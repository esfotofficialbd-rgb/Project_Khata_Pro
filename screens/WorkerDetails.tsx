import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Phone, Calendar, Briefcase, DollarSign, User, CheckCircle, Wallet, X, Edit2, Camera, Clock, MessageSquare, History, TrendingUp, Send } from 'lucide-react';
import { Profile } from '../types';

export const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, attendance, payWorker, updateUser, transactions } = useData();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'attendance' | 'payment'>('attendance');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [formData, setFormData] = useState<Partial<Profile>>({});

  const worker = users.find(u => u.id === id);
  
  if (!worker) {
    return <div className="p-10 text-center text-slate-500 font-bold">কর্মী পাওয়া যায়নি</div>;
  }

  // Calculate Stats
  const workerAttendance = attendance.filter(a => a.worker_id === id);
  const workerPayments = transactions.filter(t => t.related_user_id === id && t.type === 'salary');
  
  const totalDays = workerAttendance.filter(a => a.status === 'P' || a.status === 'H').length;
  const totalEarned = workerAttendance.reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = workerPayments.reduce((sum, t) => sum + t.amount, 0);

  const isSupervisor = worker.role === 'supervisor';

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount) {
      const amount = Number(payAmount);
      await payWorker(worker.id, amount);
      setIsPayModalOpen(false);
      
      // SMS Logic (Native Intent)
      const newBalance = worker.balance - amount;
      const message = `Project Khata: পেমেন্ট রিসিভড ৳${amount}। বর্তমান বকেয়া: ৳${newBalance}। ধন্যবাদ।`;
      
      // Check if user wants to send SMS
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedWorker = { ...worker, ...formData };
    updateUser(updatedWorker);
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
       
       {/* Header Design */}
       <div className={`relative h-48 ${isSupervisor ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}>
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
          
          <div className="flex items-center justify-between p-4 relative z-10 text-white">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <ArrowLeft size={22} />
             </button>
             <button onClick={openEditModal} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <Edit2 size={20} />
             </button>
          </div>
       </div>

       {/* Profile Details Card */}
       <div className="px-4 -mt-20 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 text-center">
             <img 
               src={worker.avatar_url || "https://picsum.photos/100"} 
               className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md bg-slate-200 mx-auto -mt-16 object-cover" 
             />
             
             <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-3">{worker.full_name}</h2>
             <div className="flex items-center justify-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isSupervisor ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                   {isSupervisor ? worker.designation : worker.skill_type}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                   {worker.payment_type === 'monthly' ? `৳${worker.monthly_salary}/মাস` : `৳${worker.daily_rate}/দিন`}
                </span>
             </div>

             {/* Quick Actions */}
             <div className="grid grid-cols-3 gap-3 mt-6">
                <a href={`tel:${worker.phone}`} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                   <Phone size={20} className="text-blue-500" />
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">কল করুন</span>
                </a>
                <a href={`sms:${worker.phone}`} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                   <MessageSquare size={20} className="text-orange-500" />
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">মেসেজ</span>
                </a>
                <button onClick={() => setIsPayModalOpen(true)} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                   <Wallet size={20} className="text-emerald-500" />
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">পেমেন্ট</span>
                </button>
             </div>
          </div>
       </div>

       {/* Financial Stats */}
       <div className="px-4 mt-4">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-5 text-white flex justify-between items-center shadow-lg shadow-slate-300 dark:shadow-none">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">বর্তমান বকেয়া</p>
                <p className={`text-3xl font-bold ${worker.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>৳ {worker.balance.toLocaleString()}</p>
             </div>
             <button 
                onClick={() => setIsPayModalOpen(true)}
                className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
             >
                পরিশোধ
             </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">মোট আয়</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">৳ {totalEarned.toLocaleString()}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">মোট পরিশোধ</p>
                <p className="text-lg font-bold text-emerald-600">৳ {totalPaid.toLocaleString()}</p>
             </div>
          </div>
       </div>

       {/* History Section with Tabs */}
       <div className="px-4 mt-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
            <button 
              onClick={() => setActiveHistoryTab('attendance')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeHistoryTab === 'attendance' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              হাজিরা ইতিহাস
            </button>
            <button 
              onClick={() => setActiveHistoryTab('payment')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeHistoryTab === 'payment' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              পেমেন্ট ইতিহাস
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
             {activeHistoryTab === 'attendance' ? (
                workerAttendance.length === 0 ? (
                    <div className="p-8 text-center">
                       <p className="text-slate-400 text-xs font-bold">কোন হাজিরা তথ্য নেই</p>
                    </div>
                 ) : (
                    workerAttendance.slice().reverse().slice(0, 10).map((record, idx) => (
                       <div key={record.id} className={`flex items-center justify-between p-4 ${idx !== workerAttendance.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                          <div className="flex items-center gap-3">
                             <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-xs flex flex-col items-center min-w-[50px]">
                                <span>{new Date(record.date).getDate()}</span>
                                <span className="text-[8px] uppercase">{new Date(record.date).toLocaleDateString('en-US', {month: 'short'})}</span>
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">
                                   {record.status === 'P' ? 'ফুল ডে' : 'হাফ ডে'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                   {record.overtime ? `+ ${record.overtime} ঘণ্টা OT` : 'কোন OT নেই'}
                                </p>
                             </div>
                          </div>
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-300">৳ {record.amount}</span>
                       </div>
                    ))
                 )
             ) : (
                workerPayments.length === 0 ? (
                    <div className="p-8 text-center">
                       <p className="text-slate-400 text-xs font-bold">কোন পেমেন্ট রেকর্ড নেই</p>
                    </div>
                 ) : (
                    workerPayments.slice().reverse().map((tx, idx) => (
                       <div key={tx.id} className={`flex items-center justify-between p-4 ${idx !== workerPayments.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                          <div className="flex items-center gap-3">
                             <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <Wallet size={18} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">{tx.description}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{tx.date}</p>
                             </div>
                          </div>
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">৳ {tx.amount.toLocaleString()}</span>
                       </div>
                    ))
                 )
             )}
          </div>
       </div>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Wallet className="text-emerald-600"/> পেমেন্ট করুন
                </h3>
                <button onClick={() => setIsPayModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl mb-6 text-center border border-emerald-100 dark:border-emerald-900/30">
                 <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">বর্তমান পাওনা</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white">৳ {worker.balance.toLocaleString()}</p>
              </div>

              <form onSubmit={handlePayment}>
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">টাকার পরিমাণ</label>
                 <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                    <input 
                      type="number" 
                      required
                      autoFocus
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-300"
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
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Edit2 size={18} className="text-blue-600"/> এডিট প্রোফাইল
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                 <div className="flex flex-col items-center mb-4">
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
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">নাম</label>
                    <div className="relative">
                       <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                       <input 
                         value={formData.full_name}
                         onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                         required
                       />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">মোবাইল</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                       <input 
                         value={formData.phone}
                         onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                         required
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">পদবী</label>
                       <div className="relative">
                          <Briefcase className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          {isSupervisor ? (
                             <input 
                               value={formData.designation}
                               onChange={(e) => setFormData({...formData, designation: e.target.value})}
                               className="w-full pl-9 pr-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                             />
                          ) : (
                             <select 
                               value={formData.skill_type}
                               onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
                               className="w-full pl-9 pr-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white appearance-none"
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
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{isSupervisor && worker.payment_type === 'monthly' ? 'বেতন (মাস)' : 'রেট (দিন)'}</label>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          <input 
                            type="number"
                            value={isSupervisor && worker.payment_type === 'monthly' ? formData.monthly_salary : formData.daily_rate}
                            onChange={(e) => isSupervisor && worker.payment_type === 'monthly' ? setFormData({...formData, monthly_salary: Number(e.target.value)}) : setFormData({...formData, daily_rate: Number(e.target.value)})}
                            className="w-full pl-9 pr-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                            required
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={18} />
                    আপডেট করুন
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};