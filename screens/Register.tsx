
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { Building2, User, Mail, Phone, Lock, ArrowLeft, Eye, EyeOff, AlertTriangle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface InputFieldProps {
  label: string;
  icon: any;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const InputField = ({ label, icon: Icon, name, type = "text", placeholder, required = true, value, onChange, showPassword, onTogglePassword }: InputFieldProps) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1 block tracking-wider">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Icon size={20} />
            </div>
            <input
                name={name}
                type={type}
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all shadow-sm"
            />
            {name === 'password' && onTogglePassword && (
                <button 
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
            )}
        </div>
    </div>
);

export const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // SAFETY: Clear local storage to prevent data bleeding from previous sessions if any
    try {
        localStorage.clear();
    } catch(e) {}

    try {
      if (formData.password.length < 6) throw new Error('পাসওয়ার্ড কমপক্ষে ৬ সংখ্যার হতে হবে।');
      if (!formData.email.includes('@')) throw new Error('সঠিক ইমেইল এড্রেস দিন।');

      const cleanPhone = formData.phone.replace(/[\s-]/g, '');

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password.trim(),
        options: {
          data: {
            full_name: formData.full_name.trim(),
            company_name: formData.company_name.trim(),
            phone: cleanPhone,
            role: 'contractor'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
         await supabase.from('profiles').upsert({
             id: data.user.id,
             full_name: formData.full_name.trim(),
             company_name: formData.company_name.trim(),
             phone: cleanPhone,
             role: 'contractor',
             email: formData.email.trim(),
             is_verified: true,
             balance: 0
         });
      }

      if (data.session) {
        toast.success('রেজিষ্ট্রেশন সফল হয়েছে!');
        navigate('/'); 
      } else {
        try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
                email: formData.email.trim(),
                password: formData.password.trim(),
            });
            if (signInData.session) navigate('/');
            else navigate('/login');
        } catch {
            navigate('/login');
        }
      }

    } catch (err: any) {
      let msg = err.message || "রেজিষ্ট্রেশন ব্যর্থ হয়েছে।";
      if (msg.includes("already registered")) msg = "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।";
      setError(msg);
      toast.error('ত্রুটি', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 relative font-sans flex flex-col overflow-hidden">
      
      {/* Centered Header Section - Height Reduced and Padding Adjusted to move content UP */}
      <div className="h-[28vh] w-full relative overflow-hidden flex flex-col items-center justify-start pt-6 text-center px-6 shrink-0 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900">
         
         {/* Back Button */}
         <button 
            onClick={() => navigate('/login')} 
            className="absolute top-5 left-5 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10 active:scale-95 z-20"
         >
            <ArrowLeft size={20} />
         </button>

         {/* Abstract Textures */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
         <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white opacity-10 rounded-full blur-[60px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 bg-black opacity-20 rounded-full blur-[60px]"></div>
         
         <div className="relative z-10 animate-fade-in-up flex flex-col items-center">
            {/* Logo */}
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.2rem] border border-white/20 flex items-center justify-center mb-3 shadow-2xl relative group">
                <div className="absolute inset-0 bg-white/20 rounded-[1.2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Building2 size={28} className="text-white drop-shadow-md relative z-10" />
            </div>
            
            {/* Title */}
            <h1 className="text-xl font-extrabold text-white tracking-tight">নতুন অ্যাকাউন্ট</h1>
            
            {/* Subtitle / Badge */}
            <div className="flex items-center justify-center gap-2 mt-1.5 opacity-90 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30 backdrop-blur-sm">
                <ShieldCheck size={12} className="text-green-300" />
                <p className="text-white/90 text-[10px] font-bold">ঠিকাদার রেজিস্ট্রেশন</p>
            </div>
         </div>
      </div>

      {/* Scrollable Form Content - Overlapping Card Style */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] relative -mt-6 z-20 overflow-hidden flex flex-col">
         
         <div className="flex-1 overflow-y-auto px-6 py-8 pb-20">
            {error && (
               <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-pulse shadow-sm">
                  <div className="bg-red-100 p-1.5 rounded-full"><AlertTriangle size={16} className="shrink-0" /></div>
                  <p className="text-xs font-bold leading-tight">{error}</p>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <InputField 
                  label="আপনার নাম" 
                  icon={User} 
                  name="full_name" 
                  placeholder="পূর্ণ নাম লিখুন" 
                  value={formData.full_name}
                  onChange={handleChange}
               />
               <InputField 
                  label="প্রতিষ্ঠানের নাম" 
                  icon={Building2} 
                  name="company_name" 
                  placeholder="কোম্পানির নাম লিখুন" 
                  value={formData.company_name}
                  onChange={handleChange}
               />
               <InputField 
                  label="মোবাইল নাম্বার" 
                  icon={Phone} 
                  name="phone" 
                  type="tel" 
                  placeholder="017xxxxxxxx" 
                  value={formData.phone}
                  onChange={handleChange}
               />
               <InputField 
                  label="ইমেইল এড্রেস" 
                  icon={Mail} 
                  name="email" 
                  type="email" 
                  placeholder="example@email.com" 
                  value={formData.email}
                  onChange={handleChange}
               />
               <InputField 
                   label="পাসওয়ার্ড (মিনিমাম ৬)" 
                   icon={Lock} 
                   name="password" 
                   type={showPassword ? "text" : "password"} 
                   placeholder="••••••••" 
                   value={formData.password}
                   onChange={handleChange}
                   showPassword={showPassword}
                   onTogglePassword={() => setShowPassword(!showPassword)}
               />

               <div className="pt-2">
                   <button
                       type="submit"
                       disabled={loading}
                       className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                       {loading ? <Loader2 size={22} className="animate-spin" /> : <>রেজিষ্ট্রেশন করুন <ArrowRight size={20} /></>}
                   </button>
               </div>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 font-medium px-4 leading-relaxed">
               রেজিষ্ট্রেশন করার মাধ্যমে আপনি আমাদের <span className="text-blue-600 font-bold">টার্মস</span> এবং <span className="text-blue-600 font-bold">প্রাইভেসি পলিসিতে</span> সম্মতি প্রদান করছেন।
            </div>
         </div>
      </div>
    </div>
  );
};
