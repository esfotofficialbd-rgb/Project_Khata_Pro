import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { Building2, HardHat, UserCog, ArrowRight, Mail, Phone, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
      let email = identifier.trim();
      if (role !== 'contractor') {
         email = `${identifier.trim()}@projectkhata.local`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error("আপনার ইমেইল কনফার্ম করা হয়নি।");
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("ভুল ইমেইল বা পাসওয়ার্ড দিয়েছেন।");
        }
        throw error;
      }

      if (data.user) {
         const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
         
         if (profileError) throw new Error("প্রোফাইল লোড করা যায়নি।");

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

  const getRoleConfig = (r: UserRole) => {
    switch(r) {
      case 'contractor': return { color: 'blue', icon: Building2, label: 'ঠিকাদার' };
      case 'supervisor': return { color: 'purple', icon: UserCog, label: 'সুপারভাইজার' };
      case 'worker': return { color: 'emerald', icon: HardHat, label: 'শ্রমিক' };
    }
  };

  const activeConfig = getRoleConfig(role);

  return (
    <div className="min-h-screen bg-slate-950 relative flex flex-col items-center justify-center p-6 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow ${role === 'contractor' ? 'bg-blue-600' : role === 'supervisor' ? 'bg-purple-600' : 'bg-emerald-600'}`}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow animation-delay-2000"></div>
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative w-full max-w-sm z-10 flex flex-col gap-6">
        
        {/* Logo & Branding */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr rounded-[2rem] shadow-2xl mb-6 ring-4 ring-white/5 ${role === 'contractor' ? 'from-blue-600 to-indigo-500' : role === 'supervisor' ? 'from-purple-600 to-fuchsia-500' : 'from-emerald-500 to-teal-600'}`}>
             <activeConfig.icon className="text-white w-10 h-10 drop-shadow-md" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-serif mb-1">
            প্রজেক্ট <span className={role === 'contractor' ? 'text-blue-400' : role === 'supervisor' ? 'text-purple-400' : 'text-emerald-400'}>খাতা</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">নির্মাণ কাজের ডিজিটাল সমাধান</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top Gradient Line */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${role === 'contractor' ? 'from-blue-500 via-indigo-500 to-blue-500' : role === 'supervisor' ? 'from-purple-500 via-fuchsia-500 to-purple-500' : 'from-emerald-500 via-teal-500 to-emerald-500'}`}></div>

          {/* Role Switcher */}
          <div className="flex bg-slate-950/50 p-1.5 rounded-2xl mb-8 border border-white/5 relative">
            <div 
               className={`absolute top-1.5 bottom-1.5 rounded-xl bg-slate-800 shadow-sm transition-all duration-300 ease-out`}
               style={{ 
                 left: role === 'contractor' ? '6px' : role === 'supervisor' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 2px)',
                 width: 'calc(33.33% - 6px)' 
               }}
            ></div>
            {[
              { id: 'contractor', icon: Building2 },
              { id: 'supervisor', icon: UserCog },
              { id: 'worker', icon: HardHat }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setRole(item.id as UserRole); setIdentifier(''); setPassword(''); setError(''); }}
                className={`flex-1 flex flex-col items-center justify-center py-3 relative z-10 transition-colors duration-300 ${role === item.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <item.icon size={20} strokeWidth={role === item.id ? 2.5 : 2} />
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 ml-1">
                {role === 'contractor' ? 'ইমেইল এড্রেস' : 'মোবাইল নাম্বার'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {role === 'contractor' ? 
                    <Mail className="text-slate-500 group-focus-within:text-white transition-colors" size={18} /> : 
                    <Phone className="text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                  }
                </div>
                <input
                  type={role === 'contractor' ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'contractor' ? "apnar@email.com" : "017xxxxxxxx"}
                  className="w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:bg-slate-950 transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 ml-1">পাসওয়ার্ড</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:bg-slate-950 transition-all text-sm font-medium"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 text-red-400 text-xs font-medium animate-in slide-in-from-top-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] mt-2
                ${role === 'contractor' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30' : 
                  role === 'supervisor' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30' :
                  'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                 <>প্রবেশ করুন <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="text-center space-y-4">
           {role === 'contractor' && (
             <p className="text-slate-400 text-sm">
               অ্যাকাউন্ট নেই? {' '}
               <button 
                 onClick={() => navigate('/register')}
                 className="text-white font-bold hover:underline decoration-blue-500 underline-offset-4 transition-all"
               >
                 খুলে নিন
               </button>
             </p>
           )}
           <p className="text-xs text-slate-600">v1.0.0 • Project Khata</p>
        </div>
      </div>
    </div>
  );
};