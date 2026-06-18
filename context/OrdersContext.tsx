import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as db from '../services/database';
import { upsertClient } from '../services/clients';
import { Order, MarkedDates } from '../constants/types';
import { Colors } from '../constants/theme';
import { Platform } from 'react-native';

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  getOrdersByDate: (date: string) => Promise<Order[]>;
  getOrderById: (id: string) => Promise<Order | null>;
  createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateOrder: (id: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  searchOrders: (query: string, statusFilter: string, dateFrom?: string, dateTo?: string) => Promise<Order[]>;
  getMarkedDates: () => Promise<MarkedDates>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db.getAllOrders();
      setOrders(result ?? []);
    } catch (e) {
      console.error('Error refreshing orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrdersByDate = useCallback(async (date: string) => {
    try { return await db.getOrdersByDate(date); }
    catch (e) { console.error('Error getting orders by date:', e); return []; }
  }, []);

  const getOrderById = useCallback(async (id: string) => {
    try { return await db.getOrderById(id); }
    catch (e) { console.error('Error getting order:', e); return null; }
  }, []);

  const createOrder = useCallback(async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await db.createOrder(data);
    if (Platform.OS !== 'web') {
      try {
        const { scheduleDeliveryReminder } = await import('../services/notifications');
        await scheduleDeliveryReminder(id, data.clientName, data.deliveryDate);
      } catch (e) { console.warn('Notification failed:', e); }
    }
    await refreshOrders();
    return id;
  }, [refreshOrders]);

  const updateOrder = useCallback(async (id: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>) => {
    await db.updateOrder(id, data);
    if (Platform.OS !== 'web' && data.deliveryDate && data.clientName) {
      try {
        const { scheduleDeliveryReminder } = await import('../services/notifications');
        await scheduleDeliveryReminder(id, data.clientName, data.deliveryDate);
      } catch (e) { console.warn('Notification failed:', e); }
    }
    await refreshOrders();
  }, [refreshOrders]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    await db.updateOrderStatus(id, status);
    // Cancelar notificação se entregue
    if (Platform.OS !== 'web' && status === 'Entregue') {
      try {
        const { cancelOrderNotification } = await import('../services/notifications');
        await cancelOrderNotification(id);
      } catch (e) {}
    }
    await refreshOrders();
  }, [refreshOrders]);

  const deleteOrder = useCallback(async (id: string) => {
    await db.deleteOrder(id);
    if (Platform.OS !== 'web') {
      try {
        const { cancelOrderNotification } = await import('../services/notifications');
        await cancelOrderNotification(id);
      } catch (e) {}
    }
    await refreshOrders();
  }, [refreshOrders]);

  const searchOrders = useCallback(async (query: string, statusFilter: string, dateFrom?: string, dateTo?: string) => {
    try { return await db.searchOrders(query, statusFilter, dateFrom, dateTo); }
    catch (e) { console.error('Error searching orders:', e); return []; }
  }, []);

  const getMarkedDates = useCallback(async (): Promise<MarkedDates> => {
    try {
      const data = await db.getMarkedDatesData();
      const marked: MarkedDates = {};
      for (const item of data ?? []) {
        const date = item?.deliveryDate;
        if (!date) continue;
        if (!marked[date]) marked[date] = { dots: [] };
        const statusColor = Colors.status?.[item?.status ?? ''] ?? Colors.primary;
        const dots = marked[date]?.dots ?? [];
        if (dots.length < 3) {
          dots.push({ key: `${date}-${dots.length}`, color: statusColor });
          marked[date] = { ...marked[date], dots };
        }
      }
      return marked;
    } catch (e) {
      console.error('Error getting marked dates:', e);
      return {};
    }
  }, []);

  return (
    <OrdersContext.Provider value={{
      orders, loading, refreshOrders, getOrdersByDate, getOrderById,
      createOrder, updateOrder, updateOrderStatus, deleteOrder,
      searchOrders, getMarkedDates,
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextType {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders must be used within OrdersProvider');
  return context;
}
