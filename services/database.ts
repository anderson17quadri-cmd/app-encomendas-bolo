import { supabase } from './supabase';
import { Order } from '../constants/types';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

function toRow(data: Partial<Order> & { id?: string; createdAt?: string; updatedAt?: string }) {
  return {
    id: data.id,
    client_name: data.clientName,
    client_phone: data.clientPhone ?? null,
    delivery_date: data.deliveryDate,
    order_type: data.orderType ?? 'bolo',
    cake_type: data.cakeType ?? '',
    filling: data.filling ?? '',
    weight_kg: data.weightKg ?? 0,
    topper: data.topper ?? null,
    hostia: data.hostia ?? null,
    especial: data.especial ?? null,
    salgados: data.salgados ?? {},
    brigadeiros: data.brigadeiros ?? {},
    price: data.price ?? 0,
    photo_uri: data.photoUri ?? null,
    source_channel: data.sourceChannel,
    notes: data.notes ?? null,
    status: (data.status === 'Pendente' ? 'pending' : data.status === 'Em Produção' ? 'in_production' : data.status === 'Concluída' ? 'completed' : data.status === 'Entregue' ? 'delivered' : data.status ?? 'pending'),
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

function fromRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    clientName: row.client_name as string,
    clientPhone: row.client_phone as string | null,
    deliveryDate: row.delivery_date as string,
    orderType: (row.order_type as string) ?? 'bolo',
    cakeType: (row.cake_type as string) ?? '',
    filling: (row.filling as string) ?? '',
    weightKg: (row.weight_kg as number) ?? 0,
    topper: (row.topper as string | null) ?? null,
    hostia: (row.hostia as string | null) ?? null,
    especial: (row.especial as string | null) ?? null,
    salgados: (row.salgados as Record<string, number>) ?? {},
    brigadeiros: (row.brigadeiros as Record<string, number>) ?? {},
    price: (row.price as number) ?? 0,
    photoUri: row.photo_uri as string | null,
    sourceChannel: row.source_channel as string,
    notes: row.notes as string | null,
    status: (row.status === 'pending' ? 'Pendente' : row.status === 'in_production' ? 'Em Produção' : row.status === 'completed' ? 'Concluída' : row.status === 'delivered' ? 'Entregue' : row.status) as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  const row = toRow({ ...data, id, createdAt: now, updatedAt: now });
  const { error } = await supabase.from('orders').insert(row);
  if (error) { console.error('createOrder error:', error); throw error; }
  return id;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) { console.error('getOrderById error:', error); return null; }
  return fromRow(data as Record<string, unknown>);
}

export async function getOrdersByDate(date: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders').select('*').eq('delivery_date', date)
    .order('created_at', { ascending: true });
  if (error) { console.error('getOrdersByDate error:', error); return []; }
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders').select('*').order('delivery_date', { ascending: false });
  if (error) { console.error('getAllOrders error:', error); return []; }
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

export async function searchOrders(query: string, statusFilter?: string, dateFrom?: string, dateTo?: string): Promise<Order[]> {
  let q = supabase.from('orders').select('*').order('delivery_date', { ascending: false });
  if (query?.trim()) q = q.ilike('client_name', `%${query.trim()}%`);
  if (statusFilter && statusFilter !== 'Todas') {
    const statusMap: Record<string, string> = {
      'Pendente': 'pending', 'Em Produção': 'in_production',
      'Concluída': 'completed', 'Entregue': 'delivered',
    };
    const dbStatus = statusMap[statusFilter];
    if (dbStatus) q = q.eq('status', dbStatus);
  }
  if (dateFrom) q = q.gte('delivery_date', dateFrom);
  if (dateTo) q = q.lte('delivery_date', dateTo);
  const { data, error } = await q;
  if (error) { console.error('searchOrders error:', error); return []; }
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

export async function getOrdersByMonth(year: number, month: number): Promise<Order[]> {
  const from = `${year}-${String(month).padStart(2,'0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;
  const { data, error } = await supabase
    .from('orders').select('*')
    .gte('delivery_date', from).lte('delivery_date', to)
    .order('delivery_date', { ascending: true });
  if (error) { console.error('getOrdersByMonth error:', error); return []; }
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>));
}

export async function updateOrder(id: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<void> {
  const now = new Date().toISOString();
  const row = toRow({ ...data, updatedAt: now });
  delete row.id;
  const { error } = await supabase.from('orders').update(row).eq('id', id);
  if (error) { console.error('updateOrder error:', error); throw error; }
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').update({ status, updated_at: now }).eq('id', id);
  if (error) { console.error('updateOrderStatus error:', error); throw error; }
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) { console.error('deleteOrder error:', error); throw error; }
}

export async function getMarkedDatesData(): Promise<Array<{ deliveryDate: string; status: string }>> {
  const { data, error } = await supabase.from('orders').select('delivery_date, status');
  if (error) { console.error('getMarkedDatesData error:', error); return []; }
  return (data ?? []).map(r => ({ deliveryDate: r.delivery_date as string, status: r.status as string }));
}
