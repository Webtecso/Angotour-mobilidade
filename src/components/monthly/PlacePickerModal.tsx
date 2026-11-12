import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import RideMapView from '../trip/RideMapView';
import { Coordinates } from '../../types';

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

async function labelFor(c: Coordinates): Promise<string> {
  try {
    const [r] = await Location.reverseGeocodeAsync(c);
    const line = r ? [r.street ?? r.name, r.district ?? r.city].filter(Boolean).join(', ') : '';
    return line || 'Local escolhido no mapa';
  } catch {
    return 'Local escolhido no mapa';
  }
}

export default function PlacePickerModal({ visible, title, initial, onClose, onConfirm }: Props) {
  const [center, setCenter] = useState<Coordinates>(LUANDA);
  const [label, setLabel] = useState('Arrasta o mapa para escolher');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery(''); setResults([]);
    if (initial) {
      setCenter({ latitude: initial.latitude, longitude: initial.longitude });
      setLabel(initial.label); setPicked(true);
    } else {
      setCenter(LUANDA); setLabel('Arrasta o mapa para escolher'); setPicked(false);
    }
  }, [visible, initial]);

  const onMapMove = async (c: Coordinates) => {
    setCenter(c); setPicked(true); setResolving(true);
    setLabel(await labelFor(c));
    setResolving(false);
  };

  const search = async () => {
    const term = query.trim();
    if (term.length < 3) return;
    setSearching(true);
    try {
      const raw = await Location.geocodeAsync(/angola/i.test(term) ? term : term + ', Angola');
      const ok = raw.filter((r) => inAngola(r.latitude, r.longitude)).slice(0, 4);
      const out: PickedPlace[] = [];
      for (const r of ok) {
        const l = await labelFor({ latitude: r.latitude, longitude: r.longitude });
        out.push({ label: l === 'Local escolhido no mapa' ? term : l, latitude: r.latitude, longitude: r.longitude });
      }
      setResults(out);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const useGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLabel('Permissao de localizacao negada'); return; }
      const p = await Location.getCurrentPositionAsync({});
      const c = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setCenter(c); setPicked(true); setResolving(true);
      setLabel(await labelFor(c)); setResolving(false);
    } catch {
      setLabel('Nao foi possivel obter a localizacao');
    }
  };

  const choose = (p: PickedPlace) => { setResults([]); setCenter({ latitude: p.latitude, longitude: p.longitude }); setLabel(p.label); setPicked(true); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={C.text} /></TouchableOpacity>
          <Text style={s.title}>{title}</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={s.searchRow}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput style={s.searchInput} value={query} onChangeText={setQuery} onSubmitEditing={search}
            placeholder="Bairro, rua ou referencia" placeholderTextColor={C.muted} returnKeyType="search" />
          {searching ? <ActivityIndicator color={C.primary} /> : null}
        </View>

        {results.length > 0 ? (
          <FlatList style={s.results} data={results} keyExtractor={(_, i) => String(i)} keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={s.resultRow} onPress={() => choose(item)}>
                <Ionicons name="location-outline" size={18} color={C.primary} />
                <Text style={s.resultText} numberOfLines={2}>{item.label}</Text>
              </TouchableOpacity>
            )} />
        ) : null}

        <View style={s.mapWrap}>
          <RideMapView origin={center} initialCenter={center} onCenterChange={onMapMove} height={9999} style={s.map} zoom={16} />
          <View style={s.pin} pointerEvents="none"><Ionicons name="location" size={40} color={C.danger} /></View>
          <TouchableOpacity style={s.gps} onPress={useGps}><Ionicons name="locate" size={20} color={C.text} /></TouchableOpacity>
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
  results: { maxHeight: 190, marginHorizontal: 16, marginTop: 8, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  resultText: { color: C.text, flex: 1 },
  mapWrap: { flex: 1, marginTop: 12, overflow: 'hidden' },
  map: { flex: 1, borderRadius: 0, height: undefined },
  pin: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40 },
  gps: { position: 'absolute', right: 14, bottom: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  footer: { backgroundColor: C.surface, padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  addrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addr: { color: C.text, marginLeft: 8, flex: 1, fontSize: 15 },
  cta: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
