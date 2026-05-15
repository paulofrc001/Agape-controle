import React, { useState, useEffect } from 'react';
import { AgapeEvent } from '../types';
import { storageService } from '../services/storageService';
import { Save, Store, Calendar, FileText, Image as ImageIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { emailService } from '../services/emailService';

export default function Settings() {
  const [event, setEvent] = useState<AgapeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await storageService.getEvent();
      setEvent(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (event) {
      await storageService.updateEvent(event);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading || !event) return <div>Carregando...</div>;

  return (
    <div className="space-y-8 h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-serif text-[var(--text-main)] tracking-tight italic">Configurações</h2>
          <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-widest mt-1">Personalização do ambiente de Ágape</p>
        </div>
      </header>

      <div className="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-surface-sidebar border border-[var(--border-main)] p-8 rounded-2xl shadow-xl space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60 border-b border-primary/10 pb-3">Informações da Oficina</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-black ml-1 flex items-center gap-2">
                    <Store size={12} className="text-primary/40" /> Nome da Loja
                  </label>
                  <input 
                    type="text" 
                    className="input-masonic w-full py-3"
                    value={event.storeName}
                    onChange={(e) => setEvent({...event, storeName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-black ml-1 flex items-center gap-2">
                    <FileText size={12} className="text-primary/40" /> Identificação do Ágape
                  </label>
                  <input 
                    type="text" 
                    className="input-masonic w-full py-3"
                    value={event.name}
                    onChange={(e) => setEvent({...event, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-black ml-1 flex items-center gap-2">
                    <Calendar size={12} className="text-primary/40" /> Data do Evento
                  </label>
                  <input 
                    type="date" 
                    className="input-masonic w-full py-3"
                    value={event.date.split('T')[0]}
                    onChange={(e) => setEvent({...event, date: new Date(e.target.value).toISOString()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-black ml-1 flex items-center gap-2">
                    <ImageIcon size={12} className="text-primary/40" /> URL do Brasão/Logo
                  </label>
                  <input 
                    type="text" 
                    className="input-masonic w-full py-3"
                    placeholder="https://..."
                    value={event.logoUrl || ''}
                    onChange={(e) => setEvent({...event, logoUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-black flex items-center gap-2">
                      <FileText size={12} className="text-primary/40" /> E-mail do Mestre de Banquete (Para Relatórios)
                    </label>
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!event.adminEmail) return alert('Insira um e-mail antes de testar.');
                        try {
                          const res = await emailService.sendTestEmail(event.adminEmail);
                          if (res.success) alert('E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.');
                          else alert('Erro no teste: ' + res.error);
                        } catch (e) {
                          alert('Erro ao conectar com o servidor de e-mail.');
                        }
                      }}
                      className="text-[8px] uppercase tracking-widest text-primary hover:underline"
                    >
                      Testar Configuração
                    </button>
                  </div>
                  <input 
                    type="email" 
                    className="input-masonic w-full py-3"
                    placeholder="exemplo@loja.org"
                    value={event.adminEmail || ''}
                    onChange={(e) => setEvent({...event, adminEmail: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-[var(--border-main)]">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60 border-b border-primary/10 pb-3">Segurança do Admin</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-black ml-1 flex items-center gap-2">
                    <Lock size={12} className="text-primary/40" /> Nova Senha do Administrador
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="input-masonic w-full py-3 pr-10"
                      placeholder="Mínimo 6 caracteres"
                      value={event.adminPassword || ''}
                      onChange={(e) => setEvent({...event, adminPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Padrão: agape777</p>
                </div>
              </div>
            </div>

            <div className="pt-10 flex items-center justify-between border-t border-[var(--border-main)]">
                {saved ? (
                  <span className="text-emerald-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                    <Save size={14} /> Atualizado com sucesso
                  </span>
                ) : <div />}
                <button type="submit" className="btn-primary min-w-[200px] py-4 text-[11px]">
                  Salvar Configurações
                </button>
            </div>
          </div>
        </form>

        <div className="mt-16 p-8 rounded-2xl border border-rose-500/10 bg-rose-500/[0.02] flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <h4 className="text-rose-500/60 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Reinicialização de Dados</h4>
             <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Limpa permanentemente todos os registros deste navegador.</p>
           </div>
           <button 
             onClick={() => {
               if(confirm('Isso apagará TODOS os dados. Tem certeza?')) {
                 localStorage.clear();
                 window.location.reload();
               }
             }}
             className="px-6 py-3 border border-rose-500/30 text-rose-500/60 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all rounded"
           >
             Limpar Ágape
           </button>
        </div>
      </div>
    </div>
  );
}
