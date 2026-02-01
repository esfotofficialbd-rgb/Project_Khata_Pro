import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Clock, Building2, ChevronLeft, ChevronRight, XCircle, Wallet, Filter } from 'lucide-react';

export const WorkerHistory = () => {
  const { user } = useAuth();
  const { attendance, transactions, users, projects, appSettings } = useData();
  
  // View Anchor Date (Initialized to Today)
  const [viewDate, setViewDate] = useState(new Date());

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
       // Map day name to index (Sun=0, Mon=1...Sat=6)
       const dayMap: Record<string, number> = { 
         'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 
         'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 
       };
       const targetDay = dayMap[appSettings.weekStartDay] ?? 6; // Default Saturday
       
       const currentDay = start.getDay();
       // Calculate days to subtract to reach the start of the week
       // (currentDay + 7 - targetDay) % 7 handles wrap around correctly
       const distance = (currentDay + 7 - targetDay) % 7;
       
       start.setDate(start.getDate() - distance);
       start.setHours(0,0,0,0);
       
       end.setTime(start.getTime());
       end.setDate(end.getDate() + 6);
       end.setHours(23,59,59,999);
       
       label = `${start.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})}`;
       subLabel = 'সাপ্তাহিক হিসাব';
    } else {
       const startDay = appSettings.monthStartDate || 1;
       
       // If viewDate's day is before startDay, it belongs to the previous month's cycle
       if (viewDate.getDate() < startDay) {
          start.setMonth(start.getMonth() - 1);
       }
       start.setDate(startDay);
       start.setHours(0,0,0,0);
       
       end.setMonth(start.getMonth() + 1);
       end.setDate(startDay - 1);
       end.setHours(23,59,59,999);
       
       // Label formatting
       if (startDay === 1) {
         label = start.toLocaleDateString('bn-BD', {month:'long', year:'numeric'});
       } else {
         label = `${start.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})} - ${end.toLocaleDateString('bn-BD', {day:'numeric', month:'short'})}`;
       }
       subLabel = 'মাসিক হিসাব';
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

  // --- Navigation Handlers ---
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

  // Check if viewDate is in current cycle to disable 'Next' if desired (optional, not implemented to allow viewing future)
  
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
       {/* Header */}
       <div className="bg-white p-4 shadow-sm sticky top-0 z-10 mb-4">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h1 className="font-bold text-lg text-gray-800">কাজের ইতিহাস</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                   <Building2 size={12} className="text-blue-500"/> 
                   <span className="font-semibold text-gray-600">{companyName}</span>
                </p>
             </div>
             <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold border border-gray-200">
                {cycleInfo.subLabel}
             </span>
          </div>
          
          {/* Cycle Navigator */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
             <button onClick={handlePrev} className="p-2 hover:bg-white rounded-lg shadow-sm transition-all text-gray-600"><ChevronLeft size={20}/></button>
             <div className="text-center">
                <p className="font-bold text-gray-800 text-sm">{cycleInfo.label}</p>
             </div>
             <button onClick={handleNext} className="p-2 hover:bg-white rounded-lg shadow-sm transition-all text-gray-600"><ChevronRight size={20}/></button>
          </div>
       </div>

       <div className="px-4 space-y-6">
          
          {/* Cycle Summary */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <h3 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-50 pb-2">
                সাইকেল সারাংশ
             </h3>
             <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                   <p className="text-xl font-bold text-blue-600">{cycleWorkDays}</p>
                   <p className="text-[10px] text-gray-500 font-bold">কাজের দিন</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg text-center">
                   <p className="text-xl font-bold text-green-600">৳{Math.round(cycleEarnings / 1000)}k</p>
                   <p className="text-[10px] text-gray-500 font-bold">মোট আয়</p>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg text-center">
                   <p className="text-xl font-bold text-purple-600">৳{Math.round(cycleReceived / 1000)}k</p>
                   <p className="text-[10px] text-gray-500 font-bold">পেমেন্ট রিসিভ</p>
                </div>
             </div>
             
             <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">বর্তমান মোট বকেয়া:</span>
                <span className={`text-sm font-bold ${user.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                   ৳ {user.balance.toLocaleString()}
                </span>
             </div>
          </div>

          {/* Attendance Log */}
          <div>
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Clock size={16} className="text-orange-500" /> হাজিরা বিবরণী
             </h3>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredAttendance.length === 0 ? (
                   <div className="p-8 text-center flex flex-col items-center gap-2">
                      <XCircle size={32} className="text-gray-200" />
                      <p className="text-gray-400 text-xs">এই সাইকেলে কোন হাজিরা নেই</p>
                   </div>
                ) : (
                   filteredAttendance.map((record) => (
                      <div key={record.id} className="p-3 border-b border-gray-50 flex items-center justify-between last:border-none hover:bg-gray-50 transition-colors">
                         <div>
                            <p className="font-bold text-gray-800 text-sm">{record.date}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                               <Building2 size={10}/> {getProjectName(record.project_id)}
                            </p>
                         </div>
                         <div className="text-right">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                record.status === 'P' ? 'bg-green-100 text-green-700' : 
                                record.status === 'H' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                             }`}>
                                {record.status === 'P' ? 'উপস্থিত' : record.status === 'H' ? 'হাফ-ডে' : 'অনুপস্থিত'}
                             </span>
                             <p className="text-xs font-bold text-gray-700 mt-1">৳{record.amount}</p>
                             {record.overtime && record.overtime > 0 ? (
                                <p className="text-[9px] text-purple-600 font-bold">+OT ({record.overtime}h)</p>
                             ) : null}
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>

          {/* Payment Log */}
          <div>
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <DollarSign size={16} className="text-green-500" /> পেমেন্ট বিবরণী
             </h3>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredPayments.length === 0 ? (
                   <div className="p-8 text-center flex flex-col items-center gap-2">
                      <Wallet size={32} className="text-gray-200" />
                      <p className="text-gray-400 text-xs">এই সাইকেলে কোন পেমেন্ট পাননি</p>
                   </div>
                ) : (
                   filteredPayments.map((tx) => (
                      <div key={tx.id} className="p-3 border-b border-gray-50 flex items-center justify-between last:border-none hover:bg-gray-50 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="bg-green-50 p-2 rounded-full text-green-600">
                               <Wallet size={16} />
                            </div>
                            <div>
                               <p className="font-bold text-gray-800 text-sm">{tx.description}</p>
                               <p className="text-[10px] text-gray-500 mt-0.5">{tx.date}</p>
                            </div>
                         </div>
                         <span className="font-bold text-green-600 text-sm">+ ৳{tx.amount.toLocaleString()}</span>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
};