import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Calendar, DollarSign, Clock, Building2, ChevronLeft, ChevronRight, XCircle, Wallet, UserCheck, CheckCircle, TrendingUp, Filter } from 'lucide-react';

export const WorkerHistory = () => {
  const { user } = useAuth();
  const { attendance, transactions, users, projects, appSettings } = useData();
  
  const [viewDate, setViewDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'attendance' | 'payment'>('attendance');

  if (!user) return null;

  const contractor = users.find(u => u.role === 'contractor');
  const companyName = contractor?.company_name || 'Project Khata';

  // --- Cycle Calculation Logic ---
  const cycleInfo = useMemo(() => {
    const start = new Date(viewDate);
    const end = new Date(viewDate);
    let label = '';
    let subLabel = '';

    if (appSettings.calcMode === 'weekly') {
       const dayMap: Record<string, number> = { 
         'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 
         'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 
       };
       const targetDay = dayMap[appSettings.weekStartDay] ?? 6; 
       
       const currentDay = start.getDay();
       const distance = (currentDay + 7 - targetDay) % 7;
       
       start.setDate(start.getDate() - distance);
       start.setHours(0,0,0,0);
       
       end.setTime(start.getTime());
       end.setDate(end.getDate() + 6);
       end.setHours(23,59,59,999);
       
       label = `${start.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})}`;
       subLabel = 'সাপ্তাহিক';
    } else {
       const startDay = appSettings.monthStartDate || 1;
       
       if (viewDate.getDate() < startDay) {
          start.setMonth(start.getMonth() - 1);
       }
       start.setDate(startDay);
       start.setHours(0,0,0,0);
       
       end.setMonth(start.getMonth() + 1);
       end.setDate(startDay - 1);
       end.setHours(23,59,59,999);
       
       if (startDay === 1) {
         label = start.toLocaleDateString('bn-BD', {month:'long', year:'numeric'});
       } else {
         label = `${start.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})}`;
       }
       subLabel = 'মাসিক';
    }
    return { start, end, label, subLabel };
  }, [viewDate, appSettings]);

  // --- Filtering Data ---
  const filteredAttendance = useMemo(() => {
     return attendance
       .filter(a => {
          const d = new Date(a.date);
          return a.worker_id === user.id && d >= cycleInfo.start && d <= cycleInfo.end;
       })
       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, user.id, cycleInfo]);

  const filteredPayments = useMemo(() => {
     return transactions
       .filter(t => {
          const d = new Date(t.date);
          return t.related_user_id === user.id && t.type === 'salary' && d >= cycleInfo.start && d <= cycleInfo.end;
       })
       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user.id, cycleInfo]);

  // --- Summaries ---
  const cycleWorkDays = filteredAttendance.filter(a => a.status === 'P' || a.status === 'H').length;
  const cycleEarnings = filteredAttendance.reduce((sum, a) => sum + a.amount, 0);
  const cycleReceived = filteredPayments.reduce((sum, t) => sum + t.amount, 0);

  const getProjectName = (id: string) => {
     const p = projects.find(proj => proj.id === id);
     return p ? p.project_name : 'অজানা প্রজেক্ট';
  };

  const handlePrev = () => {
     const d = new Date(viewDate);
     if (appSettings.calcMode === 'weekly') d.setDate(d.getDate() - 7);
     else d.setMonth(d.getMonth() - 1);
     setViewDate(d);
  };

  const handleNext = () => {
     const d = new Date(viewDate);
     if (appSettings.calcMode === 'weekly') d.setDate(d.getDate() + 7);
     else d.setMonth(d.getMonth() + 1);
     setViewDate(d);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
       {/* Sticky Header with Cycle Navigator */}
       <div className="bg-white dark:bg-slate-900 px-5 pt-5 pb-3 shadow-sm sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 rounded-b-[2rem]">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h1 className="font-bold text-xl text-slate-800 dark:text-white">কাজের ইতিহাস</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                   <Building2 size={12} className="text-emerald-500"/> 
                   <span>{companyName}</span>
                </p>
             </div>
             <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <Filter size={10} />
                {cycleInfo.subLabel}
             </span>
          </div>
          
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-2">
             <button onClick={handlePrev} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300 active:scale-95"><ChevronLeft size={20}/></button>
             <div className="text-center">
                <p className="font-bold text-slate-800 dark:text-white text-sm">{cycleInfo.label}</p>
             </div>
             <button onClick={handleNext} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300 active:scale-95"><ChevronRight size={20}/></button>
          </div>
       </div>

       <div className="px-5 mt-5 space-y-6">
          
          {/* Cycle Summary Card - Premium Design */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">সাইকেল সারাংশ</h3>
                <div className="text-right">
                   <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase">মোট বকেয়া</span>
                   <span className={`text-base font-extrabold ${user.balance > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                      ৳ {user.balance.toLocaleString()}
                   </span>
                </div>
             </div>
             
             <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-[1.2rem] text-center border border-blue-100 dark:border-blue-900/20">
                   <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cycleWorkDays}</p>
                   <p className="text-[9px] text-blue-400 font-bold uppercase mt-1 tracking-wide">দিন কাজ</p>
                </div>
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-[1.2rem] text-center border border-emerald-100 dark:border-emerald-900/20">
                   <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">৳{Math.round(cycleEarnings / 1000)}k</p>
                   <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1 tracking-wide">আয়</p>
                </div>
                <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-[1.2rem] text-center border border-purple-100 dark:border-purple-900/20">
                   <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">৳{Math.round(cycleReceived / 1000)}k</p>
                   <p className="text-[9px] text-purple-400 font-bold uppercase mt-1 tracking-wide">রিসিভ</p>
                </div>
             </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
             <button 
               onClick={() => setActiveTab('attendance')}
               className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
                <UserCheck size={16} /> হাজিরা
             </button>
             <button 
               onClick={() => setActiveTab('payment')}
               className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'payment' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
             >
                <Wallet size={16} /> পেমেন্ট
             </button>
          </div>

          {/* List Content */}
          <div className="space-y-3 pb-4">
             {activeTab === 'attendance' ? (
                filteredAttendance.length === 0 ? (
                   <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-full text-slate-300 dark:text-slate-600 mb-2">
                         <Clock size={32} />
                      </div>
                      <p className="text-slate-400 text-xs font-bold">এই সময়ে কোন হাজিরা নেই</p>
                   </div>
                ) : (
                   filteredAttendance.map((record) => (
                      <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform">
                         <div className="flex items-center gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center min-w-[60px] border border-slate-100 dark:border-slate-700">
                               <p className="text-xl font-bold text-slate-800 dark:text-white leading-none">{new Date(record.date).getDate()}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">{new Date(record.date).toLocaleDateString('en-US', {month: 'short'})}</p>
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{getProjectName(record.project_id)}</p>
                               <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                     record.status === 'P' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' : 
                                     record.status === 'H' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                                  }`}>
                                     {record.status === 'P' ? 'ফুল ডে' : record.status === 'H' ? 'হাফ ডে' : 'অনুপস্থিত'}
                                  </span>
                                  {record.overtime && record.overtime > 0 ? (
                                     <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-800">
                                        <Clock size={10} /> +{record.overtime}h
                                     </span>
                                  ) : null}
                               </div>
                            </div>
                         </div>
                         <p className="text-base font-bold text-slate-700 dark:text-slate-300">৳{record.amount}</p>
                      </div>
                   ))
                )
             ) : (
                filteredPayments.length === 0 ? (
                   <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-full text-slate-300 dark:text-slate-600 mb-2">
                         <Wallet size={32} />
                      </div>
                      <p className="text-slate-400 text-xs font-bold">এই সময়ে কোন পেমেন্ট পাননি</p>
                   </div>
                ) : (
                   filteredPayments.map((tx) => (
                      <div key={tx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm border-l-4 border-l-emerald-500 active:scale-[0.99] transition-transform">
                         <div className="flex items-center gap-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                               <CheckCircle size={24} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 dark:text-white text-sm">{tx.description}</p>
                               <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{new Date(tx.date).toLocaleDateString('bn-BD', {day:'numeric', month:'long', year:'numeric'})}</p>
                            </div>
                         </div>
                         <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">+ ৳{tx.amount.toLocaleString()}</span>
                      </div>
                   ))
                )
             )}
          </div>
       </div>
    </div>
  );
};