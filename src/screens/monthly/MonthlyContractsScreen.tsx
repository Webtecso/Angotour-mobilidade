import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { monthlyApi, MonthlyContractView, MonthlyRequestView } from '../../services/api';

const CONTRACT_STATUS: Record<string, { label: string; color: string }> = {
  proposta_emitida: { label: 'Proposta recebida', color: '#F59E0B' },
  aguardando_pagamento: { label: 'A aguardar pagamento', color: '#F59E0B' },
  pago: { label: 'Pago', color: '#10B981' },
  aguardando_atribuicao: { label: 'Pago - a atribuir motorista', color: '#10B981' },
  ativo: { label: 'Ativo', color: '#10B981' },
  suspenso: { label: 'Suspenso', color: '#EF4444' },
  cancelado: { label: 'Cancelado', color: '#EF4444' },
  concluido: { label: 'Concluido', color: '#8FA399' },
  reembolsado: { label: 'Reembolsado', color: '#EF4444' },
};
const REQUEST_STATUS: Record<string, string> = {
  pending: 'A aguardar proposta', matching: 'Em analise', proposal_available: 'Proposta emitida',
  accepted: 'Aceite', rejected: 'Rejeitado', expired: 'Expirado',
};
const MODALITY: Record<string, string> = { shared: 'Partilhado', individual: 'Individual' };

const kz = (n: number) => n.toLocaleString('pt-AO') + ' Kz';
const day = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-AO') : '-');

