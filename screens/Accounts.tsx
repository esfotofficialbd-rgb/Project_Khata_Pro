import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm mb-4">
         <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">হিসাব খাতা</h1>
            {/* Time Filter Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
               <button 
                 onClick={() => setTimeFilter('current_cycle')}
                 className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${timeFilter === 'current_cycle' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
               >
                 চলতি {appSettings.calcMode === 'weekly' ? 'সপ্তাহ' : 'মাস'}
               </button>
               <button 
                 onClick={() => setTimeFilter('all_time')}
                 className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${timeFilter === 'all_time' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
               >
                 সব সময়
               </button>
            </div>
         </div>
         
         <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg transition-all duration-300">
            <p className="text-gray-400 text-xs mb-1">
               {timeFilter === 'current_cycle' ? 'বর্তমান সাইকেল স্থিতি' : 'সর্বমোট অবশিষ্ট স্থিতি'}
            </p>
            <h2 className="text-3xl font-bold mb-4">
               ৳ {timeFilter === 'current_cycle' ? balance.toLocaleString() : globalBalance.toLocaleString()}
            </h2>
            
            <div className="flex gap-4 border-t border-gray-700 pt-3">
               <div className="flex-1">
                  <p className="text-gray-400 text-[10px] flex items-center gap-1">
                     <ArrowDownLeft size={12} className="text-green-500"/> মোট আয়
                  </p>
                  <p className="font-bold text-green-400">৳ {totalIncome.toLocaleString()}</p>
               </div>
               <div className="flex-1 border-l border-gray-700 pl-4">
                  <p className="text-gray-400 text-[10px] flex items-center gap-1">
                     <ArrowUpRight size={12} className="text-red-500"/> মোট ব্যয়
                  </p>
                  <p className="font-bold text-red-400">৳ {totalExpense.toLocaleString()}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="px-4">
        {/* Tabs */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-4">
          <button onClick={() => setActiveTab('all')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>সব</button>
          <button onClick={() => setActiveTab('income')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>আয়</button>
          <button onClick={() => setActiveTab('expense')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>ব্যয়</button>
        </div>

        {/* List */}
        <div className="space-y-3">
           {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                 <p className="text-sm">কোন লেনদেন নেই</p>
                 {timeFilter === 'current_cycle' && <p className="text-xs mt-1">(চলতি সাইকেলে)</p>}
              </div>
           ) : (
              filteredTransactions.map(tx => (
                 <div key={tx.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                       </div>
                       <div>
                          <p className="font-bold text-gray-800 text-sm">{tx.description}</p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                             <Calendar size={10}/> {tx.date}
                             {tx.project_id && (
                                <span className="bg-gray-100 px-1 rounded text-[9px] truncate max-w-[100px]">
                                   {projects.find(p => p.id === tx.project_id)?.project_name}
                                </span>
                             )}
                          </p>
                       </div>
                    </div>
                    <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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