import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { ArrowLeft, Phone, Calendar, Briefcase, DollarSign, User, CheckCircle, Wallet, X, Edit2, Camera, Clock, MessageSquare, TrendingUp, UserCog, HardHat, ShieldCheck, Loader2 } from 'lucide-react';
import { Profile } from '../types';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

export const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Logged in user (Contractor)
  const { users, attendance, payWorker, updateUser, transactions } = useData();
  const { toast } = useToast();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'attendance' | 'payment'>('attendance');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [formData, setFormData] = useState<Partial<Profile>>({});

  const worker = users.find(u => u.id === id);
  
  if (!worker) {
    return <div className="p-10 text-center text-slate-500 font-bold mt-10">কর্মী পাওয়া যায়নি</div>;
  }

  // Determine Role & Theme (Hardcoded classes for stability)
  const isSupervisorProfile = worker.role === 'supervisor';
  
  const theme = isSupervisorProfile ? {
      gradient: 'from-purple-700 via-indigo-800 to-slate-900',
      cardGradient: 'bg-gradient-to-r from-purple-700 to-indigo-700',
      primaryColor: 'text-purple-600',
      primaryBg: 'bg-purple-50',
      lightBg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      icon: UserCog,
      // Input & Button Classes
      inputFocus: 'focus:border-purple-500',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
      btnShadow: 'shadow-purple-200',
      editIconBg: 'bg-purple-100',
      editIconColor: 'text-purple-600',
      shadowColor: 'shadow-purple-900/20'
  } : {
      gradient: 'from-blue-700 via-slate-800 to-slate-900',
      cardGradient: 'bg-gradient-to-r from-blue-700 to-slate-700',
      primaryColor: 'text-blue-600',
      primaryBg: 'bg-blue-50',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      icon: HardHat,
      // Input & Button Classes
      inputFocus: 'focus:border-blue-500',
      btnBg: 'bg-blue-600 hover:bg-blue-700',
      btnShadow: 'shadow-blue-200',
      editIconBg: 'bg-blue-100',
      editIconColor: 'text-blue-600',
      shadowColor: 'shadow-blue-900/20'
  };

  // Calculate Stats
  const workerAttendance = attendance.filter(a => a.worker_id === id);
  const workerPayments = transactions.filter(t => t.related_user_id === id && t.type === 'salary');
  
  const totalEarned = workerAttendance.reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = workerPayments.reduce((sum, t) => sum + t.amount, 0);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount) {
      const amount = Number(payAmount);
      await payWorker(worker.id, amount);
      setIsPayModalOpen(false);
      
      const newBalance = worker.balance - amount;
      const message = `Project Khata: পেমেন্ট রিসিভড ৳${amount}। বর্তমান বকেয়া: ৳${newBalance}। ধন্যবাদ।`;
      
      if(window.confirm("পেমেন্ট সফল! আপনি কি কর্মীকে SMS কনফার্মেশন পাঠাতে চান?")) {
         const smsLink = `sms:${worker.phone}?body=${encodeURIComponent(message)}`;
         window.location.href = smsLink;
      }
      
      setPayAmount('');
    }
  };

  const openEditModal = () => {
    setFormData({
      full_name: worker.full_name,
      phone: worker.phone,
      skill_type: worker.skill_type,
      daily_rate: worker.daily_rate,
      avatar_url: worker.avatar_url,
      designation: worker.designation,
      monthly_salary: worker.monthly_salary
    });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
          try {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 500;
              let width = img.width;
              let height = img.height;

              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(async (blob) => {
                  if (blob) {
                      const fileName = `avatars/${worker.id}-${Date.now()}.jpg`;
                      
                      try {
                          const { data, error } = await supabase.storage
                              .from('images')
                              .upload(fileName, blob, {
                                  contentType: 'image/jpeg',
                                  upsert: true
                              });

                          if (error) throw error;

                          const { data: publicData } = supabase.storage
                              .from('images')
                              .getPublicUrl(fileName);

                          setFormData(prev => ({ ...prev, avatar_url: publicData.publicUrl }));
                          toast.success('ছবি আপলোড সম্পন্ন হয়েছে');
                      } catch (uploadError) {
                          console.warn("Storage upload failed, falling back to Base64:", uploadError);
                          // Fallback to Base64
                          const reader = new FileReader();
                          reader.onloadend = () => {
                              const base64String = reader.result as string;
                              setFormData(prev => ({ ...prev, avatar_url: base64String }));
                              toast.success('ছবি সেভ হয়েছে (অফলাইন মোড)');
                          };
                          reader.readAsDataURL(blob);
                      } finally {
                          setIsProcessingImage(false);
                      }
                  }
              }, 'image/jpeg', 0.8);

          } catch (error: any) {
              console.error(error);
              toast.error('ছবি আপলোডে সমস্যা', error.message);
              setIsProcessingImage(false);
          }
      };
      img.src = objectUrl;
    }
    
    if (e.target) e.target.value = '';
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedWorker = { ...worker, ...formData };
    updateUser(updatedWorker);
    setIsEditModalOpen(false);
  };

  const inputClass = `w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none ${theme.inputFocus} text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm`;
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase ml-1";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans">
       
       {/* Premium Header Design */}
       <div className={`relative h-64 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
          {/* Abstract Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-[80px]"></div>
          
          <div className="flex items-center justify-between p-4 relative z-10 text-white">
             <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                <ArrowLeft size={22} />
             </button>
             <h1 className="text-sm font-bold uppercase tracking-widest opacity-80">
                {isSupervisorProfile ? 'সাইট সুপারভাইজার' : 'সাইট শ্রমিক'}
             </h1>
             <button onClick={openEditModal} className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-md shadow-sm border border-white/10">
                <Edit2 size={20} />
             </button>
          </div>
       </div>

       {/* Floating Profile Card - Fixed Clipping Issue */}
       <div className="px-4 -mt-32 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 pt-0 text-center relative flex flex-col items-center">
             
             {/* Profile Pic - Positioned Absolutely to avoid clipping */}
             <div className="relative -mt-16 mb-3">
               <div className={`absolute -inset-1 bg-gradient-to-b ${isSupervisorProfile ? 'from-purple-500 to-indigo-500' : 'from-blue-500 to-slate-500'} rounded-full blur-sm opacity-50`}></div>
               <img 
                  src={worker.avatar_url || "https://picsum.photos/100"} 
                  className="relative w-32 h-32 rounded-full border-[6px] border-white dark:border-slate-900 shadow-2xl bg-slate-200 object-cover" 
                  alt="Profile"
               />
               <div className={`absolute bottom-1 right-1 p-1.5 rounded-full border-4 border-white dark:border-slate-900 ${isSupervisorProfile ? 'bg-purple-600' : 'bg-blue-600'} text-white shadow-sm`}>
                  <theme.icon size={16} />
               </div>
             </div>
             
             <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                {worker.full_name}
                {worker.is_verified && <ShieldCheck size={20} className="text-blue-500"/>}
             </h2>
             
             <div className="flex items-center justify-center gap-2 mt-2 mb-6">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${theme.lightBg} ${theme.text} ${theme.border}`}>
                   {isSupervisorProfile ? worker.designation : worker.skill_type}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                   {worker.payment_type === 'monthly' ? `৳${worker.monthly_salary}/মাস` : `৳${worker.daily_rate}/দিন`}
                </span>
             </div>

             {/* Tactile Quick Actions */}
             <div className="grid grid-cols-3 gap-3 w-full">
                <a href={`tel:${worker.phone}`} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-slate-100 dark:border-slate-700 active:scale-95 group">
                   <div className="p-2.5 bg-white dark:bg-slate-700 rounded-full text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-110 transition-transform">
                      <Phone size={18} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">কল করুন</span>
                </a>
                <a href={`sms:${worker.phone}`} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all border border-slate-100 dark:border-slate-700 active:scale-95 group">
                   <div className="p-2.5 bg-white dark:bg-slate-700 rounded-full text-orange-600 dark:text-orange-400 shadow-sm group-hover:scale-110 transition-transform">
                      <MessageSquare size={18} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">মেসেজ</span>
                </a>
                <button onClick={() => setIsPayModalOpen(true)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-slate-100 dark:border-slate-700 active:scale-95 group">
                   <div className="p-2.5 bg-white dark:bg-slate-700 rounded-full text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 transition-transform">
                      <Wallet size={18} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">পেমেন্ট</span>
                </button>
             </div>
          </div>
       </div>

       {/* Financial Stats - Premium Gradient Card */}
       <div className="px-4 mt-4">
          <div className={`${theme.cardGradient} rounded-[2.2rem] p-6 text-white flex justify-between items-center shadow-xl ${theme.shadowColor} dark:shadow-none relative overflow-hidden border border-white/10`}>
             {/* Background Texture */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
             
             {/* Neon Glow Effects */}
             <div className={`absolute right-0 bottom-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10 -mr-10 -mb-10`}></div>
             
             <div className="relative z-10">
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                   <Wallet size={14} className="text-white/80"/> বর্তমান বকেয়া
                </p>
                <p className={`text-4xl font-extrabold tracking-tight text-white`}>
                   ৳ {worker.balance.toLocaleString()}
                </p>
             </div>
             
             <button 
                onClick={() => setIsPayModalOpen(true)}
                className="bg-white text-slate-900 px-5 py-3 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-lg relative z-10 active:scale-95"
             >
                পরিশোধ করুন
             </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                <div className={`${theme.primaryBg} dark:bg-slate-800 p-2 rounded-full ${theme.primaryColor} mb-2`}>
                   <TrendingUp size={16} />
                </div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-white">৳ {totalEarned.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">মোট আয়</p>
             </div>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-full text-emerald-600 mb-2">
                   <CheckCircle size={16} />
                </div>
                <p className="text-xl font-extrabold text-emerald-600">৳ {totalPaid.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">পরিশোধ</p>
             </div>
          </div>
       </div>

       {/* History Section with Tabs */}
       <div className="px-4 mt-6">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveHistoryTab('attendance')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeHistoryTab === 'attendance' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              হাজিরা ইতিহাস
            </button>
            <button 
              onClick={() => setActiveHistoryTab('payment')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeHistoryTab === 'payment' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              পেমেন্ট ইতিহাস
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm p-2 space-y-2">
             {activeHistoryTab === 'attendance' ? (
                workerAttendance.length === 0 ? (
                    <div className="p-10 text-center">
                       <Clock size={32} className="mx-auto text-slate-300 mb-2"/>
                       <p className="text-slate-400 text-xs font-bold">কোন হাজিরা তথ্য নেই</p>
                    </div>
                 ) : (
                    workerAttendance.slice().reverse().slice(0, 10).map((record) => (
                       <div key={record.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-4">
                             <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs flex flex-col items-center min-w-[50px] shadow-sm border border-slate-100 dark:border-slate-700">
                                <span className="text-base leading-none">{new Date(record.date).getDate()}</span>
                                <span className="text-[8px] uppercase opacity-70">{new Date(record.date).toLocaleDateString('en-US', {month: 'short'})}</span>
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                   {record.status === 'P' 
                                     ? <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> ফুল ডে</span> 
                                     : <span className="text-amber-600 flex items-center gap-1"><Clock size={12}/> হাফ ডে</span>}
                                </p>
                                {record.overtime && record.overtime > 0 ? (
                                   <p className="text-[10px] text-purple-600 font-bold mt-0.5 bg-purple-50 inline-block px-2 py-0.5 rounded-md">
                                      +{record.overtime} ঘণ্টা ওভারটাইম
                                   </p>
                                ) : (
                                   <p className="text-[10px] text-slate-400 font-medium mt-0.5">রেগুলার শিফট</p>
                                )}
                             </div>
                          </div>
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-300">৳ {record.amount}</span>
                       </div>
                    ))
                 )
             ) : (
                workerPayments.length === 0 ? (
                    <div className="p-10 text-center">
                       <Wallet size={32} className="mx-auto text-slate-300 mb-2"/>
                       <p className="text-slate-400 text-xs font-bold">কোন পেমেন্ট রেকর্ড নেই</p>
                    </div>
                 ) : (
                    workerPayments.slice().reverse().map((tx) => (
                       <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-3">
                             <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-full text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle size={18} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">{tx.description}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{tx.date}</p>
                             </div>
                          </div>
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                             ৳ {tx.amount.toLocaleString()}
                          </span>
                       </div>
                    ))
                 )
             )}
          </div>
       </div>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsPayModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <div className="bg-emerald-100 p-2 rounded-full"><Wallet className="text-emerald-600" size={20}/></div>
                   পেমেন্ট করুন
                </h3>
                <button onClick={() => setIsPayModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl mb-6 text-center border border-emerald-100 dark:border-emerald-900/30">
                 <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">বর্তমান পাওনা</p>
                 <p className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ {worker.balance.toLocaleString()}</p>
              </div>

              <form onSubmit={handlePayment}>
                 <label className={labelClass}>টাকার পরিমাণ</label>
                 <div className="relative mb-6">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                    <input 
                      type="number" 
                      required
                      autoFocus
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0"
                      className={`${inputClass} pl-10 text-2xl font-extrabold text-center`}
                    />
                 </div>

                 <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> পেমেন্ট ও SMS পাঠান
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <div className={`${theme.editIconBg} p-2 rounded-full`}><Edit2 size={18} className={theme.editIconColor}/></div> 
                   এডিট প্রোফাইল
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                 <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       <img 
                         src={formData.avatar_url} 
                         className="w-24 h-24 rounded-full border-[4px] border-slate-100 dark:border-slate-800 object-cover transition-opacity" 
                         alt="Profile" 
                         style={{ opacity: isProcessingImage ? 0.5 : 1 }}
                       />
                       <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <Camera size={24} className="text-white" />
                       </div>
                       
                       {isProcessingImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="animate-spin text-blue-600" size={32} />
                          </div>
                       )}

                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/png, image/jpeg, image/jpg, image/webp"
                         onChange={handleImageUpload}
                       />
                    </div>
                    <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase tracking-wide bg-blue-50 px-3 py-1 rounded-full">ছবি পরিবর্তন</p>
                 </div>

                 <div>
                    <label className={labelClass}>নাম</label>
                    <div className="relative">
                       <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                       <input 
                         value={formData.full_name}
                         onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                         className={`${inputClass} pl-11`}
                         required
                       />
                    </div>
                 </div>

                 <div>
                    <label className={labelClass}>মোবাইল</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                       <input 
                         value={formData.phone}
                         onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         className={`${inputClass} pl-11`}
                         required
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className={labelClass}>পদবী</label>
                       <div className="relative">
                          <Briefcase className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          {worker.role === 'supervisor' ? (
                             <input 
                               value={formData.designation}
                               onChange={(e) => setFormData({...formData, designation: e.target.value})}
                               className={`${inputClass} pl-9`}
                             />
                          ) : (
                             <select 
                               value={formData.skill_type}
                               onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
                               className={`${inputClass} pl-9 appearance-none`}
                             >
                               <option value="রাজমিস্ত্রি">রাজমিস্ত্রি</option>
                               <option value="রডমিস্ত্রি">রডমিস্ত্রি</option>
                               <option value="হেল্পার">হেল্পার</option>
                               <option value="ইলেকট্রিশিয়ান">ইলেকট্রিশিয়ান</option>
                               <option value="পেইন্টার">পেইন্টার</option>
                             </select>
                          )}
                       </div>
                    </div>
                    <div>
                       <label className={labelClass}>{worker.role === 'supervisor' && worker.payment_type === 'monthly' ? 'বেতন (মাস)' : 'রেট (দিন)'}</label>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          <input 
                            type="number"
                            value={worker.role === 'supervisor' && worker.payment_type === 'monthly' ? formData.monthly_salary : formData.daily_rate}
                            onChange={(e) => worker.role === 'supervisor' && worker.payment_type === 'monthly' ? setFormData({...formData, monthly_salary: Number(e.target.value)}) : setFormData({...formData, daily_rate: Number(e.target.value)})}
                            className={`${inputClass} pl-9`}
                            required
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isProcessingImage}
                   className={`w-full py-4 ${theme.btnBg} text-white rounded-2xl font-bold shadow-lg ${theme.btnShadow} dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                 >
                    {isProcessingImage ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                    আপডেট করুন
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};