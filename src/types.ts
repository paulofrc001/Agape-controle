
export type ParticipantType = 'Irmão' | 'Familiar' | 'Convidado' | 'Visitante';

export interface DrinkConsumption {
  type: 'Cerveja 600ml' | 'Cerveja Romarinho' | 'Cerveja sem Álcool' | 'Refrigerante' | 'Água';
  quantity: number;
  updatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  symbolicName?: string;
  password?: string; // For individual brother access
  type: ParticipantType;
  phone?: string;
  observations?: string;
  isPresent: boolean;
  checkInTime?: string;
  consumption: DrinkConsumption[];
  createdAt: string;
}

export interface DrinkPrice {
  type: DrinkConsumption['type'];
  price: number;
}

export interface AgapeEvent {
  id: string;
  name: string;
  date: string;
  storeName: string;
  logoUrl?: string;
  adminEmail?: string;
  adminPassword?: string;
  drinkPrices?: DrinkPrice[];
}
