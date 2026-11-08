import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { monthlyApi } from '../../services/api';

// Pontos de referencia aproximados. O seletor no mapa fica para uma versao seguinte.
const PLACES = [
  { label: 'Viana', lat: -8.9035, lng: 13.3715 },
  { label: 'Talatona', lat: -8.9155, lng: 13.1802 },
  { label: 'Kilamba', lat: -9.0267, lng: 13.2656 },
  { label: 'Benfica', lat: -8.95, lng: 13.17 },
  { label: 'Maianga', lat: -8.8281, lng: 13.236 },
  { label: 'Baixa de Luanda', lat: -8.8147, lng: 13.2344 },
  { label: 'Aeroporto 4 de Fevereiro', lat: -8.8584, lng: 13.2312 },
  { label: 'Cacuaco', lat: -8.7757, lng: 13.3677 },
];
const DAYS = [
  { id: 'seg', label: 'Seg' }, { id: 'ter', label: 'Ter' }, { id: 'qua', label: 'Qua' }, { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' }, { id: 'sab', label: 'Sab' }, { id: 'dom', label: 'Dom' },
];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

export default function MonthlyRequestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [modality, setModality] = useState<'shared' | 'individual'>('shared');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [days, setDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [departure, setDeparture] = useState('07:00');
  const [back, setBack] = useState('17:30');
  const [startDate, setStartDate] = useState(defaultStart());
  const [passengers, setPassengers] = useState('1');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (id: string) => setDays((cur) => (cur.includes(id) ? cur.filter((d) => d !== id) : [...cur, id]));

  const submit = async () => {
    setError('');
    const o = PLACES.find((p) => p.label === origin);
    const d = PLACES.find((p) => p.label === destination);
    if (!o || !d) return setError('Escolhe a origem e o destino.');
    if (o.label === d.label) return setError('A origem e o destino tem de ser diferentes.');
    if (days.length === 0) return setError('Escolhe pelo menos um dia.');
    if (!TIME_RE.test(departure)) return setError('Hora de ida invalida (usa HH:MM).');
    if (back.trim() && !TIME_RE.test(back)) return setError('Hora de regresso invalida (usa HH:MM).');
    if (!DATE_RE.test(startDate)) return setError('Data invalida (usa AAAA-MM-DD).');
    const count = Number(passengers);
    if (!Number.isInteger(count) || count < 1 || count > 15) return setError('Numero de passageiros invalido.');

    setBusy(true);
    try {
      await monthlyApi.createRequest({
        modality,
        originLabel: o.label, originLatitude: o.lat, originLongitude: o.lng,
        destinationLabel: d.label, destinationLatitude: d.lat, destinationLongitude: d.lng,
        preferredDays: days, departureTime: departure,
        returnTime: back.trim() ? back : undefined,
        startDate, passengerCount: count,
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

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[s.chip, active && s.chipOn]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.chipText, active && s.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{'<'} Voltar</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MonthlyContracts')}><Text style={s.link}>Os meus pedidos</Text></TouchableOpacity>
        </View>
        <Text style={s.title}>Mobilidade mensal</Text>
        <Text style={s.sub}>Transporte recorrente com mensalidade fixa. Pagas antes de comecar e o preco nao muda durante o periodo contratado.</Text>

        <Text style={s.label}>Modalidade</Text>
        <View style={s.row}>
          <Chip label="Partilhado" active={modality === 'shared'} onPress={() => setModality('shared')} />
          <Chip label="Individual" active={modality === 'individual'} onPress={() => setModality('individual')} />
        </View>
        <Text style={s.hint}>{modality === 'shared' ? 'Partilhas o veiculo com outros passageiros do mesmo percurso.' : 'Veiculo com motorista so para ti, nos horarios acordados.'}</Text>

        <Text style={s.label}>Origem</Text>
        <View style={s.rowWrap}>{PLACES.map((p) => <Chip key={'o' + p.label} label={p.label} active={origin === p.label} onPress={() => setOrigin(p.label)} />)}</View>
        <Text style={s.label}>Destino</Text>
        <View style={s.rowWrap}>{PLACES.map((p) => <Chip key={'d' + p.label} label={p.label} active={destination === p.label} onPress={() => setDestination(p.label)} />)}</View>

        <Text style={s.label}>Dias de utilizacao</Text>
        <View style={s.rowWrap}>{DAYS.map((d) => <Chip key={d.id} label={d.label} active={days.includes(d.id)} onPress={() => toggleDay(d.id)} />)}</View>

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Hora de ida</Text>
            <TextInput style={s.input} value={departure} onChangeText={setDeparture} placeholder="07:00" placeholderTextColor={C.muted} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Hora de regresso</Text>
            <TextInput style={s.input} value={back} onChangeText={setBack} placeholder="17:30 (opcional)" placeholderTextColor={C.muted} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Data de inicio</Text>
            <TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="AAAA-MM-DD" placeholderTextColor={C.muted} autoCapitalize="none" />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Passageiros</Text>
            <TextInput style={s.input} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />
          </View>
        </View>
        <Text style={s.label}>Necessidades especiais (opcional)</Text>
        <TextInput style={[s.input, { height: 70 }]} value={notes} onChangeText={setNotes} multiline placeholder="Ex: cadeira de rodas" placeholderTextColor={C.muted} />

        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={[s.cta, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} activeOpacity={0.85}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.ctaText}>Pedir proposta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const C = { bg: '#0B1410', surface: '#14211B', border: '#22332B', text: '#F2F7F4', muted: '#8FA399', primary: '#10B981', danger: '#EF4444' };
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  back: { color: C.muted, fontSize: 14 },
  link: { color: C.primary, fontSize: 14, fontWeight: '600' },
  title: { color: C.text, fontSize: 26, fontWeight: '800' },
  sub: { color: C.muted, marginTop: 6, marginBottom: 8, lineHeight: 20 },
  label: { color: C.text, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  hint: { color: C.muted, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  half: { flex: 1 },
  chip: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  error: { color: C.danger, marginTop: 14 },
  cta: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
