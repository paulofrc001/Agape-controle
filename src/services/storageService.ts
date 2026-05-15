import { Participant, AgapeEvent, DrinkConsumption } from '../types';

const STORAGE_KEYS = {
  PARTICIPANTS: 'agape_participants',
  EVENT: 'agape_event',
};

class StorageService {
  private getParticipants(): Participant[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return data ? JSON.parse(data) : [];
  }

  private saveParticipants(participants: Participant[]) {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  }

  async getAllParticipants(): Promise<Participant[]> {
    return this.getParticipants();
  }

  async addParticipant(participant: Omit<Participant, 'id' | 'createdAt' | 'consumption' | 'isPresent'>): Promise<Participant> {
    const participants = this.getParticipants();
    const newParticipant: Participant = {
      ...participant,
      id: crypto.randomUUID(),
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
    const historyData = localStorage.getItem('agape_history');
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
    
    localStorage.setItem('agape_history', JSON.stringify(history));

    // Reset current session fields
    const finalized = participants.map(p => ({
      ...p,
      isPresent: false,
      checkInTime: undefined,
      consumption: []
    }));
    
    this.saveParticipants(finalized);
    
    // Reset event details for next time (keep store name)
    this.updateEvent({
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
    
    // If brother has no password yet, we might want to set one or just allow if empty
    // For now, simple check
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

  async setPresence(id: string, isPresent: boolean): Promise<Participant> {
    return this.updateParticipant(id, {
      isPresent,
      checkInTime: isPresent ? new Date().toISOString() : undefined,
    });
  }

  async toggleAttendance(id: string): Promise<Participant> {
    const participants = this.getParticipants();
    const participant = participants.find(p => p.id === id);
    if (!participant) throw new Error('Participante não encontrado');
    
    return this.setPresence(id, !participant.isPresent);
  }

  async addConsumption(id: string, drinkType: DrinkConsumption['type']): Promise<Participant> {
    const participants = this.getParticipants();
    const index = participants.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Participante não encontrado');
    
    const participant = participants[index];
    if (!participant.isPresent) throw new Error('Somente participantes presentes podem consumir');

    const consumptionIndex = participant.consumption.findIndex(c => c.type === drinkType);
    if (consumptionIndex === -1) {
      participant.consumption.push({ type: drinkType, quantity: 1, updatedAt: new Date().toISOString() });
    } else {
      participant.consumption[consumptionIndex].quantity += 1;
      participant.consumption[consumptionIndex].updatedAt = new Date().toISOString();
    }

    this.saveParticipants(participants);
    return participant;
  }

  async removeConsumption(id: string, drinkType: DrinkConsumption['type']): Promise<Participant> {
    const participants = this.getParticipants();
    const index = participants.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Participante não encontrado');
    
    const participant = participants[index];
    const consumptionIndex = participant.consumption.findIndex(c => c.type === drinkType);
    
    if (consumptionIndex !== -1 && participant.consumption[consumptionIndex].quantity > 0) {
      participant.consumption[consumptionIndex].quantity -= 1;
      participant.consumption[consumptionIndex].updatedAt = new Date().toISOString();
    }

    this.saveParticipants(participants);
    return participant;
  }

  async getEvent(): Promise<AgapeEvent> {
    const data = localStorage.getItem(STORAGE_KEYS.EVENT);
    if (data) return JSON.parse(data);
    
    // Default event if none exists
    const defaultEvent: AgapeEvent = {
        id: '1',
        name: 'Jantar de Ágape de Inverno',
        date: new Date().toISOString(),
        storeName: 'Augusta e Respeitável Loja Simbólica',
    };
    return defaultEvent;
  }

  async updateEvent(event: Partial<AgapeEvent>): Promise<AgapeEvent> {
    const current = await this.getEvent();
    const updated = { ...current, ...event };
    localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(updated));
    return updated;
  }
}

export const storageService = new StorageService();
