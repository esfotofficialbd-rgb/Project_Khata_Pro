
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { ArrowLeft, Phone, Calendar, Briefcase, DollarSign, User, CheckCircle, Wallet, X, Edit2, Camera, Clock, MessageSquare, TrendingUp, UserCog, HardHat, ShieldCheck, Loader2, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Profile } from '../types';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

export const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Logged in user (Contractor)
  const { users, attendance, payWorker, updateUser, transactions, deleteUser } = useData();
  const { toast } = useToast();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  // Determine Role & Theme
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
      inputFocus: 'focus:border-blue-500',
      btnBg: 'bg-blue-600 hover:bg-blue-700',
      btnShadow: 'shadow-blue-200',
      editIconBg: 'bg-blue-100',
      editIconColor: 'text-blue-600',
      shadowColor: 'shadow-blue-900/20'
  };

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

  const handleDeleteWorker = async () => {
      await deleteUser(worker.id);
      setIsDeleteModalOpen(false);
      navigate('/workers');
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
                          const { error } = await supabase.storage
                              .from('images')
                              .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

                          if (error) throw error;

                          const { data: publicData } = supabase.storage
                              .from('images')
                              .getPublicUrl(fileName);

                          setFormData(prev => ({ ...prev, avatar_url: publicData.publicUrl }));
                          toast.success('ছবি আপলোড সম্পন্ন হয়েছে');
                          setIsProcessingImage(false);
                      } catch (uploadError) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
                              toast.success('ছবি সেভ হয়েছে (অফলাইন মোড)');
                              setIsProcessingImage(false);
                          };
                          reader.readAsDataURL(blob);
                      }
                  } else {
                      setIsProcessingImage(false);
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
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-[80px]"></div>
          
          <div className="flex items-center justify-between p-4 relative z-10 text-white">
             <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                <ArrowLeft size={22} />
             </button>
             <h1 className="text-sm font-bold uppercase tracking-widest opacity-80">
                {isSupervisorProfile ? 'সাইট সুপারভাইজার' : 'সাইট কর্মী'}
             </h1>
             
             <div className="flex gap-2">
                 {/* Feature 1: Edit & Delete Buttons */}
                 <button onClick={openEditModal} className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-md shadow-sm border border-white/10">
                    <Edit2 size={20} />
                 </button>
                 <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 bg-red-500/20 rounded-full hover:bg-red-500/40 transition-colors backdrop-blur-md shadow-sm border border-red-500/30 text-red-200">
                    <Trash2 size={20} />
                 </button>
             </div>
          </div>
       </div>

       {/* Floating Profile Card */}
       <div className="px-4 -mt-32 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 pt-0 text-center relative flex flex-col items-center">
             
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
             </div>

             <div className="flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                <a href={`tel:${worker.phone}`} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                   <Phone size={16} /> {worker.phone}
                </a>
                <a href={`sms:${worker.phone}`} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                   <MessageSquare size={16} />
                </a>
             </div>
          </div>
       </div>

       {/* Quick Stats Grid */}
       <div className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
             <div className={`bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 ${isSupervisorProfile ? 'shadow-purple-100 dark:shadow-none' : 'shadow-blue-100 dark:shadow-none'}`}>
                <div className={`p-3 rounded-2xl mb-1 ${theme.lightBg} ${theme.text}`}>
                   <Calendar size={24} />
                </div>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{workerAttendance.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">মোট দিন</p>
             </div>
             <div className={`bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 ${isSupervisorProfile ? 'shadow-purple-100 dark:shadow-none' : 'shadow-blue-100 dark:shadow-none'}`}>
                <div className={`p-3 rounded-2xl mb-1 ${theme.lightBg} ${theme.text}`}>
                   <TrendingUp size={24} />
                </div>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{(totalEarned/1000).toFixed(1)}k</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">মোট আয়</p>
             </div>
          </div>
       </div>

       {/* Financial Card */}
       <div className="px-4 mt-6">
          <div className={`${theme.cardGradient} rounded-[2rem] p-6 text-white shadow-xl ${theme.shadowColor} relative overflow-hidden`}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
             
             <div className="relative z-10 flex justify-between items-center mb-6">
                <div>
                   <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Wallet size={12} /> মোট বকেয়া
                   </p>
                   <h2 className="text-4xl font-extrabold tracking-tight">৳ {worker.balance.toLocaleString()}</h2>
                </div>
                <button 
                   onClick={() => setIsPayModalOpen(true)}
                   className="bg-white text-slate-900 px-5 py-3 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                >
                   পেমেন্ট করুন <ChevronRight size={14} className="opacity-50"/>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 relative z-10">
                <div>
                   <p className="text-[10px] font-bold opacity-70 uppercase mb-0.5">দৈনিক রেট</p>
                   <p className="font-bold text-lg">৳ {isSupervisorProfile && worker.payment_type === 'monthly' ? (Math.round(worker.monthly_salary! / 30)) : worker.daily_rate}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold opacity-70 uppercase mb-0.5">পরিশোধিত</p>
                   <p className="font-bold text-lg">৳ {totalPaid.toLocaleString()}</p>
                </div>
             </div>
          </div>
       </div>

       {/* History Section */}
       <div className="px-4 mt-8">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
             <Clock size={16} className={theme.text} /> সাম্প্রতিক ইতিহাস
          </h3>
          
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex mb-4">
             <button 
               onClick={() => setActiveHistoryTab('attendance')} 
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeHistoryTab === 'attendance' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}
             >
                হাজিরা
             </button>
             <button 
               onClick={() => setActiveHistoryTab('payment')} 
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeHistoryTab === 'payment' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}
             >
                পেমেন্ট
             </button>
          </div>

          <div className="space-y-3">
             {activeHistoryTab === 'attendance' ? (
                workerAttendance.length === 0 ? (
                   <div className="text-center py-10 text-slate-400 text-xs font-bold">কোন হাজিরার তথ্য নেই</div>
                ) : (
                   workerAttendance.slice().reverse().slice(0, 5).map(record => (
                      <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-center min-w-[50px] border border-slate-100 dark:border-slate-700">
                               <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{new Date(record.date).getDate()}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(record.date).toLocaleDateString('en-US', {month: 'short'})}</p>
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">স্ট্যাটাস</p>
                               <div className="flex gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${record.status === 'P' ? 'bg-green-100 text-green-700' : record.status === 'H' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                     {record.status === 'P' ? 'উপস্থিত' : record.status === 'H' ? 'হাফ ডে' : 'অনুপস্থিত'}
                                  </span>
                                  {record.overtime && record.overtime > 0 ? (
                                     <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">+{record.overtime}h</span>
                                  ) : null}
                                </div>
                            </div>
                         </div>
                         <p className="font-bold text-slate-700 dark:text-slate-300">৳{record.amount}</p>
                      </div>
                   ))
                )
             ) : (
                workerPayments.length === 0 ? (
                   <div className="text-center py-10 text-slate-400 text-xs font-bold">কোন পেমেন্ট তথ্য নেই</div>
                ) : (
                   workerPayments.slice().reverse().slice(0, 5).map(tx => (
                      <div key={tx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-emerald-600">
                               <CheckCircle size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 dark:text-white text-sm">পেমেন্ট প্রদান</p>
                               <p className="text-[10px] text-slate-500 font-bold">{tx.date}</p>
                            </div>
                         </div>
                         <p className="font-bold text-emerald-600 dark:text-emerald-400">+ ৳{tx.amount.toLocaleString()}</p>
                      </div>
                   ))
                )
             )}
          </div>
       </div>

       {/* Edit Modal */}
       {isEditModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <div className={`${theme.editIconBg} p-2 rounded-xl ${theme.editIconColor}`}><Edit2 size={20}/></div>
                   এডিট প্রোফাইল
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
             </div>

             <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="flex flex-col items-center mb-4">
                   <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img 
                        src={formData.avatar_url || worker.avatar_url} 
                        className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover shadow-sm transition-opacity" 
                        alt="Profile" 
                        style={{ opacity: isProcessingImage ? 0.5 : 1 }}
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                         <Camera size={24} className="text-white" />
                      </div>
                      
                      {isProcessingImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="animate-spin text-white" size={24} />
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
                   <p className={`text-[10px] ${theme.primaryColor} font-bold mt-2 uppercase tracking-wide`}>ছবি পরিবর্তন</p>
                </div>

                <div>
                   <label className={labelClass}>নাম</label>
                   <input 
                     value={formData.full_name}
                     onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                     className={inputClass}
                     required
                   />
                </div>

                <div>
                   <label className={labelClass}>ফোন</label>
                   <input 
                     value={formData.phone}
                     onChange={(e) => setFormData({...formData, phone: e.target.value})}
                     className={inputClass}
                     type="tel"
                     required
                   />
                </div>

                {isSupervisorProfile ? (
                   <>
                      <div>
                         <label className={labelClass}>পদবী</label>
                         <input 
                           value={formData.designation}
                           onChange={(e) => setFormData({...formData, designation: e.target.value})}
                           className={inputClass}
                         />
                      </div>
                      <div>
                         <label className={labelClass}>মাসিক বেতন</label>
                         <input 
                           type="number"
                           value={formData.monthly_salary}
                           onChange={(e) => setFormData({...formData, monthly_salary: Number(e.target.value)})}
                           className={inputClass}
                         />
                      </div>
                   </>
                ) : (
                   <>
                      <div>
                         <label className={labelClass}>কাজের ধরণ</label>
                         <select 
                            value={formData.skill_type}
                            onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
                            className={`${inputClass} appearance-none`}
                         >
                            {['রাজমিস্ত্রি', 'রডমিস্ত্রি', 'হেল্পার', 'সিনিয়র হেল্পার', 'হাব মিস্ত্রী', 'ইলেকট্রিশিয়ান', 'পেইন্টার'].map(s => (
                               <option key={s} value={s}>{s}</option>
                            ))}
                         </select>
                      </div>
                      <div>
                         <label className={labelClass}>দৈনিক রেট</label>
                         <input 
                           type="number"
                           value={formData.daily_rate}
                           onChange={(e) => setFormData({...formData, daily_rate: Number(e.target.value)})}
                           className={inputClass}
                         />
                      </div>
                   </>
                )}

                <button 
                  type="submit" 
                  disabled={isProcessingImage}
                  className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-95 transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed ${theme.btnBg} ${theme.btnShadow} dark:shadow-none`}
                >
                   {isProcessingImage ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20} />}
                   সেভ করুন
                </button>
             </form>
           </div>
         </div>
       )}

       {/* Pay Modal */}
       {isPayModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsPayModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><Wallet size={20}/></div>
                   পেমেন্ট করুন
                </h3>
                <button onClick={() => setIsPayModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
             </div>

             <form onSubmit={handlePayment} className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">বর্তমান বকেয়া</p>
                   <p className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ {worker.balance.toLocaleString()}</p>
                </div>

                <div>
                   <label className={labelClass}>টাকার পরিমাণ</label>
                   <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                      <input 
                        type="number" 
                        inputMode="decimal"
                        required
                        autoFocus
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0"
                        className={`${inputClass} pl-10 text-xl font-bold`}
                       />
                   </div>
                </div>

                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none mt-2 active:scale-95 transition-all text-base flex items-center justify-center gap-2">
                   <CheckCircle size={20} /> পেমেন্ট নিশ্চিত করুন
                </button>
             </form>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {isDeleteModalOpen && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm relative z-10 p-6 rounded-[2.5rem] shadow-2xl animate-scale-up border border-red-100 dark:border-red-900/50">
               <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                     <AlertTriangle size={40} className="text-red-600 dark:text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">আপনি কি নিশ্চিত?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                     <span className="font-bold text-slate-800 dark:text-slate-200">{worker.full_name}</span>-এর প্রোফাইল এবং সকল ডাটা <span className="text-red-500 font-bold">স্থায়ীভাবে মুছে ফেলা হবে</span>।
                  </p>
                  
                  <div className="flex gap-3">
                     <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                     >
                        বাতিল করুন
                     </button>
                     <button 
                        onClick={handleDeleteWorker}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                     >
                        <Trash2 size={18} /> ডিলিট করুন
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};