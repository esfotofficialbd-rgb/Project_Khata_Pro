
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Phone, QrCode, Edit2, X, Camera, CheckCircle, Briefcase, User, Building2, Calendar, Wallet, CreditCard, Cpu, Download, ShieldCheck, Loader2, ChevronDown } from 'lucide-react';
import { Profile } from '../types';
import QRCode from 'react-qr-code';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

export const WorkerProfile = () => {
  const { user, setUser } = useAuth();
  const { updateUser, users, attendance, requestProfileUpdate } = useData();
  const { toast } = useToast();
  const [showIdCard, setShowIdCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zoomQr, setZoomQr] = useState(false); 
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  if (!user) return null;

  // Stats
  const myAttendance = attendance.filter(a => a.worker_id === user.id);
  const totalWorkDays = myAttendance.filter(a => a.status === 'P' || a.status === 'H').length;
  const totalEarned = myAttendance.reduce((sum, a) => sum + a.amount, 0);

  const contractor = users.find(u => u.role === 'contractor');
  const companyName = user?.role === 'contractor' 
    ? user.company_name 
    : contractor?.company_name || 'Project Khata';

  const isSupervisor = user.role === 'supervisor';
  const isWorker = user.role === 'worker';

  const theme = isSupervisor ? {
      lightBg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-100 dark:border-purple-800',
      icon: Briefcase
  } : {
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-100 dark:border-emerald-800',
      icon: User
  };

  const workerSkills = ['রাজমিস্ত্রি', 'রডমিস্ত্রি', 'হেল্পার', 'সিনিয়র হেল্পার', 'হাব মিস্ত্রী', 'ইলেকট্রিশিয়ান', 'পেইন্টার'];

  const handleEditClick = () => {
    setFormData({
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      skill_type: user.skill_type
    });
    setIsEditing(true);
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
                      const fileName = `avatars/${user.id}-${Date.now()}.jpg`;
                      
                      try {
                          const { error } = await supabase.storage
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
                          setIsProcessingImage(false);
                      } catch (uploadError) {
                          console.warn("Storage upload failed, fallback to Base64:", uploadError);
                          
                          // Fallback to Base64
                          const base64String = canvas.toDataURL('image/jpeg', 0.7);
                          setFormData(prev => ({ ...prev, avatar_url: base64String }));
                          toast.success('ছবি সেভ হয়েছে (অফলাইন মোড)');
                          setIsProcessingImage(false);
                      }
                  } else {
                      setIsProcessingImage(false);
                  }
              }, 'image/jpeg', 0.7);
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };

    if (isWorker) {
        await requestProfileUpdate(user.id, formData);
        setIsEditing(false);
    } else {
        updateUser(updatedUser);
        setUser(updatedUser);
        setIsEditing(false);
    }
  };

  const downloadQrCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const svg = document.getElementById("worker-qr-code");
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = 300;
            canvas.height = 300;
            ctx?.drawImage(img, 0, 0, 300, 300);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${user.full_name}_QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative overflow-hidden font-sans">
      
      {/* Cover Photo */}
      <div className={`h-52 relative overflow-hidden ${isSupervisor ? 'bg-gradient-to-r from-purple-600 to-indigo-800' : 'bg-gradient-to-r from-emerald-600 to-teal-800'}`}>
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-3xl -ml-10 -mb-10"></div>
      </div>

      <div className="px-5 relative -mt-20 z-10">
         
         {/* Profile Card */}
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center text-center">
            <div className="relative -mt-24 mb-4 group">
               <img 
                  src={user.avatar_url || "https://picsum.photos/120"} 
                  alt="Profile" 
                  className={`w-36 h-36 rounded-full border-[6px] border-white dark:border-slate-900 shadow-2xl object-cover bg-slate-200`}
               />
               <button 
                  onClick={handleEditClick}
                  className="absolute bottom-2 right-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2.5 rounded-full border-4 border-white dark:border-slate-900 shadow-lg active:scale-95 transition-transform"
               >
                  <Edit2 size={16}/>
               </button>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-2 mb-1">
               {user.full_name}
               {user.is_verified && <ShieldCheck size={22} className="text-blue-500 fill-blue-50" />}
            </h2>
            
            <div className="flex items-center justify-center gap-2 mt-2 mb-6">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${theme.lightBg} ${theme.text} ${theme.border} flex items-center gap-1.5`}>
                   <theme.icon size={12}/> {isSupervisor ? user.designation : user.skill_type}
                </span>
            </div>

            <div className="w-full flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
               <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Building2 size={14}/>
                  <span className="font-bold">{companyName}</span>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Phone size={14}/>
                  <span className="font-mono font-bold">{user.phone}</span>
               </div>
            </div>
         </div>

         {/* Glass Stats Grid */}
         <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-[2rem] border border-white/50 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
               <div className={`p-3 rounded-2xl mb-1 shadow-sm ${isSupervisor ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                  <Calendar size={24} />
               </div>
               <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalWorkDays}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">মোট কাজের দিন</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-[2rem] border border-white/50 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
               <div className={`p-3 rounded-2xl mb-1 shadow-sm ${isSupervisor ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                  <Wallet size={24} />
               </div>
               <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{(totalEarned/1000).toFixed(1)}k</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">সর্বমোট আয়</p>
            </div>
         </div>

         {/* Digital ID Section */}
         <button 
            onClick={() => setShowIdCard(!showIdCard)}
            className={`w-full mt-6 rounded-3xl bg-gradient-to-r ${isSupervisor ? 'from-purple-500 via-indigo-500 to-purple-500' : 'from-emerald-500 via-teal-500 to-emerald-500'} p-[2px] active:scale-[0.98] transition-transform shadow-xl group`}
         >
            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                     <CreditCard size={28} />
                  </div>
                  <div className="text-left">
                     <p className="font-bold text-slate-800 dark:text-white text-base">স্মার্ট আইডি কার্ড</p>
                     <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{showIdCard ? 'বন্ধ করতে ট্যাপ করুন' : 'দেখতে ট্যাপ করুন'}</p>
                  </div>
               </div>
               <div className={`transition-transform duration-500 bg-slate-50 dark:bg-slate-800 p-2 rounded-full ${showIdCard ? 'rotate-180' : ''}`}>
                  {showIdCard ? <X size={20} className="text-slate-400"/> : <QrCode size={20} className="text-slate-400"/>}
               </div>
            </div>
         </button>

         {/* ID Card Display */}
         {showIdCard && (
            <div className="mt-6 animate-scale-up perspective-1000">
               <div className={`relative rounded-3xl overflow-hidden aspect-[1.58/1] shadow-2xl transition-transform transform hover:scale-[1.02] ${isSupervisor ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900'}`}>
                  
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-pulse-slow pointer-events-none"></div>

                  <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                              <Building2 size={20} className="text-white"/>
                           </div>
                           <div>
                              <p className="font-bold text-[10px] uppercase tracking-[0.2em] opacity-80">Project Khata</p>
                              <p className="text-xs font-bold truncate max-w-[140px] mt-0.5">{companyName}</p>
                           </div>
                        </div>
                        <Cpu size={28} className="text-yellow-400 opacity-90 drop-shadow-lg" />
                     </div>

                     <div className="flex items-center gap-5 mt-2">
                        <div 
                           className="bg-white p-1.5 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
                           onClick={() => setZoomQr(true)}
                        >
                           <QRCode 
                              id="worker-qr-code" 
                              size={72} 
                              value={user.id} 
                              viewBox={`0 0 256 256`} 
                              style={{ width: '72px', height: '72px' }}
                           />
                        </div>
                        <div>
                           <h3 className="text-xl font-extrabold leading-tight">{user.full_name}</h3>
                           <p className="text-[10px] uppercase tracking-widest opacity-80 mt-1 font-bold">{isSupervisor ? user.designation : user.skill_type}</p>
                           <div className="inline-block bg-black/20 px-3 py-1 rounded-lg text-[9px] font-mono mt-3 border border-white/10 backdrop-blur-md">
                              ID: {user.id.slice(0, 8).toUpperCase()}
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-between items-end mt-auto pt-3 border-t border-white/10">
                        <div>
                           <p className="text-[8px] opacity-60 uppercase tracking-wide font-bold">Emergency</p>
                           <p className="text-sm font-mono font-bold tracking-wide">{user.phone}</p>
                        </div>
                        <img src={user.avatar_url} className="w-10 h-10 rounded-full border-2 border-white/30 object-cover shadow-sm" />
                     </div>
                  </div>
               </div>
               
               <button 
                  onClick={downloadQrCode}
                  className="w-full mt-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
               >
                  <Download size={16} /> আইডি কার্ড সেভ করুন
               </button>
            </div>
         )}
      </div>

      {zoomQr && (
        <div className="fixed inset-0 z-[80] bg-slate-950/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setZoomQr(false)}>
           <button 
              onClick={() => setZoomQr(false)} 
              className="absolute top-6 right-6 text-white/80 p-3 rounded-full hover:bg-white/10 transition-colors z-50"
           >
              <X size={32} />
           </button>
           
           <div className="relative animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white p-3 rounded-[2.5rem] shadow-[0_0_60px_rgba(255,255,255,0.15)]">
                 <div className="bg-white p-8 rounded-[2rem] border-4 border-dashed border-slate-200">
                    <QRCode size={280} value={user.id} viewBox={`0 0 256 256`} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                 </div>
              </div>
              <div className="text-center mt-8">
                 <p className="text-white text-2xl font-bold tracking-tight">{user.full_name}</p>
                 <p className="text-slate-400 text-sm font-mono uppercase tracking-widest mt-1">ID: {user.id.slice(0,8)}</p>
              </div>
           </div>
        </div>
      )}

      {isEditing && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditing(false)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">প্রোফাইল এডিট</h3>
                <button onClick={() => setIsEditing(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
             </div>

             <form onSubmit={saveProfile} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                   <div className="relative group" onClick={() => fileInputRef.current?.click()}>
                      <img 
                        src={formData.avatar_url || user.avatar_url} 
                        className="w-28 h-28 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover shadow-sm transition-opacity" 
                        alt="Profile" 
                        style={{ opacity: isProcessingImage ? 0.5 : 1 }}
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
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
                   <p className="text-xs font-bold text-blue-600 mt-3 uppercase tracking-wide bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">ছবি পরিবর্তন</p>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase ml-1">আপনার নাম</label>
                   <div className="relative">
                      <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        name="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm"
                        required
                      />
                   </div>
                </div>

                {isWorker ? (
                   <>
                      <div>
                         <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase ml-1">মোবাইল নাম্বার</label>
                         <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input 
                              name="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm"
                              required
                            />
                         </div>
                      </div>

                      <div>
                         <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase ml-1">কাজের ধরণ</label>
                         <div className="relative">
                            <Briefcase className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <select 
                               name="skill_type"
                               value={formData.skill_type}
                               onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
                               className="w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm appearance-none"
                            >
                               {workerSkills.map(skill => (
                                  <option key={skill} value={skill}>{skill}</option>
                               ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                      </div>
                   </>
                ) : (
                   <div className={`p-4 rounded-2xl flex gap-3 items-start border border-transparent ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'}`}>
                      <Briefcase size={18} className="mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed font-medium">
                         মোবাইল নাম্বার, পদবী বা বেতনের তথ্য পরিবর্তন করতে অনুগ্রহ করে ঠিকাদারের সাথে যোগাযোগ করুন।
                      </p>
                   </div>
                )}

                <button 
                  type="submit" 
                  disabled={isProcessingImage}
                  className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-95 transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed ${isSupervisor ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'}`}
                >
                   {isProcessingImage ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                   {isWorker ? 'আপডেটের জন্য অনুরোধ করুন' : 'সেভ করুন'}
                </button>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};
