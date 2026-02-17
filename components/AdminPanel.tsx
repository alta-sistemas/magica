import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { User } from '../types';
import { Shield, PlusCircle, CheckCircle, XCircle, Search, X, Loader2 } from 'lucide-react';

interface AdminPanelProps {
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const { getAllUsers, updateUserStatus, addCredits, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        refresh();
    }, []);

    const filteredUsers = users.filter(u => 
        (u.email?.toLowerCase() || '').includes(filter.toLowerCase()) || 
        (u.name?.toLowerCase() || '').includes(filter.toLowerCase())
    );

    const handleAddCredits = async (userId: string) => {
        const amountStr = prompt("Quantos créditos adicionar?", "10");
        if (amountStr) {
            const amount = parseInt(amountStr);
            if (!isNaN(amount)) {
                await addCredits(userId, amount);
                refresh();
            }
        }
    };

    const handleStatusUpdate = async (userId: string, status: any) => {
        await updateUserStatus(userId, status);
        refresh();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        Painel Administrativo
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-4 bg-gray-900 border-b border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar usuário por nome ou email..." 
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-gray-950/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> Carregando usuários...
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredUsers.map(userItem => (
                                <div key={userItem.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between group hover:border-gray-700 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${userItem.role === 'admin' ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                            {userItem.name ? userItem.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-white">{userItem.name || 'Sem nome'}</h3>
                                                {userItem.role === 'admin' && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 rounded border border-purple-500/30">ADMIN</span>}
                                                <span className={`text-[10px] px-1.5 rounded border ${
                                                    userItem.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                                    userItem.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' :
                                                    'bg-red-900/30 text-red-400 border-red-500/30'
                                                }`}>
                                                    {userItem.status === 'approved' ? 'Aprovado' : userItem.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{userItem.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase text-gray-500 font-bold">Créditos</p>
                                            <p className="text-lg font-mono text-emerald-400 font-bold">{userItem.credits}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleAddCredits(userItem.id)}
                                                className="p-2 bg-gray-800 hover:bg-emerald-900/50 text-emerald-500 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-all"
                                                title="Adicionar Créditos"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                            </button>

                                            {userItem.id !== currentUser?.id && (
                                                <>
                                                    {userItem.status === 'pending' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(userItem.id, 'approved')}
                                                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
                                                            title="Aprovar"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    
                                                    {userItem.status !== 'rejected' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(userItem.id, 'rejected')}
                                                            className="p-2 bg-gray-800 hover:bg-red-900/50 text-red-500 rounded-lg border border-gray-700 hover:border-red-500/50 transition-all"
                                                            title="Bloquear/Rejeitar"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    
                                                    {userItem.status === 'rejected' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(userItem.id, 'approved')}
                                                            className="p-2 bg-gray-800 hover:bg-emerald-900/50 text-emerald-500 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-all"
                                                            title="Reativar"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
