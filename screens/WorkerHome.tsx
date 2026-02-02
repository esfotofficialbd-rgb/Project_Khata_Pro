
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, FileText, Calculator, X, Send, Save, CheckCircle, Calendar, MapPin, Wallet, Coins, Loader2, AlertCircle, StickyNote, Hourglass, Activity, Megaphone, Users, Hammer, UserCheck, Clock, ShieldCheck, Phone, Sun, TrendingUp, PackageCheck, History, ChevronRight } from 'lucide-react';

export const WorkerHome = () => {
  const { user } = useAuth();
  const { attendance, sendNotification, users, projects, workReports, submitAttendanceRequest, submitAdvanceRequest, t, notifications, publicNotices, materialLogs, updateUserLocation, isLoadingData } = useData();
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
  const dateString = time.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', month: 'long' });

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

  // Automatic Tracking Ref
  const watchIdRef = useRef<number | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      const savedNote = localStorage.getItem(`worker_note_${user.id}`);
      if (savedNote) setMyNote(savedNote);

      const lastReqDate = localStorage.getItem(`pk_att_req_${user.id}`);
      if (lastReqDate === today) {
          setHasPendingRequest(true);
      } else {
          setHasPendingRequest(false);
      }
    }
  }, [user, today]);

  // Automatic Tracking Effect (Starts on Mount)
  useEffect(() => {
      if (!navigator.geolocation) {
          console.warn('Geolocation is not supported by this browser.');
          return;
      }

      // Start watching position automatically
      watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
              // Successfully got location - update DB
              updateUserLocation(pos.coords.latitude, pos.coords.longitude, true);
          },
          (err) => {
              console.error("Auto tracking error:", err);
              // Silent fail or minimal toast, we don't want to annoy user if GPS is off
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Cleanup on unmount
      return () => {
          if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
              // Mark as inactive when leaving the screen/app
              if(user) updateUserLocation(0, 0, false);
          }
      };
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).openAttendanceModal) {
      setActiveModal('attendance');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (!user) return null;

  const contractor = users.find(u => u.role === 'contractor');
  
  const myAttendance = attendance
    .filter(a => a.worker_id === user.id)
    .sort((a,b) => b.date.localeCompare(a.date));

  const totalDays = myAttendance.filter(a => a.status === 'P' || a.status === 'H').length;
  const totalEarned = myAttendance.reduce((sum, a) => sum + a.amount, 0);
  const totalOtHours = myAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0);

  const todaysRecord = myAttendance.find(a => a.date === today);
  const isPresentToday = !!todaysRecord;

  const currentProjectName = todaysRecord 
    ? projects.find(p => p.id === todaysRecord.project_id)?.project_name 
    : '';

  const hourlyRate = (user.daily_rate || 0) / 8;
  const calculatedOtAmount = otHours ? Math.round(Number(otHours) * hourlyRate) : 0;

  const recentActivities = myAttendance.slice(0, 3);

  const feedItems = useMemo(() => {
     let items: any[] = [];
     const recentNotices = publicNotices.sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
     recentNotices.forEach(notice => {
         items.push({
             id: `notice-${notice.id}`,
             type: 'public_notice',
             title: 'নোটিশ',
             desc: notice.message,
             icon: Megaphone,
             color: 'text-rose-600',
             bg: 'bg-rose-50 dark:bg-rose-900/30',
             border: 'border-rose-200 dark:border-rose-800'
         });
     });

     const activeProjects = projects.filter(p => p.status === 'active');
     activeProjects.forEach(p => {
        const workerCount = attendance.filter(a => a.project_id === p.id && a.date === today && (a.status === 'P' || a.status === 'H')).length;
        if (workerCount > 0) {
            items.push({
                id: `site-stats-${p.id}`,
                type: 'site_activity',
                title: p.project_name,
                desc: `সাইট আপডেট: ${workerCount} জন শ্রমিক কাজ করছে।`,
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50 dark:bg-blue-900/30',
                border: 'border-blue-200 dark:border-blue-800'
            });
        }
     });

     if (isPresentToday) {
        items.push({
           id: 'status-present',
           type: 'status',
           title: 'উপস্থিত',
           desc: `আপনি আজ ${currentProjectName || 'সাইটে'} কাজ করছেন।`,
           icon: CheckCircle,
           color: 'text-green-600',
           bg: 'bg-green-50 dark:bg-green-900/30',
           border: 'border-green-200 dark:border-green-800'
        });
     }

     if (items.length === 0) {
        items.push({
           id: 'default',
           type: 'info',
           title: 'প্রজেক্ট খাতা',
           desc: 'আপনার আজকের দিনটি শুভ হোক!',
           icon: Activity,
           color: 'text-slate-600',
           bg: 'bg-slate-100 dark:bg-slate-800',
           border: 'border-slate-200 dark:border-slate-700'
        });
     }

     return items;
  }, [projects, attendance, publicNotices, today, isPresentToday, currentProjectName]);

  useEffect(() => {
    if (feedItems.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % feedItems.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [feedItems.length, isPaused]);

  const currentItem = feedItems[currentFeedIndex] || feedItems[0];

  const handleMessageOwner = () => {
    if (contractor) {
      window.location.href = `tel:${contractor.phone}`;
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

  const getProjectName = (id: string) => {
      const p = projects.find(proj => proj.id === id);
      return p ? p.project_name : 'অজানা প্রজেক্ট';
  };

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide ml-1";

  // --- SKELETON COMPONENT ---
  const WorkerHomeSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {/* Balance Card Skeleton */}
        <div className="h-40 rounded-[1.8rem] bg-slate-200 dark:bg-slate-800 w-full mb-4"></div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-3 gap-2.5">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            ))}
        </div>

        {/* Tools Skeleton */}
        <div>
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mb-3"></div>
            <div className="grid grid-cols-3 gap-2.5">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                ))}
            </div>
        </div>

        {/* List Skeleton */}
        <div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mb-3"></div>
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="pb-24 relative bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-emerald-100">
      
      <div className="bg-white dark:bg-slate-900 px-4 pt-3 pb-5 rounded-b-[2rem] shadow-sm border-b border-slate-100 dark:border-slate-800 mb-3 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
         
         <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Sun size={10} className="text-orange-400" /> {greeting}
               </p>
               <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
                  {user.skill_type || 'কর্মী'}
               </h1>
            </div>
            
            {/* Auto Tracking Indicator (Visual Only) */}
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="opacity-80">লাইভ ট্র্যাকিং</span>
                </div>
                {isLoadingData && <p className="text-[9px] text-slate-400 animate-pulse flex items-center gap-1"><Loader2 size={8} className="animate-spin"/> Syncing...</p>}
            </div>
         </div>

         <div 
            className={`w-full relative overflow-hidden rounded-xl border ${currentItem.border} ${currentItem.bg} transition-all duration-500`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
         >
            {feedItems.length > 1 && (
               <div className="absolute top-0 left-0 w-full h-0.5 bg-black/5 dark:bg-white/5">
                  <div 
                     key={currentFeedIndex} 
                     className={`h-full ${currentItem.color.replace('text', 'bg')} opacity-50 origin-left animate-progress`}
                  ></div>
               </div>
            )}

            <div className="p-3 flex items-center gap-3">
               <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm ${currentItem.color} shrink-0`}>
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
            <WorkerHomeSkeleton />
         ) : (
            <>
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-[1.8rem] p-5 text-white shadow-lg shadow-emerald-500/10 dark:shadow-none relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                    
                    <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                <Wallet size={10} /> {t('current_due')}
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight">৳ {user.balance.toLocaleString()}</h1>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-inner">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                    </div>

                    <div className="flex gap-2.5">
                        <button 
                            onClick={() => setActiveModal('advance')}
                            className="flex-1 bg-white text-teal-800 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 hover:bg-emerald-50 active:scale-95 transition-all"
                        >
                            <Coins size={14} /> {t('request_advance')}
                        </button>
                        <button 
                            onClick={handleMessageOwner}
                            className="flex-1 bg-black/20 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 hover:bg-black/30 border border-white/10 active:scale-95 transition-all backdrop-blur-sm"
                        >
                            <Phone size={14} /> ঠিকাদার
                        </button>
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{totalDays}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">মোট দিন</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(totalEarned/1000)}k</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">মোট আয়</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{totalOtHours}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">ঘণ্টা OT</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> টুলস
                    </h3>
                    <div className="grid grid-cols-3 gap-2.5">
                    {[
                        { icon: FileText, label: 'ছুটি', sub: 'আবেদন', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => setActiveModal('leave') },
                        { icon: Calculator, label: 'OT', sub: 'হিসাব', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', action: () => setActiveModal('calc') },
                        { icon: StickyNote, label: 'নোট', sub: 'খাতা', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => setActiveModal('note') },
                    ].map((item, idx) => (
                        <button 
                            key={idx} 
                            onClick={item.action}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                        >
                            <div className={`${item.bg} p-2.5 rounded-full ${item.color} shadow-sm`}>
                                <item.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="text-center leading-none">
                                <p className="font-bold text-slate-700 dark:text-white text-[11px]">{item.label}</p>
                            </div>
                        </button>
                    ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-3 bg-blue-500 rounded-full"></div> সাম্প্রতিক কাজ
                        </h3>
                        <button 
                        onClick={() => navigate('/history')}
                        className="text-[10px] text-blue-600 font-bold flex items-center gap-1"
                        >
                        সব দেখুন <ChevronRight size={10} />
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                    {recentActivities.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-400 font-bold">কোন সাম্প্রতিক কাজ নেই</p>
                        </div>
                    ) : (
                        recentActivities.map((act) => (
                            <div key={act.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-slate-500 font-bold text-[10px] text-center min-w-[40px]">
                                    <span className="block">{new Date(act.date).getDate()}</span>
                                    <span className="block text-[8px] uppercase">{new Date(act.date).toLocaleDateString('en-US', {month: 'short'})}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white text-xs truncate max-w-[150px]">{getProjectName(act.project_id)}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        {act.status === 'P' ? 'ফুল ডে' : 'হাফ ডে'} {act.overtime ? `+ ${act.overtime}h OT` : ''}
                                    </p>
                                </div>
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">৳{act.amount}</span>
                            </div>
                        ))
                    )}
                    </div>
                </div>
            </>
         )}
      </div>

      {/* --- MODALS --- */}
      {/* Attendance Modal */}
      {activeModal === 'attendance' && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
               
               {isPresentToday ? (
                  <div className="text-center py-6">
                     <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow shadow-lg shadow-green-100 dark:shadow-none">
                        <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">হাজিরা সম্পন্ন হয়েছে</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">আপনার আজকের উপস্থিতি রেকর্ড করা হয়েছে।</p>
                     
                     <button onClick={() => setActiveModal(null)} className="mt-8 w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        বন্ধ করুন
                     </button>
                  </div>
               ) : hasPendingRequest ? (
                  <div className="text-center py-6">
                     <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Hourglass size={48} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">রিকোয়েস্ট পেন্ডিং</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-4 leading-relaxed">
                        আপনার হাজিরার আবেদন পাঠানো হয়েছে। ঠিকাদার বা সুপারভাইজার অ্যাপ্রুভ করলে কনফার্মেশন পাবেন।
                     </p>
                     
                     <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        বন্ধ করুন
                     </button>
                  </div>
               ) : (
                  <>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600">
                              <CheckCircle size={20}/>
                           </div>
                           হাজিরা দিন
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
                     </div>
                     
                     <form onSubmit={handleAttendanceSubmit} className="space-y-6">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ml-1">আজ কোন সাইটে কাজ করছেন?</p>
                        
                        {projects.length === 0 ? (
                           <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50">
                              <p className="text-slate-400 text-xs font-bold">কোন প্রজেক্ট পাওয়া যায়নি</p>
                           </div>
                        ) : (
                           <div className="max-h-64 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                              {projects.filter(p => p.status === 'active').map(project => (
                                 <label 
                                    key={project.id} 
                                    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${selectedProjectId === project.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                 >
                                    <input 
                                       type="radio" 
                                       name="project" 
                                       value={project.id} 
                                       checked={selectedProjectId === project.id}
                                       onChange={() => setSelectedProjectId(project.id)}
                                       className="w-5 h-5 accent-emerald-600"
                                    />
                                    <div>
                                       <p className="font-bold text-slate-800 dark:text-white text-sm">{project.project_name}</p>
                                       <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={10}/> {project.location}</p>
                                    </div>
                                 </label>
                              ))}
                           </div>
                        )}

                        <button 
                           type="submit" 
                           disabled={!selectedProjectId || isSubmitting}
                           className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none mt-2 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                        >
                           {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                           রিকোয়েস্ট পাঠান
                        </button>
                     </form>
                  </>
               )}
            </div>
         </div>
      )}

      {activeModal === 'advance' && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-scale-up border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-xl text-teal-600">
                        <Coins size={20}/>
                     </div>
                     অগ্রিম বেতন
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleAdvanceSubmit} className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-5 rounded-2xl text-center border border-emerald-100 dark:border-emerald-900/30">
                     <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-1">বর্তমান বকেয়া</p>
                     <p className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">৳ {user.balance.toLocaleString()}</p>
                  </div>

                  <div>
                     <label className={labelClass}>কত টাকা প্রয়োজন?</label>
                     <div className="relative mb-4">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">৳</span>
                        <input 
                           type="number" 
                           required
                           autoFocus
                           min="1"
                           value={advanceAmount}
                           onChange={(e) => setAdvanceAmount(e.target.value)}
                           className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-500 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-300 shadow-sm"
                           placeholder="0"
                        />
                     </div>
                     <div className="flex gap-2">
                        {[500, 1000, 2000].map(amt => (
                           <button 
                              key={amt}
                              type="button"
                              onClick={() => setAdvanceAmount(amt.toString())}
                              className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 transition-all"
                           >
                              ৳{amt}
                           </button>
                        ))}
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>আবেদন পাঠান <Send size={20}/></>}
                  </button>
               </form>
            </div>
         </div>
      )}

      {activeModal === 'leave' && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-scale-up border-t border-slate-100 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                        <Calendar size={20}/>
                    </div>
                    ছুটির আবেদন
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-6">
                 <div>
                    <label className={labelClass}>তারিখ</label>
                    <input 
                      type="date" 
                      required
                      value={leaveData.date}
                      onChange={(e) => setLeaveData({...leaveData, date: e.target.value})}
                      className={inputClass}
                    />
                 </div>
                 
                 <div>
                    <label className={labelClass}>কারণ</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {['অসুস্থতা', 'পারিবারিক কাজ', 'জরুরী প্রয়োজন', 'অন্যান্য'].map(r => (
                           <button
                              key={r}
                              type="button"
                              onClick={() => setLeaveData({...leaveData, reason: r})}
                              className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${leaveData.reason === r ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
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
                      className={`${inputClass} h-24 resize-none leading-relaxed`}
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none mt-2 active:scale-95 transition-transform flex items-center justify-center gap-2 text-base">
                    আবেদন নিশ্চিত করুন <CheckCircle size={20}/>
                 </button>
              </form>
           </div>
        </div>
      )}

      {activeModal === 'calc' && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-scale-up border-t border-slate-100 dark:border-slate-800">
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-600">
                        <Calculator size={20}/>
                     </div>
                     ওভারটাইম হিসাব
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
               </div>

               <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">আপনার দৈনিক রেট</span>
                        <span className="font-bold text-slate-800 dark:text-white">৳ {user.daily_rate}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">প্রতি ঘণ্টা (৮ ঘণ্টা ডিউটি)</span>
                        <span className="font-bold text-emerald-600">৳ {hourlyRate.toFixed(1)}</span>
                     </div>
                  </div>

                  <div>
                     <label className={labelClass}>কত ঘণ্টা কাজ করেছেন?</label>
                     <div className="relative">
                        <input 
                           type="number" 
                           autoFocus
                           min="0"
                           value={otHours}
                           onChange={(e) => setOtHours(e.target.value)}
                           className={`${inputClass} pr-16 text-xl`}
                           placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">ঘণ্টা</span>
                     </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 rounded-2xl text-white text-center shadow-lg shadow-orange-200 dark:shadow-none">
                     <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1">মোট আয় হবে</p>
                     <p className="text-4xl font-bold">৳ {calculatedOtAmount.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeModal === 'note' && (
         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-scale-up border-t border-slate-100 dark:border-slate-800">
               <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600">
                        <StickyNote size={20}/>
                     </div>
                     ব্যক্তিগত নোট
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
               </div>

               <div className="space-y-4">
                  <textarea 
                     value={myNote}
                     onChange={(e) => setMyNote(e.target.value)}
                     placeholder="এখানে আপনার ব্যক্তিগত হিসাব বা নোট লিখুন..."
                     className={`${inputClass} h-48 resize-none leading-relaxed text-base`}
                  />
                  <button 
                     onClick={handleNoteSave}
                     className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                  >
                     <Save size={20} /> সেভ করুন
                  </button>
               </div>
            </div>
         </div>
      )}

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
