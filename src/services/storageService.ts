import { Participant, AgapeEvent, DrinkConsumption } from '../types';
import { supabase } from '../lib/supabase';

class StorageService {
  async getAllParticipants(): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Map snake_case to camelCase
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
    
    // 1. Save to history
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

    // 2. Clear current session fields in all participants
    const { error: clearError } = await supabase
      .from('participants')
      .update({
        is_present: false,
        check_in_time: null,
        consumption: []
      })
      .neq('id', 'placeholder-to-match-all'); // This trick updates all if the filter matches

    // If update fails on mass, we can do it with a range or specific logic if needed
    // In Supabase, update without filter fails unless allowed. Let's use a better way:
    // We'll update where id is in the list of existing IDs
    const ids = participants.map(p => p.id);
    if (ids.length > 0) {
      const { error: massError } = await supabase
        .from('participants')
        .update({ is_present: false, check_in_time: null, consumption: [] })
        .in('id', ids);
      if (massError) throw massError;
    }
    
    // 3. Reset event details
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

  async setPresence(id: string, isPresent: boolean): Promise<Participant> {
    return this.updateParticipant(id, {
      isPresent,
      checkInTime: isPresent ? new Date().toISOString() : undefined,
    });
  }

  async toggleAttendance(id: string): Promise<Participant> {
    const { data: current, error: getError } = await supabase
      .from('participants')
      .select('is_present')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    return this.setPresence(id, !current.is_present);
  }

  async addConsumption(id: string, drinkType: DrinkConsumption['type']): Promise<Participant> {
    const { data: p, error: getError } = await supabase
      .from('participants')
      .select('is_present, consumption')
      .eq('id', id)
      .single();

    if (getError) throw getError;
    if (!p.is_present) throw new Error('Somente participantes presentes podem consumir');

    const consumption: DrinkConsumption[] = p.consumption || [];
    const index = consumption.findIndex(c => c.type === drinkType);
    
    if (index === -1) {
      consumption.push({ type: drinkType, quantity: 1, updatedAt: new Date().toISOString() });
    } else {
      consumption[index].quantity += 1;
      consumption[index].updatedAt = new Date().toISOString();
    }

    return this.updateParticipant(id, { consumption });
  }

  async removeConsumption(id: string, drinkType: DrinkConsumption['type']): Promise<Participant> {
    const { data: p, error: getError } = await supabase
      .from('participants')
      .select('consumption')
      .eq('id', id)
      .single();

    if (getError) throw getError;
    
    const consumption: DrinkConsumption[] = p.consumption || [];
    const index = consumption.findIndex(c => c.type === drinkType);
    
    if (index !== -1 && consumption[index].quantity > 0) {
      consumption[index].quantity -= 1;
      consumption[index].updatedAt = new Date().toISOString();
    }

    return this.updateParticipant(id, { consumption });
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
      };
    }
    
    return {
      id: data.id,
      name: data.name,
      date: data.date,
      storeName: data.store_name,
      logoUrl: data.logo_url,
      adminEmail: data.admin_email,
      adminPassword: data.admin_password
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
      adminPassword: data.admin_password
    };
  }
}

export const storageService = new StorageService();
