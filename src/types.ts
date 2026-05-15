
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
  observations?: string;
  isPresent: boolean;
  checkInTime?: string;
  consumption: DrinkConsumption[];
  createdAt: string;
}

export interface AgapeEvent {
  id: string;
  name: string;
  date: string;
  storeName: string;
  logoUrl?: string;
  adminEmail?: string;
}
