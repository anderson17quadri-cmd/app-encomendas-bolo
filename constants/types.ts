export interface Order {
  id: string;
  clientName: string;
  deliveryDate: string; // YYYY-MM-DD
  cakeType: string;
  filling: string;
  weightKg: number;
  photoUri: string | null;
  sourceChannel: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  clientName: string;
  deliveryDate: string;
  cakeType: string;
  filling: string;
  weightKg: string;
  photoUri: string | null;
  sourceChannel: string;
  notes: string;
  status: string;
}

export interface MarkedDates {
  [date: string]: {
    dots?: Array<{ key: string; color: string }>;
    selected?: boolean;
    selectedColor?: string;
  };
}
