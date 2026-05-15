import { Participant, AgapeEvent, DrinkConsumption } from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  PARTICIPANTS: 'agape_participants',
  EVENT: 'agape_event',
  HISTORY: 'agape_history'
};

const IS_SUPABASE_CONFIGURED = 
  !!(import.meta.env as any).VITE_SUPABASE_URL && 
  (import.meta.env as any).VITE_SUPABASE_URL.startsWith('http') &&
  !!(import.meta.env as any).VITE_SUPABASE_ANON_KEY;

console.log('Agape Storage Init - Supabase Configured:', IS_SUPABASE_CONFIGURED);

class LocalStorageService {
  getParticipants(): Participant[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading participants from localStorage:', e);
      return [];
    }
  }

  saveParticipants(participants: Participant[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
    } catch (e) {
      console.error('Error saving participants to localStorage:', e);
    }
  }

  async getAllParticipants(): Promise<Participant[]> {
    return this.getParticipants();
  }

  async addParticipant(participant: Omit<Participant, 'id' | 'createdAt' | 'consumption' | 'isPresent'>): Promise<Participant> {
    const participants = this.getParticipants();
    const id = typeof crypto?.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
    const newParticipant: Participant = {
      ...participant,
      id,
      createdAt: new Date().toISOString(),
      isPresent: false,
      consumption: [],
    };
    participants.push(newParticipant);
    this.saveParticipants(participants);
    return newParticipant;
  }

  async finalizeSession(): Promise<void> {
    const participants = this.getParticipants();
    const event = await this.getEvent();
    
    // Save to history
    const historyData = localStorage.getItem(STORAGE_KEYS.HISTORY);
    let history = [];
    try {
      history = historyData ? JSON.parse(historyData) : [];
      if (!Array.isArray(history)) history = [];
    } catch (e) {
      history = [];
    }
    
    history.push({
      event,
      participants: participants.filter(p => p.isPresent || p.consumption.length > 0).map(p => ({
        name: p.name,
        type: p.type,
        consumption: p.consumption
      })),
      finalizedAt: new Date().toISOString()
    });
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

    // Reset current session fields
    const finalized = participants.map(p => ({
      ...p,
      isPresent: false,
      checkInTime: undefined,
      consumption: []
    }));
    
    this.saveParticipants(finalized);
    
    // Reset event details
    await this.updateEvent({
      name: 'Novo Ágape',
      date: new Date().toISOString(),
    });
  }

  async authenticateBrother(symbolicName: string, password?: string): Promise<Participant | null> {
    const participants = this.getParticipants();
    const brother = participants.find(p => 
      p.type === 'Irmão' && 
      p.symbolicName?.toLowerCase() === symbolicName.toLowerCase()
    );

    if (!brother) return null;
    if (brother.password && brother.password !== password) return null;
    
    return brother;
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
    const participants = this.getParticipants();
    const index = participants.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Participante não encontrado');
    
    participants[index] = { ...participants[index], ...updates };
    this.saveParticipants(participants);
    return participants[index];
  }

  async deleteParticipant(id: string): Promise<void> {
    const participants = this.getParticipants();
    const filtered = participants.filter(p => p.id !== id);
    this.saveParticipants(filtered);
  }

  async getEvent(): Promise<AgapeEvent> {
    const data = localStorage.getItem(STORAGE_KEYS.EVENT);
    if (data) return JSON.parse(data);
    
    return {
        id: '1',
        name: 'Jantar de Ágape de Inverno',
        date: new Date().toISOString(),
        storeName: 'Augusta e Respeitável Loja Simbólica',
        drinkPrices: [
          { type: 'Cerveja 600ml', price: 15 },
          { type: 'Cerveja Romarinho', price: 8 },
          { type: 'Cerveja sem Álcool', price: 10 },
          { type: 'Refrigerante', price: 6 },
          { type: 'Água', price: 4 }
        ]
    };
  }

  async updateEvent(event: Partial<AgapeEvent>): Promise<AgapeEvent> {
    const current = await this.getEvent();
    const updated = { ...current, ...event };
    localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(updated));
    return updated;
  }
}

