import React, { useState, useRef } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Award, Phone, QrCode, Edit2, X, Camera, CheckCircle, Briefcase, User, Building2, Calendar, Wallet, CreditCard, Cpu, Maximize2, Download, ShieldCheck, MapPin } from 'lucide-react';
import { Profile } from '../types';
import QRCode from 'react-qr-code';

export const WorkerProfile = () => {
  const { user, setUser } = useAuth();
  const { updateUser, users, attendance } = useData();
  const [showIdCard, setShowIdCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zoomQr, setZoomQr] = useState(false); 
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

  const handleEditClick = () => {
    setFormData({
      full_name: user.full_name,
      avatar_url: user.avatar_url
    });
    setIsEditing(true);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative overflow-hidden">
      
      {/* Cover Photo */}
      <div className={`h-48 relative overflow-hidden ${isSupervisor ? 'bg-gradient-to-r from-purple-600 to-indigo-800' : 'bg-gradient-to-r from-emerald-600 to-teal-800'}`}>
         <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-3xl -ml-10 -mb-10"></div>
      </div>

      <div className="px-4 relative -mt-16 z-10">
         
         {/* Profile Card */}
         <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center text-center">
            <div className="relative -mt-20 mb-3">
               <img 
                  src={user.avatar_url || "https://picsum.photos/120"} 
                  alt="Profile" 
                  className={`w-32 h-32 rounded-full border-[6px] border-white dark:border-slate-900 shadow-lg object-cover bg-slate-200`}
               />
               <button 
                  onClick={handleEditClick}
                  className="absolute bottom-1 right-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-md hover:scale-110 transition-transform"
               >
                  <Edit2 size={14}/>
               </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
               {user.full_name}
               {user.is_verified && <ShieldCheck size={20} className="text-blue-500 fill-blue-50" />}
            </h2>
            
            <div className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
               {isSupervisor ? <Briefcase size={12}/> : <User size={12}/>}
               {isSupervisor ? user.designation : user.skill_type}
            </div>

            <div className="mt-4 w-full flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
               <div className="flex items-center gap-1">
                  <Building2 size={14}/>
                  <span>{companyName}</span>
               </div>
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
               <div className="flex items-center gap-1 font-mono font-bold">
                  <Phone size={14}/>
                  <span>{user.phone}</span>
               </div>
            </div>
         </div>

         {/* Glass Stats Grid */}
         <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm flex flex-col items-center gap-1">
               <div className={`p-2.5 rounded-full mb-1 ${isSupervisor ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                  <Calendar size={20} />
               </div>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalWorkDays}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট কাজের দিন</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm flex flex-col items-center gap-1">
               <div className={`p-2.5 rounded-full mb-1 ${isSupervisor ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                  <Wallet size={20} />
               </div>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">৳ {(totalEarned/1000).toFixed(1)}k</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">সর্বমোট আয়</p>
            </div>
         </div>

         {/* Digital ID Section */}
         <button 
            onClick={() => setShowIdCard(!showIdCard)}
            className={`w-full mt-4 p-1 rounded-2xl bg-gradient-to-r ${isSupervisor ? 'from-purple-500 via-indigo-500 to-purple-500' : 'from-emerald-500 via-teal-500 to-emerald-500'} p-[2px] active:scale-[0.98] transition-transform shadow-lg group`}
         >
            <div className="bg-white dark:bg-slate-900 rounded-[14px] p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                     <CreditCard size={24} />
                  </div>
                  <div className="text-left">
                     <p className="font-bold text-slate-800 dark:text-white text-sm">স্মার্ট আইডি কার্ড</p>
                     <p className="text-[10px] text-slate-500 dark:text-slate-400">{showIdCard ? 'বন্ধ করতে ট্যাপ করুন' : 'দেখতে ট্যাপ করুন'}</p>
                  </div>
               </div>
               <div className={`transition-transform duration-300 ${showIdCard ? 'rotate-180' : ''}`}>
                  {showIdCard ? <X size={20} className="text-slate-400"/> : <QrCode size={20} className="text-slate-400"/>}
               </div>
            </div>
         </button>

         {/* ID Card Display */}
         {showIdCard && (
            <div className="mt-4 animate-scale-up perspective-1000">
               <div className={`relative rounded-2xl overflow-hidden aspect-[1.58/1] shadow-2xl transition-transform transform hover:scale-[1.02] ${isSupervisor ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900'}`}>
                  
                  {/* Holographic/Shiny Effects */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-pulse-slow pointer-events-none"></div>

                  <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                           <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
                              <Building2 size={16} className="text-white"/>
                           </div>
                           <div>
                              <p className="font-bold text-xs uppercase tracking-widest opacity-80">Project Khata</p>
                              <p className="text-[10px] font-bold truncate max-w-[120px]">{companyName}</p>
                           </div>
                        </div>
                        <Cpu size={24} className="text-yellow-400 opacity-80" />
                     </div>

                     <div className="flex items-center gap-4 mt-2">
                        <div 
                           className="bg-white p-1 rounded-lg shadow-lg cursor-pointer"
                           onClick={() => setZoomQr(true)}
                        >
                           <QRCode 
                              id="worker-qr-code" 
                              size={64} 
                              value={user.id} 
                              viewBox={`0 0 256 256`} 
                              style={{ width: '64px', height: '64px' }}
                           />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold leading-tight">{user.full_name}</h3>
                           <p className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{isSupervisor ? user.designation : user.skill_type}</p>
                           <div className="inline-block bg-white/10 px-2 py-0.5 rounded text-[9px] font-mono mt-2 border border-white/10">
                              ID: {user.id.slice(0, 8)}
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-between items-end mt-auto pt-2 border-t border-white/10">
                        <div>
                           <p className="text-[8px] opacity-60 uppercase tracking-wide">Emergency</p>
                           <p className="text-xs font-mono font-bold tracking-wide">{user.phone}</p>
                        </div>
                        <img src={user.avatar_url} className="w-8 h-8 rounded-full border border-white/30 object-cover" />
                     </div>
                  </div>
               </div>
               
               <button 
                  onClick={downloadQrCode}
                  className="w-full mt-3 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
               >
                  <Download size={16} /> QR কোড ডাউনলোড করুন
               </button>
            </div>
         )}
      </div>

      {/* Improved Fullscreen Zoom QR Modal */}
      {zoomQr && (
        <div className="fixed inset-0 z-[80] bg-slate-950/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setZoomQr(false)}>
           <button 
              onClick={() => setZoomQr(false)} 
              className="absolute top-6 right-6 text-white/80 p-3 rounded-full hover:bg-white/10 transition-colors z-50"
           >
              <X size={32} />
           </button>
           
           <div className="relative animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white p-2 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                 <div className="bg-white p-6 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                    <QRCode size={280} value={user.id} viewBox={`0 0 256 256`} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                 </div>
              </div>
              <div className="text-center mt-6">
                 <p className="text-white text-lg font-bold">{user.full_name}</p>
                 <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-1">ID: {user.id.slice(0,8)}</p>
                 <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-xs font-bold backdrop-blur-sm border border-white/10">
                    <QrCode size={14} /> Scan Me
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditing(false)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">প্রোফাইল এডিট</h3>
                <button onClick={() => setIsEditing(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
             </div>

             <form onSubmit={saveProfile} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                   <div className="relative group" onClick={() => fileInputRef.current?.click()}>
                      <img src={formData.avatar_url} className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover" alt="Profile" />
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
                   <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase">ছবি পরিবর্তন</p>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">আপনার নাম</label>
                   <div className="relative">
                      <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                      <input 
                        name="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                        required
                      />
                   </div>
                </div>
                
                <div className={`p-4 rounded-xl flex gap-3 items-start ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'}`}>
                   <Briefcase size={16} className="mt-0.5 shrink-0" />
                   <p className="text-xs leading-relaxed font-medium">
                      মোবাইল নাম্বার, পদবী বা বেতনের তথ্য পরিবর্তন করতে অনুগ্রহ করে ঠিকাদারের সাথে যোগাযোগ করুন।
                   </p>
                </div>

                <button 
                  type="submit" 
                  className={`w-full py-4 text-white rounded-xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-95 transition-all ${isSupervisor ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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