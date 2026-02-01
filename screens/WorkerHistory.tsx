import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { Calendar, DollarSign, Clock, Building2, ChevronLeft, ChevronRight, XCircle, Wallet, UserCheck, CheckCircle } from 'lucide-react';

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
       <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-2 shadow-sm sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h1 className="font-bold text-lg text-slate-800 dark:text-white">কাজের ইতিহাস</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                   <Building2 size={12} className="text-blue-500"/> 
                   <span className="font-medium">{companyName}</span>
                </p>
             </div>
             <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                {cycleInfo.subLabel}
             </span>
          </div>
          
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 mb-2">
             <button onClick={handlePrev} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300"><ChevronLeft size={20}/></button>
             <div className="text-center">
                <p className="font-bold text-slate-800 dark:text-white text-sm">{cycleInfo.label}</p>
             </div>
             <button onClick={handleNext} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300"><ChevronRight size={20}/></button>
          </div>
       </div>

       <div className="px-4 mt-4 space-y-5">
          
          {/* Cycle Summary Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-center mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">সারাংশ</h3>
                <div className="text-right">
                   <span className="text-[10px] text-slate-400 block mb-0.5">মোট বকেয়া</span>
                   <span className={`text-sm font-bold ${user.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      ৳ {user.balance.toLocaleString()}
                   </span>
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                   <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{cycleWorkDays}</p>
                   <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">দিন কাজ</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center">
                   <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">৳{Math.round(cycleEarnings / 1000)}k</p>
                   <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">আয়</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-center">
                   <p className="text-xl font-bold text-purple-600 dark:text-purple-400">৳{Math.round(cycleReceived / 1000)}k</p>
                   <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">রিসিভ</p>
                </div>
             </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('attendance')}
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
             >
                <UserCheck size={14} /> হাজিরা
             </button>
             <button 
               onClick={() => setActiveTab('payment')}
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'payment' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
             >
                <Wallet size={14} /> পেমেন্ট
             </button>
          </div>

          {/* List Content */}
          <div className="space-y-3 pb-4">
             {activeTab === 'attendance' ? (
                filteredAttendance.length === 0 ? (
                   <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full text-slate-300 dark:text-slate-600">
                         <Clock size={32} />
                      </div>
                      <p className="text-slate-400 text-xs font-bold">এই সময়ে কোন হাজিরা নেই</p>
                   </div>
                ) : (
                   filteredAttendance.map((record) => (
                      <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center min-w-[50px]">
                               <p className="text-lg font-bold text-slate-800 dark:text-white leading-none">{new Date(record.date).getDate()}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{new Date(record.date).toLocaleDateString('en-US', {month: 'short'})}</p>
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 dark:text-white text-sm mb-0.5">{getProjectName(record.project_id)}</p>
                               <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                     record.status === 'P' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                     record.status === 'H' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                     {record.status === 'P' ? 'ফুল ডে' : record.status === 'H' ? 'হাফ ডে' : 'অনুপস্থিত'}
                                  </span>
                                  {record.overtime && record.overtime > 0 ? (
                                     <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                                        <Clock size={10} /> {record.overtime}h OT
                                     </span>
                                  ) : null}
                               </div>
                            </div>
                         </div>
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-300">৳{record.amount}</p>
                      </div>
                   ))
                )
             ) : (
                filteredPayments.length === 0 ? (
                   <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full text-slate-300 dark:text-slate-600">
                         <Wallet size={32} />
                      </div>
                      <p className="text-slate-400 text-xs font-bold">এই সময়ে কোন পেমেন্ট পাননি</p>
                   </div>
                ) : (
                   filteredPayments.map((tx) => (
                      <div key={tx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm border-l-4 border-l-emerald-500">
                         <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-full text-emerald-600 dark:text-emerald-400">
                               <CheckCircle size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 dark:text-white text-sm">{tx.description}</p>
                               <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{new Date(tx.date).toLocaleDateString('bn-BD', {day:'numeric', month:'long', year:'numeric'})}</p>
                            </div>
                         </div>
                         <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">+ ৳{tx.amount.toLocaleString()}</span>
                      </div>
                   ))
                )
             )}
          </div>
       </div>
    </div>
  );
};