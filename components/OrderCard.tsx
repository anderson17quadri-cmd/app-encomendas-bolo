import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, SalgadosQty, BrigadeirosQty } from '../constants/types';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { StatusChip } from './StatusChip';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function getOrderSubtitle(order: Order): string {
  if (order.orderType === 'salgados') {
    const s = order.salgados as Record<string, number>;
    const total = Object.values(s).reduce((a, b) => a + (b ?? 0), 0);
    return `🥟 Salgados • ${total} unidades`;
  }
  if (order.orderType === 'brigadeiros') {
    const b = order.brigadeiros as Record<string, number>;
    const total = Object.values(b).reduce((a, b) => a + (b ?? 0), 0);
    return `🍫 Brigadeiros • ${total} unidades`;
  }
  return `${order?.cakeType ?? ''} • ${order?.filling ?? ''}`;
}

function getOrderEmoji(order: Order): string {
  if (order.orderType === 'salgados') return '🥟';
  if (order.orderType === 'brigadeiros') return '🍫';
  return '🎂';
}

export function OrderCard({ order, onPress, style }: OrderCardProps) {
  const channelColor = Colors.channel?.[order?.sourceChannel ?? ''] ?? Colors.textSecondary;
  const channelIcon = order?.sourceChannel === 'WhatsApp' ? 'logo-whatsapp' : 'logo-instagram';

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts?.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatWeight = (w: number | null | undefined) => {
    if (!w) return null;
    return `${String(w).replace('.', ',')} kg`;
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      onPress={onPress}
      accessibilityLabel={`Encomenda de ${order?.clientName ?? 'cliente'}`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {order?.clientName ?? 'Sem nome'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {getOrderSubtitle(order)}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📅 {formatDate(order?.deliveryDate)}</Text>
            {order.orderType === 'bolo' && formatWeight(order?.weightKg) ? (
              <Text style={styles.metaText}>⚖️ {formatWeight(order?.weightKg)}</Text>
            ) : null}
            {order?.price ? (
              <Text style={styles.metaText}>💰 €{order.price.toFixed(2)}</Text>
            ) : null}
          </View>
          <View style={styles.bottomRow}>
            <StatusChip status={order?.status ?? 'Pendente'} />
            <View style={[styles.channelBadge, { backgroundColor: channelColor + '20' }]}>
              <Ionicons name={channelIcon as keyof typeof Ionicons.glyphMap} size={14} color={channelColor} />
              <Text style={[styles.channelText, { color: channelColor }]}>{order?.sourceChannel ?? ''}</Text>
            </View>
          </View>
        </View>
        {order?.photoUri ? (
          <Image source={{ uri: order.photoUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailEmoji}>{getOrderEmoji(order)}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginHorizontal: Spacing.md, marginVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  content: { flexDirection: 'row', alignItems: 'center' },
  mainInfo: { flex: 1, marginRight: Spacing.sm },
  clientName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xs },
  metaRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  channelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, gap: 4 },
  channelText: { fontSize: 11, fontWeight: '600' },
  thumbnail: { width: 56, height: 56, borderRadius: BorderRadius.sm },
  thumbnailPlaceholder: { width: 56, height: 56, borderRadius: BorderRadius.sm, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center' },
  thumbnailEmoji: { fontSize: 24 },
});
