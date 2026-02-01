import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Hammer, PlusCircle, DollarSign, FileText, CreditCard, Image, Wallet, X, CheckCircle, ArrowDownLeft, ArrowUpRight, TrendingUp, Bell, Search, Sun, Moon, Loader2, ArrowRight, MoreHorizontal, Calendar, PieChart, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { Transaction } from '../types';

export const ContractorDashboard = () => {
  const { projects, users, getDailyStats, transactions, attendance, addTransaction, payWorker, getWorkerBalance, t, appSettings, isLoadingData } = useData();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const stats = getDailyStats(today);

  // Greeting Logic
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting('শুভ রাত্রি');
    else if (hour < 12) setGreeting('শুভ সকাল');
    else if (hour < 17) setGreeting('শুভ দুপুর');
    else setGreeting('শুভ সন্ধ্যা');
  }, []);

  const activeWorkers = users.filter(u => u.role === 'worker').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const workers = users.filter(u => u.role === 'worker' || u.role === 'supervisor');

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

  if (isLoadingData) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
           <Loader2 className="animate-spin text-blue-600" size={32} />
           <p className="text-sm text-slate-500 font-bold animate-pulse">ডাটা লোড হচ্ছে...</p>
        </div>
     );
  }

  return (
    <div className="px-5 pt-4 pb-28 relative bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      
      {/* Top Bar */}
      <div className="flex justify-between items-end mb-6">
         <div>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
               <Sun size={14} className="text-orange-500" />
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{greeting}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">ড্যাশবোর্ড</h1>
         </div>
         <div className="bg-white dark:bg-slate-900 p-1.5 pl-3 pr-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2">
             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
             </span>
             <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-600 dark:text-slate-400">
                <Calendar size={14} />
             </div>
         </div>
      </div>

      {/* Hero Financial Card */}
      <div className="relative w-full aspect-[1.7/1] rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-500/20 mb-8 group transition-all hover:scale-[1.01]">
         {/* Background Gradient */}
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
         
         {/* Decorative Blobs */}
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

         <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                     <Wallet size={12} /> {t('total_due')}
                  </p>
                  <h2 className="text-3xl font-bold tracking-tighter">৳ {stats.totalDue.toLocaleString()}</h2>
               </div>
               <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-xl">
                  <TrendingUp size={20} className="text-white" />
               </div>
            </div>

            <div className="flex gap-3">
               <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-1 mb-1 text-rose-300">
                     <ArrowUpRight size={12} />
                     <span className="text-[10px] font-bold uppercase">{t('todays_expense')}</span>
                  </div>
                  <p className="text-sm font-bold">৳ {stats.totalExpense.toLocaleString()}</p>
               </div>
               <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-1 mb-1 text-emerald-300">
                     <Users size={12} />
                     <span className="text-[10px] font-bold uppercase">{t('present_workers')}</span>
                  </div>
                  <p className="text-sm font-bold">{stats.totalPresent} জন</p>
               </div>
            </div>
         </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h3 className="text-slate-800 dark:text-white font-bold text-sm mb-4 flex items-center gap-2">
           <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
           {t('quick_actions')}
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          {[
             { icon: PlusCircle, label: t('add_worker'), bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400', action: () => navigate('/workers', { state: { openAddModal: true } }) },
             { icon: Briefcase, label: t('add_project'), bg: 'bg-purple-50 dark:bg-purple-900/20', color: 'text-purple-600 dark:text-purple-400', action: () => navigate('/projects', { state: { openAddModal: true } }) },
             { icon: Wallet, label: t('labor_payment'), bg: 'bg-emerald-50 dark:bg-emerald-900/20', color: 'text-emerald-600 dark:text-emerald-400', action: () => setActiveModal('payment') },
             { icon: DollarSign, label: t('expense'), bg: 'bg-rose-50 dark:bg-rose-900/20', color: 'text-rose-600 dark:text-rose-400', action: () => setActiveModal('expense') },
             
             { icon: CreditCard, label: t('deposit'), bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400', action: () => setActiveModal('income') },
             { icon: Hammer, label: t('tools'), bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400', action: () => navigate('/tools') },
             { icon: FileText, label: t('report'), bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400', action: () => navigate('/reports') },
             { icon: MoreHorizontal, label: 'অন্যান্য', bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400', action: () => navigate('/settings') },
          ].map((item, idx) => (
            <button key={idx} onClick={item.action} className="flex flex-col items-center gap-2 group">
              <div className={`${item.bg} w-full aspect-square rounded-2xl flex items-center justify-center transition-transform active:scale-95 group-hover:shadow-md`}>
                <item.icon size={22} className={item.color} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h3 className="text-slate-800 dark:text-white font-bold text-sm flex items-center gap-2">
                  <PieChart size={16} className="text-blue-500" />
                  {t('last_7_days')}
               </h3>
               <p className="text-[10px] text-slate-400 font-medium ml-6 mt-0.5">আয় ও ব্যয়ের তুলনা</p>
            </div>
            <button onClick={() => navigate('/reports')} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-blue-600 transition-colors">
               <ArrowRight size={16} />
            </button>
         </div>
         
         <div style={{ width: '100%', height: 180 }}>
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
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} />
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

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
         <button 
            onClick={() => navigate('/projects')}
            className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-5 -mt-5 transition-transform group-hover:scale-110"></div>
            <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 relative z-10">
               <Briefcase size={20} />
            </div>
            <div>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeProjects}</p>
               <div className="flex items-center gap-1 text-slate-500">
                  <span className="text-[10px] font-bold uppercase">{t('active_projects')}</span>
                  <ChevronRight size={12} />
               </div>
            </div>
         </button>

         <button 
            onClick={() => navigate('/workers')}
            className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-full -mr-5 -mt-5 transition-transform group-hover:scale-110"></div>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10">
               <Users size={20} />
            </div>
            <div>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeWorkers}</p>
               <div className="flex items-center gap-1 text-slate-500">
                  <span className="text-[10px] font-bold uppercase">{t('active_workers')}</span>
                  <ChevronRight size={12} />
               </div>
            </div>
         </button>
      </div>

      {/* Bottom Sheet Modals */}
      {(activeModal === 'income' || activeModal === 'expense' || activeModal === 'payment') && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           
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
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 dark:text-white appearance-none transition-all"
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
                         className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-3xl font-bold text-slate-900 dark:text-white placeholder-slate-300 transition-all focus:bg-white dark:focus:bg-slate-900 shadow-inner"
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
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('project_optional')}</label>
                        <div className="relative">
                           <select 
                              value={txForm.projectId}
                              onChange={(e) => setTxForm({...txForm, projectId: e.target.value})}
                              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white transition-all appearance-none"
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
                   className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-gray-200 dark:shadow-none mt-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base
                     ${activeModal === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/30' : 
                       activeModal === 'payment' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-200 dark:shadow-blue-900/30' : 
                       'bg-rose-600 hover:bg-rose-500 shadow-rose-200 dark:shadow-rose-900/30'}`}
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
      `}</style>
    </div>
  );
};