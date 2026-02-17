import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegistering) {
        const err = await register(formData.email, formData.password, formData.name);
        if (err) {
          setError(err);
        } else {
          setSuccessMsg("Conta criada! Aguarde aprovação do administrador para entrar.");
          setIsRegistering(false);
          setFormData({ name: '', email: '', password: '' });
        }
      } else {
        const err = await login(formData.email, formData.password);
        if (err) setError(err);
      }
    } catch (e) {
      setError("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
       <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                <span className="text-emerald-500 text-4xl">❖</span> Halftone Magic
            </h1>
            <p className="text-gray-500 text-sm mt-2">
                {isRegistering ? 'Crie sua conta profissional' : 'Entre para gerenciar suas estampas'}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-4 text-center animate-pulse">
                {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-900/20 border border-emerald-500/50 text-emerald-200 text-sm p-3 rounded-lg mb-4 text-center">
                {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
             {isRegistering && (
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 ml-1">Nome Completo</label>
                    <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                        <input 
                            type="text" 
                            required={isRegistering}
                            className="w-full bg-gray-950 border border-gray-800 text-gray-200 text-sm rounded-xl py-2.5 pl-10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                            placeholder="Seu nome"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>
             )}

             <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 ml-1">E-mail</label>
                <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                    <input 
                        type="email" 
                        required
                        className="w-full bg-gray-950 border border-gray-800 text-gray-200 text-sm rounded-xl py-2.5 pl-10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 ml-1">Senha</label>
                <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                    <input 
                        type="password" 
                        required
                        className="w-full bg-gray-950 border border-gray-800 text-gray-200 text-sm rounded-xl py-2.5 pl-10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 mt-6"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        {isRegistering ? 'Cadastrar' : 'Entrar'}
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
             </button>
          </form>

          <div className="mt-6 text-center">
            <button 
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                    setSuccessMsg(null);
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
            >
                {isRegistering ? 'Já tem uma conta? Entre aqui.' : 'Não tem conta? Solicite seu acesso.'}
            </button>
          </div>
       </div>
    </div>
  );
};
