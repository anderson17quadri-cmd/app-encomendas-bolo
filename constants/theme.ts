import { Platform } from 'react-native';

export const Colors = {
  primary: '#E91E63',
  accent: '#FF6F61',
  secondary: '#FCE4EC',
  background: '#FFF8F5',
  backgroundEnd: '#FFF0EB',
  surface: '#FFFFFF',
  textPrimary: '#3E2723',
  textSecondary: '#795548',
  border: '#FCE4EC',
  error: '#D32F2F',
  shadow: 'rgba(233,30,99,0.08)',
  white: '#FFFFFF',
  gradientStart: '#E91E63',
  gradientEnd: '#FF6F61',
  status: {
    Pendente: '#FFA726',
    'Em Produção': '#42A5F5',
    Concluída: '#66BB6A',
    Entregue: '#AB47BC',
  } as Record<string, string>,
  channel: {
    WhatsApp: '#25D366',
    Instagram: '#E1306C',
  } as Record<string, string>,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }) ?? 'System',
  bold: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }) ?? 'System',
};

export const CAKE_TYPES = ['Pao de Lo', 'Massa de Chocolate', 'Massa Red Velvet', 'Outros'] as const;
export const FILLINGS = ['Brigadeiro Tradicional', 'Brigadeiro de Ninho', 'Brigadeiro Branco', 'Beijinho', 'Doce de Leite', 'Doce de Morango', 'Brigadeiro de Maracuja', 'Praline de Chocolate', 'Nutella', 'Chantilly', 'Ferrero', 'Oreo', 'Kinder Bueno', 'Kit Kat Crocante', 'Outros'] as const;
export const CHANNELS = ['WhatsApp', 'Instagram'] as const;
export const STATUSES = ['Pendente', 'Em Produção', 'Concluída', 'Entregue'] as const;
export type OrderStatus = typeof STATUSES[number];
export type CakeType = typeof CAKE_TYPES[number];
export type Filling = typeof FILLINGS[number];
export type Channel = typeof CHANNELS[number];
