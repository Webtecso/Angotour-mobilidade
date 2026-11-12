import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { monthlyApi } from '../../services/api';
import PlacePickerModal, { PickedPlace } from '../../components/monthly/PlacePickerModal';

const DAYS = [
  { id: 'seg', label: 'Seg' }, { id: 'ter', label: 'Ter' }, { id: 'qua', label: 'Qua' }, { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' }, { id: 'sab', label: 'Sab' }, { id: 'dom', label: 'Dom' },
];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const nice = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('pt-AO', { weekday: 'short', day: 'numeric', month: 'long' });

// Mascara HH:MM enquanto escreve.
const maskTime = (t: string) => {
  const d = t.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : d.slice(0, 2) + ':' + d.slice(2);
};

export default function MonthlyRequestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [modality, setModality] = useState<'shared' | 'individual'>('shared');
  const [origin, setOrigin] = useState<PickedPlace | null>(null);
  const [destination, setDestination] = useState<PickedPlace | null>(null);
  const [picking, setPicking] = useState<'origin' | 'destination' | null>(null);
  const [days, setDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [departure, setDeparture] = useState('07:00');
  const [back, setBack] = useState('17:30');
  const [startDate, setStartDate] = useState(inDays(7));
  const [passengers, setPassengers] = useState(1);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (id: string) => setDays((c) => (c.includes(id) ? c.filter((d) => d !== id) : [...c, id]));
  const swap = () => { setOrigin(destination); setDestination(origin); };

  const summary = useMemo(() => {
    const names = DAYS.filter((d) => days.includes(d.id)).map((d) => d.label).join(', ') || 'sem dias';
    return names + ' - ida ' + (departure || '--:--') + (back.trim() ? ' - regresso ' + back : '');
  }, [days, departure, back]);

  const submit = async () => {
    setError('');
    if (!origin || !destination) return setError('Escolhe a origem e o destino.');
    if (Math.abs(origin.latitude - destination.latitude) < 0.0005 && Math.abs(origin.longitude - destination.longitude) < 0.0005) {
      return setError('A origem e o destino tem de ser diferentes.');
    }
    if (days.length === 0) return setError('Escolhe pelo menos um dia.');
    if (!TIME_RE.test(departure)) return setError('Hora de ida invalida (HH:MM).');
    if (back.trim() && !TIME_RE.test(back)) return setError('Hora de regresso invalida (HH:MM).');

    setBusy(true);
    try {
      await monthlyApi.createRequest({
        modality,
        originLabel: origin.label.slice(0, 160), originLatitude: origin.latitude, originLongitude: origin.longitude,
        destinationLabel: destination.label.slice(0, 160), destinationLatitude: destination.latitude, destinationLongitude: destination.longitude,
        preferredDays: days, departureTime: departure,
        returnTime: back.trim() ? back : undefined,
        startDate, passengerCount: passengers,
        specialNeeds: notes.trim() ? notes.trim() : undefined,
      });
      Alert.alert('Pedido enviado', 'A equipa AngoTour vai analisar e enviar-te uma proposta de preco.');
      navigation.replace('MonthlyContracts');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const ModalityCard = ({ id, title, line, icon }: { id: 'shared' | 'individual'; title: string; line: string; icon: any }) => {
    const on = modality === id;
    return (
      <TouchableOpacity style={[s.mCard, on && s.mCardOn]} onPress={() => setModality(id)} activeOpacity={0.85}>
        <Ionicons name={icon} size={24} color={on ? C.primary : C.muted} />
        <Text style={[s.mTitle, on && { color: C.text }]}>{title}</Text>
        <Text style={s.mLine}>{line}</Text>
      </TouchableOpacity>
    );
  };

  const PlaceRow = ({ dot, label, place, onPress }: { dot: string; label: string; place: PickedPlace | null; onPress: () => void }) => (
    <TouchableOpacity style={s.placeRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.placeLabel}>{label}</Text>
        <Text style={[s.placeValue, !place && { color: C.muted }]} numberOfLines={1}>{place ? place.label : 'Toca para escolher'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.muted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{'<'} Voltar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('MonthlyContracts')}><Text style={s.link}>Os meus pedidos</Text></TouchableOpacity>
          </View>
          <Text style={s.title}>Mobilidade mensal</Text>
          <Text style={s.sub}>Mensalidade fixa. Pagas antes de comecar e o preco nao muda no periodo contratado.</Text>

          <Text style={s.label}>Modalidade</Text>
          <View style={s.row}>
            <ModalityCard id="shared" title="Partilhado" line="Partilhas o veiculo com quem faz o mesmo percurso" icon="people-outline" />
            <ModalityCard id="individual" title="Individual" line="Veiculo com motorista so para ti" icon="person-outline" />
          </View>

          <Text style={s.label}>Percurso</Text>
          <View style={s.routeCard}>
            <PlaceRow dot={C.primary} label="Origem" place={origin} onPress={() => setPicking('origin')} />
            <View style={s.divider} />
            <PlaceRow dot={C.danger} label="Destino" place={destination} onPress={() => setPicking('destination')} />
            <TouchableOpacity style={s.swap} onPress={swap} disabled={!origin && !destination}>
              <Ionicons name="swap-vertical" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Dias</Text>
          <View style={s.rowWrap}>
            {DAYS.map((d) => {
              const on = days.includes(d.id);
              return (
                <TouchableOpacity key={d.id} style={[s.day, on && s.dayOn]} onPress={() => toggleDay(d.id)}>
                  <Text style={[s.dayText, on && { color: '#fff' }]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[s.row, { marginTop: 4 }]}>
            <View style={s.half}>
              <Text style={s.label}>Ida</Text>
              <TextInput style={s.input} value={departure} onChangeText={(t) => setDeparture(maskTime(t))} keyboardType="number-pad" placeholder="07:00" placeholderTextColor={C.muted} maxLength={5} />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Regresso</Text>
              <TextInput style={s.input} value={back} onChangeText={(t) => setBack(maskTime(t))} keyboardType="number-pad" placeholder="17:30" placeholderTextColor={C.muted} maxLength={5} />
            </View>
          </View>

          <Text style={s.label}>Comeca em</Text>
          <View style={s.rowWrap}>
            {[3, 7, 14].map((n) => (
              <TouchableOpacity key={n} style={[s.day, startDate === inDays(n) && s.dayOn]} onPress={() => setStartDate(inDays(n))}>
                <Text style={[s.dayText, startDate === inDays(n) && { color: '#fff' }]}>Em {n} dias</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.hint}>{nice(startDate)}</Text>

          <Text style={s.label}>Passageiros</Text>
          <View style={s.stepper}>
            <TouchableOpacity style={s.stepBtn} onPress={() => setPassengers((p) => Math.max(1, p - 1))}><Ionicons name="remove" size={20} color={C.text} /></TouchableOpacity>
            <Text style={s.stepValue}>{passengers}</Text>
            <TouchableOpacity style={s.stepBtn} onPress={() => setPassengers((p) => Math.min(15, p + 1))}><Ionicons name="add" size={20} color={C.text} /></TouchableOpacity>
          </View>

          <Text style={s.label}>Necessidades especiais (opcional)</Text>
          <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Ex: cadeira de rodas" placeholderTextColor={C.muted} />
        </ScrollView>

        <View style={s.footer}>
          <Text style={s.summary} numberOfLines={2}>{(modality === 'shared' ? 'Partilhado' : 'Individual') + ' - ' + summary}</Text>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity style={[s.cta, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.ctaText}>Pedir proposta</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={picking !== null}
        title={picking === 'origin' ? 'Escolher origem' : 'Escolher destino'}
        initial={picking === 'origin' ? origin : destination}
        onClose={() => setPicking(null)}
        onConfirm={(p) => { if (picking === 'origin') setOrigin(p); else setDestination(p); setPicking(null); }}
      />
    </SafeAreaView>
  );
}

const C = { bg: '#0B1410', surface: '#14211B', border: '#22332B', text: '#F2F7F4', muted: '#8FA399', primary: '#10B981', danger: '#EF4444' };
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  back: { color: C.muted, fontSize: 14 },
  link: { color: C.primary, fontSize: 14, fontWeight: '600' },
  title: { color: C.text, fontSize: 26, fontWeight: '800' },
  sub: { color: C.muted, marginTop: 6, lineHeight: 20 },
  label: { color: C.text, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  hint: { color: C.muted, fontSize: 12, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  half: { flex: 1 },
  mCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 16, padding: 14, gap: 6 },
  mCardOn: { borderColor: C.primary },
  mTitle: { color: C.muted, fontSize: 16, fontWeight: '700' },
  mLine: { color: C.muted, fontSize: 12, lineHeight: 16 },
  routeCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 4 },
  placeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, paddingRight: 56 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  placeLabel: { color: C.muted, fontSize: 11 },
  placeValue: { color: C.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 36 },
  swap: { position: 'absolute', right: 12, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  day: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  dayOn: { backgroundColor: C.primary, borderColor: C.primary },
  dayText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: C.text, fontSize: 20, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  footer: { backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  summary: { color: C.muted, fontSize: 12, marginBottom: 8 },
  error: { color: C.danger, marginBottom: 8 },
  cta: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
