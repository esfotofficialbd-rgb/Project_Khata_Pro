import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLocation } from 'react-router-dom';
import { Bell, FileText, Calculator, CalendarClock, Building2, X, Send, Save, CheckCircle, Calendar, Clock, MapPin, Briefcase, Wallet, ChevronRight, HandCoins } from 'lucide-react';

export const WorkerHome = () => {
  const { user } = useAuth();
  const { attendance, sendNotification, users, projects, submitAttendanceRequest, submitAdvanceRequest, t } = useData();
  const { toast } = useToast();
  const location = useLocation();
  
  // Clock State
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' });

  // Modal States
  const [activeModal, setActiveModal] = useState<'leave' | 'calc' | 'note' | 'attendance' | 'advance' | null>(null);

  // Feature States
  const [leaveData, setLeaveData] = useState({ date: '', reason: '' });
  const [otHours, setOtHours] = useState('');
  const [myNote, setMyNote] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  useEffect(() => {
    if (user) {
      const savedNote = localStorage.getItem(`worker_note_${user.id}`);
      if (savedNote) setMyNote(savedNote);
    }
  }, [user]);

  // Handle Navigation State to open Attendance Modal
  useEffect(() => {
    if (location.state && (location.state as any).openAttendanceModal) {
      setActiveModal('attendance');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (!user) return null;

  // Determine Company Name
  const contractor = users.find(u => u.role === 'contractor');
  const companyName = contractor?.company_name || 'Project Khata';

  const myAttendance = attendance.filter(a => a.worker_id === user.id);
  const totalDays = myAttendance.filter(a => a.status === 'P' || a.status === 'H').length;
  const totalEarned = myAttendance.reduce((sum, a) => sum + a.amount, 0);

  // Check today's attendance
  const today = new Date().toISOString().split('T')[0];
  const isPresentToday = attendance.some(a => a.worker_id === user.id && a.date === today);

  // --- Handlers ---

  const handleMessageOwner = () => {
    if (contractor) {
      sendNotification(contractor.id, `${user.full_name} বকেয়া বেতনের জন্য মেসেজ দিয়েছেন।`, 'info');
      toast.success('মালিকের কাছে নোটিফিকেশন পাঠানো হয়েছে।');
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractor && leaveData.date && leaveData.reason) {
      sendNotification(
        contractor.id, 
        `${user.full_name} ছুটির আবেদন করেছেন। তারিখ: ${leaveData.date}, কারণ: ${leaveData.reason}`, 
        'alert'
      );
      toast.success('ছুটির আবেদন পাঠানো হয়েছে!');
      setLeaveData({ date: '', reason: '' });
      setActiveModal(null);
    }
  };

  const handleNoteSave = () => {
    localStorage.setItem(`worker_note_${user.id}`, myNote);
    toast.success('নোট সেভ করা হয়েছে!');
    setActiveModal(null);
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectId) {
      submitAttendanceRequest(user.id, selectedProjectId, today);
      toast.info('হাজিরা রিকোয়েস্ট পাঠানো হয়েছে');
      setActiveModal(null);
      setSelectedProjectId('');
    }
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(advanceAmount);
    if(amount > 0) {
      if(amount > user.balance) {
         if(!window.confirm(t('warning_advance'))) return;
      }
      submitAdvanceRequest(user.id, amount);
      toast.success('অগ্রিম বেতনের আবেদন পাঠানো হয়েছে।');
      setAdvanceAmount('');
      setActiveModal(null);
    }
  };

  // OT Calculation
  const hourlyRate = (user.daily_rate || 0) / 8;
  const calculatedOtAmount = otHours ? Math.round(Number(otHours) * hourlyRate) : 0;

  return (
    <div className="p-5 space-y-6 pb-28 relative bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      
      {/* Header Date/Time */}
      <div className="flex justify-between items-end mb-2">
         <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{dateString}</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">স্বাগতম</h1>
         </div>
         <div className="text-right">
             <div className="bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{timeString}</span>
             </div>
         </div>
      </div>

      {/* Due Balance Card (Digital Wallet Style) */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden h-52 flex flex-col justify-between group">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        <div className="relative z-10 flex justify-between items-start">
           <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">{t('current_due')}</p>
              <h1 className="text-4xl font-bold tracking-tight font-mono">৳ {user.balance.toLocaleString()}</h1>
           </div>
           <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
              <Wallet size={24} className="text-emerald-100" />
           </div>
        </div>

        <div className="relative z-10 flex justify-between items-end">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <Building2 size={14} className="text-emerald-200" />
                 <p className="text-sm font-bold tracking-wide text-emerald-50">{companyName}</p>
              </div>
              <p className="text-[10px] text-emerald-200 tracking-widest font-mono">ID: {user.id.slice(0,8)}</p>
           </div>
           
           <button 
             onClick={handleMessageOwner}
             className="bg-white text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 hover:bg-emerald-50 transition-colors active:scale-95"
           >
             <Bell size={14} />
             {t('message_owner')}
           </button>
        </div>
      </div>

      {/* Attendance CTA */}
      {!isPresentToday ? (
         <button 
            onClick={() => setActiveModal('attendance')}
            className="w-full bg-white dark:bg-slate-900 border-[3px] border-blue-500 dark:border-blue-600 p-1.5 rounded-[2rem] shadow-lg shadow-blue-100 dark:shadow-none active:scale-[0.98] transition-transform animate-pulse-slow group"
         >
            <div className="bg-blue-500 dark:bg-blue-600 rounded-[1.5rem] p-5 flex items-center justify-between group-hover:bg-blue-600 transition-colors">
               <div className="flex items-center gap-4 text-white">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                     <CheckCircle size={32} />
                  </div>
                  <div className="text-left">
                     <p className="font-bold text-lg leading-none mb-1">হাজিরা দিন</p>
                     <p className="text-xs text-blue-100 opacity-90">আজকের কাজ শুরু করতে এখানে ট্যাপ করুন</p>
                  </div>
               </div>
               <div className="bg-white/10 p-2 rounded-full">
                  <ChevronRight className="text-white opacity-80" />
               </div>
            </div>
         </button>
      ) : (
         <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-full text-emerald-600 dark:text-emerald-400">
               <CheckCircle size={28} />
            </div>
            <div>
               <p className="font-bold text-slate-800 dark:text-white text-lg">{t('attendance_done')}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{t('attendance_recorded')}</p>
            </div>
         </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4"></div>
          <p className="text-4xl font-bold text-slate-800 dark:text-white tracking-tighter">{totalDays}</p>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('total_work_days')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-4 -mt-4"></div>
          <p className="text-4xl font-bold text-slate-800 dark:text-white tracking-tighter">৳ {(totalEarned/1000).toFixed(1)}k</p>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('total_income')}</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 px-1 text-sm uppercase tracking-wider flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {t('quick_actions')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveModal('advance')}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 active:scale-95 transition-transform group hover:border-emerald-200"
          >
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3.5 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors">
               <HandCoins size={22} />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-700 dark:text-white text-sm">{t('request_advance')}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">টাকার আবেদন</p>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveModal('leave')}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 active:scale-95 transition-transform group hover:border-purple-200"
          >
            <div className="bg-purple-50 dark:bg-purple-900/30 p-3.5 rounded-full text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 transition-colors">
               <FileText size={22} />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-700 dark:text-white text-sm">{t('leave_request')}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">ছুটি নিন</p>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveModal('calc')}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 active:scale-95 transition-transform group hover:border-orange-200"
          >
            <div className="bg-orange-50 dark:bg-orange-900/30 p-3.5 rounded-full text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 transition-colors">
               <Calculator size={22} />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-700 dark:text-white text-sm">{t('ot_calculator')}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">OT হিসাব</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveModal('note')}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 active:scale-95 transition-transform group hover:border-blue-200"
          >
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3.5 rounded-full text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
               <CalendarClock size={22} />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-700 dark:text-white text-sm">{t('work_note')}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">নোট রাখুন</p>
            </div>
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Attendance Request Modal */}
      {activeModal === 'attendance' && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <CheckCircle className="text-blue-600" /> হাজিরা রিকোয়েস্ট
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mb-2">আজ আপনি কোন প্রজেক্টে কাজ করছেন?</p>
                  
                  <div className="max-h-60 overflow-y-auto space-y-3">
                     {projects.filter(p => p.status === 'active').map(project => (
                        <label 
                           key={project.id} 
                           className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${selectedProjectId === project.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                           <input 
                              type="radio" 
                              name="project" 
                              value={project.id} 
                              checked={selectedProjectId === project.id}
                              onChange={() => setSelectedProjectId(project.id)}
                              className="w-5 h-5 accent-blue-600"
                           />
                           <div>
                              <p className="font-bold text-slate-800 dark:text-white text-sm">{project.project_name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium"><MapPin size={10}/> {project.location}</p>
                           </div>
                        </label>
                     ))}
                  </div>

                  <button 
                     type="submit" 
                     disabled={!selectedProjectId}
                     className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none mt-4 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     <Send size={20} />
                     রিকোয়েস্ট পাঠান
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Advance Request Modal */}
      {activeModal === 'advance' && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <Wallet className="text-emerald-600" /> {t('request_advance')}
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleAdvanceSubmit} className="space-y-6">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2rem] text-center border border-emerald-100 dark:border-emerald-900/30">
                     <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1 uppercase tracking-wide">{t('current_due')}</p>
                     <p className="text-4xl font-bold text-slate-800 dark:text-white tracking-tighter">৳ {user.balance.toLocaleString()}</p>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">{t('request_amount')}</label>
                     <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl group-focus-within:text-emerald-500 transition-colors">৳</span>
                        <input 
                           type="number" 
                           required
                           autoFocus
                           value={advanceAmount}
                           onChange={(e) => setAdvanceAmount(e.target.value)}
                           className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:border-emerald-500 text-3xl font-bold text-slate-900 dark:text-white placeholder-slate-300 transition-all focus:bg-white dark:focus:bg-slate-900 shadow-inner"
                           placeholder="0"
                        />
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     <Send size={20} />
                     আবেদন পাঠান
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Leave Modal */}
      {activeModal === 'leave' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="text-purple-600" /> {t('leave_request')}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">ছুটির তারিখ</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="date" 
                         required
                         value={leaveData.date}
                         onChange={(e) => setLeaveData({...leaveData, date: e.target.value})}
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 text-sm text-slate-900 dark:text-white font-medium"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">কারণ</label>
                    <textarea 
                      required
                      value={leaveData.reason}
                      onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})}
                      placeholder="কেন ছুটি প্রয়োজন?"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 text-sm text-slate-900 dark:text-white h-32 resize-none font-medium"
                    />
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <Send size={20} />
                    আবেদন পাঠান
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* Calculator Modal */}
      {activeModal === 'calc' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Calculator className="text-orange-600"/> ওভারটাইম হিসাব
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-[2rem] mb-6 text-center border border-orange-100 dark:border-orange-900/30">
                 <p className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-bold uppercase">আপনার দৈনিক রেট</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white">৳ {user.daily_rate}</p>
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium bg-white/50 dark:bg-black/20 inline-block px-3 py-1 rounded-full">প্রতি ঘণ্টা রেট: ৳ {Math.round(hourlyRate)}</p>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">ওভারটাইম ঘণ্টা</label>
                    <div className="relative">
                       <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                       <input 
                         type="number" 
                         value={otHours}
                         onChange={(e) => setOtHours(e.target.value)}
                         placeholder="কত ঘণ্টা কাজ করবেন?"
                         className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-orange-500 text-lg font-bold text-slate-900 dark:text-white font-medium"
                       />
                    </div>
                 </div>

                 {otHours && (
                    <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-[1.5rem] border border-green-100 dark:border-green-800 text-center animate-scale-up">
                       <p className="text-xs text-green-700 dark:text-green-400 font-bold mb-1 uppercase">সম্ভাব্য আয়</p>
                       <p className="text-4xl font-bold text-green-600 dark:text-green-400 tracking-tighter">৳ {calculatedOtAmount}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Note Modal */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CalendarClock className="text-blue-600"/> ব্যক্তিগত নোট
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                 <textarea 
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    placeholder="আপনার কাজের হিসাব বা জরুরি তথ্য এখানে লিখে রাখুন..."
                    className="w-full p-5 bg-blue-50/50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-slate-200 h-48 resize-none leading-relaxed font-medium"
                 />

                 <button 
                   onClick={handleNoteSave}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <Save size={20} />
                    নোট সেভ করুন
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};