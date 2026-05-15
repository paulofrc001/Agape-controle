import React, { useState, useEffect } from 'react';
import { 
  Beer, 
  Search, 
  Plus, 
  Minus, 
  User,
  Coffee,
  Droplets,
  Wine,
  CheckCircle
} from 'lucide-react';
import { Participant, DrinkConsumption } from '../types';
import { storageService } from '../services/storageService';
import { cn, DRINKS } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const DRINK_ICONS: Record<string, React.ElementType> = {
  'Cerveja 600ml': Beer,
  'Cerveja Romarinho': Wine,
  'Cerveja sem Álcool': Beer,
  'Refrigerante': Coffee,
  'Água': Droplets
};

export default function Consumption({ participantId }: { participantId?: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(participantId || null);

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    setLoading(true);
    const data = await storageService.getAllParticipants();
    // If participantId is provided, we check if they are present
    if (participantId) {
      setParticipants(data.filter(p => p.id === participantId));
    } else {
      // Admin view: only present participants can consume
      setParticipants(data.filter(p => p.isPresent));
    }
    setLoading(false);
  }

  const handleAdd = async (id: string, type: DrinkConsumption['type']) => {
    await storageService.addConsumption(id, type);
    loadParticipants();
  };

  const handleRemove = async (id: string, type: DrinkConsumption['type']) => {
    await storageService.removeConsumption(id, type);
    loadParticipants();
  };

  const handleConfirmPresence = async (id: string) => {
    try {
      const updated = await storageService.toggleAttendance(id);
      loadParticipants();
      if (updated.isPresent) {
        alert('Presença confirmada! Listagem de consumo liberada.');
      }
    } catch (err) {
      alert('Erro ao confirmar presença.');
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.symbolicName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myRecord = participantId ? participants[0] : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h2 className="text-2xl font-serif text-[var(--text-main)] tracking-tight italic">
            {participantId ? 'Meu Consumo' : 'Consumo'}
          </h2>
          <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-widest mt-1">
            {participantId ? 'Gerencie seu consumo individual' : 'Lançamento instantâneo de bebidas'}
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {participantId && myRecord && !myRecord.isPresent && (
            <div className="bg-surface-sidebar border border-primary/30 p-12 rounded-3xl text-center shadow-2xl max-w-2xl mx-auto">
               <div className="w-20 h-20 rounded-full border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-primary/40" size={32} />
               </div>
               <h3 className="text-2xl font-serif italic text-[var(--text-main)] mb-4">Presença Requerida</h3>
               <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.2em] mb-8 leading-relaxed">
                 Você precisa confirmar sua presença no Ágape antes de lançar o consumo de bebidas.
               </p>
               <button 
                 onClick={() => handleConfirmPresence(myRecord.id)}
                 className="btn-primary w-full py-5 text-xs font-black"
               >
                 Confirmar Minha Presença
               </button>
            </div>
        )}

        {( !participantId || (myRecord && myRecord.isPresent) ) && (
          <>
            {!participantId && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input 
                  type="text" 
                  placeholder="BUSCAR NOME PARA LANÇAMENTO..." 
                  className="input-masonic w-full pl-12 py-4 text-xs font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredParticipants.map((p) => (
                  <motion.div
                    layout
                    key={p.id}
                    className={cn(
                      "bg-surface-sidebar border-l-4 p-6 transition-all rounded-r-2xl shadow-xl border border-[var(--border-main)]",
                      selectedParticipantId === p.id ? "border-l-primary bg-[var(--input-bg)] shadow-primary/5" : "border-l-transparent"
                    )}
                    onClick={() => setSelectedParticipantId(p.id)}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center font-serif italic text-xl text-primary bg-primary/5">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-lg font-serif italic text-[var(--text-main)] transition-colors">{p.name}</h4>
                          <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">Conta Aberta</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded border border-primary/20">
                        {p.consumption.reduce((sum, c) => sum + c.quantity, 0)} Itens
                      </div>
                    </div>

                    <div className="space-y-2">
                      {DRINKS.map((drink) => {
                        const quantity = p.consumption.find(c => c.type === drink)?.quantity || 0;
                        
                        return (
                          <div key={drink} className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-lg border border-[var(--border-main)] group hover:border-primary/20 transition-colors">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-tight text-[var(--text-dim)]">{drink}</p>
                              <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-0.5">Qtd: {quantity}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemove(p.id, drink as any); }}
                                className="w-8 h-8 rounded bg-rose-500/10 text-rose-500 flex items-center justify-center font-black hover:bg-rose-500/20 disabled:opacity-10 transition-all border border-rose-500/10"
                                disabled={quantity === 0}
                              >
                                <Minus size={12} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAdd(p.id, drink as any); }}
                                className="w-10 h-10 rounded bg-primary text-surface-dark flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredParticipants.length === 0 && !loading && (
                <div className="col-span-full text-center py-24 bg-surface-sidebar rounded-2xl border border-[var(--border-main)] opacity-50 font-serif italic text-[var(--text-dim)]">
                   {participantId ? 'Você ainda não foi marcado como presente.' : 'Nenhum participante presente encontrado. Faça a chamada primeiro.'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
