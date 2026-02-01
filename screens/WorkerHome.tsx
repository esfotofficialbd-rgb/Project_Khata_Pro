import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, FileText, Calculator, Building2, X, Send, Save, CheckCircle, Calendar, MapPin, Wallet, Coins, Loader2, ChevronRight, AlertCircle, StickyNote, Hourglass, Activity, Megaphone, Users, Briefcase, TrendingUp, Hammer, UserCheck, Clock } from 'lucide-react';

export const WorkerHome = () => {
  const { user } = useAuth();
  const { attendance, sendNotification, users, projects, workReports, submitAttendanceRequest, submitAdvanceRequest, t, notifications } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Clock & Greeting
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const hour = new Date().getHours();
    if (hour < 5) setGreeting('শুভ রাত্রি');
    else if (hour < 12) setGreeting('শুভ সকাল');
    else if (hour < 17) setGreeting('শুভ দুপুর');
    else setGreeting('শুভ সন্ধ্যা');
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' });

  // Modal States
  const [activeModal, setActiveModal] = useState<'leave' | 'calc' | 'note' | 'attendance' | 'advance' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feed State
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Feature States
  const [leaveData, setLeaveData] = useState({ date: '', reason: 'পারিবারিক কাজ' });
  const [otHours, setOtHours] = useState('');
  const [myNote, setMyNote] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      const savedNote = localStorage.getItem(`worker_note_${user.id}`);
      if (savedNote) setMyNote(savedNote);

      // Check local storage for pending request for TODAY
      const lastReqDate = localStorage.getItem(`pk_att_req_${user.id}`);
      if (lastReqDate === today) {
          setHasPendingRequest(true);
      } else {
          setHasPendingRequest(false);
      }
    }
  }, [user, today]);

  useEffect(() => {
    if (location.state && (location.state as any).openAttendanceModal) {
      setActiveModal('attendance');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (!user) return null;

  const contractor = users.find(u => u.role === 'contractor');
  
  const myAttendance = attendance.filter(a => a.worker_id === user.id);
  const totalDays = myAttendance.filter(a => a.status === 'P' || a.status === 'H').length;
  const totalEarned = myAttendance.reduce((sum, a) => sum + a.amount, 0);
  const totalOtHours = myAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0);

  // Check Actual Attendance Record (Approved)
  const todaysRecord = attendance.find(a => a.worker_id === user.id && a.date === today);
  const isPresentToday = !!todaysRecord;

  // Determine Current Project Name (if present)
  const currentProjectName = todaysRecord 
    ? projects.find(p => p.id === todaysRecord.project_id)?.project_name 
    : '';

  const hourlyRate = (user.daily_rate || 0) / 8;
  const calculatedOtAmount = otHours ? Math.round(Number(otHours) * hourlyRate) : 0;

  // --- SMART PUBLIC FEED GENERATION (Global Data) ---
  const feedItems = useMemo(() => {
     let items: any[] = [];

     // 1. Today's Project Activity (How many workers on which project)
     const activeProjects = projects.filter(p => p.status === 'active');
     
     activeProjects.forEach(p => {
        // Count workers for this project today
        const workerCount = attendance.filter(a => a.project_id === p.id && a.date === today && (a.status === 'P' || a.status === 'H')).length;
        
        // Find supervisor for this project (either assigned or present)
        const supervisor = users.find(u => u.role === 'supervisor' && (u.assigned_project_id === p.id));
        
        if (workerCount > 0) {
            items.push({
                id: `site-stats-${p.id}`,
                type: 'site_activity',
                title: p.project_name,
                desc: `সাইট আপডেট: ${workerCount} জন শ্রমিক কাজ করছে।`,
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                border: 'border-blue-200 dark:border-blue-800'
            });
        }

        if (supervisor) {
             // Only show supervisor info occasionally or if active
             items.push({
                id: `sup-${p.id}`,
                type: 'supervisor_info',
                title: 'সুপারভাইজার অন সাইট',
                desc: `${p.project_name}-এ দায়িত্বে আছেন ${supervisor.full_name}।`,
                icon: UserCheck,
                color: 'text-purple-600',
                bg: 'bg-purple-100 dark:bg-purple-900/30',
                border: 'border-purple-200 dark:border-purple-800'
             });
        }
     });

     // 2. New Projects (Last 7 days)
     const oneWeekAgo = new Date();
     oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
     
     activeProjects.forEach(p => {
         // Assuming we can check start date, creating a "New Project" alert
         // (Using start_date string comparison for simplicity)
         if (new Date(p.start_date) >= oneWeekAgo) {
             items.push({
                 id: `new-proj-${p.id}`,
                 type: 'new_project',
                 title: 'নতুন প্রজেক্ট শুরু হয়েছে',
                 desc: `${p.project_name} - ${p.location}`,
                 icon: Megaphone,
                 color: 'text-emerald-600',
                 bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                 border: 'border-emerald-200 dark:border-emerald-800'
             });
         }
     });

     // 3. Work Reports (Today's progress)
     const todaysReports = workReports.filter(r => r.date === today);
     todaysReports.forEach(r => {
         const p = projects.find(proj => proj.id === r.project_id);
         items.push({
             id: `report-${r.id}`,
             type: 'work_report',
             title: p ? p.project_name : 'কাজের আপডেট',
             desc: `কাজ চলছে: ${r.description.substring(0, 30)}...`,
             icon: Hammer,
             color: 'text-orange-600',
             bg: 'bg-orange-100 dark:bg-orange-900/30',
             border: 'border-orange-200 dark:border-orange-800'
         });
     });

     // 4. Completed Projects
     const completedProjects = projects.filter(p => p.status === 'completed');
     if (completedProjects.length > 0) {
         const lastCompleted = completedProjects[completedProjects.length - 1];
         items.push({
             id: `comp-${lastCompleted.id}`,
             type: 'completed',
             title: 'প্রজেক্ট সম্পন্ন',
             desc: `${lastCompleted.project_name}-এর কাজ শেষ হয়েছে।`,
             icon: CheckCircle,
             color: 'text-slate-600',
             bg: 'bg-slate-200 dark:bg-slate-800',
             border: 'border-slate-300 dark:border-slate-700'
         });
     }

     // If empty, show default company status
     if (items.length === 0) {
        items.push({
           id: 'default',
           type: 'info',
           title: 'প্রজেক্ট খাতা',
           desc: 'আজকের কাজের সকল আপডেট এখানে দেখুন।',
           icon: Activity,
           color: 'text-slate-600',
           bg: 'bg-slate-100 dark:bg-slate-800',
           border: 'border-slate-200 dark:border-slate-700'
        });
     }

     // Shuffle or Sort? Let's prioritize New Projects and Site Activity
     return items.sort((a, b) => {
         if (a.type === 'new_project') return -1;
         if (a.type === 'site_activity') return -1;
         return 0;
     });

  }, [projects, attendance, users, workReports, today]);

  // Auto-Rotate Logic
  useEffect(() => {
    if (feedItems.length <= 1 || isPaused) return;
    if (currentFeedIndex >= feedItems.length) setCurrentFeedIndex(0);

    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % feedItems.length);
    }, 4000); 

    return () => clearInterval(interval);
  }, [feedItems.length, isPaused]);

  const currentItem = feedItems[currentFeedIndex] || feedItems[0];

  // --- Handlers ---
  const handleMessageOwner = () => {
    if (contractor) {
      sendNotification(contractor.id, `${user.full_name} পেমেন্টের ব্যাপারে যোগাযোগ করতে চায়।`, 'info');
      toast.success('মালিকের কাছে নোটিফিকেশন পাঠানো হয়েছে।');
    } else {
        toast.error('ঠিকাদার পাওয়া যায়নি।');
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractor && leaveData.date && leaveData.reason) {
      sendNotification(contractor.id, `${user.full_name} ছুটির আবেদন করেছেন।`, 'alert');
      toast.success('ছুটির আবেদন পাঠানো হয়েছে!');
      setLeaveData({ date: '', reason: 'পারিবারিক কাজ' });
      setActiveModal(null);
    } else if (!contractor) {
        toast.error('ঠিকাদার পাওয়া যায়নি।');
    }
  };

  const handleNoteSave = () => {
    localStorage.setItem(`worker_note_${user.id}`, myNote);
    toast.success('নোট সেভ করা হয়েছে!');
    setActiveModal(null);
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectId) {
      setIsSubmitting(true);
      try {
        await submitAttendanceRequest(user.id, selectedProjectId, today);
        // Set Pending State locally to show immediate feedback
        localStorage.setItem(`pk_att_req_${user.id}`, today);
        setHasPendingRequest(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(advanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsSubmitting(true);
    try {
        await submitAdvanceRequest(user.id, amount);
        setAdvanceAmount('');
        setActiveModal(null);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-28 relative bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 px-5 pt-4 pb-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 dark:border-slate-800">
         <div className="flex justify-between items-end mb-4">
            <div>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 opacity-80">
                  {greeting}
               </p>
               <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">
                  {user.full_name.split(' ')[0]}
               </h1>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 mb-0.5">{dateString}</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono leading-none">{timeString}</p>
            </div>
         </div>

         {/* --- SMART PUBLIC FEED (Global Updates) --- */}
         <div 
            className={`w-full relative overflow-hidden rounded-2xl border ${currentItem.border} ${currentItem.bg} transition-all duration-500`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
         >
            {/* Progress Bar */}
            {feedItems.length > 1 && (
               <div className="absolute top-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5">
                  <div 
                     key={currentFeedIndex} 
                     className={`h-full ${currentItem.color.replace('text', 'bg')} opacity-50 origin-left animate-progress`}
                  ></div>
               </div>
            )}

            <div className="p-3 flex items-center gap-3">
               <div className={`p-2.5 rounded-full bg-white/60 dark:bg-black/20 backdrop-blur-sm ${currentItem.color} shrink-0`}>
                  <currentItem.icon size={20} />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                     <p className={`text-[10px] font-bold uppercase tracking-wider ${currentItem.color} opacity-80`}>
                        লাইভ অ্যাক্টিভিটি ফিড
                     </p>
                     {feedItems.length > 1 && (
                        <span className="text-[9px] font-bold text-slate-400 bg-white/50 dark:bg-black/20 px-1.5 rounded">
                           {currentFeedIndex + 1}/{feedItems.length}
                        </span>
                     )}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-xs truncate leading-tight">
                     {currentItem.title}
                  </h3>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium opacity-90 line-clamp-1">
                     {currentItem.desc}
                  </p>
               </div>
            </div>
         </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
         
         {/* Balance Card */}
         <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-100 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">{t('current_due')}</p>
                     <h1 className="text-3xl font-bold tracking-tight font-mono">৳ {user.balance.toLocaleString()}</h1>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                     <Wallet size={20} className="text-emerald-100" />
                  </div>
               </div>

               <div className="flex gap-2">
                  <button 
                     onClick={() => setActiveModal('advance')}
                     className="flex-1 bg-white text-emerald-700 py-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-50 active:scale-95 transition-all"
                  >
                     <Coins size={14} /> {t('request_advance')}
                  </button>
                  <button 
                     onClick={handleMessageOwner}
                     className="flex-1 bg-emerald-700/50 text-white py-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-700 border border-emerald-500/30 active:scale-95 transition-all"
                  >
                     <Bell size={14} /> {t('message_owner')}
                  </button>
               </div>
            </div>
         </div>

         {/* Quick Stats Grid */}
         <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
               <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalDays}</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">মোট দিন</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
               <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(totalEarned/1000)}k</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">মোট আয়</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
               <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalOtHours}</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">ঘণ্টা OT</p>
            </div>
         </div>

         {/* Tools Section */}
         <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> টুলস ও অ্যাকশন
            </h3>
            <div className="grid grid-cols-3 gap-3">
               {[
                  { icon: FileText, label: 'ছুটি', sub: 'আবেদন', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => setActiveModal('leave') },
                  { icon: Calculator, label: 'OT', sub: 'ক্যালকুলেটর', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', action: () => setActiveModal('calc') },
                  { icon: StickyNote, label: 'নোট', sub: 'খাতা', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => setActiveModal('note') },
               ].map((item, idx) => (
                  <button 
                     key={idx} 
                     onClick={item.action}
                     className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group hover:border-slate-200"
                  >
                     <div className={`${item.bg} p-2.5 rounded-full ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={20} />
                     </div>
                     <div className="text-center leading-tight">
                        <p className="font-bold text-slate-700 dark:text-white text-xs">{item.label}</p>
                        <p className="text-[9px] text-slate-400">{item.sub}</p>
                     </div>
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Attendance Modal Logic: Approved > Pending > Form */}
      {activeModal === 'attendance' && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
               
               {/* 1. If Already Present (Approved) */}
               {isPresentToday ? (
                  <div className="text-center py-6">
                     <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                        <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">হাজিরা সম্পন্ন হয়েছে</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">আপনার আজকের উপস্থিতি রেকর্ড করা হয়েছে।</p>
                     
                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-left">
                        <div className="flex justify-between mb-2">
                           <span className="text-xs font-bold text-slate-400 uppercase">প্রজেক্ট</span>
                           <span className="text-xs font-bold text-slate-800 dark:text-white">{currentProjectName || 'জেনারেল'}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-xs font-bold text-slate-400 uppercase">স্টেটাস</span>
                           <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-md">Approved</span>
                        </div>
                     </div>
                     
                     <button onClick={() => setActiveModal(null)} className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl">
                        বন্ধ করুন
                     </button>
                  </div>
               ) : hasPendingRequest ? (
                  /* 2. If Pending Request */
                  <div className="text-center py-6">
                     <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Hourglass size={40} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">রিকোয়েস্ট পেন্ডিং</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                        আপনার হাজিরার আবেদন পাঠানো হয়েছে। ঠিকাদার বা সুপারভাইজার অ্যাপ্রুভ করলে কনফার্মেশন পাবেন।
                     </p>
                     
                     <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
                           <Clock size={12}/> অপেক্ষা করুন
                        </p>
                     </div>

                     <button onClick={() => setActiveModal(null)} className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl">
                        বন্ধ করুন
                     </button>
                  </div>
               ) : (
                  /* 3. Default: Attendance Form */
                  <>
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <CheckCircle className="text-emerald-600" size={20}/> হাজিরা দিন
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500"><X size={20}/></button>
                     </div>
                     
                     <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">আজ কোন সাইটে কাজ করছেন?</p>
                        
                        {projects.length === 0 ? (
                           <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                              <p className="text-slate-400 text-xs">কোন প্রজেক্ট পাওয়া যায়নি</p>
                           </div>
                        ) : (
                           <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                              {projects.filter(p => p.status === 'active').map(project => (
                                 <label 
                                    key={project.id} 
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedProjectId === project.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                 >
                                    <input 
                                       type="radio" 
                                       name="project" 
                                       value={project.id} 
                                       checked={selectedProjectId === project.id}
                                       onChange={() => setSelectedProjectId(project.id)}
                                       className="w-4 h-4 accent-blue-600"
                                    />
                                    <div>
                                       <p className="font-bold text-slate-800 dark:text-white text-sm">{project.project_name}</p>
                                       <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin size={8}/> {project.location}</p>
                                    </div>
                                 </label>
                              ))}
                           </div>
                        )}

                        <button 
                           type="submit" 
                           disabled={!selectedProjectId || isSubmitting}
                           className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg mt-2 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                           {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Send size={18} />}
                           রিকোয়েস্ট পাঠান
                        </button>
                     </form>
                  </>
               )}
            </div>
         </div>
      )}

      {/* Advance Modal */}
      {activeModal === 'advance' && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <Coins className="text-emerald-600" size={20}/> অগ্রিম বেতন
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleAdvanceSubmit} className="space-y-6">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center border border-emerald-100 dark:border-emerald-900/30">
                     <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">বর্তমান বকেয়া</p>
                     <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">৳ {user.balance.toLocaleString()}</p>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">কত টাকা প্রয়োজন?</label>
                     <div className="relative mb-3">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">৳</span>
                        <input 
                           type="number" 
                           required
                           autoFocus
                           min="1"
                           value={advanceAmount}
                           onChange={(e) => setAdvanceAmount(e.target.value)}
                           className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-300"
                           placeholder="0"
                        />
                     </div>
                     {/* Quick Presets */}
                     <div className="flex gap-2">
                        {[500, 1000, 2000].map(amt => (
                           <button 
                              key={amt}
                              type="button"
                              onClick={() => setAdvanceAmount(amt.toString())}
                              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 border border-transparent hover:border-emerald-200 transition-all"
                           >
                              ৳{amt}
                           </button>
                        ))}
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>আবেদন পাঠান <Send size={18}/></>}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Leave Modal */}
      {activeModal === 'leave' && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar className="text-purple-600" size={20}/> ছুটির আবেদন
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500"><X size={20}/></button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-5">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">তারিখ</label>
                    <input 
                      type="date" 
                      required
                      value={leaveData.date}
                      onChange={(e) => setLeaveData({...leaveData, date: e.target.value})}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 text-sm font-bold text-slate-900 dark:text-white"
                    />
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">কারণ</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {['অসুস্থতা', 'পারিবারিক কাজ', 'জরুরী প্রয়োজন', 'অন্যান্য'].map(r => (
                           <button
                              key={r}
                              type="button"
                              onClick={() => setLeaveData({...leaveData, reason: r})}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${leaveData.reason === r ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                           >
                              {r}
                           </button>
                        ))}
                    </div>
                    <textarea 
                      required
                      value={leaveData.reason}
                      onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})}
                      placeholder="বিস্তারিত লিখুন..."
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 text-sm font-medium text-slate-900 dark:text-white h-20 resize-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg mt-2 active:scale-95 transition-transform flex items-center justify-center gap-2">
                    আবেদন নিশ্চিত করুন <CheckCircle size={18}/>
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Calc Modal */}
      {activeModal === 'calc' && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Calculator className="text-orange-600" size={20}/> OT ক্যালকুলেটর
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500"><X size={20}/></button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-center">
                    <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">ঘণ্টা প্রতি রেট</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">৳ {Math.round(hourlyRate)}</p>
                 </div>
                 <div className="text-slate-300 dark:text-slate-600">
                    <X size={24} />
                 </div>
                 <div className="flex-1">
                    <input 
                      type="number" 
                      value={otHours}
                      onChange={(e) => setOtHours(e.target.value)}
                      placeholder="ঘণ্টা"
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-orange-500 text-xl font-bold text-slate-900 dark:text-white text-center"
                    />
                 </div>
              </div>

              <div className="bg-slate-900 dark:bg-white p-5 rounded-2xl text-center shadow-lg">
                 <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">মোট সম্ভাব্য আয়</p>
                 <p className="text-4xl font-bold text-white dark:text-slate-900">৳ {calculatedOtAmount}</p>
              </div>
              
              <p className="text-[10px] text-slate-400 text-center mt-4 flex items-center justify-center gap-1">
                 <AlertCircle size={12}/>
                 এটি শুধুমাত্র আপনার হিসাবের জন্য, মূল হাজিরায় যোগ হবে না।
              </p>
           </div>
        </div>
      )}

      {/* Note Modal */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <StickyNote className="text-blue-600" size={20}/> ব্যক্তিগত নোট
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500"><X size={20}/></button>
              </div>
              
              <div className="relative">
                 <div className="absolute top-0 left-0 w-full h-8 bg-yellow-200/50 dark:bg-yellow-900/20 rounded-t-xl border-b border-yellow-200 dark:border-yellow-800/30 flex items-center px-4">
                    <div className="flex gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-red-400"></div>
                       <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                       <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                 </div>
                 <textarea 
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    placeholder="আপনার ব্যক্তিগত হিসাব বা তথ্য লিখে রাখুন..."
                    className="w-full p-4 pt-10 bg-yellow-50 dark:bg-slate-800 border border-yellow-100 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-white h-48 resize-none leading-relaxed"
                 />
              </div>
              
              <button onClick={handleNoteSave} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2">
                 <Save size={18} /> সেভ করুন
              </button>
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