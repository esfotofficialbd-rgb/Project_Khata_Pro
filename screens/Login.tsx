
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { UserRole, Profile } from '../types';
import { Building2, HardHat, UserCog, ArrowRight, Mail, Phone, Lock, Eye, EyeOff, AlertTriangle, KeyRound, X, Send, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { APP_NAME } from '../constants';

export const Login = () => {
  const [role, setRole] = useState<UserRole>('contractor');
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // Cleanup ref on unmount
  useEffect(() => {
    isMounted.current = true;
    
    // Safety check: if user is already logged in, redirect
    if (user) {
        navigate('/', { replace: true });
    }

    return () => { isMounted.current = false; };
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit

    setError('');
    setLoading(true);

    const timeoutDuration = 15000; // 15 seconds
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("সার্ভার থেকে সাড়া পাওয়া যাচ্ছে না। দয়া করে ইন্টারনেট সংযোগ চেক করুন।")), timeoutDuration)
    );

    try {
      let email = identifier.trim();
      
      // Formatting Logic
      if (role !== 'contractor') {
         if (!email.includes('@')) {
            const cleanPhone = email.replace(/\D/g, '');
            if (cleanPhone.length < 11) {
               throw new Error("মোবাইল নাম্বার সঠিক নয় (কমপক্ষে ১১ ডিজিট)");
            }
            email = `${cleanPhone}@projectkhata.local`;
         }
      }

      // Race between login and timeout
      const response: any = await Promise.race([
          supabase.auth.signInWithPassword({
            email: email,
            password: password.trim(),
          }),
          timeoutPromise
      ]);

      const { data, error: authError } = response;

      if (authError) {
          if (authError.message === 'Invalid login credentials') {
              throw new Error("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।");
          }
          throw authError;
      }

      if (data?.user) {
         // Fetch Profile
         const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

         if (profileError) throw new Error("প্রোফাইল লোড করা যায়নি।");

         if (profile) {
             // Role Validation
             if (profile.role !== role) {
                 await supabase.auth.signOut();
                 
                 let roleName = '';
                 if (profile.role === 'worker') roleName = 'শ্রমিক';
                 else if (profile.role === 'supervisor') roleName = 'সুপারভাইজার';
                 else roleName = 'ঠিকাদার';

                 throw new Error(`ভুল লগইন টাইপ! এটি একটি ${roleName} অ্যাকাউন্ট। দয়া করে সঠিক ট্যাব সিলেক্ট করুন।`);
             }

             if (isMounted.current) {
                 setUser(profile as Profile);
                 toast.success('লগইন সফল হয়েছে!');
                 navigate('/', { replace: true });
                 // Do NOT set loading false here, as unmount will happen
                 return; 
             }
         } else {
             await supabase.auth.signOut();
             throw new Error('প্রোফাইল পাওয়া যায়নি।');
         }
      } else {
          throw new Error('লগইন সেশন পাওয়া যায়নি।');
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      if (isMounted.current) {
          setError(err.message || 'লগইন ব্যর্থ হয়েছে।');
          toast.error('ত্রুটি', err.message);
          setLoading(false);
      }
    }
  };

  const handleForgotPasswordClick = () => {
      setIsForgotModalOpen(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (role !== 'contractor') return;
      
      setResetLoading(true);
      try {
          const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
              redirectTo: window.location.origin + '/#/reset-password', 
          });
          if (error) throw error;
          toast.success('রিসেট লিংক পাঠানো হয়েছে!', 'আপনার ইমেইল চেক করুন।');
          setIsForgotModalOpen(false);
          setResetEmail('');
      } catch (err: any) {
          toast.error('ব্যর্থ', err.message || 'পাসওয়ার্ড রিসেট লিংক পাঠানো যায়নি।');
      } finally {
          if (isMounted.current) setResetLoading(false);
      }
  };

  const getRoleTheme = (r: UserRole) => {
    switch(r) {
      case 'contractor': 
        return { 
            bg: 'bg-blue-600', 
            text: 'text-blue-600',
            border: 'border-blue-500',
            icon: Building2, 
            label: 'ঠিকাদার',
            gradient: 'from-blue-600 to-indigo-700',
            lightBg: 'bg-blue-50'
        };
      case 'supervisor': 
        return { 
            bg: 'bg-purple-600', 
            text: 'text-purple-600',
            border: 'border-purple-500',
            icon: UserCog, 
            label: 'সুপারভাইজার',
            gradient: 'from-purple-600 to-fuchsia-700',
            lightBg: 'bg-purple-50'
        };
      case 'worker': 
        return { 
            bg: 'bg-emerald-600', 
            text: 'text-emerald-600',
            border: 'border-emerald-500',
            icon: HardHat, 
            label: 'শ্রমিক',
            gradient: 'from-emerald-600 to-teal-700',
            lightBg: 'bg-emerald-50'
        };
    }
  };

  const theme = getRoleTheme(role);

  return (
    <div className="h-screen bg-slate-900 relative font-sans flex flex-col overflow-hidden">
      
      {/* Immersive Background Header */}
      <div className="h-[40vh] w-full relative overflow-hidden flex flex-col items-center justify-center text-center px-6 pb-12 shrink-0">
         <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} transition-colors duration-700`}></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
         
         <div className="absolute top-[-20%] left-[-20%] w-80 h-80 bg-white opacity-10 rounded-full blur-[80px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-60 h-60 bg-black opacity-20 rounded-full blur-[60px]"></div>

         <div className="relative z-10 animate-fade-in-up">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-2xl relative group">
               <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <theme.icon size={40} className="text-white drop-shadow-md relative z-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{APP_NAME}</h1>
            <div className="flex items-center justify-center gap-2 mt-1 opacity-90">
                <ShieldCheck size={14} className="text-green-300" />
                <p className="text-white/90 text-sm font-medium">নিরাপদ ও সহজ ব্যবস্থাপনা</p>
            </div>
         </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative -mt-10 z-20 overflow-hidden flex flex-col">
         
         <div className="flex-1 overflow-y-auto px-6 py-8">
            {/* Role Tabs */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
               {(['contractor', 'supervisor', 'worker'] as UserRole[]).map((r) => {
                  const rTheme = getRoleTheme(r);
                  const isActive = role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setError(''); }}
                      className={`flex-1 min-w-[100px] flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-300 active:scale-95 ${isActive ? `bg-slate-50 ${rTheme.border} shadow-sm` : 'bg-white border-slate-100 text-slate-400 grayscale'}`}
                    >
                       <div className={`p-1.5 rounded-full ${isActive ? rTheme.bg + ' text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <rTheme.icon size={16} />
                       </div>
                       <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{rTheme.label}</span>
                    </button>
                  );
               })}
            </div>

            {error && (
               <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-pulse shadow-sm">
                  <div className="bg-red-100 p-1.5 rounded-full"><AlertTriangle size={16} className="shrink-0" /></div>
                  <p className="text-xs font-bold leading-tight">{error}</p>
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 pb-2">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block tracking-wider">{role === 'contractor' ? 'ইমেইল এড্রেস' : 'মোবাইল নাম্বার'}</label>
                  <div className="relative group">
                     <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        {role === 'contractor' ? <Mail size={20}/> : <Phone size={20}/>}
                     </div>
                     <input 
                       type={role === 'contractor' ? "email" : "tel"}
                       value={identifier}
                       onChange={(e) => setIdentifier(e.target.value)}
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                       placeholder={role === 'contractor' ? "name@company.com" : "017xxxxxxxx"}
                       required
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block tracking-wider">পাসওয়ার্ড</label>
                  <div className="relative group">
                     <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={20}/>
                     </div>
                     <input 
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                       placeholder="••••••••"
                       required
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                     >
                        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                  </div>
                  
                  <div className="flex justify-between items-start px-1 mt-2">
                      {role !== 'contractor' ? (
                         <p className="text-[10px] text-slate-400">
                            <span className="font-bold">ডিফল্ট পাসওয়ার্ড:</span> মোবাইল নাম্বারের শেষ ৬ ডিজিট
                         </p>
                      ) : <div></div>}
                      
                      <button 
                        type="button"
                        onClick={handleForgotPasswordClick}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                      >
                         পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 bg-gradient-to-r ${theme.gradient} disabled:opacity-70 disabled:cursor-not-allowed`}
               >
                  {loading ? 'যাচাই করা হচ্ছে...' : (
                     <>লগইন করুন <ArrowRight size={20} /></>
                  )}
               </button>
            </form>

            {role === 'contractor' && (
               <div className="mt-6 flex items-center justify-center gap-2 pb-4">
                  <p className="text-sm text-slate-500 font-bold">কোন অ্যাকাউন্ট নেই?</p>
                  <button onClick={() => navigate('/register')} className="text-blue-600 font-bold text-sm hover:text-blue-700 hover:underline transition-all">
                     নতুন অ্যাকাউন্ট খুলুন
                  </button>
               </div>
            )}
         </div>
      </div>

      {isForgotModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsForgotModalOpen(false)}></div>
           
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm sm:rounded-[2.5rem] rounded-t-[2.5rem] relative z-10 p-8 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
              
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><KeyRound size={20}/></div>
                    পাসওয়ার্ড রিসেট
                 </h3>
                 <button onClick={() => setIsForgotModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>

              {role === 'contractor' ? (
                  <form onSubmit={handleResetSubmit} className="space-y-5">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                        আপনার নিবন্ধিত ইমেইল এড্রেসটি দিন। আমরা সেখানে একটি পাসওয়ার্ড রিসেট লিংক পাঠাবো।
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">আপনার ইমেইল</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                required
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                placeholder="name@company.com"
                            />
                        </div>
                     </div>
                     <button 
                        type="submit" 
                        disabled={resetLoading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                        {resetLoading ? 'পাঠানো হচ্ছে...' : <>লিংক পাঠান <Send size={18}/></>}
                     </button>
                  </form>
              ) : (
                  <div className="text-center space-y-6 py-4">
                      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <UserCog size={40} className="text-orange-500" />
                      </div>
                      <div>
                          <h4 className="text-lg font-bold text-slate-800 mb-2">ঠিকাদারের সাথে যোগাযোগ করুন</h4>
                          <p className="text-sm text-slate-500 leading-relaxed px-2">
                             যেহেতু আপনি একজন {role === 'worker' ? 'শ্রমিক' : 'সুপারভাইজার'}, আপনার অ্যাকাউন্টের নিরাপত্তা এবং পাসওয়ার্ড ম্যানেজমেন্ট সরাসরি আপনার <b>ঠিকাদার (Contractor)</b> দ্বারা নিয়ন্ত্রিত হয়।
                          </p>
                      </div>
                      <button 
                        onClick={() => setIsForgotModalOpen(false)}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                      >
                         বুঝতে পেরেছি
                      </button>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
