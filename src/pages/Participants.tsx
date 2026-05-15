import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Participant, ParticipantType } from '../types';
import { storageService } from '../services/storageService';
import { cn, PARTICIPANT_TYPES } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Participants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    symbolicName: '',
    password: '',
    type: 'Irmão' as ParticipantType,
    observations: ''
  });

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    setLoading(true);
    const data = await storageService.getAllParticipants();
    setParticipants(data);
    setLoading(false);
  }

  const handleOpenModal = (participant?: Participant) => {
    if (participant) {
      setEditingParticipant(participant);
      setFormData({
        name: participant.name,
        symbolicName: participant.symbolicName || '',
        password: participant.password || '',
        type: participant.type,
        observations: participant.observations || ''
      });
    } else {
      setEditingParticipant(null);
      setFormData({
        name: '',
        symbolicName: '',
        password: '',
        type: 'Irmão',
        observations: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParticipant) {
      await storageService.updateParticipant(editingParticipant.id, formData);
    } else {
      await storageService.addParticipant(formData);
    }
    setIsModalOpen(false);
    loadParticipants();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este participante?')) {
      await storageService.deleteParticipant(id);
      loadParticipants();
    }
  };

  const filteredParticipants = participants
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 p.symbolicName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => filterType === 'all' || p.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-tight italic">Participantes</h2>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Gestão de convidados e irmãos</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus size={14} /> Novo Cadastro
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
          <input 
            type="text" 
            placeholder="BUSCAR NOME..." 
            className="input-masonic w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['all', ...PARTICIPANT_TYPES].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded text-[9px] uppercase tracking-widest transition-all border shrink-0",
                filterType === type 
                  ? "bg-primary/10 text-primary border-primary/30 font-bold" 
                  : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
              )}
            >
              {type === 'all' ? 'Todos' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredParticipants.map((p) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={p.id}
              className="bg-surface-sidebar border border-white/5 p-5 group hover:border-primary/40 transition-all rounded-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary font-serif italic text-lg border border-primary/20">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-white/90">{p.name}</h4>
                    {p.symbolicName && (
                      <p className="text-primary/60 text-[9px] uppercase tracking-widest mt-0.5">{p.symbolicName}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(p)}
                    className="p-1.5 hover:bg-white/5 rounded text-white/30 hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 hover:bg-rose-500/10 rounded text-white/30 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <span className="badge-masonic">
                  {p.type}
                </span>
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest",
                  p.isPresent ? "text-emerald-500" : "text-white/20"
                )}>
                  {p.isPresent ? 'Presente' : 'Ausente'}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-surface-card border border-white/10 rounded-2xl shadow-3xl p-8"
            >
              <h3 className="text-2xl font-bold mb-6 gold-text-gradient">
                {editingParticipant ? 'Editar Participante' : 'Novo Participante'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-white/40">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="input-masonic w-full"
                    placeholder="Ex: João da Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-white/40">Nome Simbólico (Opcional)</label>
                  <input 
                    type="text" 
                    className="input-masonic w-full"
                    placeholder="Ex: Aprendiz da Paz"
                    value={formData.symbolicName}
                    onChange={(e) => setFormData({...formData, symbolicName: e.target.value})}
                  />
                </div>
                {formData.type === 'Irmão' && (
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-white/40">Palavra de Passe (Para Acesso Individual)</label>
                    <input 
                      type="password" 
                      className="input-masonic w-full"
                      placeholder="Senha para o irmão"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-white/40">Tipo</label>
                  <select 
                    className="input-masonic w-full appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as ParticipantType})}
                  >
                    {PARTICIPANT_TYPES.map(t => (
                      <option key={t} value={t} className="bg-surface-card">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-white/40">Observações</label>
                  <textarea 
                    className="input-masonic w-full h-24 resize-none"
                    value={formData.observations}
                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary flex-1"
                  >
                    {editingParticipant ? 'Salvar Alterações' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
