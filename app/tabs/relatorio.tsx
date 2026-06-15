import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOrdersByMonth } from '../../services/database';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Order } from '../../constants/types';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getOrderSubtitle(o: Order): string {
  if (o.orderType === 'salgados') {
    const total = Object.values(o.salgados ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    return `🥟 Salgados • ${total} unid.`;
  }
  if (o.orderType === 'brigadeiros') {
    const total = Object.values(o.brigadeiros ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    return `🍫 Brigadeiros • ${total} unid.`;
  }
  return `🎂 ${o.cakeType ?? ''} • ${o.weightKg ?? 0}kg`;
}

export default function RelatorioScreen() {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getOrdersByMonth(ano, mes);
    setOrders(data ?? []);
    setLoading(false);
  }, [ano, mes]);

  useEffect(() => { carregar(); }, [carregar]);

  const navMes = (dir: number) => {
    let novoMes = mes + dir;
    let novoAno = ano;
    if (novoMes > 12) { novoMes = 1; novoAno++; }
    if (novoMes < 1) { novoMes = 12; novoAno--; }
    setMes(novoMes);
    setAno(novoAno);
    carregar();
  };

  const totalReceita = orders.reduce((acc, o) => acc + (o.price ?? 0), 0);
  const totalPeso = orders.reduce((acc, o) => acc + (o.weightKg ?? 0), 0);

  const porCanal = ['WhatsApp', 'Instagram'].map(ch => ({
    canal: ch,
    count: orders.filter(o => o.sourceChannel === ch).length,
    color: Colors.channel?.[ch] ?? Colors.primary,
  }));

  const formatMoney = (v: number) => `€ ${v.toFixed(2).replace('.', ',')}`;
  const formatWeight = (v: number) => `${v.toFixed(1).replace('.', ',')} kg`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navRow}>
        <Pressable onPress={() => navMes(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </Pressable>
        <Text style={styles.navTitle}>{MESES[mes - 1]} {ano}</Text>
        <Pressable onPress={() => navMes(1)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={28} color={Colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>🎂</Text>
              <Text style={styles.cardValue}>{orders.length}</Text>
              <Text style={styles.cardLabel}>Encomendas</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>💶</Text>
              <Text style={styles.cardValue}>{formatMoney(totalReceita)}</Text>
              <Text style={styles.cardLabel}>Receita Total</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>⚖️</Text>
              <Text style={styles.cardValue}>{formatWeight(totalPeso)}</Text>
              <Text style={styles.cardLabel}>Peso Total</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Por Canal</Text>
          <View style={styles.section}>
            {porCanal.map(({ canal, count, color }) => (
              <View key={canal} style={styles.row}>
                <Ionicons name={canal === 'WhatsApp' ? 'logo-whatsapp' : 'logo-instagram'} size={18} color={color} />
                <Text style={styles.rowLabel}>{canal}</Text>
                <Text style={styles.rowValue}>{count}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Encomendas do Mês</Text>
          {orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhuma encomenda este mês</Text>
            </View>
          ) : (
            <View style={styles.section}>
              {orders.map(o => (
                <Pressable key={o.id} style={styles.orderRow} onPress={() => router.push(`/order/${o.id}`)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderName}>{o.clientName}</Text>
                    <Text style={styles.orderSub}>{getOrderSubtitle(o)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderPrice}>{formatMoney(o.price ?? 0)}</Text>
                    <Text style={[styles.orderStatus, { color: Colors.status?.[o.status] ?? Colors.textSecondary }]}>{o.status}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  navTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.md, paddingBottom: 60 },
  cardsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  card: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  cardIcon: { fontSize: 24, marginBottom: 4 },
  cardValue: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  cardLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  section: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  rowValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  orderName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  orderSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  orderStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  empty: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