class SupabaseService {
  async getAllParticipants(): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      symbolicName: p.symbolic_name,
      phone: p.phone,
      password: p.password,
      isPresent: p.is_present,
      checkInTime: p.check_in_time,
      consumption: p.consumption || [],
      createdAt: p.created_at
    }));
  }

  async addParticipant(participant: Omit<Participant, 'id' | 'createdAt' | 'consumption' | 'isPresent'>): Promise<Participant> {
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        name: participant.name,
        type: participant.type,
        symbolic_name: participant.symbolicName,
        phone: participant.phone,
        password: participant.password,
        is_present: false,
        consumption: []
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...participant,
      id: data.id,
      createdAt: data.created_at,
      isPresent: data.is_present,
      consumption: data.consumption
    };
  }

  async finalizeSession(): Promise<void> {
    const participants = await this.getAllParticipants();
    const event = await this.getEvent();
    
    const { error: historyError } = await supabase
      .from('agape_history')
      .insert([{
        event_data: event,
        participants_data: participants.filter(p => p.isPresent || p.consumption.length > 0).map(p => ({
          name: p.name,
          type: p.type,
          consumption: p.consumption
        })),
        finalized_at: new Date().toISOString()
      }]);

    if (historyError) throw historyError;

    const ids = participants.map(p => p.id);
    if (ids.length > 0) {
      const { error: massError } = await supabase
        .from('participants')
        .update({ is_present: false, check_in_time: null, consumption: [] })
        .in('id', ids);
      if (massError) throw massError;
    }
    
    await this.updateEvent({
      name: 'Novo Ágape',
      date: new Date().toISOString(),
    });
  }

  async authenticateBrother(symbolicName: string, password?: string): Promise<Participant | null> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('type', 'Irmão')
      .ilike('symbolic_name', symbolicName)
      .single();

    if (error || !data) return null;
    if (data.password && data.password !== password) return null;
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      symbolicName: data.symbolic_name,
      phone: data.phone,
      password: data.password,
      isPresent: data.is_present,
      checkInTime: data.check_in_time,
      consumption: data.consumption || [],
      createdAt: data.created_at
    };
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.symbolicName !== undefined) dbUpdates.symbolic_name = updates.symbolicName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.isPresent !== undefined) dbUpdates.is_present = updates.isPresent;
    if (updates.checkInTime !== undefined) dbUpdates.check_in_time = updates.checkInTime;
    if (updates.consumption !== undefined) dbUpdates.consumption = updates.consumption;

    const { data, error } = await supabase
      .from('participants')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...updates,
      id: data.id,
      name: data.name,
      type: data.type,
      symbolicName: data.symbolic_name,
      phone: data.phone,
      password: data.password,
      isPresent: data.is_present,
      checkInTime: data.check_in_time,
      consumption: data.consumption || [],
      createdAt: data.created_at
    } as Participant;
  }

  async deleteParticipant(id: string): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getEvent(): Promise<AgapeEvent> {
    const { data, error } = await supabase
      .from('event_config')
      .select('*')
      .eq('id', 'current')
      .single();
    
    if (error || !data) {
      return {
          id: '1',
          name: 'Jantar de Ágape de Inverno',
          date: new Date().toISOString(),
          storeName: 'Augusta e Respeitável Loja Simbólica',
          drinkPrices: [
            { type: 'Cerveja 600ml', price: 15 },
            { type: 'Cerveja Romarinho', price: 8 },
            { type: 'Cerveja sem Álcool', price: 10 },
            { type: 'Refrigerante', price: 6 },
            { type: 'Água', price: 4 }
          ]
      };
    }
    
    return {
      id: data.id,
      name: data.name,
      date: data.date,
      storeName: data.store_name,
      logoUrl: data.logo_url,
      adminEmail: data.admin_email,
      adminPassword: data.admin_password,
      drinkPrices: data.drink_prices || [
        { type: 'Cerveja 600ml', price: 15 },
        { type: 'Cerveja Romarinho', price: 8 },
        { type: 'Cerveja sem Álcool', price: 10 },
        { type: 'Refrigerante', price: 6 },
        { type: 'Água', price: 4 }
      ]
    };
  }

  async updateEvent(event: Partial<AgapeEvent>): Promise<AgapeEvent> {
    const dbUpdates: any = {};
    if (event.name !== undefined) dbUpdates.name = event.name;
    if (event.date !== undefined) dbUpdates.date = event.date;
    if (event.storeName !== undefined) dbUpdates.store_name = event.storeName;
    if (event.logoUrl !== undefined) dbUpdates.logo_url = event.logoUrl;
    if (event.adminEmail !== undefined) dbUpdates.admin_email = event.adminEmail;
    if (event.adminPassword !== undefined) dbUpdates.admin_password = event.adminPassword;
    if (event.drinkPrices !== undefined) dbUpdates.drink_prices = event.drinkPrices;

    const { data, error } = await supabase
      .from('event_config')
      .update(dbUpdates)
      .eq('id', 'current')
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      date: data.date,
      storeName: data.store_name,
      logoUrl: data.logo_url,
      adminEmail: data.admin_email,
      adminPassword: data.admin_password,
      drinkPrices: data.drink_prices
    };
  }
}

