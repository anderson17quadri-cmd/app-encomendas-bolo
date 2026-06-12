import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, Alert,
  Platform, SafeAreaView, Modal, Linking,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../../context/OrdersContext';
import { StatusChip } from '../../../components/StatusChip';
import { Colors, Spacing, BorderRadius, STATUSES } from '../../../constants/theme';
import { Order } from '../../../constants/types';
import { printReceipt, printDirect } from '../../../services/receipt';

const STATUS_ORDER = STATUSES;

function getNextStatus(current: string | null | undefined): string | null {
  const idx = STATUS_ORDER.indexOf(current as typeof STATUS_ORDER[number]);
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

function getNextStatusLabel(current: string | null | undefined): string {
  switch (current) {
    case 'Pendente': return 'Iniciar Produção';
    case 'Em Produção': return 'Marcar Concluída';
    case 'Concluída': return 'Marcar Entregue';
    default: return '';
  }
}

function openContact(sourceChannel: string, clientPhone: string | null | undefined) {
  if (!clientPhone) { Alert.alert('Sem contato', 'Nenhum contato cadastrado.'); return; }
  if (sourceChannel === 'WhatsApp') {
    const phone = clientPhone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${phone}`).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
  } else {
    const username = clientPhone.replace('@', '').trim();
    Linking.openURL(`https://instagram.com/${username}`).catch(() => Alert.alert('Erro', 'Não foi possível abrir o Instagram.'));
  }
}

export default function DetalheEncomendaScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, updateOrderStatus, deleteOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const o = await getOrderById(id);
      setOrder(o);
    } catch (e) {
      console.error('Error loading order:', e);
    } finally {
      setLoading(false);
    }
  }, [id, getOrderById]);

  useFocusEffect(useCallback(() => { loadOrder(); }, [loadOrder]));

  const handleAdvanceStatus = async () => {
    if (!order?.id) return;
    const next = getNextStatus(order?.status);
    if (!next) return;
    try {
      await updateOrderStatus(order.id, next);
      setOrder(prev => prev ? { ...prev, status: next, updatedAt: new Date().toISOString() } : null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir encomenda', 'Tem certeza que deseja excluir esta encomenda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrder(id);
            router.back();
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir a encomenda.');
          }
        },
      },
    ]);
  };

  const handlePrint = async () => {
    try { await printDirect(order); } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try { await printReceipt(order); } catch (e) { console.error(e); }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts?.length !== 3) return dateStr;
    return `$${parts[2]}/$${parts[1]}/${parts[0]}`;
  };

  const formatWeight = (w: number | null | undefined) => {
    if (w == null) return '0 kg';
    return `${String(w).replace('.', ',')} kg`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyEmoji}>😞</Text>
          <Text style={styles.loadingText}>Encomenda não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextStatus = getNextStatus(order?.status);
  const nextLabel = getNextStatusLabel(order?.status);
  const channelColor = Colors.channel?.[order?.sourceChannel ?? ''] ?? Colors.textSecondary;
  const currentStatusIdx = STATUS_ORDER.indexOf(order?.status as typeof STATUS_ORDER[number]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <Pressable onPress={() => setMenuVisible(true)} hitSlop={12}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Foto */}
        {order?.photoUri ? (
          <Pressable onPress={() => setImageModalVisible(true)}>
            <Image source={{ uri: order.photoUri }} style={styles.heroImage} resizeMode="cover" />
          </Pressable>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>🎂</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.clientName}>{order?.clientName ?? ''}</Text>

          {/* Badge canal — clicável */}
          <Pressable
            style={[styles.channelBadge, { backgroundColor: channelColor + '20' }]}
            onPress={() => openContact(order?.sourceChannel ?? '', order?.clientPhone)}
          >
            <Ionicons
              name={order?.sourceChannel === 'WhatsApp' ? 'logo-whatsapp' : 'logo-instagram'}
              size={16} color={channelColor}
            />
            <Text style={[styles.channelText, { color: channelColor }]}>
              {order?.clientPhone ? order.clientPhone : order?.sourceChannel ?? ''}
            </Text>
            <Ionicons name="open-outline" size={13} color={channelColor} />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoLabel}>Data de entrega</Text>
            <Text style={styles.infoValue}>{formatDate(order?.deliveryDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎂</Text>
            <Text style={styles.infoLabel}>Tipo de massa</Text>
            <Text style={styles.infoValue}>{order?.cakeType ?? ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🍰</Text>
            <Text style={styles.infoLabel}>Recheio</Text>
            <Text style={styles.infoValue}>{order?.filling ?? ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⚖️</Text>
            <Text style={styles.infoLabel}>Peso</Text>
            <Text style={styles.infoValue}>{formatWeight(order?.weightKg)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.statusSectionTitle}>Status</Text>
          <StatusChip status={order?.status ?? 'Pendente'} large />

          <View style={styles.progressRow}>
            {STATUS_ORDER.map((s, idx) => {
              const isFilled = idx <= currentStatusIdx;
              const color = Colors.status?.[s] ?? Colors.textSecondary;
              return (
                <React.Fragment key={s}>
                  <View style={[styles.progressDot, { backgroundColor: isFilled ? color : '#E0E0E0' }]} />
                  {idx < STATUS_ORDER.length - 1 && (
                    <View style={[styles.progressLine, { backgroundColor: idx < currentStatusIdx ? color : '#E0E0E0' }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <View style={styles.progressLabels}>
            {STATUS_ORDER.map((s) => (
              <Text key={s} style={styles.progressLabel} numberOfLines={1}>{s.split(' ')[0]}</Text>
            ))}
          </View>

          {order?.notes ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.notesTitle}>Observações</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          {nextStatus ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, pressed && styles.actionPressed]}
              onPress={handleAdvanceStatus}
            >
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              <Text style={styles.actionPrimaryText}>{nextLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionOutline, pressed && styles.actionPressed]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionOutlineText}>Compartilhar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionOutline, pressed && styles.actionPressed]}
            onPress={handlePrint}
          >
            <Ionicons name="print-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionOutlineText}>Imprimir</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push(`/order/${id}/edit`); }}>
              <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
              <Text style={styles.menuItemText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); handleDelete(); }}>
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
              <Text style={[styles.menuItemText, { color: Colors.error }]}>Excluir</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modal foto */}
      <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.imageModalContainer}>
          <Pressable style={styles.imageModalClose} onPress={() => setImageModalVisible(false)}>
            <Ionicons name="close" size={30} color={Colors.white} />
          </Pressable>
          {order?.photoUri ? (
            <Image source={{ uri: order.photoUri }} style={styles.imageModalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { paddingBottom: Spacing.xxl },
  heroImage: { width: '100%', height: 250 },
  heroPlaceholder: { width: '100%', height: 180, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center' },
  heroEmoji: { fontSize: 64 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.md, marginTop: -Spacing.lg, padding: Spacing.lg, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: Colors.border },
  clientName: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  channelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  channelText: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoIcon: { fontSize: 18, width: 28 },
  infoLabel: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  statusSectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xs },
  progressDot: { width: 14, height: 14, borderRadius: 7 },
  progressLine: { flex: 1, height: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', width: 60 },
  notesTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: BorderRadius.md },
  actionPrimary: { backgroundColor: Colors.primary },
  actionOutline: { borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.white },
  actionPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  actionPrimaryText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  actionOutlineText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: Platform.OS === 'android' ? 80 : 100, paddingRight: Spacing.md },
  menuSheet: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, paddingVertical: 4, minWidth: 160, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  menuItemText: { fontSize: 16, color: Colors.textPrimary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: Colors.textSecondary },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  imageModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 60, right: 20, zIndex: 10 },
  imageModalImage: { width: '90%', height: '80%' },
});
