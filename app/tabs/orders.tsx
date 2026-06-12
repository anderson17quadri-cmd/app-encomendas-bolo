import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Platform, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../context/OrdersContext';
import { OrderCard } from '../../components/OrderCard';
import { Colors, Spacing, BorderRadius, STATUSES } from '../../constants/theme';
import { Order } from '../../constants/types';

const FILTER_OPTIONS = ['Todas', ...STATUSES] as const;

export default function EncomendasScreen() {
  const { searchOrders } = useOrders();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [results, setResults] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string, s: string) => {
    try {
      setLoading(true);
      const data = await searchOrders(q, s);
      setResults(data ?? []);
    } catch (e) {
      console.error('Error searching:', e);
    } finally {
      setLoading(false);
    }
  }, [searchOrders]);

  useFocusEffect(
    useCallback(() => {
      doSearch(query, statusFilter);
    }, [doSearch, query, statusFilter])
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    doSearch(text, statusFilter);
  };

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    doSearch(query, filter);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Encomendas</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente..."
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          accessibilityLabel="Buscar por nome do cliente"
        />
        {query ? (
          <Pressable onPress={() => handleQueryChange('')} hitSlop={12} accessibilityLabel="Limpar busca">
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTER_OPTIONS as unknown as string[]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => {
          const isActive = item === statusFilter;
          const chipColor = item === 'Todas' ? Colors.primary : (Colors.status?.[item] ?? Colors.textSecondary);
          return (
            <Pressable
              style={[
                styles.filterChip,
                isActive && { backgroundColor: chipColor },
                !isActive && { backgroundColor: chipColor + '20', borderColor: chipColor, borderWidth: 1 },
              ]}
              onPress={() => handleFilterChange(item)}
              accessibilityLabel={`Filtrar por ${item}`}
              accessibilityRole="button"
            >
              <Text style={[
                styles.filterText,
                isActive && { color: Colors.white },
                !isActive && { color: chipColor },
              ]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Order list */}
      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/order/${item?.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Nenhuma encomenda encontrada</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={() => doSearch(query, statusFilter)}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/new-order')}
        accessibilityLabel="Adicionar nova encomenda"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    height: '100%',
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
  },
});
