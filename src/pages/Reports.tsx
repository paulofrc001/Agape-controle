import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Trophy, 
  Users, 
  Beer,
  Share2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateAgapePDF } from '../lib/reportUtils';
import { Participant, DrinkConsumption } from '../types';
import { storageService } from '../services/storageService';
import { cn, DRINKS } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reports() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const parts = await storageService.getAllParticipants();
      const event = await storageService.getEvent();
      setParticipants(parts);
      setEventData(event);
      setLoading(false);
    }
    load();
  }, []);

  const handleExportPDF = () => {
    const doc = generateAgapePDF(eventData, participants);
    doc.save(`Relatorio_Agape_${eventData?.name || 'Evento'}.pdf`);
  };

  const presentCount = participants.filter(p => p.isPresent).length;
  const totalCount = participants.length;
  
  const drinkTotals = participants.reduce((acc, p) => {
    p.consumption.forEach(c => {
      acc[c.type] = (acc[c.type] || 0) + c.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const ranking = [...participants]
    .map(p => ({
      ...p,
      totalDrinks: p.consumption.reduce((sum, c) => sum + c.quantity, 0)
    }))
    .filter(p => p.totalDrinks > 0)
    .sort((a, b) => b.totalDrinks - a.totalDrinks);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight italic">Relatório de Ágape</h2>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Consumo e participação consolidados</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportPDF} className="btn-secondary">
             <Download size={14} className="inline mr-2" /> PDF
           </button>
           <button className="btn-primary">
             <Share2 size={14} className="inline mr-2" /> Exportar
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Consumo Geral */}
        <div className="bg-surface-sidebar border border-white/5 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Consumo Coletivo</h3>
          </div>

          <div className="space-y-6">
            {DRINKS.map(drink => (
              <div key={drink} className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full border border-white/5 flex items-center justify-center font-serif text-2xl text-white">
                  {drinkTotals[drink] || 0}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">{drink}</p>
                  <div className="h-1 bg-white/5 rounded-full mt-2">
                    <div 
                      className="h-full bg-primary/60" 
                      style={{ width: `${Math.min(100, ((drinkTotals[drink] || 0) / 100) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-xl border border-white/5">
               <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Total de Itens</span>
               <span className="text-4xl font-serif text-primary">
                 {(Object.values(drinkTotals) as number[]).reduce((a, b) => a + b, 0)}
               </span>
            </div>
          </div>
        </div>

        {/* Ranking de Consumo */}
        <div className="bg-surface-sidebar border border-white/5 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Destaques de Consumo</h3>
          </div>

          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 scroll-thin">
            {ranking.map((p, index) => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-serif text-xs",
                  index === 0 ? "gold-gradient text-surface-dark font-black" : 
                  index === 1 ? "bg-slate-300 text-black font-bold" :
                  index === 2 ? "bg-amber-700 text-white font-bold" : "bg-white/5 text-white/30"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-serif italic text-white/90">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.consumption.filter(c => c.quantity > 0).map(c => (
                      <span key={c.type} className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 uppercase tracking-tighter">
                        {c.quantity}x {c.type}
                      </span>
                    ))}
                    {p.consumption.length === 0 && <p className="text-[9px] text-white/20 uppercase tracking-widest font-medium">{p.type}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif text-primary">{p.totalDrinks}</p>
                  <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Unidades</p>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div className="text-center py-24 text-white/10 font-serif italic uppercase tracking-widest">
                Nenhum consumo registrado ainda.
              </div>
            )}
          </div>
        </div>

        {/* Participação */}
        <div className="lg:col-span-2 bg-surface-sidebar border border-white/5 p-8 rounded-2xl">
           <div className="flex items-center gap-3 mb-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Mapa de Presença</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                Presentes ({presentCount})
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scroll-thin">
                {participants.filter(p => p.isPresent).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-[11px] p-3 bg-white/[0.02] border border-white/5 rounded">
                    <span className="font-medium text-white/80">{p.name}</span>
                    <span className="badge-masonic">{p.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-rose-500 mb-6 flex items-center gap-2">
                Ausentes ({totalCount - presentCount})
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scroll-thin">
                {participants.filter(p => !p.isPresent).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-[11px] p-3 bg-white/[0.02] border border-white/5 rounded opacity-60">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-white/20 uppercase text-[9px] tracking-tighter">{p.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
