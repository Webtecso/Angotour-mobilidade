import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import RideMapView from '../trip/RideMapView';
import { Coordinates } from '../../types';
import { reverseLabel, searchPlaces } from '../../services/backendApi';

export interface PickedPlace { label: string; latitude: number; longitude: number }

interface Props {
  visible: boolean;
  title: string;
  initial?: PickedPlace | null;
  onClose: () => void;
  onConfirm: (place: PickedPlace) => void;
}

const LUANDA: Coordinates = { latitude: -8.8383, longitude: 13.2344 };
const inAngola = (lat: number, lng: number) => lat >= -18.5 && lat <= -4.2 && lng >= 11.4 && lng <= 24.1;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function labelFor(c: Coordinates): Promise<string> {
  const FALLBACK = 'Local escolhido no mapa';
  const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  try {
    const l = await timeout(reverseLabel(c), 6000);
    if (l) return l;
  } catch {
    // usa o geocoder do telemovel
  }
  try {
    const [r] = await timeout(Location.reverseGeocodeAsync(c), 4000);
    const line = r ? [r.street ?? r.name, r.district ?? r.city].filter(Boolean).join(', ') : '';
    return line || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export default function PlacePickerModal({ visible, title, initial, onClose, onConfirm }: Props) {
  // "start" e o que o mapa recebe: so muda por GPS, pesquisa ou abertura (nunca pelos movimentos do proprio mapa).
  const [start, setStart] = useState<Coordinates>(LUANDA);
  // "center" e onde o pin esta neste momento.
  const [center, setCenter] = useState<Coordinates>(LUANDA);
  const [label, setLabel] = useState('Arrasta o mapa para escolher');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedPlace[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [picked, setPicked] = useState(false);
  const reqRef = useRef(0);
  const chosenRef = useRef(false);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveLabel = async (c: Coordinates) => {
    const id = ++reqRef.current;
    setResolving(true);
    const l = await labelFor(c);
    if (id !== reqRef.current) return;
    setLabel(l);
    setResolving(false);
  };

  const useGps = async (silent = false) => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent) setLabel('Permissao de localizacao negada. Ativa-a nas definicoes do telemovel.');
        return;
      }
      let p: Location.LocationObject | null = null;
      try {
        p = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 8000);
      } catch {
        p = await Location.getLastKnownPositionAsync();
      }
      if (!p) {
        if (!silent) setLabel('Nao foi possivel obter a localizacao');
        return;
      }
      if (silent && chosenRef.current) return;
      const c = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setStart(c);
      setCenter(c);
      setPicked(true);
      void resolveLabel(c);
    } catch {
      if (!silent) setLabel('Nao foi possivel obter a localizacao');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    setQuery(''); setResults([]); setSearched(false);
    reqRef.current++;
    chosenRef.current = false;
    setResolving(false);
    if (initial) {
      const c = { latitude: initial.latitude, longitude: initial.longitude };
      setStart(c); setCenter(c); setLabel(initial.label); setPicked(true);
    } else {
      setStart(LUANDA); setCenter(LUANDA); setLabel('Arrasta o mapa para escolher'); setPicked(false);
      void useGps(true);
    }
    return () => { if (moveTimer.current) clearTimeout(moveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onMapMove = (c: Coordinates) => {
    setCenter(c);
    setPicked(true);
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => { void resolveLabel(c); }, 400);
  };

  const search = async () => {
    const term = query.trim();
    if (term.length < 3) return;
    setSearching(true);
    setSearched(true);
    try {
      const found = await withTimeout(searchPlaces(term), 12000);
      const out: PickedPlace[] = found
        .filter((r) => inAngola(r.coordinates.latitude, r.coordinates.longitude))
        .slice(0, 6)
        .map((r) => ({ label: r.label, latitude: r.coordinates.latitude, longitude: r.coordinates.longitude }));
      setResults(out);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const choose = (p: PickedPlace) => {
    const c = { latitude: p.latitude, longitude: p.longitude };
    reqRef.current++;
    setResolving(false);
    chosenRef.current = true;
    setResults([]); setSearched(false);
    setStart(c); setCenter(c); setLabel(p.label); setPicked(true);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={C.text} /></TouchableOpacity>
          <Text style={s.title}>{title}</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={s.searchRow}>
          <TouchableOpacity onPress={search}><Ionicons name="search" size={18} color={C.muted} /></TouchableOpacity>
          <TextInput style={s.searchInput} value={query} onChangeText={(t) => { chosenRef.current = true; setQuery(t); }} onSubmitEditing={search}
            placeholder="Bairro, rua ou referencia" placeholderTextColor={C.muted} returnKeyType="search"
            autoCorrect={false} spellCheck={false} autoComplete="off" textContentType="none" autoCapitalize="words" />
          {searching ? <ActivityIndicator color={C.primary} /> : null}
        </View>

        <TouchableOpacity style={s.gpsRow} onPress={() => useGps(false)} disabled={locating} activeOpacity={0.8}>
          {locating ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="locate" size={18} color={C.primary} />}
          <Text style={s.gpsRowText}>{locating ? 'A localizar...' : 'Usar a minha localizacao'}</Text>
        </TouchableOpacity>

        {results.length > 0 ? (
          <FlatList style={s.results} data={results} keyExtractor={(_, i) => String(i)} keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={s.resultRow} onPress={() => choose(item)}>
                <Ionicons name="location-outline" size={18} color={C.primary} />
                <Text style={s.resultText} numberOfLines={2}>{item.label}</Text>
              </TouchableOpacity>
            )} />
        ) : searched && !searching ? (
          <Text style={s.noResults}>Sem resultados. Tenta outro nome ou arrasta o mapa.</Text>
        ) : null}

        <View style={s.mapWrap}>
          <RideMapView origin={start} initialCenter={start} onCenterChange={onMapMove} height={9999} style={s.map} zoom={16} />
          <View style={s.pin} pointerEvents="none"><Ionicons name="location" size={40} color={C.danger} /></View>
        </View>

        <View style={s.footer}>
          <View style={s.addrRow}>
            <Ionicons name="location-outline" size={18} color={C.primary} />
            {resolving ? <ActivityIndicator size="small" color={C.primary} style={{ marginLeft: 8 }} />
              : <Text style={s.addr} numberOfLines={2}>{label}</Text>}
          </View>
          <TouchableOpacity style={[s.cta, (!picked || resolving) && { opacity: 0.5 }]} disabled={!picked || resolving}
            onPress={() => onConfirm({ label, latitude: center.latitude, longitude: center.longitude })}>
            <Text style={s.ctaText}>Confirmar este local</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const C = { bg: '#0B1410', surface: '#14211B', border: '#22332B', text: '#F2F7F4', muted: '#8FA399', primary: '#10B981', danger: '#EF4444' };
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: C.text, fontSize: 17, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginHorizontal: 16, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: C.text, paddingVertical: 12, fontSize: 15 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 10, paddingVertical: 4 },
  gpsRowText: { color: C.primary, fontWeight: '600', fontSize: 14 },
  results: { maxHeight: 190, marginHorizontal: 16, marginTop: 8, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  resultText: { color: C.text, flex: 1 },
  noResults: { color: C.muted, marginHorizontal: 16, marginTop: 8, fontSize: 13 },
  mapWrap: { flex: 1, marginTop: 12, overflow: 'hidden' },
  map: { flex: 1, borderRadius: 0, height: undefined },
  pin: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40 },
  footer: { backgroundColor: C.surface, padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  addrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addr: { color: C.text, marginLeft: 8, flex: 1, fontSize: 15 },
  cta: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});