import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image,
  Alert, Platform, KeyboardAvoidingView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { photoToBase64 } from '../services/photoStorage';
import { supabase } from '../services/supabase';
import { searchClients, Client } from '../services/clients';
import { useOrders } from '../context/OrdersContext';
import { PickerModal } from '../components/PickerModal';
import { Colors, Spacing, BorderRadius, CHANNELS } from '../constants/theme';
import { OrderFormData, SalgadosQty, BrigadeirosQty } from '../constants/types';

const SALGADOS_LIST = [
  { key: 'coxinha', label: 'Coxinha', icon: '🍗' },
  { key: 'rissoisCarne', label: 'Rissóis de Carne', icon: '🥟' },
  { key: 'rissoisMistos', label: 'Rissóis Mistos', icon: '🥟' },
  { key: 'bolinhsQueijo', label: 'Bolinhas de Queijo', icon: '🧀' },
  { key: 'pastelFrango', label: 'Pastel de Frango', icon: '🫓' },
  { key: 'pastelCarne', label: 'Pastel de Carne', icon: '🫓' },
  { key: 'pastelPizza', label: 'Pastel de Pizza', icon: '🫓' },
  { key: 'enroladinho', label: 'Enroladinho de Salsicha', icon: '🌭' },
  { key: 'pastelBacalhau', label: 'Pastel de Bacalhau', icon: '🐟' },
];

const BRIGADEIROS_LIST = [
  { key: 'tradicional', label: 'Tradicional', icon: '🍫' },
  { key: 'beijinho', label: 'Beijinho', icon: '🤍' },
  { key: 'morango', label: 'Morango', icon: '🍓' },
  { key: 'ninho', label: 'Ninho', icon: '🥛' },
  { key: 'churros', label: 'Churros', icon: '🍬' },
  { key: 'sensacao', label: 'Sensação', icon: '✨' },
  { key: 'seducao', label: 'Sedução', icon: '💜' },
  { key: 'casadinho', label: 'Casadinho', icon: '🤎' },
  { key: 'prestigio', label: 'Prestígio', icon: '🖤' },
  { key: 'oreo', label: 'Oreo', icon: '⚫' },
  { key: 'napolitano', label: 'Napolitano', icon: '🍦' },
  { key: 'cafe', label: 'Café', icon: '☕' },
];

const TOPPER_OPTIONS = ['Sem topper', 'Topper personalizado', 'Hóstia comestível', 'Topper + Hóstia'];