export default function MonthlyContractsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [contracts, setContracts] = useState<MonthlyContractView[] | null>(null);
  const [requests, setRequests] = useState<MonthlyRequestView[]>([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([monthlyApi.myContracts(), monthlyApi.myRequests()]);
      setContracts(c);
      // pedidos que ainda nao viraram contrato aceite
      setRequests(r.filter((x) => x.status === 'pending' || x.status === 'matching'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setContracts((cur) => cur ?? []);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try { await fn(); await load(); } catch (e) { Alert.alert('Nao foi possivel concluir', (e as Error).message); } finally { setBusyId(null); }
  };

  const accept = (c: MonthlyContractView) =>
    Alert.alert(
      'Aceitar proposta',
      `Preco mensal: ${kz(c.priceKz)}.\n\nAo aceitar, confirmas as condicoes do contrato: o preco fica fixo durante o periodo e o pagamento e feito antes de comecar.`,
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Aceitar', onPress: () => run(c.id, () => monthlyApi.accept(c.id)) }]
    );

  const cancel = async (c: MonthlyContractView) => {
    try {
      const p = await monthlyApi.cancelPreview(c.id);
      const msg = p.total > 0 ? 'Vais receber um reembolso de ' + kz(p.refundKz) + ' (' + p.remaining + ' de ' + p.total + ' servicos por realizar).' : p.refundKz > 0 ? 'Vais receber um reembolso de ' + kz(p.refundKz) + '.' : 'Nao ha valor a reembolsar.';
      Alert.alert('Cancelar contrato', msg, [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar contrato', style: 'destructive', onPress: () => run(c.id, () => monthlyApi.cancel(c.id)) },
      ]);
    } catch (e) { Alert.alert('Nao foi possivel', (e as Error).message); }
  };

  const reject = (c: MonthlyContractView) =>
    Alert.alert('Rejeitar proposta', 'Queres mesmo rejeitar esta proposta?', [
      { text: 'Voltar', style: 'cancel' }, { text: 'Rejeitar', style: 'destructive', onPress: () => run(c.id, () => monthlyApi.reject(c.id)) },
    ]);

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>{'<'} Voltar</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MonthlyRequest')}><Text style={s.link}>Novo pedido</Text></TouchableOpacity>
        </View>
        <Text style={s.title}>Os meus contratos mensais</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {contracts === null ? <ActivityIndicator color="#10B981" style={{ marginTop: 30 }} /> : null}

        {requests.map((r) => (
          <View key={r.id} style={s.card}>
            <Text style={s.cardTitle}>{r.originLabel} - {r.destinationLabel}</Text>
            <Text style={s.muted}>{MODALITY[r.modality] ?? r.modality} - inicio {day(r.startDate)}</Text>
            <Text style={[s.status, { color: '#F59E0B' }]}>{REQUEST_STATUS[r.status] ?? r.status}</Text>
          </View>
        ))}

        {contracts && contracts.length === 0 && requests.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.muted}>Ainda nao tens pedidos nem contratos.</Text>
            <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('MonthlyRequest')}><Text style={s.ctaText}>Pedir mobilidade mensal</Text></TouchableOpacity>
          </View>
        ) : null}

        {(contracts ?? []).map((c) => {
          const st = CONTRACT_STATUS[c.status] ?? { label: c.status, color: '#8FA399' };
          const busy = busyId === c.id;
          return (
            <View key={c.id} style={s.card}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{MODALITY[c.modality] ?? c.modality}</Text>
                <Text style={s.price}>{kz(c.priceKz)}</Text>
              </View>
              <Text style={s.muted}>{day(c.startDate)} a {day(c.endDate)}</Text>
              <Text style={[s.status, { color: st.color }]}>{st.label}</Text>

              {c.status === 'proposta_emitida' ? (
                <>
                  {c.proposalExpiresAt ? <Text style={s.muted}>Valida ate {new Date(c.proposalExpiresAt).toLocaleString('pt-AO')}</Text> : null}
                  <View style={s.actions}>
                    <TouchableOpacity style={s.cta} disabled={busy} onPress={() => accept(c)}><Text style={s.ctaText}>Aceitar</Text></TouchableOpacity>
                    <TouchableOpacity style={s.ghost} disabled={busy} onPress={() => reject(c)}><Text style={s.ghostText}>Rejeitar</Text></TouchableOpacity>
                  </View>
                </>
              ) : null}

              {c.status === 'aguardando_pagamento' ? (
                <>
                  <View style={s.refBox}><Text style={s.muted}>Referencia de pagamento</Text><Text style={s.ref}>{c.paymentReference ?? '-'}</Text></View>
                  <Text style={s.muted}>O contrato so comeca depois de o pagamento ser confirmado.</Text>
                  {__DEV__ ? (
                    <TouchableOpacity style={s.ghost} disabled={busy} onPress={() => run(c.id, () => monthlyApi.confirmPayment(c.id))}>
                      <Text style={s.ghostText}>Simular pagamento (so em desenvolvimento)</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}

              {c.status === 'aguardando_atribuicao' ? <Text style={s.muted}>Pagamento confirmado. Estamos a atribuir o teu motorista e veiculo.</Text> : null}
              {c.status === 'ativo' ? <Text style={s.muted}>Servico ativo.</Text> : null}
              {c.status === 'ativo' && c.endDate && new Date(c.endDate).getTime() - Date.now() < 7 * 86400000 ? (
                <TouchableOpacity style={s.cta} disabled={busy} onPress={() => run(c.id, () => monthlyApi.renew(c.id))}><Text style={s.ctaText}>Renovar para o mes seguinte</Text></TouchableOpacity>
              ) : null}
              {['aguardando_pagamento', 'aguardando_atribuicao', 'ativo'].includes(c.status) ? (
                <TouchableOpacity style={s.ghost} disabled={busy} onPress={() => cancel(c)}><Text style={s.ghostText}>Cancelar contrato</Text></TouchableOpacity>
              ) : null}
            </View>
          );
        })}
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
  title: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 14 },
  error: { color: C.danger, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 14 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, marginBottom: 12, gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  price: { color: C.primary, fontSize: 16, fontWeight: '800' },
  muted: { color: C.muted, fontSize: 13, lineHeight: 18 },
  status: { fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  refBox: { backgroundColor: C.bg, borderRadius: 12, padding: 12, marginVertical: 8 },
  ref: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  cta: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
  ghost: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center', marginTop: 8 },
  ghostText: { color: C.text, fontWeight: '600' },
});
