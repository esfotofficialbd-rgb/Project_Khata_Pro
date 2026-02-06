import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Hammer, PlusCircle, DollarSign, FileText, CreditCard, Wallet, X, CheckCircle, ArrowDownLeft, ArrowUpRight, TrendingUp, Sun, Loader2, ArrowRight, MoreHorizontal, PieChart, ChevronRight, Activity, Building2, Zap, Clock, Package, MapPin, UserPlus, Sparkles, AlertCircle, Search, Check, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { Transaction } from '../types';
import { useAuth } from '../context/SessionContext';

// --- CUSTOM SELECTOR COMPONENT ---
interface SelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { value: string; label: string; sub?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon?: React.ElementType;
}

const SelectorSheet = ({ isOpen, onClose, title, options, selectedValue, onSelect, icon: Icon }: SelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.sub && opt.sub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {Icon && <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600"><Icon size={20}/></div>}
                        {title}
                    </h3>
                    <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="খুঁজুন..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                        autoFocus
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar space-y-2">
                {filteredOptions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">কোন তথ্য পাওয়া যায়নি</div>
                ) : (
                    filteredOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onSelect(opt.value); onClose(); setSearchTerm(''); }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                                selectedValue === opt.value 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/20' 
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="text-left">
                                <p className={`font-bold text-sm ${selectedValue === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>
                                    {opt.label}
                                </p>
                                {opt.sub && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{opt.sub}</p>
                                )}
                            </div>
                            {selectedValue === opt.value && (
                                <div className="bg-blue-500 text-white p-1 rounded-full">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export const ContractorDashboard = () => {
  const { user } = useAuth();
  const { projects, users, getDailyStats, transactions, attendance, addTransaction, payWorker, getWorkerBalance, workReports, materialLogs, t, isLoadingData } = useData();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const stats = getDailyStats(today);

  // Greeting Logic
  const [greeting, setGreeting] = useState('');
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting('শুভ রাত্রি');
    else if (hour < 12) setGreeting('শুভ সকাল');
    else if (hour < 17) setGreeting('শুভ দুপুর');
    else setGreeting('শুভ সন্ধ্যা');
  }, []);

  // Time & Date Strings
  const timeString = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  const dateString = new Date().toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', month: 'long' });

  const activeWorkers = users.filter(u => u.role === 'worker').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const workers = users.filter(u => u.role === 'worker' || u.role === 'supervisor');

  // --- SMART FEED LOGIC (ENHANCED) ---
  const carouselItems = useMemo(() => {
     let items: any[] = [];

     // 1. Specific High Due Alert
     const highDueWorker = users.find(u => u.balance > 3000);
     if (highDueWorker) {
        items.push({
            id: 'due-alert-high',
            title: 'পেমেন্ট বকেয়া',
            desc: `${highDueWorker.full_name}-এর বকেয়া ৳${highDueWorker.balance.toLocaleString()} ছাড়িয়ে গেছে।`,
            icon: Wallet,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-900/30',
            border: 'border-rose-100 dark:border-rose-800'
        });
     } else if (stats.totalDue > 10000) {
        items.push({
            id: 'due-alert-total',
            title: 'মোট বকেয়া অ্যালার্ট',
            desc: `মোট বকেয়া বেতন: ৳${stats.totalDue.toLocaleString()} (সকল কর্মী)`,
            icon: Wallet,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            border: 'border-amber-100 dark:border-amber-800'
        });
     }

     // 2. Today's Expense Breakdown
     if(stats.totalExpense > 0) {
        const laborCost = attendance.filter(a => a.date === today).reduce((sum, a) => sum + a.amount, 0);
        const materialCost = stats.totalExpense - laborCost;
        
        items.push({
            id: 'daily-expense',
            title: 'আজকের হিসাব',
            desc: `লেবার: ৳${laborCost.toLocaleString()} | ম্যাটেরিয়াল: ৳${materialCost.toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            border: 'border-blue-100 dark:border-blue-800'
        });
     }

     // 3. Active Site Highlight
     const activeProjs = projects.filter(p => p.status === 'active');
     if (activeProjs.length > 0) {
         let topProject = activeProjs[0];
         let maxWorkers = 0;
         
         activeProjs.forEach(p => {
             const count = attendance.filter(a => a.project_id === p.id && a.date === today).length;
             if(count > maxWorkers) {
                 maxWorkers = count;
                 topProject = p;
             }
         });

         if (maxWorkers > 0) {
             items.push({
                id: 'site-update',
                title: 'সাইট আপডেট',
                desc: `${topProject.project_name}-এ আজ সবচেয়ে বেশি (${maxWorkers} জন) কর্মী আছে।`,
                icon: Hammer,
                color: 'text-purple-600 dark:text-purple-400',
                bg: 'bg-purple-50 dark:bg-purple-900/30',
                border: 'border-purple-100 dark:border-purple-800'
             });
         } else {
             // If no attendance yet (e.g. early morning)
             const currentHour = new Date().getHours();
             if (currentHour >= 9 && currentHour <= 12) {
                 items.push({
                    id: 'no-att-alert',
                    title: 'উপস্থিতি শূন্য',
                    desc: 'আজকের হাজিরা এখনো এন্ট্রি করা হয়নি। সুপারভাইজারকে কল দিন।',
                    icon: AlertCircle,
                    color: 'text-orange-600 dark:text-orange-400',
                    bg: 'bg-orange-50 dark:bg-orange-900/30',
                    border: 'border-orange-100 dark:border-orange-800'
                 });
             } else {
                 items.push({
                    id: 'proj-status',
                    title: 'প্রজেক্ট স্ট্যাটাস',
                    desc: `${activeProjs.length}টি প্রজেক্ট বর্তমানে চলমান আছে।`,
                    icon: Briefcase,
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                    border: 'border-emerald-100 dark:border-emerald-800'
                 });
             }
         }
     }

     // Fallback
     if(items.length === 0) {
         items.push({
             id: 'welcome',
             title: 'শুভ দিন',
             desc: 'আপনার প্রজেক্ট ম্যানেজমেন্ট ড্যাশবোর্ডে স্বাগতম।',
             icon: Sun,
             color: 'text-orange-600 dark:text-orange-400',
             bg: 'bg-orange-50 dark:bg-orange-900/30',
             border: 'border-orange-100 dark:border-orange-800'
         });
     }

     return items;
  }, [stats, users, attendance, projects, today]);

  // Feed Auto-Rotation
  useEffect(() => {
    if (carouselItems.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [carouselItems.length, isPaused]);

  const currentItem = carouselItems[currentFeedIndex] || carouselItems[0];

  // --- RECENT ACTIVITY LOGIC ---
  const smartActivityFeed = useMemo(() => {
      let activities: any[] = [];

      const safeDate = (d: string) => {
          const date = new Date(d);
          return isNaN(date.getTime()) ? new Date() : date;
      };

      // 1. Projects
      projects.forEach(p => {
          if (p.created_at) {
              activities.push({
                  id: `proj-${p.id}`,
                  date: safeDate(p.created_at),
                  title: 'নতুন প্রজেক্ট',
                  desc: `"${p.project_name}" প্রজেক্ট শুরু হয়েছে।`,
                  icon: Briefcase,
                  color: 'text-blue-600',
                  bg: 'bg-blue-100 dark:bg-blue-900/30'
              });
          }
      });

      // 2. Transactions
      transactions.slice(0, 10).forEach(t => {
          activities.push({
              id: `tx-${t.id}`,
              date: safeDate(t.created_at || t.date),
              title: t.type === 'income' ? 'জমা হয়েছে' : t.type === 'salary' ? 'বেতন প্রদান' : 'খরচ',
              desc: `${t.description} - ৳${t.amount}`,
              icon: t.type === 'income' ? ArrowDownLeft : ArrowUpRight,
              color: t.type === 'income' ? 'text-emerald-600' : 'text-rose-600',
              bg: t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
          });
      });

      // 3. Work Reports
      workReports.forEach(r => {
          const pName = projects.find(p => p.id === r.project_id)?.project_name || 'Project';
          activities.push({
              id: `rep-${r.id}`,
              date: safeDate(r.created_at || r.date),
              title: 'কাজের রিপোর্ট',
              desc: `${pName}: ${r.description.substring(0, 30)}...`,
              icon: FileText,
              color: 'text-indigo-600',
              bg: 'bg-indigo-100 dark:bg-indigo-900/30'
          });
      });

      // 4. Recent Attendance
      const recentAttendance = attendance
        .filter(a => a.date === today)
        .sort((a,b) => safeDate(b.created_at).getTime() - safeDate(a.created_at).getTime())
        .slice(0, 3); 

      recentAttendance.forEach(a => {
          const wName = users.find(u => u.id === a.worker_id)?.full_name || 'Worker';
          activities.push({
              id: `att-${a.id}`,
              date: safeDate(a.created_at),
              title: 'হাজিরা আপডেট',
              desc: `${wName} আজ ${a.status === 'P' ? 'উপস্থিত' : 'হাফ-ডে'}।`,
              icon: CheckCircle,
              color: 'text-green-600',
              bg: 'bg-green-100 dark:bg-green-900/30'
          });
      });

      return activities.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 15);
  }, [projects, transactions, workReports, attendance, users, today]);

  const formatTimeAgo = (date: Date) => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'এইমাত্র';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes} মি. আগে`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} ঘণ্টা আগে`;
      return date.toLocaleDateString('bn-BD', {day: 'numeric', month:'short'});
  };

  // Modals & Forms
  const [activeModal, setActiveModal] = useState<'income' | 'expense' | 'payment' | null>(null);
  const [txForm, setTxForm] = useState({ amount: '', description: '', projectId: '' });
  const [payForm, setPayForm] = useState({ workerId: '', amount: '' });
  
  // Custom Selector States
  const [showWorkerSelector, setShowWorkerSelector] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: activeModal as 'income' | 'expense',
      amount: Number(txForm.amount),
      description: txForm.description || (activeModal === 'income' ? 'জমা (ক্যাশ)' : 'সাধারণ খরচ'),
      project_id: txForm.projectId || undefined,
      date: today
    };
    await addTransaction(newTx);
    setActiveModal(null);
    setTxForm({ amount: '', description: '', projectId: '' });
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payForm.workerId && payForm.amount) {
      const amount = Number(payForm.amount);
      const worker = users.find(u => u.id === payForm.workerId);
      
      await payWorker(payForm.workerId, amount);
      setActiveModal(null);
      
      if (worker) {
         const newBalance = worker.balance - amount;
         const message = `Project Khata: পেমেন্ট রিসিভড ৳${amount}। বর্তমান বকেয়া: ৳${newBalance}। ধন্যবাদ।`;
         
         if(window.confirm("পেমেন্ট সফল! আপনি কি কর্মীকে SMS পাঠাতে চান?")) {
            const smsLink = `sms:${worker.phone}?body=${encodeURIComponent(message)}`;
            window.location.href = smsLink;
         }
      }
      setPayForm({ workerId: '', amount: '' });
    }
  };

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
      
      const dayTxs = transactions.filter(t => t.date === dateStr);
      const dayAttendance = attendance.filter(a => a.date === dateStr);

      const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) + dayAttendance.reduce((sum, a) => sum + a.amount, 0);

      data.push({ name: dayName, income, expense });
    }
    return data;
  }, [transactions, attendance]);

  const selectedWorkerBalance = payForm.workerId ? getWorkerBalance(payForm.workerId) : 0;
  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-sm";

  const DashboardSkeleton = () => (
    <div className="space-y-4 animate-pulse">
       <div className="h-64 rounded-[2.2rem] bg-slate-200 dark:bg-slate-800 w-full mb-4"></div>
       <div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mb-3"></div>
          <div className="grid grid-cols-4 gap-3">
             {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
             ))}
          </div>
       </div>
       <div className="h-48 rounded-[1.5rem] bg-slate-200 dark:bg-slate-800 w-full"></div>
       <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="space-y-3">
             {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="pb-28 relative bg-slate-50 dark:bg-slate-900 min-h-screen font-sans selection:bg-blue-100">
      
      {/* Compact Header & Smart Feed */}
      <div className="bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800 dark:to-slate-900 px-4 pt-3 pb-5 rounded-b-[2rem] shadow-sm border-b border-blue-100/50 dark:border-slate-700 mb-3 relative overflow-hidden">
         
         <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sun size={10} className="text-orange-500" /> {greeting}
               </p>
               <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5 truncate max-w-[200px]">
                  ঠিকাদার
               </h1>
            </div>
            <div className="flex flex-col items-end gap-1">
               <div className="text-right bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{dateString}</p>
                   <p className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono leading-none mt-0.5">{timeString}</p>
               </div>
            </div>
         </div>

         {/* SMART FEED SECTION */}
         <div className="mb-2 flex items-center gap-1.5 opacity-80">
            <Sparkles size={12} className="text-blue-500" />
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">স্মার্ট ফিড</h3>
         </div>

         <div 
            className={`w-full relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 border transition-all duration-500 shadow-sm ${currentItem.border}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
         >
            {carouselItems.length > 1 && (
               <div className="absolute top-0 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700">
                  <div 
                     key={currentFeedIndex} 
                     className={`h-full ${currentItem.color.replace('text', 'bg')} opacity-100 origin-left animate-progress`}
                  ></div>
               </div>
            )}

            <div className="p-3 flex items-center gap-3">
               <div className={`p-2 rounded-lg ${currentItem.bg} ${currentItem.color} shrink-0`}>
                  <currentItem.icon size={16} strokeWidth={2.5} />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                     <h3 className="font-bold text-slate-800 dark:text-white text-xs truncate leading-tight">
                        {currentItem.title}
                     </h3>
                     {carouselItems.length > 1 && (
                        <span className="text-[9px] font-bold text-slate-400">
                           {currentFeedIndex + 1}/{carouselItems.length}
                        </span>
                     )}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-medium opacity-90 line-clamp-1">
                     {currentItem.desc}
                  </p>
               </div>
            </div>
         </div>
      </div>

      <div className="px-4 space-y-4">
         
         {isLoadingData ? (
            <DashboardSkeleton />
         ) : (
            <>
                {/* MAIN FINANCIAL CARD */}
                <div className="relative rounded-[2.2rem] overflow-hidden shadow-xl shadow-blue-900/20 dark:shadow-none mb-3 group transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-800"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    
                    <div className="relative p-6 text-white">
                        <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1 opacity-90">
                                <div className="bg-amber-400/20 p-1 rounded backdrop-blur-sm border border-amber-400/20">
                                    <Wallet size={12} className="text-amber-300" />
                                </div>
                                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.15em]">{t('total_due')}</p>
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-1 drop-shadow-sm">
                                <span className="text-2xl text-blue-200 font-bold">৳</span> 
                                {stats.totalDue.toLocaleString()}
                            </h2>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-inner">
                            <Activity size={24} className="text-blue-200" />
                        </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => navigate('/projects')} className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-400/20 p-2 rounded-lg text-blue-200">
                                        <Briefcase size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-white leading-none">{activeProjects}</p>
                                        <p className="text-[9px] font-bold text-blue-200 uppercase mt-0.5">প্রজেক্ট</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-blue-300 group-hover/item:text-white transition-colors" />
                            </button>

                            <button onClick={() => navigate('/workers')} className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-400/20 p-2 rounded-lg text-emerald-200">
                                        <Users size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-white leading-none">{activeWorkers}</p>
                                        <p className="text-[9px] font-bold text-emerald-200 uppercase mt-0.5">কর্মী</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-emerald-300 group-hover/item:text-white transition-colors" />
                            </button>

                            <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3">
                                    <div className="bg-rose-400/20 p-2 rounded-lg text-rose-200">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-rose-200 uppercase">আজকের খরচ</p>
                                        <p className="text-sm font-bold text-white">৳ {stats.totalExpense.toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-[9px] bg-rose-500/20 text-rose-100 px-2 py-1 rounded font-bold border border-rose-400/20">আজ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h3 className="text-slate-700 dark:text-white font-bold text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
                    {t('quick_actions')}
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-3">
                    {[
                        { icon: PlusCircle, label: t('add_worker'), color: 'text-blue-600', action: () => navigate('/workers', { state: { openAddModal: true } }) },
                        { icon: Briefcase, label: t('add_project'), color: 'text-purple-600', action: () => navigate('/projects', { state: { openAddModal: true } }) },
                        { icon: Wallet, label: t('labor_payment'), color: 'text-emerald-600', action: () => setActiveModal('payment') },
                        { icon: DollarSign, label: t('expense'), color: 'text-rose-600', action: () => setActiveModal('expense') },
                        
                        { icon: CreditCard, label: t('deposit'), color: 'text-cyan-600', action: () => setActiveModal('income') },
                        { icon: Hammer, label: t('tools'), color: 'text-orange-600', action: () => navigate('/tools') },
                        { icon: FileText, label: t('report'), color: 'text-indigo-600', action: () => navigate('/reports') },
                        { icon: MapPin, label: 'লাইভ ম্যাপ', color: 'text-red-600', action: () => navigate('/tracking') },
                    ].map((item, idx) => (
                        <button 
                        key={idx} 
                        onClick={item.action} 
                        className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
                        >
                        <div className="bg-white dark:bg-slate-800 w-full aspect-square rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <item.icon size={22} className={`${item.color} relative z-10`} strokeWidth={2} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight truncate w-full">{item.label}</span>
                        </button>
                    ))}
                    </div>
                </div>

                {/* Analytics */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-slate-800 dark:text-white font-bold text-xs flex items-center gap-2 uppercase tracking-wide">
                            <PieChart size={14} className="text-blue-500" />
                            {t('last_7_days')}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-medium ml-6">আয় ও ব্যয়ের তুলনা</p>
                    </div>
                    <button onClick={() => navigate('/reports')} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-blue-600 transition-colors border border-slate-100 dark:border-slate-700">
                        <ArrowRight size={14} />
                    </button>
                    </div>
                    
                    <div className="w-full h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                <XAxis dataKey="name" tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                    }}
                                />
                                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.8rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-slate-800 dark:text-white font-bold text-xs mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Activity size={14} className="text-indigo-500" />
                        সাম্প্রতিক কার্যক্রম
                    </h3>
                    
                    <div className="space-y-0 relative">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                        {smartActivityFeed.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-medium">কোন অ্যাক্টিভিটি পাওয়া যায়নি</div>
                        ) : (
                            smartActivityFeed.map((act) => (
                                <div key={act.id} className="relative pl-12 pb-5 last:pb-0 group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-slate-900 ${act.bg} ${act.color}`}>
                                        <act.icon size={16} strokeWidth={2.5} />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-slate-800 dark:text-white text-xs">{act.title}</p>
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                {formatTimeAgo(act.date)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium line-clamp-2">
                                            {act.desc}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </>
         )}
      </div>

      {/* Bottom Sheet Modals */}
      {(activeModal === 'income' || activeModal === 'expense' || activeModal === 'payment') && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-800/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm sm:rounded-[2.5rem] rounded-t-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
              {/* Drag Handle for Mobile */}
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>

              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {activeModal === 'income' ? <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600"><ArrowDownLeft size={20}/></div> : 
                     activeModal === 'expense' ? <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600"><ArrowUpRight size={20}/></div> : 
                     <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><Wallet size={20}/></div>}
                    <span className="text-lg">{activeModal === 'income' ? t('income_title') : activeModal === 'expense' ? t('expense_title') : t('payment_title')}</span>
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={activeModal === 'payment' ? handlePaySubmit : handleTxSubmit} className="space-y-5">
                 {activeModal === 'payment' && (
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('select_worker')}</label>
                       
                       {/* Custom Worker Selector Trigger */}
                       <button
                          type="button"
                          onClick={() => setShowWorkerSelector(true)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-left flex justify-between items-center group transition-all active:scale-[0.98]"
                       >
                          <span className={`text-sm font-bold ${payForm.workerId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                             {payForm.workerId ? workers.find(w => w.id === payForm.workerId)?.full_name : t('click_list')}
                          </span>
                          <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                       </button>

                       {payForm.workerId && (
                          <div className="flex justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                             <span className="text-slate-500 dark:text-slate-400">বর্তমান বকেয়া</span>
                             <span className={`font-bold ${selectedWorkerBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>৳ {selectedWorkerBalance}</span>
                          </div>
                       )}
                    </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('amount')}</label>
                    <div className="relative group">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">৳</span>
                       <input 
                         type="number" 
                         inputMode="decimal"
                         required
                         autoFocus
                         value={activeModal === 'payment' ? payForm.amount : txForm.amount}
                         onChange={(e) => activeModal === 'payment' ? setPayForm({...payForm, amount: e.target.value}) : setTxForm({...txForm, amount: e.target.value})}
                         placeholder="0"
                         className={`${inputClass} pl-14 pr-6 text-3xl font-bold`}
                       />
                    </div>
                 </div>

                 {activeModal !== 'payment' && (
                   <>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('description')}</label>
                        <input 
                          type="text" 
                          required
                          value={txForm.description}
                          onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                          placeholder={activeModal === 'income' ? t('source_placeholder') : t('expense_placeholder')}
                          className={inputClass}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('project_optional')}</label>
                        
                        {/* Custom Project Selector Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowProjectSelector(true)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-left flex justify-between items-center group transition-all active:scale-[0.98]"
                        >
                           <span className={`text-sm font-bold ${txForm.projectId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                              {txForm.projectId ? projects.find(p => p.id === txForm.projectId)?.project_name : t('general_project')}
                           </span>
                           <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </button>
                     </div>
                   </>
                 )}

                 <button 
                   type="submit" 
                   className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg mt-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base bg-gradient-to-r
                     ${activeModal === 'income' ? 'from-emerald-600 to-teal-600 shadow-emerald-200 dark:shadow-none' : 
                       activeModal === 'payment' ? 'from-blue-600 to-indigo-600 shadow-blue-200 dark:shadow-none' : 
                       'from-rose-600 to-pink-600 shadow-rose-200 dark:shadow-none'}`}
                 >
                    <CheckCircle size={20} />
                    নিশ্চিত করুন
                 </button>
              </form>
           </div>
        </div>
      )}
      
      {/* --- CUSTOM SELECTOR MODALS --- */}
      
      {/* Worker Selector */}
      <SelectorSheet 
         isOpen={showWorkerSelector}
         onClose={() => setShowWorkerSelector(false)}
         title="কর্মী সিলেক্ট করুন"
         icon={Users}
         options={workers.map(w => ({ value: w.id, label: w.full_name, sub: w.skill_type }))}
         selectedValue={payForm.workerId}
         onSelect={(val) => setPayForm({...payForm, workerId: val})}
      />

      {/* Project Selector */}
      <SelectorSheet 
         isOpen={showProjectSelector}
         onClose={() => setShowProjectSelector(false)}
         title="প্রজেক্ট সিলেক্ট করুন"
         icon={Briefcase}
         options={[
             { value: '', label: t('general_project'), sub: 'General' },
             ...projects.filter(p => p.status === 'active').map(p => ({ value: p.id, label: p.project_name, sub: p.location }))
         ]}
         selectedValue={txForm.projectId}
         onSelect={(val) => setTxForm({...txForm, projectId: val})}
      />

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 4000ms linear infinite;
        }
      `}</style>
    </div>
  );
};