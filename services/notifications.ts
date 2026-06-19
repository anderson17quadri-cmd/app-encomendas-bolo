import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelOrderNotification(orderId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.identifier.startsWith(`order-${orderId}`)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {}
}

export async function scheduleDeliveryReminder(
  orderId: string,
  clientName: string,
  deliveryDate: string,
  deliveryTime?: string | null,
): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelOrderNotification(orderId);

  const parts = deliveryDate.split('-');
  if (parts.length !== 3) return;

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  // Parse hora de entrega (ex: "15:30")
  let deliveryHour = 18; // default 18h
  let deliveryMinute = 0;
  if (deliveryTime) {
    const timeParts = deliveryTime.split(':');
    if (timeParts.length >= 2) {
      deliveryHour = parseInt(timeParts[0]);
      deliveryMinute = parseInt(timeParts[1]);
    }
  }

  const now = new Date();
  const deliveryDateTime = new Date(year, month, day, deliveryHour, deliveryMinute);

  // Notificação dia anterior às 21h
  const prevDay = new Date(year, month, day - 1, 21, 0, 0);
  if (prevDay > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `order-${orderId}-prev`,
      content: {
        title: '🎂 Entrega amanhã!',
        body: `Encomenda de ${clientName} é amanhã${deliveryTime ? ` às ${deliveryTime}` : ''}. Está tudo pronto?`,
        data: { orderId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: prevDay,
      },
    });
  }

  // Notificações de hora em hora das 8h até hora de entrega no dia da entrega
  const startHour = 8;
  for (let hour = startHour; hour <= deliveryHour; hour++) {
    const notifDate = new Date(year, month, day, hour, 0, 0);
    if (notifDate <= now) continue;
    if (notifDate > deliveryDateTime) break;

    const horasRestantes = deliveryHour - hour;
    let body = '';
    if (horasRestantes === 0) {
      body = `🎂 Entrega AGORA! Encomenda de ${clientName}${deliveryTime ? ` às ${deliveryTime}` : ''}.`;
    } else if (horasRestantes === 1) {
      body = `⏰ 1 hora para entrega! Encomenda de ${clientName}.`;
    } else {
      body = `⏰ ${horasRestantes}h para entrega de ${clientName}${deliveryTime ? ` às ${deliveryTime}` : ''}.`;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `order-${orderId}-${hour}h`,
      content: {
        title: '🎂 Sal Doce — Lembrete de Entrega',
        body,
        data: { orderId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifDate,
      },
    });
  }
}

export async function scheduleAllReminders(
  orders: Array<{ id: string; clientName: string; deliveryDate: string; deliveryTime?: string | null }>
): Promise<void> {
  for (const order of orders) {
    await scheduleDeliveryReminder(order.id, order.clientName, order.deliveryDate, order.deliveryTime);
  }
}
