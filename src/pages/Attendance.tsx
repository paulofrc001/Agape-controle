import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Search, 
  Clock,
  UserCheck,
  UserX
} from 'lucide-react';
import { Participant } from '../types';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Attendance() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    setLoading(true);
    const data = await storageService.getAllParticipants();
    setParticipants(data);
    setLoading(false);
  }

  const togglePresence = async (id: string, currentStatus: boolean) => {
    await storageService.setPresence(id, !currentStatus);
    loadParticipants();
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.symbolicName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight italic">Chamada</h2>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Controle de entrada e presença</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
        <input 
          type="text" 
          placeholder="BUSCAR PARTICIPANTE..." 
          className="input-masonic w-full pl-12 py-4 text-xs font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-surface-sidebar border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-white/30 font-bold">Participante</th>
              <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-white/30 font-bold text-center">Status</th>
              <th className="px-6 py-4 text-[9px] uppercase tracking-widest text-white/30 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredParticipants.map((p) => (
              <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-serif italic text-lg border",
                      p.isPresent ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-white/20 border-white/5"
                    )}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white/90">{p.name}</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-widest font-medium">{p.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center">
                    {p.isPresent ? (
                      <>
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          Presente
                        </span>
                        <span className="text-white/20 text-[8px] flex items-center gap-1 mt-0.5">
                          <Clock size={8} /> {p.checkInTime && format(new Date(p.checkInTime), 'HH:mm')}
                        </span>
                      </>
                    ) : (
                      <span className="text-white/10 text-[10px] font-bold uppercase tracking-widest">
                        Ausente
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => togglePresence(p.id, p.isPresent)}
                    className={cn(
                      "px-4 py-2 rounded text-[10px] font-black transition-all uppercase tracking-[0.2em] border",
                      p.isPresent 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" 
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                  >
                    {p.isPresent ? 'Remover' : 'Marcar'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredParticipants.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center text-white/10 uppercase tracking-[0.3em] font-serif italic text-sm">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
