import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { Building2, HardHat, UserCog, ArrowRight, Mail, Phone, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { APP_NAME } from '../constants';

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
      // For worker/supervisor, we use phone number as email prefix
      if (role !== 'contractor') {
         // Check if identifier is phone (no @)
         if (!email.includes('@')) {
            // Strictly sanitize phone: Remove ALL non-digits
            const cleanPhone = email.replace(/\D/g, '');
            if (cleanPhone.length < 11) {
               throw new Error("মোবাইল নাম্বার সঠিক নয় (কমপক্ষে ১১ ডিজিট)");
            }
            email = `${cleanPhone}@projectkhata.local`;
         }
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
          throw new Error("ভুল মোবাইল নাম্বার বা পাসওয়ার্ড দিয়েছেন।");
        }
        throw error;
      }

      if (data.user) {
         // Check profile role
         const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
         
         if (profileError) {
             console.error("Login Profile Fetch Error:", profileError);
             throw new Error("প্রোফাইল লোড করা যায়নি।");
         }

         if (profile && profile.role === role) {
             toast.success('লগইন সফল হয়েছে!');
             navigate('/');
         } else {
             await supabase.auth.signOut();
             throw new Error(`এই অ্যাকাউন্টটি ${role === 'worker' ? 'শ্রমিক' : role === 'supervisor' ? 'সুপারভাইজার' : 'ঠিকাদার'} হিসেবে নিবন্ধিত নয়।`);
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
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow ${role === 'contractor' ? 'bg-blue-600' : role === 'supervisor' ? 'bg-purple-600' : 'bg-emerald-600'}`}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-sm z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-4 relative group">
              <div className={`absolute inset-0 bg-${activeConfig.color}-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all`}></div>
              <activeConfig.icon size={40} className={`text-${activeConfig.color}-500 relative z-10`} />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{APP_NAME}</h1>
           <p className="text-slate-400 text-sm">আপনার কনস্ট্রাকশন ম্যানেজমেন্ট পার্টনার</p>
        </div>

        {/* Role Selector */}
        <div className="bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex mb-6">
           {(['contractor', 'supervisor', 'worker'] as UserRole[]).map((r) => {
              const config = getRoleConfig(r);
              const isActive = role === r;
              return (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError(''); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-slate-800 text-white shadow-lg scale-100' : 'text-slate-500 hover:text-slate-300 scale-95'}`}
                >
                   <config.icon size={18} className={isActive ? `text-${config.color}-500` : ''} />
                   <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
                </button>
              );
           })}
        </div>

        {/* Form */}
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${activeConfig.color}-500 to-transparent opacity-50`}></div>
           
           <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              লগইন করুন
              <span className={`text-xs px-2 py-1 rounded-full bg-${activeConfig.color}-50 text-${activeConfig.color}-600 border border-${activeConfig.color}-100`}>
                 {activeConfig.label}
              </span>
           </h2>

           {error && (
             <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-red-600 leading-relaxed">{error}</p>
             </div>
           )}

           <form onSubmit={handleLogin} className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                    {role === 'contractor' ? 'ইমেইল' : 'মোবাইল নাম্বার'}
                 </label>
                 <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                       {role === 'contractor' ? <Mail size={18}/> : <Phone size={18}/>}
                    </div>
                    <input 
                      type={role === 'contractor' ? "email" : "tel"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all text-sm font-bold text-slate-800 placeholder-slate-400"
                      placeholder={role === 'contractor' ? "example@mail.com" : "017xxxxxxxx"}
                      required
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">পাসওয়ার্ড</label>
                 <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                       <Lock size={18}/>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:bg-white transition-all text-sm font-bold text-slate-800 placeholder-slate-400"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                       {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 mt-2 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                 {loading ? 'লগইন হচ্ছে...' : (
                    <>
                       প্রবেশ করুন <ArrowRight size={18} />
                    </>
                 )}
              </button>
           </form>
           
           {role === 'contractor' && (
              <div className="mt-6 text-center pt-6 border-t border-slate-50">
                 <p className="text-xs text-slate-500 font-medium">অ্যাকাউন্ট নেই?</p>
                 <button onClick={() => navigate('/register')} className="text-sm font-bold text-blue-600 hover:underline mt-1">
                    নতুন অ্যাকাউন্ট খুলুন
                 </button>
              </div>
           )}

           {role !== 'contractor' && (
              <div className="mt-6 text-center pt-6 border-t border-slate-50">
                 <p className="text-xs text-slate-400 font-medium bg-slate-50 py-2 rounded-lg">
                    পাসওয়ার্ড: আপনার মোবাইল নাম্বারের শেষ ৬ ডিজিট
                 </p>
              </div>
           )}
        </div>

        <div className="text-center mt-8 opacity-40">
           <p className="text-[10px] text-white font-mono tracking-widest uppercase">Secured by Project Khata</p>
        </div>
      </div>
    </div>
  );
};