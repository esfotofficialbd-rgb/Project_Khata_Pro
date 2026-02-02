import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Hammer, PlusCircle, DollarSign, FileText, CreditCard, Wallet, X, CheckCircle, ArrowDownLeft, ArrowUpRight, TrendingUp, Sun, Loader2, ArrowRight, MoreHorizontal, PieChart, ChevronRight, Activity, Building2, Zap, Clock, Package, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { Transaction } from '../types';
import { useAuth } from '../context/SessionContext';

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

  // --- SMART FEED LOGIC ---
  const feedItems = useMemo(() => {
     let items: any[] = [];

     // 1. Total Due Alert (If high)
     if (stats.totalDue > 0) {
        items.push({
            id: 'due-alert',
            title: 'বকেয়া অ্যালার্ট',
            desc: `মোট বকেয়া বেতন: ৳${stats.totalDue.toLocaleString()}`,
            icon: Wallet,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            border: 'border-amber-100 dark:border-amber-800'
        });
     }

     // 2. Today's Expense
     items.push({
        id: 'daily-expense',
        title: 'আজকের খরচ',
        desc: `আজ মোট খরচ হয়েছে: ৳${stats.totalExpense.toLocaleString()}`,
        icon: TrendingUp,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-100 dark:border-blue-800'
     });

     // 3. Attendance
     items.push({
        id: 'daily-attendance',
        title: 'সাইট উপস্থিতি',
        desc: `আজ ${stats.totalPresent} জন কর্মী উপস্থিত আছেন।`,
        icon: Users,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        border: 'border-emerald-100 dark:border-emerald-800'
     });

     return items;
  }, [stats]);

  // Feed Auto-Rotation
  useEffect(() => {
    if (feedItems.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % feedItems.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [feedItems.length, isPaused]);

  const currentItem = feedItems[currentFeedIndex] || feedItems[0];

  // --- RECENT ACTIVITY LOGIC ---
  const recentActivities = useMemo(() => {
      const acts: any[] = [];
      
      // Transactions
      transactions.slice(0, 5).forEach(t => acts.push({
          id: t.id,
          type: 'money',
          icon: t.type === 'income' ? ArrowDownLeft : ArrowUpRight,
          title: t.type === 'income' ? 'টাকা জমা' : t.type === 'salary' ? 'বেতন প্রদান' : 'খরচ',
          desc: t.description,
          amount: t.amount,
          date: t.date,
          color: t.type === 'income' ? 'text-emerald-600' : 'text-rose-600',
          bg: t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
      }));

      // Work Reports
      workReports.slice(0, 3).forEach(r => acts.push({
          id: r.id,
          type: 'report',
          icon: FileText,
          title: 'কাজের রিপোর্ট',
          desc: projects.find(p=>p.id===r.project_id)?.project_name || 'Project',
          date: r.date,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50 dark:bg-indigo-900/20'
      }));

      // Material Logs
      materialLogs.slice(0, 3).forEach(m => acts.push({
          id: m.id,
          type: 'material',
          icon: Package,
          title: 'ম্যাটেরিয়াল',
          desc: `${m.quantity} ${m.unit} ${m.item_name}`,
          date: m.date,
          color: 'text-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-900/20'
      }));

      return acts.sort((a,b) => b.id.localeCompare(a.id)).slice(0, 5);
  }, [transactions, workReports, materialLogs, projects]);

  // Modals & Forms
  const [activeModal, setActiveModal] = useState<'income' | 'expense' | 'payment' | null>(null);
  const [txForm, setTxForm] = useState({ amount: '', description: '', projectId: '' });
  const [payForm, setPayForm] = useState({ workerId: '', amount: '' });

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: activeModal as 'income' | 'expense',
      amount: Number(txForm.amount),
      description: txForm.description || (activeModal === 'income' ? 'Cash In' : 'General Expense'),
      project_id: txForm.projectId || undefined,
      date: today
    };
    addTransaction(newTx);
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

  // Consistent input styling
  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-sm";

  // --- SKELETON LOADER COMPONENT ---
  const DashboardSkeleton = () => (
    <div className="space-y-4 animate-pulse">
       {/* Main Card Skeleton */}
       <div className="h-64 rounded-[2.2rem] bg-slate-200 dark:bg-slate-800 w-full mb-4"></div>
       
       {/* Quick Actions Grid Skeleton */}
       <div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mb-3"></div>
          <div className="grid grid-cols-4 gap-3">
             {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
             ))}
          </div>
       </div>

       {/* Chart Skeleton */}
       <div className="h-48 rounded-[1.5rem] bg-slate-200 dark:bg-slate-800 w-full"></div>

       {/* Recent List Skeleton */}
       <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="space-y-3">
             {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                   <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                      <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="pb-28 relative bg-slate-50 dark:bg-slate-900 min-h-screen font-sans selection:bg-blue-100">
      
      {/* Compact Header & Smart Feed */}
      <div className="bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800 dark:to-slate-900 px-4 pt-3 pb-5 rounded-b-[2rem] shadow-sm border-b border-blue-100/50 dark:border-slate-700 mb-3 relative overflow-hidden">
         
         {/* Welcome Header */}
         <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sun size={10} className="text-orange-500" /> {greeting}
               </p>
               {/* ROLE TITLE (Deep Blue) */}
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

         {/* SMART FEED - Clean White Look */}
         <div 
            className={`w-full relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 border transition-all duration-500 shadow-sm ${currentItem.border}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
         >
            {/* Progress Bar */}
            {feedItems.length > 1 && (
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
                     {feedItems.length > 1 && (
                        <span className="text-[9px] font-bold text-slate-400">
                           {currentFeedIndex + 1}/{feedItems.length}
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
                {/* MAIN FINANCIAL & STATUS CARD (Merged) - Premium Theme (NO BLACK) */}
                <div className="relative rounded-[2.2rem] overflow-hidden shadow-xl shadow-blue-900/20 dark:shadow-none mb-3 group transition-all">
                    {/* Premium Royal Blue Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-800"></div>
                    
                    {/* Texture Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    
                    <div className="relative p-6 text-white">
                        
                        {/* Top Section: Money */}
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

                        {/* Bottom Section: Grid Stats (Merged from removed cards) */}
                        <div className="grid grid-cols-2 gap-3">
                        
                        {/* Projects Stat */}
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

                        {/* Workers Stat */}
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

                        {/* Expense Stat */}
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
                            <span className="text-[9px] bg-rose-500/20 text-rose-100 px-2 py-1 rounded font-bold border border-rose-400/20">Today</span>
                        </div>

                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid - Clean Tile Design */}
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
                        { icon: MapPin, label: 'Live Map', color: 'text-red-600', action: () => navigate('/tracking') },
                    ].map((item, idx) => (
                        <button 
                        key={idx} 
                        onClick={item.action} 
                        className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
                        >
                        <div className="bg-white dark:bg-slate-800 w-full aspect-square rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:shadow-md transition-all relative overflow-hidden">
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <item.icon size={22} className={`${item.color} relative z-10`} strokeWidth={2} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight truncate w-full">{item.label}</span>
                        </button>
                    ))}
                    </div>
                </div>

                {/* Analytics Section - Card Style */}
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
                    
                    <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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

                {/* RECENT ACTIVITY LIST - NEW SECTION */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-slate-800 dark:text-white font-bold text-xs mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <Clock size={14} className="text-purple-500" />
                    সাম্প্রতিক কার্যক্রম
                    </h3>
                    
                    <div className="space-y-3">
                    {recentActivities.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">কোন সাম্প্রতিক কাজ নেই</div>
                    ) : (
                        recentActivities.map((act) => (
                            <div key={act.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                                <div className={`p-2.5 rounded-xl ${act.bg} ${act.color} shrink-0`}>
                                <act.icon size={18} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className="font-bold text-slate-800 dark:text-white text-xs truncate">{act.title}</p>
                                    <span className="text-[9px] font-bold text-slate-400">{act.date}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{act.desc}</p>
                                </div>
                                {act.amount && (
                                <span className={`text-xs font-bold ${act.color}`}>
                                    {act.type === 'money' && act.icon === ArrowUpRight ? '-' : '+'} ৳{act.amount}
                                </span>
                                )}
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
                       <select 
                          value={payForm.workerId}
                          onChange={(e) => setPayForm({...payForm, workerId: e.target.value})}
                          className={`${inputClass} appearance-none`}
                          required
                       >
                          <option value="">{t('click_list')}</option>
                          {workers.map(w => (
                             <option key={w.id} value={w.id}>{w.full_name}</option>
                          ))}
                       </select>
                       {payForm.workerId && (
                          <div className="flex justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium border border-slate-100 dark:border-slate-700">
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
                        <div className="relative">
                           <select 
                              value={txForm.projectId}
                              onChange={(e) => setTxForm({...txForm, projectId: e.target.value})}
                              className={`${inputClass} appearance-none`}
                           >
                              <option value="">{t('general_project')}</option>
                              {projects.filter(p => p.status === 'active').map(p => (
                                 <option key={p.id} value={p.id}>{p.project_name}</option>
                              ))}
                           </select>
                           <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                        </div>
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