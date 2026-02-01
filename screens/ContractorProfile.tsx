import React, { useState, useRef } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Building2, Mail, Phone, Award, ShieldCheck, ChevronRight, Edit2, Camera, X, CheckCircle, User, Wallet, Briefcase } from 'lucide-react';
import { Profile } from '../types';

export const ContractorProfile = () => {
  const { user, setUser } = useAuth();
  const { projects, users, updateUser, transactions, attendance } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit States
  const [formData, setFormData] = useState<Partial<Profile>>({});

  if (!user || user.role !== 'contractor') return null;

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalWorkers = users.filter(u => u.role === 'worker').length;

  // Financial Snapshot
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) + 
                       attendance.reduce((sum, a) => sum + a.amount, 0);
  const totalDue = users.reduce((sum, u) => sum + u.balance, 0);

  const handleEditClick = () => {
    setFormData({
      full_name: user.full_name,
      company_name: user.company_name,
      phone: user.phone,
      email: user.email,
      avatar_url: user.avatar_url
    });
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, avatar_url: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };
    updateUser(updatedUser); 
    setUser(updatedUser); 
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
       {/* Modern Header Background */}
       <div className="bg-slate-900 h-48 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -ml-10 -mb-10"></div>
       </div>

       {/* Profile Card */}
       <div className="px-4 -mt-20 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center text-center">
             <div className="relative -mt-16 mb-4">
                <img 
                  src={user.avatar_url || "https://picsum.photos/100"} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-md object-cover bg-slate-200" 
                />
                {user.is_verified && (
                   <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-900" title="Verified Account">
                      <ShieldCheck size={16} />
                   </div>
                )}
             </div>

             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{user.full_name}</h1>
             <div className="flex items-center gap-2 mt-1 mb-4">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{user.company_name}</span>
             </div>

             <button 
                onClick={handleEditClick}
                className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition-transform flex items-center gap-2"
             >
                <Edit2 size={14} /> প্রোফাইল এডিট
             </button>
          </div>
       </div>

       {/* Stats Overview */}
       <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Briefcase size={18}/></div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">প্রজেক্ট</span>
             </div>
             <p className="text-xl font-bold text-slate-800 dark:text-white">{activeProjects} <span className="text-xs font-medium text-slate-400">/ {activeProjects + completedProjects}</span></p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400"><User size={18}/></div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">কর্মী</span>
             </div>
             <p className="text-xl font-bold text-slate-800 dark:text-white">{totalWorkers}</p>
          </div>
       </div>

       {/* Financial Snapshot */}
       <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-100 dark:shadow-none">
             <h3 className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Wallet size={14} /> ফাইন্যান্স স্ন্যাপশট
             </h3>
             <div className="flex justify-between items-end border-b border-emerald-500/30 pb-4 mb-4">
                <div>
                   <p className="text-emerald-100 text-xs mb-1">মোট খরচ (লাইফটাইম)</p>
                   <p className="text-2xl font-bold">৳ {(totalExpense / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-right">
                   <p className="text-emerald-100 text-xs mb-1">বর্তমান বকেয়া</p>
                   <p className="text-xl font-bold text-white">৳ {totalDue.toLocaleString()}</p>
                </div>
             </div>
             <div className="flex items-center justify-between text-xs font-medium text-emerald-100">
                <span>সাবস্ক্রিপশন: <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded">PRO</span></span>
                <span>মেয়াদ: ২০২৫</span>
             </div>
          </div>
       </div>

       {/* Detailed Info */}
       <div className="px-4 mt-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">যোগাযোগের তথ্য</h3>
             </div>
             <div className="p-2">
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                   <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-600 dark:text-slate-400">
                      <Phone size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">মোবাইল</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{user.phone}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                   <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-600 dark:text-slate-400">
                      <Mail size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ইমেইল</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{user.email || 'দেওয়া নেই'}</p>
                   </div>
                </div>
             </div>
          </div>

          <button className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:scale-95 transition-all">
             <div className="flex items-center gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-xl text-orange-600 dark:text-orange-400">
                   <Award size={20} />
                </div>
                <div className="text-left">
                   <p className="text-sm font-bold text-slate-800 dark:text-white">সাবস্ক্রিপশন প্ল্যান</p>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400">আনলিমিটেড অ্যাক্সেস</p>
                </div>
             </div>
             <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
       </div>

       {/* Edit Modal */}
       {isEditing && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Edit2 size={18} className="text-blue-600"/> এডিট প্রোফাইল
                </h3>
                <button onClick={() => setIsEditing(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
             </div>

             <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex flex-col items-center mb-6">
                   <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={formData.avatar_url} className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover" alt="Profile" />
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={24} className="text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                   </div>
                   <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase tracking-wide">ছবি পরিবর্তন করুন</p>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">আপনার নাম</label>
                   <input 
                     name="full_name"
                     value={formData.full_name}
                     onChange={handleInputChange}
                     className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                     required
                   />
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">কোম্পানির নাম</label>
                   <input 
                     name="company_name"
                     value={formData.company_name}
                     onChange={handleInputChange}
                     className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                     required
                   />
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">ইমেইল</label>
                   <input 
                     name="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                   />
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">মোবাইল</label>
                   <input 
                     name="phone"
                     value={formData.phone}
                     onChange={handleInputChange}
                     className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                     required
                   />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                   <CheckCircle size={18} />
                   সেভ করুন
                </button>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};