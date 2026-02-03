
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Building2, Mail, Phone, Award, ShieldCheck, ChevronRight, Edit2, Camera, X, CheckCircle, User, Wallet, Briefcase, Gem, Loader2, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { Profile } from '../types';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export const ContractorProfile = () => {
  const { user, setUser, logout } = useAuth();
  const { projects, users, updateUser, transactions, attendance, t } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
      setIsProcessingImage(true);
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 500; // Resize to save space
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
              
              // Try conversion
              canvas.toBlob(async (blob) => {
                  if (blob) {
                      const fileName = `avatars/${user.id}-${Date.now()}.jpg`;
                      try {
                          // 1. Try Supabase Storage Upload
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
                          console.warn("Storage upload failed, switching to offline mode:", uploadError);
                          
                          // 2. Fallback: Use Base64 String directly
                          const base64String = canvas.toDataURL('image/jpeg', 0.7);
                          setFormData(prev => ({ ...prev, avatar_url: base64String }));
                          toast.success('ছবি সেভ হয়েছে');
                      } finally {
                          setIsProcessingImage(false);
                      }
                  }
              }, 'image/jpeg', 0.7);
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    
    // Clear input to allow re-selecting same file
    if (e.target) e.target.value = '';
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };
    updateUser(updatedUser); 
    setUser(updatedUser); 
    setIsEditing(false);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', user.id);
        
        if (error) {
            console.error("Delete failed:", error);
            if (error.code === '23503') {
                toast.error("ডাটা ডিলিট করা যায়নি", "আপনার প্রজেক্ট বা অন্যান্য ডাটা আগে ম্যানুয়ালি মুছে ফেলুন।");
            } else {
                toast.error("অ্যাকাউন্ট ডিলিট ব্যর্থ হয়েছে", error.message);
            }
            setDeleteLoading(false);
            setShowDeleteModal(false);
            return;
        }

        await logout();
        navigate('/login');
        toast.success("অ্যাকাউন্ট সফলভাবে ডিলিট করা হয়েছে।");
    } catch (error: any) {
        console.error("Delete Error:", error);
        toast.error("অ্যাকাউন্ট ডিলিট ব্যর্থ হয়েছে");
        setDeleteLoading(false);
        setShowDeleteModal(false);
    }
  };

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase ml-1";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
       {/* Modern Header Background */}
       <div className="h-64 relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-40"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-purple-500 rounded-full blur-[60px] opacity-30"></div>
       </div>

       {/* Profile Content Wrapper */}
       <div className="px-4 -mt-28 relative z-10">
          
          {/* Main Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white/50 dark:border-slate-700 p-6 flex flex-col items-center text-center relative">
             
             {/* Profile Image */}
             <div className="relative -mt-20 mb-4 group cursor-pointer" onClick={handleEditClick}>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full opacity-80 blur-sm group-hover:blur-md transition-all"></div>
                <img 
                  src={user.avatar_url || "https://picsum.photos/100"} 
                  alt="Profile" 
                  className="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl object-cover bg-slate-200" 
                />
                {user.is_verified && (
                   <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-900 shadow-sm z-20">
                      <ShieldCheck size={16} />
                   </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                   <Edit2 size={24} className="text-white"/>
                </div>
             </div>

             <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{user.full_name}</h1>
             
             <div className="flex items-center gap-2 mt-2 mb-6 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-md">
                   <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-slate-600 dark:text-slate-300 font-bold text-sm tracking-wide">{user.company_name}</span>
             </div>

             {/* Stats Row */}
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 flex flex-col items-center gap-1">
                   <div className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-blue-600">
                      <Briefcase size={18} />
                   </div>
                   <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{activeProjects}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('active_projects_stat')}</p>
                </div>
                <div className="bg-purple-50 dark:bg-slate-800 p-4 rounded-2xl border border-purple-100 dark:border-slate-700 flex flex-col items-center gap-1">
                   <div className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-purple-600">
                      <User size={18} />
                   </div>
                   <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{totalWorkers}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('total_workers_stat')}</p>
                </div>
             </div>
          </div>
       </div>

       {/* Financial Snapshot */}
       <div className="px-4 mt-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Wallet size={14} /> {t('financial_snapshot')}
                  </h3>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold border border-white/10">{t('lifetime')}</span>
               </div>
               
               <div className="flex justify-between items-end border-b border-emerald-500/30 pb-5 mb-4">
                  <div>
                     <p className="text-emerald-100 text-xs font-bold mb-1 opacity-80 uppercase">{t('total_expense_stat')}</p>
                     <p className="text-3xl font-extrabold tracking-tight">৳ {(totalExpense / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="text-right">
                     <p className="text-emerald-100 text-xs font-bold mb-1 opacity-80 uppercase">{t('total_due')}</p>
                     <p className="text-xl font-bold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10">৳ {totalDue.toLocaleString()}</p>
                  </div>
               </div>
               
               <div className="flex items-center justify-between text-xs font-bold text-emerald-100">
                  <span className="flex items-center gap-1.5"><Gem size={14} /> {t('pro_membership')}</span>
                  <span className="opacity-80">{t('valid_till')}: 2025</span>
               </div>
             </div>
          </div>
       </div>

       {/* Contact Info List */}
       <div className="px-4 mt-6 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
             <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('contact_info')}</h3>
             </div>
             <div className="p-3">
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-default">
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                      <Phone size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t('mobile')}</p>
                      <p className="text-base font-bold text-slate-800 dark:text-white font-mono tracking-wide">{user.phone}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-default">
                   <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full text-orange-600 dark:text-orange-400">
                      <Mail size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t('email')}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{user.email || 'N/A'}</p>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* Danger Zone */}
       <div className="px-4 mt-6">
          <div className="bg-red-50 dark:bg-red-900/10 rounded-[2rem] p-1 border border-red-100 dark:border-red-900/30">
             <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-white dark:bg-slate-900/50 p-4 rounded-[1.8rem] flex items-center justify-between group active:scale-95 transition-all"
             >
                <div className="flex items-center gap-3">
                   <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-full text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                      <Trash2 size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{t('delete_account')}</p>
                      <p className="text-[10px] text-red-400 dark:text-red-300 font-medium">{t('action_irreversible')}</p>
                   </div>
                </div>
                <AlertTriangle size={18} className="text-red-300 dark:text-red-500 group-hover:text-red-600 transition-colors" />
             </button>
          </div>
       </div>

       {/* Edit Modal */}
       {isEditing && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600"><Edit2 size={20}/></div>
                   এডিট প্রোফাইল
                </h3>
                <button onClick={() => setIsEditing(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
             </div>

             <form onSubmit={saveProfile} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                   <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={formData.avatar_url || user.avatar_url} className="w-28 h-28 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover shadow-sm transition-opacity" alt="Profile" style={{ opacity: isProcessingImage ? 0.5 : 1 }} />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                         <Camera size={32} className="text-white" />
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
                   <p className="text-[10px] text-blue-600 font-bold mt-3 uppercase tracking-wide bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">ছবি পরিবর্তন</p>
                </div>

                <div>
                   <label className={labelClass}>আপনার নাম</label>
                   <input 
                     name="full_name"
                     value={formData.full_name}
                     onChange={handleInputChange}
                     className={inputClass}
                     required
                   />
                </div>

                <div>
                   <label className={labelClass}>কোম্পানির নাম</label>
                   <input 
                     name="company_name"
                     value={formData.company_name}
                     onChange={handleInputChange}
                     className={inputClass}
                     required
                   />
                </div>

                <div>
                   <label className={labelClass}>ইমেইল</label>
                   <input 
                     name="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     className={inputClass}
                   />
                </div>

                <div>
                   <label className={labelClass}>মোবাইল</label>
                   <input 
                     name="phone"
                     value={formData.phone}
                     onChange={handleInputChange}
                     className={inputClass}
                     required
                   />
                </div>

                <button 
                  type="submit" 
                  disabled={isProcessingImage}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-70 disabled:cursor-not-allowed"
                >
                   {isProcessingImage ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20} />}
                   সেভ করুন
                </button>
             </form>
           </div>
         </div>
       )}

       {/* Custom Delete Confirmation Modal */}
       {showDeleteModal && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm relative z-10 p-6 rounded-[2.5rem] shadow-2xl animate-scale-up border border-red-100 dark:border-red-900/50">
               <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                     <AlertTriangle size={40} className="text-red-600 dark:text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">আপনি কি নিশ্চিত?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                     আপনার অ্যাকাউন্ট এবং সকল প্রজেক্টের ডাটা <span className="text-red-500 font-bold">স্থায়ীভাবে মুছে ফেলা হবে</span>। এই অ্যাকশনটি ফেরত নেওয়া যাবে না।
                  </p>
                  
                  <div className="flex gap-3">
                     <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                     >
                        বাতিল করুন
                     </button>
                     <button 
                        onClick={confirmDelete}
                        disabled={deleteLoading}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                     >
                        {deleteLoading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        ডিলিট করুন
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
