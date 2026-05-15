import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Beer,
  Plus,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Participant } from '../types';
import { storageService } from '../services/storageService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-[#151515] border border-white/5 p-6 rounded-xl flex flex-col justify-center hover:border-primary/20 transition-all">
      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className={cn("text-3xl font-serif", label === 'Consumo Total' ? 'text-primary' : 'text-white')}>{value}</p>
        <Icon size={20} className={cn("opacity-20", color.split(' ')[1])} />
      </div>
    </div>
  );
}

import { emailService } from '../services/emailService';

export default function Dashboard({ userType, participantId }: { userType?: 'admin' | 'brother', participantId?: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentBrother = participants.find(p => p.id === participantId);

  useEffect(() => {
    async function loadData() {
      const [parts, evt] = await Promise.all([
        storageService.getAllParticipants(),
        storageService.getEvent()
      ]);
      setParticipants(parts);
      setEvent(evt);
      setLoading(false);
    }
    loadData();
  }, []);

  const stats = {
    total: participants.length,
    present: participants.filter(p => p.isPresent).length,
    absent: participants.filter(p => !p.isPresent).length,
    totalDrinks: participants.reduce((total, p) => 
      total + p.consumption.reduce((sum, c) => sum + c.quantity, 0), 0
    ),
  };

  const drinkTotals = participants.reduce((acc, p) => {
    p.consumption.forEach(c => {
      acc[c.type] = (acc[c.type] || 0) + c.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const handleConfirmPresence = async () => {
    if (participantId) {
      try {
        const updated = await storageService.toggleAttendance(participantId);
        const parts = await storageService.getAllParticipants();
        setParticipants(parts);
        if (updated.isPresent) {
          alert('Sua presença foi confirmada com sucesso! Agora você pode lançar seu consumo.');
        } else {
          alert('Sua presença foi removida.');
        }
      } catch (err) {
        alert('Erro ao confirmar presença. Verifique sua conexão ou tente novamente.');
      }
    }
  };

  const handleFinalize = async () => {
    if (participants.filter(p => p.isPresent).length === 0 && participants.reduce((acc, p) => acc + p.consumption.length, 0) === 0) {
      if (!confirm('Nenhum consumo ou presença registrada. Deseja finalizar assim mesmo?')) return;
    }

    if (confirm('Deseja realmente finalizar o evento? Isso salvará o histórico, enviará o relatório PDF por e-mail para o Mestre de Banquete e limpará todas as presenças e consumos para o próximo Ágape.')) {
      try {
        setLoading(true);
        // Send report before clearing data
        if (event?.adminEmail) {
          await emailService.sendReportWithPDF(event, participants);
        }
        
        await storageService.finalizeSession();
        
        // Reload page data
        const [parts, evt] = await Promise.all([
          storageService.getAllParticipants(),
          storageService.getEvent()
        ]);
        setParticipants(parts);
        setEvent(evt);
        setLoading(false);
        alert('Evento finalizado com sucesso! O relatório PDF foi enviado para o seu e-mail e os registros foram salvos no histórico.');
      } catch (err) {
        console.error('Error finalizing:', err);
        alert('Ocorreu um erro ao finalizar o evento.');
        setLoading(false);
      }
    }
  };

  const handleCreateNew = () => {
    if (confirm('Iniciar novo Ágape agora? Verifique se o anterior foi finalizado.')) {
      window.location.href = '/settings';
    }
  };

  if (loading) return <div className="animate-pulse">Carregando...</div>;

  return (
    <div className="space-y-8 h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/20 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-serif italic text-white tracking-tight">{event?.storeName || 'Loja Maçônica'}</h2>
          <div className="flex items-center gap-4 text-primary text-[10px] uppercase tracking-[0.2em] font-bold mt-1">
             <span>{event?.name}</span>
             <span className="w-1 h-1 bg-primary/40 rounded-full" />
             <span className="flex items-center gap-1"><Clock size={12} /> {event && format(new Date(event.date), "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
        </div>
        {userType === 'admin' && (
          <div className="flex gap-3">
            <button onClick={handleCreateNew} className="btn-secondary">Novo Ágape</button>
            <button onClick={handleFinalize} className="btn-primary">Finalizar Evento</button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Cadastro" 
          value={stats.total} 
          icon={Users} 
          color="text-blue-400" 
        />
        <StatCard 
          label="Presentes Agora" 
          value={stats.present} 
          icon={CheckCircle} 
          color="text-emerald-400" 
        />
        <StatCard 
          label="Ausentes" 
          value={stats.absent} 
          icon={XCircle} 
          color="text-rose-400" 
        />
        <StatCard 
          label="Consumo Total" 
          value={stats.totalDrinks} 
          icon={Beer} 
          color="text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-sidebar border border-white/5 p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">
                 Consumo Coletivo
               </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {['Cerveja 600ml', 'Cerveja Romarinho', 'Cerveja sem Álcool', 'Refrigerante', 'Água'].map((drink) => (
                <div key={drink} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-tight text-white/70">{drink}</span>
                      <span className="text-2xl font-serif text-primary">{drinkTotals[drink] || 0}</span>
                   </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ 
                           width: `${Math.min(100, ((drinkTotals[drink] || 0) / (Math.max(...(Object.values(drinkTotals) as number[]), 1))) * 100)}%` 
                         }}
                         className="h-full bg-primary/60"
                       />
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           {userType === 'brother' && currentBrother && !currentBrother.isPresent && (
             <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl shadow-xl text-center">
                <CheckCircle className="text-primary mx-auto mb-4" size={32} />
                <h3 className="text-lg font-serif italic mb-2 text-white">Bem-vindo, Irmão!</h3>
                <p className="text-[10px] text-white/50 uppercase tracking-widest mb-6 leading-relaxed">
                  Para liberar o lançamento de consumo e registrar sua presença oficial, clique no botão abaixo.
                </p>
                <button onClick={handleConfirmPresence} className="btn-primary w-full py-4">
                   Confirmar Presença
                </button>
             </div>
           )}

           <div className="bg-surface-sidebar border border-primary/30 p-8 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 rounded-full border border-primary flex items-center justify-center mb-4">
                 <Beer className="text-primary" size={24} />
              </div>
              <h3 className="text-sm font-serif italic mb-2 tracking-wide text-white">Lançamento Rápido</h3>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-6">Operação em tempo real</p>
              <Link to="/consumption" className="btn-primary w-full py-4 flex items-center justify-center gap-3">
                 <Plus size={16} /> Lançar Agora
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