export default function NovaEncomendaScreen() {
  const { date = '' } = useLocalSearchParams<{ date?: string }>();
  const { createOrder } = useOrders();

  const [cakeTypes, setCakeTypes] = useState<string[]>([]);
  const [fillings, setFillings] = useState<string[]>([]);
  const [loadingFlavors, setLoadingFlavors] = useState(true);
  const [orderType, setOrderType] = useState<'bolo' | 'salgados' | 'brigadeiros' | 'especial'>('bolo');
  const [salgados, setSalgados] = useState<SalgadosQty>({});
  const [brigadeiros, setBrigadeiros] = useState<BrigadeirosQty>({});

  useEffect(() => {
    const fetchFlavors = async () => {
      setLoadingFlavors(true);
      const { data } = await supabase.from('flavors').select('*').order('name');
      if (data) {
        setCakeTypes(data.filter((f: any) => f.type === 'massa').map((f: any) => f.name));
        setFillings(data.filter((f: any) => f.type === 'recheio').map((f: any) => f.name));
      }
      setLoadingFlavors(false);
    };
    fetchFlavors();
  }, []);

  const parseInitialDate = (d: string) => {
    if (!d) return { dia: '', mes: '', ano: '' };
    const parts = d.split('-');
    if (parts.length === 3) return { dia: parts[2], mes: parts[1], ano: parts[0] };
    return { dia: '', mes: '', ano: '' };
  };

  const initial = parseInitialDate(typeof date === 'string' ? date : '');
  const [dia, setDia] = useState(initial.dia);
  const [mes, setMes] = useState(initial.mes);
  const [ano, setAno] = useState(initial.ano);

  const [form, setForm] = useState<OrderFormData>({
    clientName: '', clientPhone: '', deliveryDate: '',
    orderType: 'bolo', cakeType: '', filling: '',
    weightKg: '', topper: 'Sem topper', hostia: '',
    especial: '', salgados: {}, brigadeiros: {},
    price: '', photoUri: null, sourceChannel: 'WhatsApp', notes: '',
  });

  useEffect(() => {
    if (cakeTypes.length > 0 && !form.cakeType) setForm(prev => ({ ...prev, cakeType: cakeTypes[0] }));
    if (fillings.length > 0 && !form.filling) setForm(prev => ({ ...prev, filling: fillings[0] }));
  }, [cakeTypes, fillings]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickerModal, setPickerModal] = useState<{ field: string; title: string; options: string[] } | null>(null);

  const updateField = (field: keyof OrderFormData, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateSalgado = (key: string, dir: number) => {
    setSalgados(prev => {
      const cur = (prev as Record<string, number>)[key] ?? 0;
      return { ...prev, [key]: Math.max(0, cur + dir) };
    });
  };

  const updateBrigadeiro = (key: string, dir: number) => {
    setBrigadeiros(prev => {
      const cur = (prev as Record<string, number>)[key] ?? 0;
      return { ...prev, [key]: Math.max(0, cur + dir) };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.clientName.trim()) newErrors.clientName = 'Nome do cliente é obrigatório';
    const diaNum = parseInt(dia), mesNum = parseInt(mes), anoNum = parseInt(ano);
    if (!dia || !mes || !ano || isNaN(diaNum) || isNaN(mesNum) || isNaN(anoNum) ||
        diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 2024) {
      newErrors.deliveryDate = 'Data inválida';
    }
    if (orderType === 'bolo') {
      const weight = parseFloat(form.weightKg.replace(',', '.'));
      if (!form.weightKg.trim() || isNaN(weight) || weight < 0.1) newErrors.weightKg = 'Peso mínimo: 0,1 kg';
    }
    if (orderType === 'especial' && !form.especial.trim()) {
      newErrors.especial = 'Descreve a encomenda especial';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const deliveryDate = `${ano.padStart(4,'0')}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`;
      const weight = orderType === 'bolo' ? parseFloat(form.weightKg.replace(',', '.')) : 0;

      let photoUri: string | null = null;
      if (form.photoUri) {
        try {
          photoUri = await photoToBase64(form.photoUri) ?? null;
        } catch (e) {
          console.error('Photo upload failed:', e);
        }
      }

      await createOrder({
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone?.trim() || null,
        deliveryDate,
        orderType,
        cakeType: orderType === 'bolo' ? form.cakeType : '',
        filling: orderType === 'bolo' ? form.filling : '',
        weightKg: weight,
        topper: orderType === 'bolo' && form.topper !== 'Sem topper' ? form.topper : null,
        hostia: orderType === 'bolo' && form.hostia.trim() ? form.hostia.trim() : null,
        especial: orderType === 'especial' ? form.especial.trim() : null,
        salgados: orderType === 'salgados' ? salgados : {},
        brigadeiros: orderType === 'brigadeiros' ? brigadeiros : {},
        price: parseFloat((form.price || '0').replace(',', '.')) || 0,
        photoUri,
        sourceChannel: form.sourceChannel,
        notes: form.notes?.trim() || null,
        status: 'Pendente',
      });
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar a encomenda.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permissão necessária'); return; }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]?.uri) updateField('photoUri', result.assets[0].uri);
    } catch (e) { console.error(e); }
  };

  if (loadingFlavors) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const TIPOS = [
    { key: 'bolo', icon: '🎂', label: 'Bolo' },
    { key: 'salgados', icon: '🥟', label: 'Salgados' },
    { key: 'brigadeiros', icon: '🍫', label: 'Brigadeiros' },
    { key: 'especial', icon: '⭐', label: 'Especial' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova Encomenda</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
          <Ionicons name="checkmark" size={28} color={saving ? Colors.textSecondary : Colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">

          <Text style={styles.sectionTitle}>Informações do Cliente</Text>
          <View style={[styles.inputContainer, errors.clientName ? styles.inputError : null]}>
            <TextInput style={styles.input} placeholder="Nome do cliente *"
              placeholderTextColor={Colors.textSecondary}
              value={form.clientName} onChangeText={t => updateField('clientName', t)} />
          </View>
          {errors.clientName ? <Text style={styles.errorText}>{errors.clientName}</Text> : null}

          <View style={[styles.inputContainer, { marginTop: Spacing.sm }]}>
            <TextInput style={styles.input} placeholder="Número WhatsApp ou @Instagram"
              placeholderTextColor={Colors.textSecondary}
              value={form.clientPhone} onChangeText={t => updateField('clientPhone', t)} />
          </View>

          <Text style={styles.label}>Canal de origem</Text>
          <View style={styles.channelRow}>
            {CHANNELS.map(ch => {
              const isActive = form.sourceChannel === ch;
              const chColor = Colors.channel?.[ch] ?? Colors.primary;
              return (
                <Pressable key={ch}
                  style={[styles.channelButton, isActive ? { backgroundColor: chColor, borderColor: chColor } : { borderColor: chColor }]}
                  onPress={() => updateField('sourceChannel', ch)}>
                  <Ionicons name={ch === 'WhatsApp' ? 'logo-whatsapp' : 'logo-instagram'} size={18} color={isActive ? '#fff' : chColor} />
                  <Text style={[styles.channelButtonText, { color: isActive ? '#fff' : chColor }]}>{ch}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Tipo de Encomenda</Text>
          <View style={styles.tipoRow}>
            {TIPOS.map(t => (
              <Pressable key={t.key}
                style={[styles.tipoBtn, orderType === t.key && styles.tipoBtnActive]}
                onPress={() => setOrderType(t.key as typeof orderType)}>
                <Text style={styles.tipoIcon}>{t.icon}</Text>
                <Text style={[styles.tipoLabel, orderType === t.key && styles.tipoLabelActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── BOLO ── */}
          {orderType === 'bolo' && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
                <Text style={styles.sectionTitle}>Detalhes do Bolo</Text>
                <Pressable onPress={() => router.push('/gerir-sabores')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="settings-outline" size={16} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontSize: 13 }}>Gerir sabores</Text>
                </Pressable>
              </View>
              <Text style={styles.label}>Tipo de massa *</Text>
              <Pressable style={styles.selectButton}
                onPress={() => setPickerModal({ field: 'cakeType', title: 'Tipo de Massa', options: cakeTypes })}>
                <Text style={styles.selectText}>{form.cakeType || 'Selecionar...'}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Text style={styles.label}>Recheio *</Text>
              <Pressable style={styles.selectButton}
                onPress={() => setPickerModal({ field: 'filling', title: 'Recheio', options: fillings })}>
                <Text style={styles.selectText}>{form.filling || 'Selecionar...'}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Text style={styles.label}>Peso (kg) *</Text>
              <View style={[styles.inputContainer, errors.weightKg ? styles.inputError : null]}>
                <TextInput style={styles.input} placeholder="Ex: 2,5"
                  placeholderTextColor={Colors.textSecondary}
                  value={form.weightKg} onChangeText={t => updateField('weightKg', t)} keyboardType="decimal-pad" />
              </View>
              {errors.weightKg ? <Text style={styles.errorText}>{errors.weightKg}</Text> : null}

              <Text style={styles.label}>Topper / Hóstia</Text>
              <Pressable style={styles.selectButton}
                onPress={() => setPickerModal({ field: 'topper', title: 'Topper / Hóstia', options: TOPPER_OPTIONS })}>
                <Text style={styles.selectText}>{form.topper || 'Sem topper'}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </Pressable>
              {form.topper && form.topper !== 'Sem topper' && (
                <View style={[styles.inputContainer, { marginTop: Spacing.sm }]}>
                  <TextInput style={styles.input} placeholder="Descreve o topper/hóstia (ex: nome, tema...)"
                    placeholderTextColor={Colors.textSecondary}
                    value={form.hostia} onChangeText={t => updateField('hostia', t)} />
                </View>
              )}
            </>
          )}

          {/* ── SALGADOS ── */}
          {orderType === 'salgados' && (
            <>
              <Text style={styles.sectionTitle}>Salgados — Quantidade</Text>
              {SALGADOS_LIST.map(item => (
                <View key={item.key} style={styles.qtyRow}>
                  <Text style={styles.qtyIcon}>{item.icon}</Text>
                  <Text style={styles.qtyLabel}>{item.label}</Text>
                  <View style={styles.qtyCtrl}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateSalgado(item.key, -1)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyVal}>{(salgados as Record<string, number>)[item.key] ?? 0}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => updateSalgado(item.key, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── BRIGADEIROS ── */}
          {orderType === 'brigadeiros' && (
            <>
              <Text style={styles.sectionTitle}>Brigadeiros — Quantidade</Text>
              {BRIGADEIROS_LIST.map(item => (
                <View key={item.key} style={styles.qtyRow}>
                  <Text style={styles.qtyIcon}>{item.icon}</Text>
                  <Text style={styles.qtyLabel}>{item.label}</Text>
                  <View style={styles.qtyCtrl}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateBrigadeiro(item.key, -1)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyVal}>{(brigadeiros as Record<string, number>)[item.key] ?? 0}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => updateBrigadeiro(item.key, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── ESPECIAL ── */}
          {orderType === 'especial' && (
            <>
              <Text style={styles.sectionTitle}>Encomenda Especial ⭐</Text>
              <View style={[styles.inputContainer, errors.especial ? styles.inputError : null]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreve a encomenda especial...&#10;Ex: Mesa de doces, bolo esculpido, kit festa..."
                  placeholderTextColor={Colors.textSecondary}
                  value={form.especial}
                  onChangeText={t => updateField('especial', t)}
                  multiline numberOfLines={5} textAlignVertical="top" />
              </View>
              {errors.especial ? <Text style={styles.errorText}>{errors.especial}</Text> : null}
            </>
          )}

          <Text style={styles.label}>Preço total (€)</Text>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Ex: 45,00"
              placeholderTextColor={Colors.textSecondary}
              value={form.price} onChangeText={t => updateField('price', t)} keyboardType="decimal-pad" />
          </View>

          <Text style={styles.sectionTitle}>Entrega</Text>
          <Text style={styles.label}>Data de entrega *</Text>
          <View style={styles.dateRow}>
            <View style={[styles.dateBox, errors.deliveryDate ? styles.inputError : null]}>
              <TextInput style={styles.dateInput} placeholder="DD"
                placeholderTextColor={Colors.textSecondary}
                value={dia} onChangeText={t => setDia(t.replace(/\D/g,'').slice(0,2))}
                keyboardType="numeric" maxLength={2} textAlign="center" />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={[styles.dateBox, errors.deliveryDate ? styles.inputError : null]}>
              <TextInput style={styles.dateInput} placeholder="MM"
                placeholderTextColor={Colors.textSecondary}
                value={mes} onChangeText={t => setMes(t.replace(/\D/g,'').slice(0,2))}
                keyboardType="numeric" maxLength={2} textAlign="center" />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={[styles.dateBox, styles.dateBoxYear, errors.deliveryDate ? styles.inputError : null]}>
              <TextInput style={styles.dateInput} placeholder="AAAA"
                placeholderTextColor={Colors.textSecondary}
                value={ano} onChangeText={t => setAno(t.replace(/\D/g,'').slice(0,4))}
                keyboardType="numeric" maxLength={4} textAlign="center" />
            </View>
          </View>
          {errors.deliveryDate ? <Text style={styles.errorText}>{errors.deliveryDate}</Text> : null}

          <Text style={styles.sectionTitle}>Foto</Text>
          {form.photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: form.photoUri }} style={styles.photoPreview} />
              <Pressable style={styles.photoRemove} onPress={() => updateField('photoUri', null)}>
                <Ionicons name="close-circle" size={28} color={Colors.error} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.photoPlaceholder}
              onPress={() => Alert.alert('Adicionar foto', 'Escolha uma opção', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Tirar foto', onPress: () => pickImage(true) },
                { text: 'Escolher da galeria', onPress: () => pickImage(false) },
              ])}>
              <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.photoPlaceholderText}>Adicionar foto (opcional)</Text>
            </Pressable>
          )}

          <Text style={styles.sectionTitle}>Observações</Text>
          <View style={styles.inputContainer}>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Observações adicionais..."
              placeholderTextColor={Colors.textSecondary} value={form.notes}
              onChangeText={t => updateField('notes', t)} multiline numberOfLines={4} textAlignVertical="top" />
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, saving && styles.saveButtonDisabled]}
            onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Encomenda'}</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {pickerModal ? (
        <PickerModal visible={!!pickerModal} title={pickerModal.title} options={pickerModal.options}
          selected={(form as unknown as Record<string, string>)[pickerModal.field] ?? ''}
          onSelect={val => updateField(pickerModal.field as keyof OrderFormData, val)}
          onClose={() => setPickerModal(null)} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  formContainer: { padding: Spacing.md, paddingBottom: 80 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  inputContainer: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  inputError: { borderColor: Colors.error },
  input: { fontSize: 16, color: Colors.textPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, minHeight: 48 },
  textArea: { minHeight: 100 },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 2, marginLeft: 4 },
  selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, minHeight: 48 },
  selectText: { fontSize: 16, color: Colors.textPrimary, flex: 1 },
  channelRow: { flexDirection: 'row', gap: Spacing.sm },
  channelButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 2, flex: 1, justifyContent: 'center' },
  channelButtonText: { fontSize: 14, fontWeight: '700' },
  tipoRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'nowrap' },
  tipoBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', gap: 4 },
  tipoBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  tipoIcon: { fontSize: 24 },
  tipoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  tipoLabelActive: { color: Colors.primary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8, gap: 10 },
  qtyIcon: { fontSize: 22, width: 32 },
  qtyLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, fontWeight: '700', color: Colors.primary, lineHeight: 24 },
  qtyVal: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, minWidth: 28, textAlign: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateBox: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, width: 64, height: 48, justifyContent: 'center' },
  dateBoxYear: { width: 90 },
  dateInput: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  dateSep: { fontSize: 22, fontWeight: '700', color: Colors.textSecondary, marginHorizontal: 2 },
  photoPlaceholder: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  photoPlaceholderText: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  photoPreviewContainer: { position: 'relative' },
  photoPreview: { width: '100%', height: 200, borderRadius: BorderRadius.lg },
  photoRemove: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.white, borderRadius: 14 },
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg },
  saveButtonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
