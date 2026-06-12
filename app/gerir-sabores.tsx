import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, SafeAreaView } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, CAKE_TYPES, FILLINGS } from '../constants/theme';

export default function GerirSaboresScreen() {
  const [massas, setMassas] = useState<string[]>([...CAKE_TYPES]);
  const [recheios, setRecheios] = useState<string[]>([...FILLINGS]);
  const [novaMassa, setNovaMassa] = useState('');
  const [novoRecheio, setNovoRecheio] = useState('');
  const [editando, setEditando] = useState<{tipo: 'massa'|'recheio', index: number, valor: string} | null>(null);

  const adicionarMassa = () => {
    if (!novaMassa.trim()) return;
    setMassas([...massas, novaMassa.trim()]);
    setNovaMassa('');
  };

  const adicionarRecheio = () => {
    if (!novoRecheio.trim()) return;
    setRecheios([...recheios, novoRecheio.trim()]);
    setNovoRecheio('');
  };

  const excluir = (tipo: 'massa'|'recheio', index: number) => {
    Alert.alert('Excluir', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        if (tipo === 'massa') setMassas(massas.filter((_, i) => i !== index));
        else setRecheios(recheios.filter((_, i) => i !== index));
      }}
    ]);
  };

  const salvarEdicao = () => {
    if (!editando || !editando.valor.trim()) return;
    if (editando.tipo === 'massa') {
      const novo = [...massas];
      novo[editando.index] = editando.valor.trim();
      setMassas(novo);
    } else {
      const novo = [...recheios];
      novo[editando.index] = editando.valor.trim();
      setRecheios(novo);
    }
    setEditando(null);
  };

  const renderItem = (item: string, index: number, tipo: 'massa'|'recheio') => (
    <View key={index} style={styles.item}>
      {editando?.tipo === tipo && editando?.index === index ? (
        <TextInput
          style={styles.editInput}
          value={editando.valor}
          onChangeText={v => setEditando({...editando, valor: v})}
          autoFocus
        />
      ) : (
        <Text style={styles.itemText}>{item}</Text>
      )}
      <View style={styles.itemActions}>
        {editando?.tipo === tipo && editando?.index === index ? (
          <Pressable onPress={salvarEdicao} style={styles.btnSave}>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          </Pressable>
        ) : (
          <Pressable onPress={() => setEditando({tipo, index, valor: item})} style={styles.btnEdit}>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </Pressable>
        )}
        <Pressable onPress={() => excluir(tipo, index)} style={styles.btnDelete}>
          <Ionicons name="trash" size={16} color="#e74c3c" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Gerir Sabores', headerBackTitle: 'Voltar' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>🎂 Massas</Text>
        {massas.map((m, i) => renderItem(m, i, 'massa'))}
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} placeholder="Nova massa..." value={novaMassa} onChangeText={setNovaMassa} />
          <Pressable onPress={adicionarMassa} style={styles.btnAdd}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 24}]}>🍫 Recheios</Text>
        {recheios.map((r, i) => renderItem(r, i, 'recheio'))}
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} placeholder="Novo recheio..." value={novoRecheio} onChangeText={setNovoRecheio} />
          <Pressable onPress={adicionarRecheio} style={styles.btnAdd}>
            <Ionicons name="add" size={22} color={Colors.white} />
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
  white: { color: '#fff' },
});
