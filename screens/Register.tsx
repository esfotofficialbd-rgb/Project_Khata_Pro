
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { Building2, User, Mail, Phone, Lock, ArrowLeft, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';

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
    
    try {
      // Validation
      if (formData.password.length < 6) {
        throw new Error('পাসওয়ার্ড কমপক্ষে ৬ সংখ্যার হতে হবে।');
      }

      if (!formData.email.includes('@')) {
        throw new Error('সঠিক ইমেইল এড্রেস দিন।');
      }

      // Sanitize phone number
      const cleanPhone = formData.phone.replace(/[\s-]/g, '');

      // 1. Sign Up
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

      // 2. Ensure Profile is Created (Upsert to be safe)
      if (data.user) {
         const { error: profileError } = await supabase.from('profiles').upsert({
             id: data.user.id,
             full_name: formData.full_name.trim(),
             company_name: formData.company_name.trim(),
             phone: cleanPhone,
             role: 'contractor',
             email: formData.email.trim(),
             is_verified: true,
             balance: 0
         });
         
         if (profileError) console.error("Profile upsert error:", profileError.message);
      }

      // 3. Handle Navigation based on Session
      if (data.session) {
        // Immediate session available (Email verification disabled or unnecessary)
        toast.success('রেজিষ্ট্রেশন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করছেন...');
        navigate('/'); 
      } else {
        // No session? Try Auto Login manually as a fallback
        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email.trim(),
                password: formData.password.trim(),
            });

            if (signInData.session) {
                toast.success('স্বাগতম! ড্যাশবোর্ডে প্রবেশ করছেন...');
                navigate('/');
            } else {
                toast.success('রেজিষ্ট্রেশন সফল! দয়া করে আপনার ইমেইল চেক করে ভেরিফাই করুন।');
                navigate('/login');
            }
        } catch (autoLoginError) {
            toast.success('রেজিষ্ট্রেশন সফল! দয়া করে লগইন করুন।');
            navigate('/login');
        }
      }

    } catch (err: any) {
      console.error("Signup Error:", err);
      let msg = err.message || "রেজিষ্ট্রেশন ব্যর্থ হয়েছে।";
      
      if (msg.includes("already registered")) {
        msg = "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন।";
      } else if (msg.includes("password")) {
        msg = "পাসওয়ার্ডটি দুর্বল। আরো কঠিন পাসওয়ার্ড দিন।";
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8">
        <button onClick={() => navigate('/login')} className="mb-6 text-slate-500 hover:text-blue-600 flex items-center gap-2 w-fit transition-colors text-sm font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <ArrowLeft size={16} /> ফিরে যান
        </button>

        <div className="mb-8">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm border border-blue-100">
             <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">নতুন অ্যাকাউন্ট</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">ঠিকাদার হিসেবে রেজিষ্ট্রেশন করুন</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold mb-6 animate-pulse shadow-sm">
             <AlertTriangle size={18} className="shrink-0 mt-0.5" />
             <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 uppercase tracking-wide">আপনার নাম</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                name="full_name"
                type="text"
                required
                className="w-full pl-11 pr-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                placeholder="পূর্ণ নাম"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 uppercase tracking-wide">প্রতিষ্ঠানের নাম</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                name="company_name"
                type="text"
                required
                className="w-full pl-11 pr-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                placeholder="কোম্পানির নাম"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 uppercase tracking-wide">মোবাইল নাম্বার</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                name="phone"
                type="tel"
                required
                placeholder="017xxxxxxxx"
                className="w-full pl-11 pr-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 uppercase tracking-wide">ইমেইল</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-11 pr-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                placeholder="example@mail.com"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 uppercase tracking-wide">পাসওয়ার্ড (মিনিমাম ৬)</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-11 pr-11 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400"
                placeholder="••••••••"
                onChange={handleChange}
              />
              <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 bg-white/50 p-1 rounded-md"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold mt-6 shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'অ্যাকাউন্ট খুলুন'}
          </button>
        </form>
      </div>
    </div>
  );
};
