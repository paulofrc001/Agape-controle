import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DRINKS = [
  'Cerveja 600ml',
  'Cerveja Romarinho',
  'Cerveja sem Álcool',
  'Refrigerante',
  'Água'
] as const;

export const PARTICIPANT_TYPES = [
  'Irmão',
  'Familiar',
  'Convidado',
  'Visitante'
] as const;
