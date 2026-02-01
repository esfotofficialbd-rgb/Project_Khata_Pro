import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Wallet, DollarSign, ArrowUpRight, CheckCircle, X, MapPin, PlusCircle, Briefcase, Camera, FileText, Truck, PackageCheck, UserCheck, PlayCircle, History } from 'lucide-react';
import { Transaction, WorkReport, MaterialLog } from '../types';

export const SupervisorDashboard = () => {
  const { user } = useAuth();
  const { projects, users, getDailyStats, transactions, attendance, addTransaction, payWorker, getWorkerBalance, addWorkReport, addMaterialLog, markAttendance, t } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const stats = getDailyStats(today);

  // Check if supervisor has marked attendance today
  const myAttendance = attendance.find(a => a.worker_id === user?.id && a.date === today);
  const myProject = myAttendance ? projects.find(p => p.id === myAttendance.project_id) : null;

  // Clock State
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' });

  // Filter only active workers
  const activeWorkers = users.filter(u => u.role === 'worker').length;
  const workers = users.filter(u => u.role === 'worker');

  // Modal States
  const [activeModal, setActiveModal] = useState<'expense' | 'payment' | 'report' | 'material' | 'selfEntry' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Forms
  const [txForm, setTxForm] = useState({ amount: '', description: '', projectId: '' });
  const [payForm, setPayForm] = useState({ workerId: '', amount: '' });
  const [reportForm, setReportForm] = useState({ projectId: '', description: '', image_url: '' });
  const [materialForm, setMaterialForm] = useState({ projectId: '', item_name: '', quantity: '', unit: '', supplier: '', challan_photo: '' });
  const [selfEntryProject, setSelfEntryProject] = useState('');

  // Auto-select Assigned Project
  useEffect(() => {
    if (user?.assigned_project_id && !selfEntryProject) {
        setSelfEntryProject(user.assigned_project_id);
    }
    // Also auto-select for other forms if not set
    if (user?.assigned_project_id) {
        setTxForm(prev => ({ ...prev, projectId: prev.projectId || user.assigned_project_id || '' }));
        setReportForm(prev => ({ ...prev, projectId: prev.projectId || user.assigned_project_id || '' }));
        setMaterialForm(prev => ({ ...prev, projectId: prev.projectId || user.assigned_project_id || '' }));
    }
  }, [user, activeModal]);

  // Handlers
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      amount: Number(txForm.amount),
      description: txForm.description || 'Site Expense',
      project_id: txForm.projectId || undefined,
      date: today
    };
    addTransaction(newTx);
    setActiveModal(null);
    setTxForm({ amount: '', description: '', projectId: '' });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payForm.workerId && payForm.amount) {
      payWorker(payForm.workerId, Number(payForm.amount));
      setActiveModal(null);
      setPayForm({ workerId: '', amount: '' });
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && reportForm.projectId && reportForm.description) {
      const newReport: WorkReport = {
         id: Date.now().toString(),
         project_id: reportForm.projectId,
         submitted_by: user.id,
         date: today,
         description: reportForm.description,
         image_url: reportForm.image_url
      };
      addWorkReport(newReport);
      setActiveModal(null);
      setReportForm({ projectId: '', description: '', image_url: '' });
      toast.success('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে।');
    }
  };

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && materialForm.projectId && materialForm.item_name && materialForm.quantity) {
       const newLog: MaterialLog = {
          id: Date.now().toString(),
          project_id: materialForm.projectId,
          submitted_by: user.id,
          date: today,
          item_name: materialForm.item_name,
          quantity: Number(materialForm.quantity),
          unit: materialForm.unit,
          supplier_name: materialForm.supplier,
          challan_photo: materialForm.challan_photo
       };
       addMaterialLog(newLog);
       setActiveModal(null);
       setMaterialForm({ projectId: '', item_name: '', quantity: '', unit: '', supplier: '', challan_photo: '' });
       toast.success('মালামাল এন্ট্রি সফল হয়েছে।');
    }
  };

  const handleSelfEntrySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (user && selfEntryProject) {
          markAttendance(user.id, 'P', selfEntryProject, today);
          setActiveModal(null);
          toast.success('আপনার সাইট এন্ট্রি সম্পন্ন হয়েছে');
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, formType: 'report' | 'material') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress
          if (formType === 'report') {
             setReportForm(prev => ({ ...prev, image_url: dataUrl }));
          } else {
             setMaterialForm(prev => ({ ...prev, challan_photo: dataUrl }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedWorkerBalance = payForm.workerId ? getWorkerBalance(payForm.workerId) : 0;

  // Recent Expenses (Last 5)
  const recentExpenses = transactions
    .filter(t => t.type === 'expense' || t.type === 'salary')
    .sort((a, b) => Number(b.id) - Number(a.id)) // approximation for sort by latest
    .slice(0, 5);

  return (
    <div className="p-4 space-y-6 pb-24 relative bg-slate-50 dark:bg-slate-950 min-h-screen">

      {/* Header Date/Time */}
      <div className="flex justify-between items-end mb-2">
         <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{dateString}</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ড্যাশবোর্ড</h1>
         </div>
         <div className="text-right">
             <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{timeString}</span>
             </div>
         </div>
      </div>

      {/* Self Attendance Card (Site Entry) */}
      {!myAttendance ? (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-200 dark:shadow-none animate-fade-in relative overflow-hidden text-white">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                    <UserCheck className="text-blue-200" size={20} />
                    {t('self_entry_title')}
                </h3>
                <p className="text-blue-100 text-xs mb-6 opacity-90">আপনার উপস্থিতির সময় রেকর্ড করুন</p>
                
                <button 
                    onClick={() => setActiveModal('selfEntry')}
                    className="w-full bg-white text-indigo-600 py-3.5 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <PlayCircle size={18} fill="currentColor" className="text-indigo-600" />
                    এন্ট্রি দিন
                </button>
              </div>
          </div>
      ) : (
          <div className="bg-white dark:bg-slate-900 border border-green-100 dark:border-green-900/30 rounded-3xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1.5 h-full bg-green-500"></div>
              <div className="bg-green-50 dark:bg-green-900/50 p-3 rounded-full text-green-600 dark:text-green-400">
                  <CheckCircle size={28} />
              </div>
              <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">{t('you_are_present')}</p>
                  <p className="font-bold text-slate-800 dark:text-white mt-0.5 text-lg">{myProject?.project_name || 'জেনারেল'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={10} /> {myProject?.location}
                  </p>
              </div>
          </div>
      )}
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
               <Users size={18} />
               <span className="text-xs font-bold">উপস্থিতি</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalPresent} <span className="text-xs font-normal text-slate-400">/ {activeWorkers}</span></p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-red-500 dark:text-red-400">
               <ArrowUpRight size={18} />
               <span className="text-xs font-bold">খরচ</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">৳ {stats.totalExpense.toLocaleString()}</p>
         </div>
      </div>

      {/* Primary Actions Grid */}
      <div>
        <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-3 px-1 text-sm uppercase tracking-wider">{t('site_management')}</h3>
        <div className="grid grid-cols-3 gap-3">
           {/* Expense */}
           <button 
             onClick={() => setActiveModal('expense')}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform group"
           >
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full text-red-600 dark:text-red-400 group-hover:bg-red-100 transition-colors">
                 <DollarSign size={22} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('expense_entry')}</span>
           </button>

           {/* Payment */}
           <button 
             onClick={() => setActiveModal('payment')}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform group"
           >
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors">
                 <Wallet size={22} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('labor_payment')}</span>
           </button>

           {/* Attendance */}
           <button 
             onClick={() => navigate('/khata')}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform group"
           >
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 transition-colors">
                 <Users size={22} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('give_attendance')}</span>
           </button>

           {/* Material */}
           <button 
             onClick={() => setActiveModal('material')}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform group"
           >
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 transition-colors">
                 <PackageCheck size={22} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('material_stock')}</span>
           </button>

           {/* Report */}
           <button 
             onClick={() => setActiveModal('report')}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform group"
           >
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
                 <FileText size={22} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('daily_report')}</span>
           </button>
           
           {/* Add Worker */}
           <button 
             onClick={() => navigate('/workers', { state: { openAddModal: true } })}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform group"
           >
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full text-gray-600 dark:text-gray-400 group-hover:bg-gray-100 transition-colors">
                 <PlusCircle size={22} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('add_worker')}</span>
           </button>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm">{t('recent_expense')}</h3>
            <button onClick={() => navigate('/accounts')} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:text-slate-800"><History size={16} /></button>
         </div>
         
         <div className="space-y-4">
            {recentExpenses.length === 0 ? (
               <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  {t('no_expense_today')}
               </div>
            ) : (
               recentExpenses.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                        <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-full text-red-500 dark:text-red-400 group-hover:bg-red-100 transition-colors">
                           <ArrowUpRight size={16} />
                        </div>
                        <div>
                           <p className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{tx.description}</p>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              {projects.find(p => p.id === tx.project_id)?.project_name || 'General'}
                           </p>
                        </div>
                     </div>
                     <span className="font-bold text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-lg">- ৳{tx.amount.toLocaleString()}</span>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* --- MODALS --- */}

      {/* Self Entry Modal */}
      {activeModal === 'selfEntry' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <UserCheck className="text-blue-600" /> {t('self_entry_title')}
                      </h3>
                      <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
                  </div>

                  <form onSubmit={handleSelfEntrySubmit} className="space-y-6">
                      <div>
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide">প্রজেক্ট সিলেক্ট করুন</label>
                          <div className="relative">
                              <select 
                                  value={selfEntryProject}
                                  onChange={(e) => setSelfEntryProject(e.target.value)}
                                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm appearance-none text-slate-900 dark:text-white font-medium"
                                  required
                              >
                                  <option value="">{t('click_list')}</option>
                                  {projects.filter(p => p.status === 'active').map(p => (
                                      <option key={p.id} value={p.id}>{p.project_name}</option>
                                  ))}
                              </select>
                              <MapPin size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                          </div>
                      </div>

                      <button 
                          type="submit" 
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                          <CheckCircle size={20} />
                          {t('confirm_self_entry')}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Expense Modal */}
      {activeModal === 'expense' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-red-100 p-2 rounded-full"><ArrowUpRight className="text-red-600" size={20}/></div>
                    {t('expense_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleTxSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('amount')}</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                       <input 
                         type="number" 
                         required
                         autoFocus
                         value={txForm.amount}
                         onChange={(e) => setTxForm({...txForm, amount: e.target.value})}
                         placeholder="0"
                         className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-red-500 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-300"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('description')}</label>
                    <input 
                      type="text" 
                      required
                      value={txForm.description}
                      onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                      placeholder={t('expense_placeholder')}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-red-500 text-sm font-medium text-slate-900 dark:text-white"
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('project_optional')}</label>
                    <div className="relative">
                       <select 
                          value={txForm.projectId}
                          onChange={(e) => setTxForm({...txForm, projectId: e.target.value})}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-red-500 text-sm appearance-none text-slate-900 dark:text-white font-medium"
                       >
                          <option value="">{t('general_project')}</option>
                          {projects.filter(p => p.status === 'active').map(p => (
                             <option key={p.id} value={p.id}>{p.project_name}</option>
                          ))}
                       </select>
                       <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={20} />
                    {t('confirm_expense')}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Payment Modal */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-emerald-100 p-2 rounded-full"><Wallet className="text-emerald-600" size={20}/></div>
                    {t('payment_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('select_worker')}</label>
                    <div className="relative">
                       <select 
                          value={payForm.workerId}
                          onChange={(e) => setPayForm({...payForm, workerId: e.target.value})}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-sm appearance-none text-slate-900 dark:text-white font-medium"
                          required
                       >
                          <option value="">{t('click_list')}</option>
                          {workers.map(w => (
                             <option key={w.id} value={w.id}>{w.full_name} ({w.skill_type})</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 {payForm.workerId && (
                    <div className={`p-4 rounded-2xl border flex justify-between items-center ${selectedWorkerBalance >= 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900'}`}>
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('current_due_label')}</span>
                       <span className={`font-bold text-lg ${selectedWorkerBalance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ৳ {selectedWorkerBalance.toLocaleString()}
                       </span>
                    </div>
                 )}

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('amount')}</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                       <input 
                         type="number" 
                         required
                         autoFocus
                         value={payForm.amount}
                         onChange={(e) => setPayForm({...payForm, amount: e.target.value})}
                         placeholder="0"
                         className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-300"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={20} />
                    {t('confirm_payment')}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Material Modal */}
      {activeModal === 'material' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-full"><Truck className="text-orange-600" size={20}/></div>
                    {t('material_entry_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleMaterialSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('project_optional')}</label>
                    <div className="relative">
                       <select 
                          value={materialForm.projectId}
                          onChange={(e) => setMaterialForm({...materialForm, projectId: e.target.value})}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-orange-500 text-sm appearance-none text-slate-900 dark:text-white font-medium"
                          required
                       >
                          <option value="">প্রজেক্ট সিলেক্ট করুন</option>
                          {projects.filter(p => p.status === 'active').map(p => (
                             <option key={p.id} value={p.id}>{p.project_name}</option>
                          ))}
                       </select>
                       <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('item_name')}</label>
                    <input 
                      type="text" 
                      required
                      value={materialForm.item_name}
                      onChange={(e) => setMaterialForm({...materialForm, item_name: e.target.value})}
                      placeholder="সিমেন্ট / বালু / ইট"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-orange-500 text-sm text-slate-900 dark:text-white font-medium"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('quantity')}</label>
                        <input 
                           type="number" 
                           required
                           value={materialForm.quantity}
                           onChange={(e) => setMaterialForm({...materialForm, quantity: e.target.value})}
                           placeholder="0"
                           className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-orange-500 text-sm text-slate-900 dark:text-white font-medium"
                        />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('unit')}</label>
                        <input 
                           type="text" 
                           required
                           value={materialForm.unit}
                           onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
                           placeholder="ব্যাগ / ট্রাক"
                           className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-orange-500 text-sm text-slate-900 dark:text-white font-medium"
                        />
                     </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={20} />
                    {t('submit_entry')}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Report Modal */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full"><FileText className="text-blue-600" size={20}/></div>
                    {t('submit_report')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('project_optional')}</label>
                    <div className="relative">
                       <select 
                          value={reportForm.projectId}
                          onChange={(e) => setReportForm({...reportForm, projectId: e.target.value})}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm appearance-none text-slate-900 dark:text-white font-medium"
                          required
                       >
                          <option value="">প্রজেক্ট সিলেক্ট করুন</option>
                          {projects.filter(p => p.status === 'active').map(p => (
                             <option key={p.id} value={p.id}>{p.project_name}</option>
                          ))}
                       </select>
                       <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('description')}</label>
                    <textarea 
                      required
                      value={reportForm.description}
                      onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                      placeholder={t('report_desc')}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-white font-medium h-24 resize-none"
                    />
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={20} />
                    {t('submit_report')}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};