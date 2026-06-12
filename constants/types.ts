export interface Order {
  id: string;
  clientName: string;
  clientPhone: string | null;
  deliveryDate: string;
  cakeType: string;
  filling: string;
  weightKg: number;
  price: number;
  photoUri: string | null;
  sourceChannel: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  clientName: string;
  clientPhone: string;
  deliveryDate: string;
  cakeType: string;
  filling: string;
  weightKg: string;
  price: string;
  photoUri: string | null;
  sourceChannel: string;
  notes: string;
}

export interface MarkedDates {
  [date: string]: {
    dots?: Array<{ key: string; color: string }>;
    selected?: boolean;
    selectedColor?: string;
  };
}
