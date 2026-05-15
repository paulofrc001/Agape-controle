import React, { useState, useEffect } from 'react';
import { Shield, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { storageService } from '../services/storageService';
import { Participant } from '../types';

interface LoginProps {
  onLogin: (type: 'admin' | 'brother', user?: Participant) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    storageService.getEvent().then(setEvent);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin check
    const adminPass = event?.adminPassword || 'agape777';
    if ((username === 'admin' && password === adminPass) || (username === 'mestre' && password === 'osmil')) {
      onLogin('admin');
      return;
    }

    // Brother check
    try {
      const brother = await storageService.authenticateBrother(username, password);
      if (brother) {
        onLogin('brother', brother);
      } else {
        setError('Credenciais inválidas. Tente seu nome simbólico e senha.');
      }
    } catch (err) {
      setError('Erro ao autenticar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-full border border-primary p-2 mb-6 flex items-center justify-center">
             <div className="w-full h-full border border-primary/40 rounded-full flex items-center justify-center text-primary">
                <span className="text-3xl font-serif">G</span>
             </div>
          </div>
          <h1 className="text-xs font-bold text-primary uppercase tracking-[0.4em]">Controle de Ágape</h1>
          <p className="text-white/20 text-[9px] uppercase tracking-widest mt-2">{event?.storeName || 'Oficina Maçônica'}</p>
        </div>

        <div className="bg-surface-sidebar border border-white/5 p-10 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Identificação</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={14} />
                  <input 
                    required
                    type="text" 
                    placeholder="USUÁRIO"
                    className="input-masonic w-full pl-12 py-4"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Palavra de Passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={14} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    placeholder="SENHA"
                    className="input-masonic w-full pl-12 pr-10 py-4"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-rose-500/60 text-[10px] text-center font-bold uppercase tracking-widest">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-3 py-5 rounded-lg active:scale-95 transition-all">
              Acessar Templo <ArrowRight size={14} />
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.3em] mt-8">
          Sinceridade • Verdade • União
        </p>
      </motion.div>
    </div>
  );
}
