import React, { useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

interface Props { visible: boolean; onClose: () => void }

const TERMS: { h: string; p: string }[] = [
  { h: '1. Quem somos', p: 'O AngoTour Mobilidade e uma plataforma que liga passageiros a motoristas independentes em Luanda e noutras cidades de Angola. Ao usar a app, aceitas estes Termos.' },
  { h: '2. O servico', p: 'A plataforma permite pedir viagens, escolher a categoria do veiculo, acompanhar o motorista e pagar. O transporte e prestado pelo motorista; o AngoTour faz a ligacao entre as partes, a seguranca da conta e o apoio ao cliente.' },
  { h: '3. A tua conta', p: 'Para usar a app precisas de um numero de telefone valido e de dar informacao verdadeira. Es responsavel pela conta e pelo codigo que recebes por SMS. Nao partilhes o codigo com ninguem.' },
  { h: '4. Precos e pagamentos', p: 'O preco da viagem e mostrado antes de a pedires e nao sobe por hora de ponta, chuva ou falta de motoristas. Pode pagar-se em numerario ou com o saldo da carteira, conforme disponivel. Na mobilidade mensal, o valor acordado e pago antes de comecar e nao muda no periodo contratado.' },
  { h: '5. Cancelamentos', p: 'Podes cancelar uma viagem antes de o motorista chegar. Cancelamentos repetidos depois de o motorista estar a caminho podem ter uma taxa ou limitar o acesso. Se o motorista cancelar, nao pagas nada.' },
  { h: '6. Comportamento', p: 'Trata o motorista e os outros passageiros com respeito. E proibido danificar o veiculo, transportar mercadorias ilegais ou usar a app para fins ilicitos. O AngoTour pode suspender contas que ponham a seguranca em risco.' },
  { h: '7. Seguranca', p: 'A app tem partilha de viagem e botao de emergencia. Em caso de perigo imediato, liga primeiro para os servicos de emergencia. Os casos reportados na app sao acompanhados pela nossa equipa.' },
  { h: '8. Objetos perdidos e reclamacoes', p: 'Se esqueceres um objeto no veiculo, indica-o no apoio da app. As reclamacoes sao analisadas pela equipa AngoTour, que te responde na propria app.' },
  { h: '9. Responsabilidade', p: 'O AngoTour faz o possivel para manter a app disponivel, mas nao garante um servico sem interrupcoes. Na medida permitida pela lei, nao respondemos por danos indiretos nem por atrasos causados por transito ou rede movel.' },
  { h: '10. Alteracoes', p: 'Podemos atualizar estes Termos. Quando a mudanca for importante, avisamos-te na app. Continuar a usar o servico depois do aviso significa que aceitas a nova versao.' },
  { h: '11. Lei aplicavel', p: 'Estes Termos regem-se pela lei da Republica de Angola.' },
];

const PRIVACY: { h: string; p: string }[] = [
  { h: '1. Que dados recolhemos', p: 'Numero de telefone, nome e data de nascimento; a tua localizacao durante o uso da app (para encontrar motoristas e mostrar a viagem); o historico de viagens e pagamentos; e, se pedires verificacao de identidade, a imagem do documento.' },
  { h: '2. Para que os usamos', p: 'Para criar a tua conta, ligar-te a um motorista, calcular o preco, garantir a seguranca da viagem, dar apoio e prevenir fraude. Nao vendemos os teus dados.' },
  { h: '3. Com quem os partilhamos', p: 'O motorista ve o teu nome, o ponto de partida e o destino durante a viagem. Podemos partilhar dados com autoridades quando a lei o exigir. Os servicos tecnicos que usamos (mapas, SMS, alojamento) tratam dados so para nos prestar o servico.' },
  { h: '4. Localizacao', p: 'So usamos a localizacao quando a app esta aberta e tu permites. Podes retirar a permissao nas definicoes do telemovel; sem ela, tens de escolher a partida manualmente.' },
  { h: '5. Documentos de identidade', p: 'A imagem do documento serve so para verificar a tua conta e fica guardada de forma restrita. Nao e visivel para motoristas nem para outros passageiros.' },
  { h: '6. Durante quanto tempo guardamos', p: 'Guardamos os dados enquanto a conta estiver ativa e pelo tempo que a lei exigir para registos de viagens e pagamentos. Depois disso, sao apagados ou anonimizados.' },
  { h: '7. Os teus direitos', p: 'Tens direito a aceder aos teus dados, corrigi-los, pedir que sejam apagados e retirar consentimentos, nos termos da Lei de Protecao de Dados Pessoais de Angola (Lei n.o 22/11). Pede-o pelo apoio da app.' },
  { h: '8. Seguranca dos dados', p: 'Usamos ligacoes seguras e acesso restrito aos dados. Nenhum sistema e perfeito; se houver um incidente que te afete, avisamos-te.' },
  { h: '9. Alteracoes', p: 'Se mudarmos esta Politica de forma importante, avisamos-te na app.' },
];

export default function LegalModal({ visible, onClose }: Props) {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');
  const list = tab === 'terms' ? TERMS : PRIVACY;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={s.title}>Termos e privacidade</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'terms' && s.tabOn]} onPress={() => setTab('terms')}>
            <Text style={[s.tabText, tab === 'terms' && s.tabTextOn]}>Termos de Uso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'privacy' && s.tabOn]} onPress={() => setTab('privacy')}>
            <Text style={[s.tabText, tab === 'privacy' && s.tabTextOn]}>Privacidade</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.updated}>Versao de 26/11/2026</Text>
          {list.map((x) => (
            <View key={x.h} style={{ marginBottom: 16 }}>
              <Text style={s.h}>{x.h}</Text>
              <Text style={s.p}>{x.p}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.textMuted },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextOn: { color: '#fff' },
  body: { padding: 16, paddingBottom: 40 },
  updated: { color: colors.textMuted, fontSize: 12, marginBottom: 12 },
  h: { color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  p: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
});
