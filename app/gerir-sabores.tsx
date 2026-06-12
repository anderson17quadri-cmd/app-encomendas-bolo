import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

type Flavor = { id: string; type: string; name: string };

export default function GerirSaboresScreen() {
  const [massas, setMassas] = useState<Flavor[]>([]);
  const [recheios, setRecheios] = useState<Flavor[]>([]);
  const [novaMassa, setNovaMassa] = useState('');
  const [novoRecheio, setNovoRecheio] = useState('');
  const [editando, setEditando] = useState<{id: string, valor: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase.from('flavors').select('*').order('name');
    if (data) {
      setMassas(data.filter(f => f.type === 'massa'));
      setRecheios(data.filter(f => f.type === 'recheio'));
    }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const adicionar = async (tipo: string, nome: string, setNome: (v: string) => void) => {
    if (!nome.trim()) return;
    await supabase.from('flavors').insert({ type: tipo, name: nome.trim() });
    setNome('');
    carregar();
  };

  const excluir = (id: string, nome: string) => {
    Alert.alert('Excluir', `Excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await supabase.from('flavors').delete().eq('id', id);
        carregar();
      }}
    ]);
  };

  const salvarEdicao = async () => {
    if (!editando || !editando.valor.trim()) return;
    await supabase.from('flavors').update({ name: editando.valor.trim() }).eq('id', editando.id);
    setEditando(null);
    carregar();
  };

  const renderItem = (item: Flavor, tipo: string) => (
    <View key={item.id} style={styles.item}>
      {editando?.id === item.id ? (
        <TextInput style={styles.editInput} value={editando.valor} onChangeText={v => setEditando({...editando, valor: v})} autoFocus />
      ) : (
        <Text style={styles.itemText}>{item.name}</Text>
      )}
      <View style={styles.itemActions}>
        {editando?.id === item.id ? (
          <Pressable onPress={salvarEdicao} style={styles.btnSave}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable onPress={() => setEditando({id: item.id, valor: item.name})} style={styles.btnEdit}>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </Pressable>
        )}
        <Pressable onPress={() => excluir(item.id, item.name)} style={styles.btnDelete}>
          <Ionicons name="trash" size={16} color="#e74c3c" />
        </Pressable>
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 40}} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Gerir Sabores', headerBackTitle: 'Voltar' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>🎂 Massas</Text>
        {massas.map(m => renderItem(m, 'massa'))}
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} placeholder="Nova massa..." value={novaMassa} onChangeText={setNovaMassa} />
          <Pressable onPress={() => adicionar('massa', novaMassa, setNovaMassa)} style={styles.btnAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 24}]}>🍫 Recheios</Text>
        {recheios.map(r => renderItem(r, 'recheio'))}
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} placeholder="Novo recheio..." value={novoRecheio} onChangeText={setNovoRecheio} />
          <Pressable onPress={() => adicionar('recheio', novoRecheio, setNovoRecheio)} style={styles.btnAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 12, marginBottom: 8, elevation: 1 },
  itemText: { flex: 1, fontSize: 15, color: Colors.text },
  editInput: { flex: 1, fontSize: 15, color: Colors.text, borderBottomWidth: 1, borderColor: Colors.primary, paddingVertical: 2 },
  itemActions: { flexDirection: 'row', gap: 8 },
  btnEdit: { padding: 6, borderRadius: 8, backgroundColor: Colors.primary + '20' },
  btnDelete: { padding: 6, borderRadius: 8, backgroundColor: '#e74c3c20' },
  btnSave: { padding: 6, borderRadius: 8, backgroundColor: Colors.primary },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addInput: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 12, fontSize: 15, elevation: 1 },
  btnAdd: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: 12, justifyContent: 'center', alignItems: 'center' },
});
