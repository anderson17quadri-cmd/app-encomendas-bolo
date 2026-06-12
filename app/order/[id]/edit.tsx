import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image,
  Alert, Platform, KeyboardAvoidingView, SafeAreaView, ActionSheetIOS,
} from 'react-native';
import { router, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useOrders } from '../../../context/OrdersContext';
import { PickerModal } from '../../../components/PickerModal';
import { Colors, Spacing, BorderRadius, CAKE_TYPES, FILLINGS, CHANNELS, STATUSES } from '../../../constants/theme';
import { OrderFormData, Order } from '../../../constants/types';

export default function EditarEncomendaScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, updateOrder, deleteOrder } = useOrders();

  const [originalOrder, setOriginalOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderFormData>({
    clientName: '',
    deliveryDate: '',
    cakeType: CAKE_TYPES[0],
    filling: FILLINGS[0],
    weightKg: '',
    photoUri: null,
    sourceChannel: 'WhatsApp',
    notes: '',
    status: 'Pendente',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerModal, setPickerModal] = useState<{ field: string; title: string; options: readonly string[] } | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!id) return;
        try {
          setLoading(true);
          const o = await getOrderById(id);
          if (o) {
            setOriginalOrder(o);
            setForm({
              clientName: o.clientName ?? '',
              deliveryDate: o.deliveryDate ?? '',
              cakeType: o.cakeType ?? CAKE_TYPES[0],
              filling: o.filling ?? FILLINGS[0],
              weightKg: String(o.weightKg ?? '').replace('.', ','),
              photoUri: o.photoUri ?? null,
              sourceChannel: o.sourceChannel ?? 'WhatsApp',
              notes: o.notes ?? '',
              status: o.status ?? 'Pendente',
            });
          }
        } catch (e) {
          console.error('Error loading order for edit:', e);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [id, getOrderById])
  );

  const updateField = (field: keyof OrderFormData, value: string | null) => {
    setForm(prev => ({ ...(prev ?? {}), [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => { const n = { ...(prev ?? {}) }; delete n[field]; return n; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form?.clientName?.trim()) newErrors.clientName = 'Nome do cliente é obrigatório';
    if (!form?.deliveryDate) newErrors.deliveryDate = 'Data de entrega é obrigatória';
    if (!form?.cakeType) newErrors.cakeType = 'Tipo de massa é obrigatório';
    if (!form?.filling) newErrors.filling = 'Recheio é obrigatório';
    const weight = parseFloat((form?.weightKg ?? '').replace(',', '.'));
    if (!form?.weightKg?.trim() || isNaN(weight) || weight < 0.1) newErrors.weightKg = 'Peso mínimo: 0,1 kg';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !id) return;
    try {
      setSaving(true);
      let photoUri: string | null = form?.photoUri ?? null;

      // Handle image changes on native
      if (Platform.OS !== 'web') {
        const oldPhoto = originalOrder?.photoUri;
        // If photo was changed
        if (photoUri !== oldPhoto) {
          // Delete old photo if exists
          if (oldPhoto) {
            try {
              const { File } = await import('expo-file-system');
              const oldFile = new File(oldPhoto);
              if (oldFile.exists) {
                await oldFile.delete();
              }
            } catch (e) {
              console.warn('Error deleting old photo:', e);
            }
          }
          // Copy new photo
          if (photoUri && !photoUri.includes('/orders/')) {
            try {
              const { File, Paths } = await import('expo-file-system');
              const ordersDir = new File(Paths.document, 'orders');
              if (!ordersDir.exists) {
                await ordersDir.create();
              }
              const ext = photoUri.split('.').pop() ?? 'jpg';
              const fileName = `${Date.now()}.${ext}`;
              const destFile = new File(ordersDir, fileName);
              const sourceFile = new File(photoUri);
              await sourceFile.copy(destFile);
              photoUri = destFile.uri;
            } catch (e) {
              console.error('Error copying image:', e);
            }
          }
        }
      }

      const weight = parseFloat((form?.weightKg ?? '0').replace(',', '.'));
      await updateOrder(id, {
        clientName: form?.clientName?.trim() ?? '',
        deliveryDate: form?.deliveryDate ?? '',
        cakeType: form?.cakeType ?? '',
        filling: form?.filling ?? '',
        weightKg: weight,
        photoUri,
        sourceChannel: form?.sourceChannel ?? 'WhatsApp',
        notes: form?.notes?.trim() || null,
        status: form?.status ?? 'Pendente',
      });
      router.back();
    } catch (e) {
      console.error('Error updating order:', e);
      Alert.alert('Erro', 'Não foi possível atualizar a encomenda.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = () => {
    Alert.alert(
      'Excluir encomenda',
      'Tem certeza que deseja excluir esta encomenda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (originalOrder?.photoUri && Platform.OS !== 'web') {
                try {
                  const { File } = await import('expo-file-system');
                  const file = new File(originalOrder.photoUri);
                  if (file.exists) {
                    await file.delete();
                  }
                } catch (e) {
                  console.warn('Error deleting photo:', e);
                }
              }
              await deleteOrder(id);
              router.dismissTo('/tabs');
            } catch (e) {
              console.error('Error deleting:', e);
              Alert.alert('Erro', 'Não foi possível excluir a encomenda.');
            }
          },
        },
      ]
    );
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const permResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permResult?.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua câmera/galeria.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

      if (!result?.canceled && result?.assets?.[0]?.uri) {
        updateField('photoUri', result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error picking image:', e);
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tirar foto', 'Escolher da galeria'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickImage(true);
          if (index === 2) pickImage(false);
        }
      );
    } else {
      Alert.alert('Adicionar foto', 'Escolha uma opção', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar foto', onPress: () => pickImage(true) },
        { text: 'Escolher da galeria', onPress: () => pickImage(false) },
      ]);
    }
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      updateField('deliveryDate', `${y}-${m}-${d}`);
    }
  };

  const formatDateDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Selecionar data';
    const parts = dateStr.split('-');
    if (parts?.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const parseDateForPicker = (): Date => {
    if (form?.deliveryDate) {
      const d = new Date(form.deliveryDate + 'T12:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
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

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Encomenda</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12} accessibilityLabel="Salvar">
          <Ionicons name="checkmark" size={28} color={saving ? Colors.textSecondary : Colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          {/* Cliente */}
          <Text style={styles.sectionTitle}>Informações do Cliente</Text>
          <View style={[styles.inputContainer, errors?.clientName ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Nome do cliente *"
              placeholderTextColor={Colors.textSecondary}
              value={form?.clientName ?? ''}
              onChangeText={(t) => updateField('clientName', t)}
              accessibilityLabel="Nome do cliente"
            />
          </View>
          {errors?.clientName ? <Text style={styles.errorText}>{errors.clientName}</Text> : null}

          {/* Canal */}
          <Text style={styles.label}>Canal de origem</Text>
          <View style={styles.channelRow}>
            {CHANNELS.map((ch) => {
              const isActive = form?.sourceChannel === ch;
              const chColor = Colors.channel?.[ch] ?? Colors.primary;
              return (
                <Pressable
                  key={ch}
                  style={[
                    styles.channelButton,
                    isActive && { backgroundColor: chColor, borderColor: chColor },
                    !isActive && { borderColor: chColor },
                  ]}
                  onPress={() => updateField('sourceChannel', ch)}
                  accessibilityLabel={ch}
                >
                  <Ionicons name={ch === 'WhatsApp' ? 'logo-whatsapp' : 'logo-instagram'} size={18} color={isActive ? Colors.white : chColor} />
                  <Text style={[styles.channelButtonText, { color: isActive ? Colors.white : chColor }]}>{ch}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Detalhes do bolo */}
          <Text style={styles.sectionTitle}>Detalhes do Bolo</Text>

          <Text style={styles.label}>Tipo de massa *</Text>
          <Pressable
            style={[styles.selectButton, errors?.cakeType ? styles.inputError : null]}
            onPress={() => setPickerModal({ field: 'cakeType', title: 'Tipo de Massa', options: CAKE_TYPES })}
            accessibilityLabel="Selecionar tipo de massa"
          >
            <Text style={styles.selectText}>{form?.cakeType || 'Selecionar'}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>
          {errors?.cakeType ? <Text style={styles.errorText}>{errors.cakeType}</Text> : null}

          <Text style={styles.label}>Recheio *</Text>
          <Pressable
            style={[styles.selectButton, errors?.filling ? styles.inputError : null]}
            onPress={() => setPickerModal({ field: 'filling', title: 'Recheio', options: FILLINGS })}
            accessibilityLabel="Selecionar recheio"
          >
            <Text style={styles.selectText}>{form?.filling || 'Selecionar'}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>
          {errors?.filling ? <Text style={styles.errorText}>{errors.filling}</Text> : null}

          <Text style={styles.label}>Peso (kg) *</Text>
          <View style={[styles.inputContainer, errors?.weightKg ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2,5"
              placeholderTextColor={Colors.textSecondary}
              value={form?.weightKg ?? ''}
              onChangeText={(t) => updateField('weightKg', t)}
              keyboardType="decimal-pad"
              accessibilityLabel="Peso em quilogramas"
            />
          </View>
          {errors?.weightKg ? <Text style={styles.errorText}>{errors.weightKg}</Text> : null}

          {/* Entrega */}
          <Text style={styles.sectionTitle}>Entrega</Text>

          <Text style={styles.label}>Data de entrega *</Text>
          <Pressable
            style={[styles.selectButton, errors?.deliveryDate ? styles.inputError : null]}
            onPress={() => setShowDatePicker(true)}
            accessibilityLabel="Selecionar data de entrega"
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.selectText, { marginLeft: 8 }]}>{formatDateDisplay(form?.deliveryDate)}</Text>
          </Pressable>
          {errors?.deliveryDate ? <Text style={styles.errorText}>{errors.deliveryDate}</Text> : null}

          {showDatePicker && (
            <DateTimePicker
              value={parseDateForPicker()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              locale="pt-BR"
            />
          )}

          <Text style={styles.label}>Status</Text>
          <Pressable
            style={styles.selectButton}
            onPress={() => setPickerModal({ field: 'status', title: 'Status', options: STATUSES })}
            accessibilityLabel="Selecionar status"
          >
            <Text style={styles.selectText}>{form?.status || 'Pendente'}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </Pressable>

          {/* Foto */}
          <Text style={styles.sectionTitle}>Foto</Text>
          {form?.photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: form.photoUri }} style={styles.photoPreview} />
              <Pressable style={styles.photoRemove} onPress={() => updateField('photoUri', null)} accessibilityLabel="Remover foto">
                <Ionicons name="close-circle" size={28} color={Colors.error} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.photoPlaceholder} onPress={showImageOptions} accessibilityLabel="Adicionar foto">
              <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.photoPlaceholderText}>Adicionar foto</Text>
            </Pressable>
          )}

          {/* Observações */}
          <Text style={styles.sectionTitle}>Observações</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observações adicionais..."
              placeholderTextColor={Colors.textSecondary}
              value={form?.notes ?? ''}
              onChangeText={(t) => updateField('notes', t)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Observações"
            />
          </View>

          {/* Save */}
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Salvar alterações"
          >
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
          </Pressable>

          {/* Delete */}
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
            onPress={handleDeleteOrder}
            accessibilityLabel="Excluir encomenda"
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.deleteButtonText}>Excluir encomenda</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {pickerModal ? (
        <PickerModal
          visible={!!pickerModal}
          title={pickerModal.title}
          options={pickerModal.options}
          selected={(form as unknown as Record<string, string>)?.[pickerModal.field] ?? ''}
          onSelect={(val) => updateField(pickerModal.field as keyof OrderFormData, val)}
          onClose={() => setPickerModal(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  channelRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
  },
  channelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoPlaceholder: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
