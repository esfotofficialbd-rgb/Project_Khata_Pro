import React, { useState, useRef } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Award, Phone, QrCode, Edit2, X, Camera, CheckCircle, Briefcase, User, Building2, Calendar, Wallet, CreditCard, Cpu, Maximize2 } from 'lucide-react';
import { Profile } from '../types';
import QRCode from 'react-qr-code';

export const WorkerProfile = () => {
  const { user, setUser } = useAuth();
  const { updateUser, users, attendance } = useData();
  const [showIdCard, setShowIdCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [zoomQr, setZoomQr] = useState(false); // State for fullscreen QR
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
  const themeColor = isSupervisor ? 'purple' : 'emerald';

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

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Header Profile */}
      <div className="flex flex-col items-center pt-6 pb-6">
        <div className="relative mb-4">
          <img 
            src={user.avatar_url} 
            alt="Profile" 
            className={`w-28 h-28 rounded-full border-4 shadow-lg object-cover ${isSupervisor ? 'border-purple-100 dark:border-purple-900' : 'border-emerald-100 dark:border-emerald-900'}`} 
          />
          <button 
             onClick={handleEditClick}
             className="absolute bottom-0 right-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-full border-4 border-white dark:border-slate-950 shadow-md"
          >
             <Edit2 size={14}/>
          </button>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
           {user.full_name}
           {user.is_verified && <Award size={18} className="text-blue-500" />}
        </h2>
        
        <div className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${isSupervisor ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
           {isSupervisor ? <Briefcase size={12}/> : <User size={12}/>}
           {isSupervisor ? user.designation : user.skill_type}
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 flex items-center gap-1">
           <Building2 size={12}/> {companyName}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-1">
            <div className={`p-2 rounded-full mb-1 ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
               <Calendar size={18} />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{totalWorkDays}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">মোট কাজ</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-1">
            <div className={`p-2 rounded-full mb-1 ${isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
               <Wallet size={18} />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">৳ {(totalEarned/1000).toFixed(1)}k</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">মোট আয়</p>
         </div>
      </div>

      {/* Contact & ID Actions */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-600 dark:text-slate-400">
                 <Phone size={18} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">মোবাইল</p>
                 <p className="font-bold text-slate-800 dark:text-white">{user.phone}</p>
              </div>
           </div>
        </div>

        <button 
          onClick={() => setShowIdCard(!showIdCard)}
          className={`w-full flex items-center justify-between p-4 text-white rounded-2xl shadow-lg mt-4 active:scale-[0.98] transition-transform ${isSupervisor ? 'bg-purple-600 shadow-purple-200 dark:shadow-none' : 'bg-emerald-600 shadow-emerald-200 dark:shadow-none'}`}
        >
          <div className="flex items-center gap-3">
             <CreditCard size={20} />
             <span className="font-bold text-sm">ডিজিটাল আইডি কার্ড দেখুন</span>
          </div>
          <QrCode size={20} />
        </button>

        {/* Realistic Smart Card UI */}
        {showIdCard && (
          <div className={`mt-4 rounded-2xl p-6 aspect-[1.58/1] relative overflow-hidden shadow-2xl text-white ${isSupervisor ? 'bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900' : 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900'}`}>
             
             {/* Card Patterns */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

             <div className="relative h-full flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2">
                      <Building2 size={16} className="opacity-80"/>
                      <span className="font-bold text-sm tracking-wider uppercase opacity-90">{companyName}</span>
                   </div>
                   <img src="/logo_placeholder.png" className="h-6 opacity-0" /> {/* Placeholder for logo */}
                </div>

                <div className="flex gap-4 items-center">
                   <div 
                      className="bg-white p-1 rounded-lg cursor-pointer hover:scale-105 transition-transform relative group"
                      onClick={() => setZoomQr(true)}
                      title="বড় করে দেখতে ক্লিক করুন"
                   >
                      <div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
                        <QRCode size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={user.id} viewBox={`0 0 256 256`} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                         <Maximize2 size={16} className="text-slate-800"/>
                      </div>
                   </div>
                   <div>
                      <h3 className="font-bold text-lg leading-tight">{user.full_name}</h3>
                      <p className="text-xs opacity-75 uppercase tracking-wider mt-0.5">{isSupervisor ? user.designation : user.skill_type}</p>
                      <div className="mt-2 flex items-center gap-2">
                         <Cpu size={24} className="text-yellow-400 opacity-80" />
                         <span className="text-[10px] font-mono opacity-60">{user.id.slice(0, 8)}...</span>
                      </div>
                   </div>
                </div>

                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[8px] opacity-60 uppercase">Phone</p>
                      <p className="text-xs font-mono font-bold tracking-wide">{user.phone}</p>
                   </div>
                   <p className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">OFFICIAL ID</p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Fullscreen Zoom QR Modal */}
      {zoomQr && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in zoom-in duration-300" onClick={() => setZoomQr(false)}>
           <button 
              onClick={() => setZoomQr(false)} 
              className="absolute top-6 right-6 text-white/80 p-3 rounded-full hover:bg-white/10 transition-colors"
           >
              <X size={32} />
           </button>
           
           <div className="bg-white p-6 rounded-3xl max-w-sm w-full aspect-square flex flex-col items-center justify-center relative shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div style={{ height: "auto", margin: "0 auto", maxWidth: "100%", width: "100%" }}>
                <QRCode size={1024} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={user.id} viewBox={`0 0 256 256`} />
              </div>
              <p className="text-slate-500 font-bold text-xs mt-4 uppercase tracking-widest">{user.full_name}</p>
           </div>
           <p className="text-white/70 text-sm font-bold mt-8 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">বন্ধ করতে স্ক্রিনে ট্যাপ করুন</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
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
                  className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-95 transition-all ${isSupervisor ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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