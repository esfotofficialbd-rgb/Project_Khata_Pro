import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Wallet, DollarSign, ArrowUpRight, CheckCircle, X, MapPin, PlusCircle, Briefcase, Camera, FileText, Truck, PackageCheck, UserCheck, PlayCircle, History, QrCode, Calendar, Sun, Clock, Send, Image as ImageIcon } from 'lucide-react';
import { Transaction, WorkReport, MaterialLog } from '../types';

export const SupervisorDashboard = () => {
  const { user } = useAuth();
  const { projects, users, getDailyStats, transactions, attendance, addTransaction, payWorker, getWorkerBalance, addWorkReport, addMaterialLog, markAttendance, t } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const workers = users.filter(u => u.role === 'worker');

  // Modal States
  const [activeModal, setActiveModal] = useState<'expense' | 'payment' | 'report' | 'material' | 'selfEntry' | null>(null);
  
  // Forms
  const [txForm, setTxForm] = useState({ amount: '', description: '', projectId: '' });
  const [payForm, setPayForm] = useState({ workerId: '', amount: '' });
  const [reportForm, setReportForm] = useState({ projectId: '', description: '', image_url: '' });
  const [materialForm, setMaterialForm] = useState({ projectId: '', item_name: '', quantity: '', unit: '', supplier: '', challan_photo: '' });
  const [selfEntryProject, setSelfEntryProject] = useState('');

  // Auto-select Assigned Project
  useEffect(() => {
    if (user?.assigned_project_id) {
        const assignedId = user.assigned_project_id;
        if (!selfEntryProject) setSelfEntryProject(assignedId);
        
        setTxForm(prev => ({ ...prev, projectId: prev.projectId || assignedId }));
        setReportForm(prev => ({ ...prev, projectId: prev.projectId || assignedId }));
        setMaterialForm(prev => ({ ...prev, projectId: prev.projectId || assignedId }));
    }
  }, [user, activeModal]);

  // Image Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'report' | 'material') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resize for storage efficiency
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          if (type === 'report') {
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

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payForm.workerId && payForm.amount) {
      await payWorker(payForm.workerId, Number(payForm.amount));
      setActiveModal(null);
      setPayForm({ workerId: '', amount: '' });
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
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
      await addWorkReport(newReport);
      setActiveModal(null);
      setReportForm({ projectId: '', description: '', image_url: '' });
      toast.success('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে।');
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
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
       await addMaterialLog(newLog);
       setActiveModal(null);
       setMaterialForm({ projectId: '', item_name: '', quantity: '', unit: '', supplier: '', challan_photo: '' });
       toast.success('মালামাল এন্ট্রি সফল হয়েছে।');
    }
  };

  const handleSelfEntrySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (user && selfEntryProject) {
          await markAttendance(user.id, 'P', selfEntryProject, today);
          setActiveModal(null);
          toast.success('আপনার সাইট এন্ট্রি সম্পন্ন হয়েছে');
      }
  };

  const selectedWorkerBalance = payForm.workerId ? getWorkerBalance(payForm.workerId) : 0;

  // Recent Expenses (Last 5)
  const recentExpenses = transactions
    .filter(t => t.type === 'expense' || t.type === 'salary')
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  return (
    <div className="p-5 space-y-6 pb-28 relative bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">

      {/* Header */}
      <div className="flex justify-between items-center pt-2 mb-2">
         <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-0.5 uppercase tracking-wider">{dateString}</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">সুপারভাইজার</h1>
         </div>
         <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2">
             <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-600 dark:text-purple-400">
                <Clock size={18} />
             </div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200 pr-2 font-mono">{timeString}</span>
         </div>
      </div>

      {/* Status Card (Self Attendance) */}
      {!myAttendance ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-6 shadow-xl shadow-blue-200 dark:shadow-none animate-fade-in relative overflow-hidden text-white group">
              <div className="absolute right-0 top-0 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm mb-3 animate-bounce-slow">
                   <UserCheck size={32} className="text-white" />
                </div>
                <h3 className="font-bold text-xl mb-1">{t('self_entry_title')}</h3>
                <p className="text-blue-100 text-xs mb-6 opacity-90 max-w-[200px]">আজকের কাজের জন্য আপনার উপস্থিতি নিশ্চিত করুন</p>
                
                <button 
                    onClick={() => setActiveModal('selfEntry')}
                    className="w-full bg-white text-blue-600 py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-50"
                >
                    <PlayCircle size={18} fill="currentColor" />
                    এন্ট্রি দিন
                </button>
              </div>
          </div>
      ) : (
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/20 rounded-[2rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                 <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                     <CheckCircle size={28} />
                 </div>
                 <div>
                     <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide mb-0.5">{t('you_are_present')}</p>
                     <p className="font-bold text-slate-800 dark:text-white text-lg">{myProject?.project_name || 'জেনারেল'}</p>
                 </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-50 dark:from-emerald-900/10 to-transparent"></div>
          </div>
      )}
      
      {/* Site Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="bg-purple-100 dark:bg-purple-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 relative z-10">
               <Users size={20} />
            </div>
            <div>
               <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalPresent}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mt-1">কর্মী উপস্থিত</p>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="bg-rose-100 dark:bg-rose-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 relative z-10">
               <ArrowUpRight size={20} />
            </div>
            <div>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">৳{stats.totalExpense.toLocaleString()}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mt-1">আজকের খরচ</p>
            </div>
         </div>
      </div>

      {/* Site Management Grid */}
      <div>
        <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-4 px-1 text-sm uppercase tracking-wider flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div> {t('site_management')}
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
           {/* Expense */}
           <button 
             onClick={() => setActiveModal('expense')}
             className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-transform group hover:border-red-200 dark:hover:border-red-800"
           >
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full text-red-600 dark:text-red-400 group-hover:bg-red-100 transition-colors">
                 <DollarSign size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('expense_entry')}</span>
           </button>

           {/* Payment */}
           <button 
             onClick={() => setActiveModal('payment')}
             className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-transform group hover:border-emerald-200 dark:hover:border-emerald-800"
           >
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors">
                 <Wallet size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('labor_payment')}</span>
           </button>

           {/* Attendance */}
           <button 
             onClick={() => navigate('/khata')}
             className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-transform group hover:border-purple-200 dark:hover:border-purple-800"
           >
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 transition-colors">
                 <Users size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('give_attendance')}</span>
           </button>

           {/* Material */}
           <button 
             onClick={() => setActiveModal('material')}
             className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-transform group hover:border-orange-200 dark:hover:border-orange-800"
           >
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 transition-colors">
                 <PackageCheck size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('material_stock')}</span>
           </button>

           {/* Report */}
           <button 
             onClick={() => setActiveModal('report')}
             className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-transform group hover:border-blue-200 dark:hover:border-blue-800"
           >
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
                 <FileText size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('daily_report')}</span>
           </button>
           
           {/* Add Worker */}
           <button 
             onClick={() => navigate('/workers', { state: { openAddModal: true } })}
             className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-transform group hover:border-gray-200 dark:hover:border-gray-700"
           >
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 transition-colors">
                 <PlusCircle size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] text-center">{t('add_worker')}</span>
           </button>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm uppercase tracking-wide">{t('recent_expense')}</h3>
            <button onClick={() => navigate('/accounts')} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:text-slate-800 transition-colors"><History size={18} /></button>
         </div>
         
         <div className="space-y-4">
            {recentExpenses.length === 0 ? (
               <div className="text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  {t('no_expense_today')}
               </div>
            ) : (
               recentExpenses.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between group p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-full text-red-500 dark:text-red-400">
                           <ArrowUpRight size={18} />
                        </div>
                        <div>
                           <p className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{tx.description}</p>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                              {projects.find(p => p.id === tx.project_id)?.project_name || 'General'}
                           </p>
                        </div>
                     </div>
                     <span className="font-bold text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-lg">- ৳{tx.amount.toLocaleString()}</span>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* FAB - Quick Scan QR */}
      <button 
         onClick={() => navigate('/khata', { state: { autoStartScan: true } })}
         className="fixed bottom-24 right-5 z-30 w-16 h-16 bg-slate-900 dark:bg-blue-600 text-white rounded-full shadow-2xl shadow-slate-900/30 flex items-center justify-center animate-bounce-slow active:scale-90 transition-transform"
         title="QR স্ক্যান করুন"
      >
         <QrCode size={30} />
         <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white dark:border-slate-900"></span>
         </span>
      </button>

      {/* --- MODALS --- */}

      {/* Self Entry Modal */}
      {activeModal === 'selfEntry' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <UserCheck className="text-blue-600" /> {t('self_entry_title')}
                      </h3>
                      <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
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
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-red-100 p-2 rounded-full"><ArrowUpRight className="text-red-600" size={20}/></div>
                    {t('expense_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleTxSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('amount')}</label>
                    <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-red-500 transition-colors">৳</span>
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
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-emerald-100 p-2 rounded-full"><Wallet className="text-emerald-600" size={20}/></div>
                    {t('payment_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
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
                             <option key={w.id} value={w.id}>{w.full_name}</option>
                          ))}
                       </select>
                       <Users size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {payForm.workerId && (
                       <div className="mt-2 flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-100 dark:border-slate-700">
                          <span className="text-slate-500">বর্তমান বকেয়া</span>
                          <span className={`font-bold ${selectedWorkerBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>৳ {selectedWorkerBalance}</span>
                       </div>
                    )}
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('amount')}</label>
                    <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-emerald-500 transition-colors">৳</span>
                       <input 
                         type="number" 
                         required
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

      {/* Material Log Modal */}
      {activeModal === 'material' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-full"><PackageCheck className="text-orange-600" size={20}/></div>
                    {t('material_entry_title')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleMaterialSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">প্রজেক্ট</label>
                    <select 
                        value={materialForm.projectId}
                        onChange={(e) => setMaterialForm({...materialForm, projectId: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 text-sm font-medium"
                        required
                    >
                        <option value="">প্রজেক্ট সিলেক্ট করুন</option>
                        {projects.filter(p => p.status === 'active').map(p => (
                            <option key={p.id} value={p.id}>{p.project_name}</option>
                        ))}
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('item_name')}</label>
                    <input 
                      type="text" 
                      required
                      value={materialForm.item_name}
                      onChange={(e) => setMaterialForm({...materialForm, item_name: e.target.value})}
                      placeholder="যেমন: সিমেন্ট"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 text-sm font-bold"
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
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('unit')}</label>
                        <input 
                          type="text" 
                          required
                          value={materialForm.unit}
                          onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
                          placeholder="ব্যাগ/ট্রাক"
                          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 text-sm font-bold"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('supplier')}</label>
                    <div className="relative">
                        <input 
                          type="text" 
                          value={materialForm.supplier}
                          onChange={(e) => setMaterialForm({...materialForm, supplier: e.target.value})}
                          placeholder="দোকানের নাম"
                          className="w-full pl-9 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 text-sm font-medium"
                        />
                        <Truck size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                 </div>

                 {/* Image Upload */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('challan_photo')}</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors relative overflow-hidden"
                    >
                        {materialForm.challan_photo ? (
                            <img src={materialForm.challan_photo} alt="Challan" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <Camera size={24} className="text-slate-400 mb-2" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase">ছবি তুলুন</p>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleImageUpload(e, 'material')}
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

      {/* Work Report Modal */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full"><FileText className="text-blue-600" size={20}/></div>
                    {t('submit_report')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">প্রজেক্ট</label>
                    <select 
                        value={reportForm.projectId}
                        onChange={(e) => setReportForm({...reportForm, projectId: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium"
                        required
                    >
                        <option value="">প্রজেক্ট সিলেক্ট করুন</option>
                        {projects.filter(p => p.status === 'active').map(p => (
                            <option key={p.id} value={p.id}>{p.project_name}</option>
                        ))}
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">বিবরণ</label>
                    <textarea 
                      required
                      value={reportForm.description}
                      onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                      placeholder={t('report_desc')}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium h-24 resize-none leading-relaxed"
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">{t('upload_photo')}</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors relative overflow-hidden"
                    >
                        {reportForm.image_url ? (
                            <img src={reportForm.image_url} alt="Work" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon size={28} className="text-slate-400 mb-2" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase">কাজের ছবি দিন</p>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleImageUpload(e, 'report')}
                        />
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <Send size={18} />
                    {t('submit_report')}
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};