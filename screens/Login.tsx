import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { Building2, HardHat, UserCog, ArrowRight, Mail, Phone, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Login = () => {
  const [role, setRole] = useState<UserRole>('contractor');
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For Contractor (Email)
      let email = identifier.trim();
      
      // For Worker/Supervisor (Phone) -> Convert to fake email
      if (role !== 'contractor') {
         email = `${identifier.trim()}@projectkhata.local`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password.trim(),
      });

      if (error) {
        console.error("Login Error:", error);
        if (error.message.includes("Email not confirmed")) {
          throw new Error("আপনার ইমেইল কনফার্ম করা হয়নি। দয়া করে ইমেইল চেক করুন।");
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("ভুল ইমেইল বা পাসওয়ার্ড দিয়েছেন।");
        }
        throw error;
      }

      if (data.user) {
         // Fetch profile to verify role
         const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
         
         if (profileError) {
             throw new Error("প্রোফাইল লোড করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।");
         }

         if (profile && profile.role === role) {
             toast.success('লগইন সফল হয়েছে!');
             navigate('/');
         } else {
             await supabase.auth.signOut();
             throw new Error('ভুল রোল সিলেক্ট করেছেন।');
         }
      }
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে।');
      toast.error(err.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Blobs - Keep existing UI */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl shadow-2xl mb-4 rotate-3 transform hover:rotate-0 transition-all duration-300">
             <Building2 className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-serif">প্রজেক্ট খাতা</h1>
          <p className="text-blue-200 text-sm mt-2 font-medium">স্মার্ট কনস্ট্রাকশন ম্যানেজমেন্ট</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl">
          {/* Role Toggle */}
          <div className="flex bg-slate-800/50 p-1.5 rounded-xl mb-6 backdrop-blur-sm">
            {[
              { id: 'contractor', icon: Building2, label: 'ঠিকাদার', color: 'text-blue-400', bg: 'bg-blue-600/20' },
              { id: 'supervisor', icon: UserCog, label: 'সুপারভাইজার', color: 'text-purple-400', bg: 'bg-purple-600/20' },
              { id: 'worker', icon: HardHat, label: 'শ্রমিক', color: 'text-emerald-400', bg: 'bg-emerald-600/20' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setRole(item.id as UserRole); setIdentifier(''); setPassword(''); setError(''); }}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg text-[10px] font-bold transition-all duration-300 ${
                  role === item.id 
                    ? 'bg-white shadow-lg text-slate-900 scale-100' 
                    : 'text-slate-400 hover:text-white scale-95 hover:bg-white/5'
                }`}
              >
                <item.icon size={18} className={`mb-1 ${role === item.id ? item.color.replace('text-', 'text-slate-900') : ''}`} />
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-blue-200 mb-1.5 ml-1">
                {role === 'contractor' ? 'ইমেইল' : 'মোবাইল নাম্বার'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {role === 'contractor' ? <Mail className="text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} /> : <Phone className="text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />}
                </div>
                <input
                  type={role === 'contractor' ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'contractor' ? "example@mail.com" : "017xxxxxxxx"}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-blue-200 mb-1.5 ml-1">পাসওয়ার্ড</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === 'contractor' ? "••••••••" : "শেষ ৬ ডিজিট"}
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-xs text-center font-medium animate-pulse flex items-center justify-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                role === 'contractor' ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400' : 
                role === 'supervisor' ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400' :
                'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'} <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-4">
           {role === 'contractor' && (
             <button 
               onClick={() => navigate('/register')}
               className="text-white font-bold text-sm hover:underline hover:text-blue-300 transition-colors"
             >
               নতুন অ্যাকাউন্ট খুলুন
             </button>
           )}
        </div>
      </div>
    </div>
  );
};