export interface SalgadosQty {
  coxinha?: number;
  rissoisCarne?: number;
  rissoisMistos?: number;
  bolinhsQueijo?: number;
  pastelFrango?: number;
  pastelCarne?: number;
  pastelPizza?: number;
  enroladinho?: number;
  pastelBacalhau?: number;
}

export interface BrigadeirosQty {
  tradicional?: number;
  beijinho?: number;
  morango?: number;
  ninho?: number;
  churros?: number;
  sensacao?: number;
  seducao?: number;
  casadinho?: number;
  prestigio?: number;
  oreo?: number;
  napolitano?: number;
  cafe?: number;
}

export interface Order {
  id: string;
  clientName: string;
  clientPhone: string | null;
  deliveryDate: string;
  orderType: string;
  cakeType: string;
  filling: string;
  weightKg: number;
  topper: string | null;
  hostia: string | null;
  especial: string | null;
  salgados: SalgadosQty;
  brigadeiros: BrigadeirosQty;
  price: number;
  photoUri: string | null;
  sourceChannel: string;
  deliveryTime: string;
  notes: string | null;
  status: string;
  deliveryTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  clientName: string;
  clientPhone: string;
  deliveryDate: string;
  orderType: string;
  cakeType: string;
  filling: string;
  weightKg: string;
  topper: string;
  hostia: string;
  especial: string;
  salgados: SalgadosQty;
  brigadeiros: BrigadeirosQty;
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
