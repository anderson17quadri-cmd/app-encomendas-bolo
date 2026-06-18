import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, SafeAreaView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllClients, searchClients, deleteClient, Client } from '../../services/clients';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function ClientesScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    const data = q.trim() ? await searchClients(q) : await getAllClients();
    setClients(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(query); }, [load]));

  const handleSearch = (text: string) => {
    setQuery(text);
    load(text);
  };

  const handleDelete = (client: Client) => {
    Alert.alert('Excluir cliente', `Excluir "${client.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await deleteClient(client.id);
        load(query);
      }},
    ]);
  };

  const handleNewOrder = (client: Client) => {
    router.push(`/new-order?clientName=${encodeURIComponent(client.name)}&clientPhone=${encodeURIComponent(client.phone ?? '')}&sourceChannel=${encodeURIComponent(client.sourceChannel)}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  };

  const getChannelColor = (channel: string) => {
    return Colors.channel?.[channel] ?? Colors.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <Text style={styles.headerSub}>{clients.length} clientes</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
        />
        {query ? (
          <Pressable onPress={() => handleSearch('')} hitSlop={12}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>
                {query ? 'Nenhum cliente encontrado' : 'Ainda sem clientes\nSerão adicionados automaticamente'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleNewOrder(item)}>
              <View style={[styles.avatar, { backgroundColor: Colors.secondary }]}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.phone ? (
                  <View style={styles.cardMeta}>
                    <Ionicons
                      name={item.sourceChannel === 'WhatsApp' ? 'logo-whatsapp' : 'logo-instagram'}
                      size={13} color={getChannelColor(item.sourceChannel)}
                    />
                    <Text style={[styles.cardPhone, { color: getChannelColor(item.sourceChannel) }]}>
                      {item.phone}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.newOrderBtn}
                  onPress={() => handleNewOrder(item)}>
                  <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                </Pressable>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md, paddingBottom: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, height: 48 },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary, height: '100%' },
  listContent: { paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: Colors.white, marginHorizontal: Spacing.md, marginVertical: 4, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  cardPhone: { fontSize: 13, fontWeight: '500' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newOrderBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
});