class StorageService {
  private local = new LocalStorageService();
  private supabase = new SupabaseService();

  private get service() {
    return IS_SUPABASE_CONFIGURED ? this.supabase : this.local;
  }

  async getAllParticipants() { return this.service.getAllParticipants(); }
  async addParticipant(p: any) { return this.service.addParticipant(p); }
  async finalizeSession() { return this.service.finalizeSession(); }
  async authenticateBrother(s: string, p?: string) { return this.service.authenticateBrother(s, p); }
  async updateParticipant(id: string, u: any) { return this.service.updateParticipant(id, u); }
  async deleteParticipant(id: string) { return this.service.deleteParticipant(id); }
  async getEvent() { return this.service.getEvent(); }
  async updateEvent(e: any) { return this.service.updateEvent(e); }

  // Shared logic helpers
  async setPresence(id: string, isPresent: boolean): Promise<Participant> {
    return this.updateParticipant(id, {
      isPresent,
      checkInTime: isPresent ? new Date().toISOString() : undefined,
    });
  }

  async toggleAttendance(id: string): Promise<Participant> {
    const participants = await this.getAllParticipants();
    const participant = participants.find(p => p.id === id);
    if (!participant) throw new Error('Participante não encontrado');
    return this.setPresence(id, !participant.isPresent);
  }

  async addConsumption(id: string, drinkType: DrinkConsumption['type']): Promise<Participant> {
    const participants = await this.getAllParticipants();
    const p = participants.find(p => p.id === id);
    if (!p) throw new Error('Participante não encontrado');
    if (!p.isPresent) throw new Error('Somente participantes presentes podem consumir');

    const consumption: DrinkConsumption[] = [...(p.consumption || [])];
    const index = consumption.findIndex(c => c.type === drinkType);
    
    if (index === -1) {
      consumption.push({ type: drinkType, quantity: 1, updatedAt: new Date().toISOString() });
    } else {
      consumption[index] = {
        ...consumption[index],
        quantity: consumption[index].quantity + 1,
        updatedAt: new Date().toISOString()
      };
    }

    return this.updateParticipant(id, { consumption });
  }

  async removeConsumption(id: string, drinkType: DrinkConsumption['type']): Promise<Participant> {
    const participants = await this.getAllParticipants();
    const p = participants.find(p => p.id === id);
    if (!p) throw new Error('Participante não encontrado');
    
    const consumption: DrinkConsumption[] = [...(p.consumption || [])];
    const index = consumption.findIndex(c => c.type === drinkType);
    
    if (index !== -1 && consumption[index].quantity > 0) {
      consumption[index] = {
        ...consumption[index],
        quantity: consumption[index].quantity - 1,
        updatedAt: new Date().toISOString()
      };
    }

    return this.updateParticipant(id, { consumption });
  }
}

export const storageService = new StorageService();
