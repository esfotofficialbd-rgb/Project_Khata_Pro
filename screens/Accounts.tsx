import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter, Wallet } from 'lucide-react';

export const Accounts = () => {
  const { transactions, projects, appSettings } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [timeFilter, setTimeFilter] = useState<'all_time' | 'current_cycle'>('current_cycle');

  // Logic to determine Current Cycle Date Range
  const cycleRange = useMemo(() => {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    if (appSettings.calcMode === 'weekly') {
       const dayMap: Record<string, number> = { 
         'Saturday': 6, 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 
         'Wednesday': 3, 'Thursday': 4, 'Friday': 5 
       };
       const targetDay = dayMap[appSettings.weekStartDay] ?? 6; 
       const currentDay = today.getDay();
       const distance = (currentDay + 7 - targetDay) % 7;
       start.setDate(today.getDate() - distance);
       start.setHours(0,0,0,0);
       end.setTime(start.getTime());
       end.setDate(end.getDate() + 6);
       end.setHours(23,59,59,999);
    } else {
       const startDay = appSettings.monthStartDate || 1;
       if (today.getDate() < startDay) {
          start.setMonth(start.getMonth() - 1);
       }
       start.setDate(startDay);
       start.setHours(0,0,0,0);
       end.setMonth(start.getMonth() + 1);
       end.setDate(startDay - 1);
       end.setHours(23,59,59,999);
    }
    return { start, end };
  }, [appSettings]);

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    // 1. Time Filter
    if (timeFilter === 'current_cycle') {
       const d = new Date(t.date);
       if (d < cycleRange.start || d > cycleRange.end) return false;
    }
    
    // 2. Type Filter
    if (activeTab === 'all') return true;
    if (activeTab === 'income') return t.type === 'income';
    return t.type === 'expense' || t.type === 'salary';
  });

  // Calculate stats based on Filtered Data
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'salary').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Global Balance (Always All Time for the Cash Card)
  const globalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const globalExpense = transactions.filter(t => t.type === 'expense' || t.type === 'salary').reduce((sum, t) => sum + t.amount, 0);
  const globalBalance = globalIncome - globalExpense;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative font-sans">
      <div className="bg-white dark:bg-slate-900 p-4 sticky top-0 z-10 shadow-sm mb-4 border-b border-slate-100 dark:border-slate-800">
         <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">হিসাব খাতা</h1>
            {/* Time Filter Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
               <button 
                 onClick={() => setTimeFilter('current_cycle')}
                 className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${timeFilter === 'current_cycle' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
               >
                 চলতি {appSettings.calcMode === 'weekly' ? 'সপ্তাহ' : 'মাস'}
               </button>
               <button 
                 onClick={() => setTimeFilter('all_time')}
                 className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${timeFilter === 'all_time' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
               >
                 সব সময়
               </button>
            </div>
         </div>
         
         <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 rounded-[1.8rem] p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            {/* Overlay Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            
            <div className="relative z-10">
               <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {timeFilter === 'current_cycle' ? 'বর্তমান সাইকেল স্থিতি' : 'সর্বমোট অবশিষ্ট স্থিতি'}
               </p>
               <h2 className="text-4xl font-extrabold mb-5 tracking-tight">
                  ৳ {timeFilter === 'current_cycle' ? balance.toLocaleString() : globalBalance.toLocaleString()}
               </h2>
               
               <div className="flex gap-4 border-t border-blue-500/30 pt-4">
                  <div className="flex-1">
                     <p className="text-blue-200 text-[10px] font-bold flex items-center gap-1 uppercase mb-0.5">
                        <ArrowDownLeft size={12} className="text-emerald-400"/> মোট আয়
                     </p>
                     <p className="font-bold text-emerald-300 text-lg">৳ {totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 border-l border-blue-500/30 pl-4">
                     <p className="text-blue-200 text-[10px] font-bold flex items-center gap-1 uppercase mb-0.5">
                        <ArrowUpRight size={12} className="text-rose-400"/> মোট ব্যয়
                     </p>
                     <p className="font-bold text-rose-300 text-lg">৳ {totalExpense.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="px-4">
        {/* Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl mb-4">
          <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>সব</button>
          <button onClick={() => setActiveTab('income')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'income' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>আয়</button>
          <button onClick={() => setActiveTab('expense')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-slate-700 shadow text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>ব্যয়</button>
        </div>

        {/* List */}
        <div className="space-y-3">
           {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                 <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-2">
                    <Wallet size={24} className="opacity-50"/>
                 </div>
                 <p className="text-sm font-bold">কোন লেনদেন নেই</p>
                 {timeFilter === 'current_cycle' && <p className="text-[10px] mt-1 opacity-70">(চলতি সাইকেলে)</p>}
              </div>
           ) : (
              filteredTransactions.map(tx => (
                 <div key={tx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={20} strokeWidth={2.5}/> : <ArrowUpRight size={20} strokeWidth={2.5}/>}
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{tx.description}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                             <Calendar size={10}/> {tx.date}
                             {tx.project_id && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[100px] border border-slate-200 dark:border-slate-700">
                                   {projects.find(p => p.id === tx.project_id)?.project_name}
                                </span>
                             )}
                          </p>
                       </div>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                       {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                    </span>
                 </div>
              ))
           )}
        </div>
      </div>
    </div>
  );
};