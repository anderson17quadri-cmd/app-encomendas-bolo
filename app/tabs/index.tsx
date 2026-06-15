import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, SafeAreaView, PanResponder } from 'react-native';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../context/OrdersContext';
import { OrderCard } from '../../components/OrderCard';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Order, MarkedDates } from '../../constants/types';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export default function CalendarioScreen() {
  const { getOrdersByDate, getMarkedDates } = useOrders();
  const calendarRef = useRef<any>(null);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().split('T')[0] ?? '');
  const [dayOrders, setDayOrders] = useState<Order[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const marks = await getMarkedDates();
      setMarkedDates(marks ?? {});
      if (selectedDate) {
        const orders = await getOrdersByDate(selectedDate);
        setDayOrders(orders ?? []);
      }
    } catch (e) {
      console.error('Error loading calendar data:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, getMarkedDates, getOrdersByDate]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDayPress = useCallback(async (day: DateData) => {
    const date = day?.dateString ?? '';
    setSelectedDate(date);
    if (date) {
      try {
        const orders = await getOrdersByDate(date);
        setDayOrders(orders ?? []);
      } catch (e) {
        setDayOrders([]);
      }
    }
  }, [getOrdersByDate]);

  const navMonth = (dir: number) => {
    setCurrentMonth(prev => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1) { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  // Swipe handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 30 && Math.abs(gs.dy) < 40,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50) navMonth(1);
        else if (gs.dx > 50) navMonth(-1);
      },
    })
  ).current;

  const formatDatePtBr = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts?.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const currentDateString = `${currentMonth.year}-${String(currentMonth.month).padStart(2,'0')}-01`;

  const calendarMarkedDates = {
    ...(markedDates ?? {}),
    ...(selectedDate ? {
      [selectedDate]: {
        ...(markedDates?.[selectedDate] ?? {}),
        selected: true,
        selectedColor: Colors.primary,
      },
    } : {}),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎂 Sal Doce</Text>
      </View>

      <FlatList
        data={dayOrders ?? []}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        ListHeaderComponent={
          <View {...panResponder.panHandlers}>
            <Calendar
              ref={calendarRef}
              key={currentDateString}
              current={currentDateString}
              markingType="multi-dot"
              markedDates={calendarMarkedDates}
              onDayPress={handleDayPress}
              onMonthChange={(month) => setCurrentMonth({ year: month.year, month: month.month })}
              enableSwipeMonths={true}
              theme={{
                backgroundColor: Colors.background,
                calendarBackground: Colors.white,
                textSectionTitleColor: Colors.textSecondary,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.primary,
                dayTextColor: Colors.textPrimary,
                textDisabledColor: '#d9e1e8',
                dotColor: Colors.primary,
                monthTextColor: Colors.textPrimary,
                arrowColor: Colors.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Encomendas do dia — {formatDatePtBr(selectedDate)}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => router.push(`/order/${item?.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍰</Text>
            <Text style={styles.emptyText}>Nenhuma encomenda para este dia</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push(`/new-order?date=${selectedDate ?? ''}`)}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md, paddingBottom: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  calendar: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  listContent: { paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  fab: { position: 'absolute', right: Spacing.md, bottom: Spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabPressed: { transform: [{ scale: 0.93 }] },
});
