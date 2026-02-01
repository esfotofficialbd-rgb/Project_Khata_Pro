
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Hammer, PlusCircle, DollarSign, FileText, CreditCard, Image, Wallet, X, CheckCircle, ArrowDownLeft, ArrowUpRight, TrendingUp, Bell, Search, Sun, Moon, Loader2 } from 'lucide-react';
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
    if (hour < 12) setGreeting('শুভ সকাল');
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
         // Calculate new balance locally for immediate feedback in SMS
         const currentBalance = worker.balance; // This is before update in local state might reflect instantly depending on implementation, better to calc
         const newBalance = currentBalance - amount;
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
        <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
           <Loader2 className="animate-spin text-blue-600" size={32} />
           <p className="text-sm text-slate-500 font-bold animate-pulse">ডাটা লোড হচ্ছে...</p>
        </div>
     );
  }

  return (
    <div className="p-4 space-y-6 pb-24 relative bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-2">
         <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-0.5">{greeting},</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ড্যাশবোর্ড</h1>
         </div>
         <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
             <div className="text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
             </div>
         </div>
      </div>

      {/* Hero Balance Card - Premium Gradient */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 shadow-xl shadow-blue-500/20">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>

         <div className="relative z-10 text-white">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-1 opacity-90">
                     <Wallet size={14} /> {t('total_due')}
                  </p>
                  <h2 className="text-4xl font-bold tracking-tight">৳ {stats.totalDue.toLocaleString()}</h2>
               </div>
               <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-blue-50 uppercase tracking-wider">{t('present_workers')}</p>
                  <p className="text-xl font-bold text-center">{stats.totalPresent}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1 text-emerald-300">
                     <ArrowDownLeft size={16} />
                     <span className="text-xs font-bold">আজকের আয়</span>
                  </div>
                  <p className="text-lg font-bold">৳ 0</p>
               </div>
               <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1 text-red-300">
                     <ArrowUpRight size={16} />
                     <span className="text-xs font-bold">{t('todays_expense')}</span>
                  </div>
                  <p className="text-lg font-bold">৳ {stats.totalExpense.toLocaleString()}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Quick Actions - Horizontal Scrollable */}
      <div>
        <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-3 px-1 text-sm uppercase tracking-wider">{t('quick_actions')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
             { icon: PlusCircle, label: t('add_worker'), color: 'text-white', bg: 'bg-blue-500', action: () => navigate('/workers', { state: { openAddModal: true } }) },
             { icon: Briefcase, label: t('add_project'), color: 'text-white', bg: 'bg-indigo-500', action: () => navigate('/projects', { state: { openAddModal: true } }) },
             { icon: Wallet, label: t('advance'), color: 'text-white', bg: 'bg-emerald-500', action: () => setActiveModal('payment') },
             { icon: DollarSign, label: t('expense'), color: 'text-white', bg: 'bg-red-500', action: () => setActiveModal('expense') },
             { icon: CreditCard, label: t('deposit'), color: 'text-slate-700', bg: 'bg-white border border-slate-200', action: () => setActiveModal('income') },
             { icon: Hammer, label: t('tools'), color: 'text-slate-700', bg: 'bg-white border border-slate-200', action: () => navigate('/tools') },
             { icon: FileText, label: t('report'), color: 'text-slate-700', bg: 'bg-white border border-slate-200', action: () => navigate('/reports') },
             { icon: Image, label: t('gallery'), color: 'text-slate-700', bg: 'bg-white border border-slate-200', action: () => alert('গ্যালারি শীঘ্রই আসছে') },
          ].map((item, idx) => (
            <button key={idx} onClick={item.action} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
              <div className={`${item.bg} p-4 rounded-2xl shadow-sm ${item.color === 'text-white' ? 'shadow-lg' : ''} flex items-center justify-center w-full aspect-square transition-all`}>
                <item.icon size={24} className={item.color} />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight truncate w-full">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wider">{t('last_7_days')}</h3>
            <button onClick={() => navigate('/reports')} className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg">সব দেখুন</button>
         </div>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
               <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                     <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                     labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}
                  />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name={t('expenditure')} />
                  <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name={t('income')} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
         <div 
            onClick={() => navigate('/projects')}
            className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer"
         >
            <div className="absolute right-0 top-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Briefcase size={24} className="text-blue-600 mb-3 relative z-10" />
            <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 relative z-10">{activeProjects}</p>
            <p className="text-xs text-slate-500 font-bold uppercase relative z-10">{t('active_projects')}</p>
         </div>

         <div 
            onClick={() => navigate('/workers')}
            className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer"
         >
            <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Users size={24} className="text-emerald-600 mb-3 relative z-10" />
            <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 relative z-10">{activeWorkers}</p>
            <p className="text-xs text-slate-500 font-bold uppercase relative z-10">{t('active_workers')}</p>
         </div>
      </div>

      {/* Modals - Clean & Minimal */}
      {(activeModal === 'income' || activeModal === 'expense' || activeModal === 'payment') && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {activeModal === 'income' ? <div className="p-2 bg-green-100 rounded-full text-green-600"><ArrowDownLeft size={20}/></div> : 
                     activeModal === 'expense' ? <div className="p-2 bg-red-100 rounded-full text-red-600"><ArrowUpRight size={20}/></div> : 
                     <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><Wallet size={20}/></div>}
                    {activeModal === 'income' ? t('income_title') : activeModal === 'expense' ? t('expense_title') : t('payment_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={activeModal === 'payment' ? handlePaySubmit : handleTxSubmit} className="space-y-6">
                 {activeModal === 'payment' && (
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('select_worker')}</label>
                       <select 
                          value={payForm.workerId}
                          onChange={(e) => setPayForm({...payForm, workerId: e.target.value})}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 dark:text-white"
                          required
                       >
                          <option value="">{t('click_list')}</option>
                          {workers.map(w => (
                             <option key={w.id} value={w.id}>{w.full_name}</option>
                          ))}
                       </select>
                       {payForm.workerId && (
                          <div className="flex justify-between px-2 text-xs font-medium">
                             <span className="text-slate-500">বর্তমান বকেয়া</span>
                             <span className={`${selectedWorkerBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>৳ {selectedWorkerBalance}</span>
                          </div>
                       )}
                    </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('amount')}</label>
                    <div className="relative">
                       <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                       <input 
                         type="number" 
                         required
                         autoFocus
                         value={activeModal === 'payment' ? payForm.amount : txForm.amount}
                         onChange={(e) => activeModal === 'payment' ? setPayForm({...payForm, amount: e.target.value}) : setTxForm({...txForm, amount: e.target.value})}
                         placeholder="0"
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-3xl font-bold text-slate-900 dark:text-white placeholder-slate-300"
                       />
                    </div>
                 </div>

                 {activeModal !== 'payment' && (
                   <>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('description')}</label>
                        <input 
                          type="text" 
                          required
                          value={txForm.description}
                          onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                          placeholder={activeModal === 'income' ? t('source_placeholder') : t('expense_placeholder')}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('project_optional')}</label>
                        <select 
                           value={txForm.projectId}
                           onChange={(e) => setTxForm({...txForm, projectId: e.target.value})}
                           className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium"
                        >
                           <option value="">{t('general_project')}</option>
                           {projects.filter(p => p.status === 'active').map(p => (
                              <option key={p.id} value={p.id}>{p.project_name}</option>
                           ))}
                        </select>
                     </div>
                   </>
                 )}

                 <button 
                   type="submit" 
                   className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-200 dark:shadow-none mt-4 active:scale-95 transition-all flex items-center justify-center gap-2 
                     ${activeModal === 'income' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                       activeModal === 'payment' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                       'bg-red-600 hover:bg-red-700'}`}
                 >
                    <CheckCircle size={20} />
                    নিশ্চিত করুন
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
