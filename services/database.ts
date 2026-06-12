import { supabase } from './supabase';
import { Order } from '../constants/types';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').insert({ id, ...data, createdAt: now, updatedAt: now });
  if (error) throw error;
  return id;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) return null;
  return data as Order;
}

export async function getOrdersByDate(date: string): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').eq('deliveryDate', date).order('createdAt', { ascending: true });
  if (error) return [];
  return (data ?? []) as Order[];
}

export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').order('deliveryDate', { ascending: false });
  if (error) return [];
  return (data ?? []) as Order[];
}

export async function searchOrders(query: string, statusFilter: string, dateFrom?: string, dateTo?: string): Promise<Order[]> {
  let q = supabase.from('orders').select('*');
  if (query?.trim()) q = q.ilike('clientName', `%${query.trim()}%`);
  if (statusFilter && statusFilter !== 'Todas') q = q.eq('status', statusFilter);
  if (dateFrom) q = q.gte('deliveryDate', dateFrom);
  if (dateTo) q = q.lte('deliveryDate', dateTo);
  q = q.order('deliveryDate', { ascending: false });
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Order[];
}

export async function updateOrder(id: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').update({ ...data, updatedAt: now }).eq('id', id);
  if (error) throw error;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('orders').update({ status, updatedAt: now }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

export async function getMarkedDatesData(): Promise<Array<{ deliveryDate: string; status: string }>> {
  const { data, error } = await supabase.from('orders').select('deliveryDate, status');
  if (error) return [];
  return (data ?? []) as Array<{ deliveryDate: string; status: string }>;
}
