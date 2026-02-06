
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { Calendar, ChevronLeft, ChevronRight, X, Search, QrCode, Clock, CheckCircle, UserCheck, RefreshCw, Smartphone, AlertTriangle, UserX, CheckSquare, Camera, Keyboard, Filter, MoreHorizontal, Banknote, Users, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';

export const Khata = () => {
  const { users, projects, markAttendance, addOvertime, attendance, getDailyStats, markRemainingAbsent } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<{workerId: string, status: 'P' | 'H'} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'present' | 'absent'>('all');
  const [activeSkillFilter, setActiveSkillFilter] = useState<string>('all');
  
  // Overtime State
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [selectedWorkerForOt, setSelectedWorkerForOt] = useState<string | null>(null);
  const [otHours, setOtHours] = useState('');

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanError, setScanError] = useState('');
  const [manualIdInput, setManualIdInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null); 
  const requestRef = useRef<number>(0);

  const isSupervisor = user?.role === 'supervisor';
  const themeColor = isSupervisor ? 'purple' : 'blue';

  // Logic: Show ONLY Workers
  const allStaff = users.filter(u => u.role === 'worker');

  // --- Logic: Real-time Calculations ---
  
  // 1. Get Daily Status
  const getStatus = (workerId: string) => {
    const record = attendance.find(a => a.worker_id === workerId && a.date === selectedDate);
    return record ? record.status : null;
  };

  const getOvertime = (workerId: string) => {
    const record = attendance.find(a => a.worker_id === workerId && a.date === selectedDate);
    return record?.overtime || 0;
  };

  // 2. Filter Logic
  const filteredWorkers = useMemo(() => {
      return allStaff.filter(worker => {
          const status = getStatus(worker.id);
          const matchesSearch = worker.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || worker.phone.includes(searchQuery);
          
          let matchesSkill = true;
          if (activeSkillFilter !== 'all') {
              matchesSkill = worker.skill_type === activeSkillFilter;
          }

          let matchesStatus = true;
          if (activeFilter === 'pending') matchesStatus = !status;
          else if (activeFilter === 'present') matchesStatus = status === 'P' || status === 'H';
          else if (activeFilter === 'absent') matchesStatus = status === 'A';

          return matchesSearch && matchesSkill && matchesStatus;
      }).sort((a, b) => {
          // Sort pending first
          const statusA = getStatus(a.id) ? 1 : 0;
          const statusB = getStatus(b.id) ? 1 : 0;
          return statusA - statusB;
      });
  }, [allStaff, searchQuery, activeFilter, activeSkillFilter, attendance, selectedDate]);

  // 3. Stats Calculation (Dynamic)
  const stats = useMemo(() => {
      let present = 0;
      let absent = 0;
      let cost = 0;
      let pending = 0;

      allStaff.forEach(w => {
          const record = attendance.find(a => a.worker_id === w.id && a.date === selectedDate);
          if (record) {
              if (record.status === 'P' || record.status === 'H') {
                  present++;
                  cost += record.amount;
              }
              if (record.status === 'A') absent++;
          } else {
              pending++;
          }
      });
      return { present, absent, pending, cost };
  }, [attendance, allStaff, selectedDate]);

  // Unique Skills for Filter
  const uniqueSkills = ['all', ...Array.from(new Set(users.filter(u => u.role === 'worker').map(w => w.skill_type || 'Unknown')))];

  // --- Handlers ---

  useEffect(() => {
    if (location.state && (location.state as any).autoStartScan) {
        startScanning();
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleStatusClick = async (workerId: string, status: 'P' | 'H') => {
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
    setCurrentAction({ workerId, status });
    setModalOpen(true);
  };

  const handleOtClick = (workerId: string) => {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDate === todayStr) {
          const currentHour = new Date().getHours();
          if (currentHour < 17) {
              toast.error('সময় হয়নি', 'বিকেল ৫টার পর ওভারটাইম যুক্ত করা যাবে।');
              return;
          }
      }
      setSelectedWorkerForOt(workerId);
      setOtModalOpen(true);
  };

  const confirmProject = (projectId: string) => {
    if (currentAction) {
      markAttendance(currentAction.workerId, currentAction.status, projectId, selectedDate);
      closeModal();
      closeScanner();
    }
  };

  const closeModal = () => {
      setModalOpen(false);
      setCurrentAction(null);
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const displayDate = new Date(selectedDate).toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- QR & Media Logic ---
  const cleanupMedia = () => {
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const closeScanner = () => {
    cleanupMedia();
    setIsScanning(false);
  };

  const startScanning = () => {
    cleanupMedia();
    setIsScanning(true);
    setScanError('');
    setShowManualInput(false);

    const constraints = {
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScanError("আপনার ব্রাউজারে ক্যামেরা সাপোর্ট নেই।");
        return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.playsInline = true;
          videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                 requestRef.current = requestAnimationFrame(tick);
              }).catch(e => setScanError("ক্যামেরা চালু সমস্যা।"));
          };
        }
      })
      .catch((err) => setScanError("ক্যামেরা পারমিশন নেই।"));
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      
      if (canvas && overlay) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        overlay.height = video.videoHeight;
        overlay.width = video.videoWidth;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const overlayCtx = overlay.getContext("2d");
        
        if (ctx && overlayCtx) {
          overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
          
          if (code) {
             const scannedData = code.data.trim();
             const worker = allStaff.find(w => w.id === scannedData);
             if (worker) {
               if (navigator.vibrate) navigator.vibrate(200);
               const stream = video.srcObject as MediaStream;
               stream?.getTracks().forEach(t => t.stop());
               setTimeout(() => {
                 setIsScanning(false);
                 setCurrentAction({ workerId: worker.id, status: 'P' });
                 setModalOpen(true);
               }, 300);
               return; 
             }
          }
        }
      }
    }
    if (isScanning) requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => { return () => cleanupMedia(); }, []);

  // --- Render ---

  return (
    <div className="pb-28 min-h-screen bg-slate-50 dark:bg-slate-950 relative font-sans selection:bg-indigo-100">
      
      {/* 1. Improved Sticky Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 pt-4 pb-3 shadow-sm border-b border-slate-200/50 dark:border-slate-800 sticky top-0 z-30 transition-all">
        
        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 shadow-inner">
          <button onClick={() => changeDate(-1)} className="p-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 rounded-xl shadow-sm text-slate-500 dark:text-slate-300 active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
                <Calendar size={16} className={isSupervisor ? "text-purple-500" : "text-blue-500"} />
                {displayDate}
             </div>
             {selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-0.5 rounded-full mt-0.5 border border-green-200 dark:border-green-800 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> আজ
                </span>
             )}
          </div>
          
          <button onClick={() => changeDate(1)} className="p-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 rounded-xl shadow-sm text-slate-500 dark:text-slate-300 active:scale-95 transition-all">
             <ChevronRight size={20} />
          </button>
        </div>

        {/* Improved Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-2xl border border-green-100 dark:border-green-800/50 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-xl font-extrabold text-green-600 dark:text-green-400 leading-none">{stats.present}</p>
                <p className="text-[9px] font-bold text-green-600/70 dark:text-green-400/70 mt-1 uppercase tracking-wider">উপস্থিত</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-400/10 rounded-full blur-lg -mr-2 -mt-2"></div>
                <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 leading-none flex items-center gap-0.5">
                   <span className="text-xs opacity-70">৳</span>{stats.cost.toLocaleString()}
                </p>
                <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 mt-1 uppercase tracking-wider">খরচ</p>
            </div>
            <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-colors shadow-sm ${stats.pending > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <p className={`text-xl font-extrabold leading-none ${stats.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{stats.pending}</p>
                <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${stats.pending > 0 ? 'text-amber-600/70 dark:text-amber-400/70' : 'text-slate-400'}`}>বাকি</p>
            </div>
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="px-4 py-4 space-y-4">
         <div className="flex gap-2">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
               <input 
               type="text"
               placeholder="কর্মী খুঁজুন..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className={`w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-${themeColor}-500 outline-none text-sm text-slate-800 dark:text-white font-medium shadow-sm transition-all`}
               />
            </div>
            
            {/* Filter Toggle with Badge */}
            <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
               <button 
                  onClick={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
                  className={`px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                  <Filter size={14} /> বাকি
                  {stats.pending > 0 && activeFilter !== 'pending' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
               </button>
            </div>
         </div>

         {/* Skill Filters - Styled Pills */}
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {uniqueSkills.map(skill => (
               <button 
                  key={skill}
                  onClick={() => setActiveSkillFilter(skill)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all active:scale-95 ${
                     activeSkillFilter === skill 
                     ? `bg-${themeColor}-600 text-white border-${themeColor}-600 shadow-md shadow-${themeColor}-200 dark:shadow-none` 
                     : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
               >
                  {skill === 'all' ? 'সব' : skill}
               </button>
            ))}
         </div>
      </div>

      {/* 3. Worker List (Premium Cards) */}
      <div className="px-4 space-y-3 pb-24">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center animate-in fade-in zoom-in duration-300">
             <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4 shadow-inner">
                <UserCheck size={36} className="text-slate-300 dark:text-slate-600"/>
             </div>
             <p className="text-slate-500 font-bold text-sm">কোন কর্মী পাওয়া যায়নি</p>
             <p className="text-slate-400 text-xs mt-1">ফিল্টার পরিবর্তন করে দেখুন</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const status = getStatus(worker.id);
            const ot = getOvertime(worker.id);
            
            // Dynamic Card Style based on Status
            let cardStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700";
            let statusBadge = null;

            if (status === 'P') {
                cardStyle = "bg-green-50/60 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 shadow-md shadow-green-100/50 dark:shadow-none";
                statusBadge = (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle size={10} strokeWidth={3} /> উপস্থিত
                    </div>
                );
            } else if (status === 'H') {
                cardStyle = "bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 shadow-md shadow-amber-100/50 dark:shadow-none";
                statusBadge = (
                    <div className="absolute top-4 right-4 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        <Clock size={10} strokeWidth={3} /> হাফ ডে
                    </div>
                );
            }

            return (
              <div key={worker.id} className={`relative p-5 rounded-[1.8rem] border transition-all duration-300 group ${cardStyle}`}>
                
                {statusBadge}

                <div className="flex items-center gap-4 mb-4">
                   <div className="relative shrink-0">
                      <img 
                        src={worker.avatar_url} 
                        className="w-14 h-14 rounded-2xl object-cover bg-slate-200 dark:bg-slate-800 shadow-sm" 
                        alt="User"
                      />
                      {status && (
                         <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm ${status === 'P' ? 'bg-green-500' : 'bg-amber-500'}`}>
                            {status === 'P' ? <CheckCircle size={12} className="text-white" strokeWidth={3}/> : <Clock size={12} className="text-white" strokeWidth={3}/>}
                         </div>
                      )}
                   </div>
                   
                   <div className="flex-1 min-w-0 pr-16">
                     <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">{worker.full_name}</h3>
                     <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                            {worker.skill_type}
                        </span>
                        <span className={`text-[10px] font-bold ${worker.payment_type === 'monthly' ? 'text-purple-600' : `text-${themeColor}-600 dark:text-${themeColor}-400`}`}>
                            {worker.payment_type === 'monthly' ? 'মাসিক' : `৳${worker.daily_rate}/দিন`}
                        </span>
                     </div>
                   </div>
                </div>

                {/* Overtime & Action Row */}
                <div className="flex gap-2.5">
                   
                   {/* P - Present Button */}
                   <button 
                        onClick={() => handleStatusClick(worker.id, 'P')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-1.5 ${
                           status === 'P' 
                           ? 'bg-green-600 border-green-700 text-white shadow-green-200 dark:shadow-none ring-2 ring-green-500/20' 
                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 hover:border-green-200'
                        }`}
                   >
                        {status === 'P' && <CheckCircle size={14} strokeWidth={3}/>} P
                   </button>

                   {/* H - Half Day Button */}
                   <button 
                        onClick={() => handleStatusClick(worker.id, 'H')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-1.5 ${
                           status === 'H' 
                           ? 'bg-amber-500 border-amber-600 text-white shadow-amber-200 dark:shadow-none ring-2 ring-amber-500/20' 
                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 hover:border-amber-200'
                        }`}
                   >
                        {status === 'H' && <Clock size={14} strokeWidth={3}/>} H
                   </button>
                   
                   {/* OT - Overtime Button */}
                   <button 
                      onClick={() => handleOtClick(worker.id)}
                      disabled={!status}
                      className={`flex-1 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                         ot > 0 
                         ? 'bg-purple-600 border-purple-700 text-white shadow-purple-200 dark:shadow-none ring-2 ring-purple-500/20'
                         : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200'
                      }`}
                   >
                      {ot > 0 ? (
                          <><Sparkles size={12} fill="currentColor"/> {ot}h OT</>
                      ) : 'OT'}
                   </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (Scanner Only) */}
      <div className="fixed bottom-24 right-4 z-40">
         <button 
            onClick={startScanning}
            className={`w-16 h-16 rounded-[1.5rem] shadow-2xl active:scale-90 transition-transform flex items-center justify-center bg-gradient-to-tr ${isSupervisor ? 'from-purple-600 to-indigo-600 shadow-purple-400/40' : 'from-blue-600 to-cyan-600 shadow-blue-400/40'}`}
         >
            <QrCode size={28} className="text-white" strokeWidth={2} />
         </button>
      </div>

      {/* --- Modals (Logic Unchanged, UI Polished) --- */}
      
      {/* Project Confirm Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] animate-slide-up sm:animate-scale-up shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <CheckCircle className="text-green-500" /> কনফার্ম করুন
              </h3>
              <button onClick={closeModal} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold uppercase tracking-wide ml-1">আজ কোন প্রজেক্টে কাজ করছে?</p>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {projects.filter(p => p.status === 'active').map(project => (
                <button
                  key={project.id}
                  onClick={() => confirmProject(project.id)}
                  className={`w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/20 hover:border-${themeColor}-200 transition-all active:scale-[0.98] group`}
                >
                  <p className={`font-bold text-slate-800 dark:text-white group-hover:text-${themeColor}-600`}>{project.project_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> {project.location}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overtime Modal */}
      {otModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setOtModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-slide-up sm:animate-scale-up">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-purple-100 dark:border-purple-800">
                 <Clock className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-center text-xl font-bold text-slate-800 dark:text-white mb-6">অতিরিক্ত কাজের সময়</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); if(selectedWorkerForOt) { addOvertime(selectedWorkerForOt, Number(otHours), selectedDate); setOtModalOpen(false); setOtHours(''); } }}>
                 <div className="relative mb-6">
                    <input type="number" required min="1" max="12" value={otHours} onChange={(e) => setOtHours(e.target.value)} className="w-full px-4 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-4xl font-extrabold text-center text-slate-800 dark:text-white" placeholder="0"/>
                    <span className="absolute right-8 top-6 text-slate-400 font-bold text-sm uppercase">ঘণ্টা</span>
                 </div>
                 
                 {/* Quick Select */}
                 <div className="flex justify-center gap-3 mb-6">
                    {[1, 2, 3, 4].map(h => (
                       <button 
                          key={h}
                          type="button" 
                          onClick={() => setOtHours(h.toString())}
                          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-purple-100 hover:text-purple-600 transition-colors"
                       >
                          {h}
                       </button>
                    ))}
                 </div>

                 <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none active:scale-95 transition-all text-lg">নিশ্চিত করুন</button>
              </form>
           </div>
        </div>
      )}

      {/* QR Overlay (Same as before) */}
      {isScanning && (
         <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <button onClick={closeScanner} className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white z-20 hover:bg-white/20"><X size={24} /></button>
            
            <h2 className="text-white font-bold text-lg mb-8 tracking-wide uppercase opacity-80">স্ক্যানার চালু আছে</h2>

            <div className="relative w-full max-w-sm aspect-square bg-black overflow-hidden rounded-[2.5rem] shadow-2xl mx-6 border-4 border-slate-800">
               {scanError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                     <AlertTriangle size={48} className="text-red-500 mb-2"/>
                     <p className="text-white font-bold">{scanError}</p>
                     <button onClick={startScanning} className="mt-4 px-6 py-2 bg-white text-black rounded-xl font-bold">পুনরায় চেষ্টা করুন</button>
                  </div>
               ) : (
                  <>
                     <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                     <canvas ref={canvasRef} className="hidden" />
                     <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                     <div className="absolute inset-0 border-[40px] border-black/50 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_15px_#ef4444] animate-scan"></div>
                     </div>
                     <div className="absolute top-4 left-0 right-0 text-center">
                        <span className="bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">QR কোড ফ্রেমে ধরুন</span>
                     </div>
                  </>
               )}
            </div>
            
            {/* Manual Input Toggle */}
            <div className="mt-10 px-8 w-full max-w-sm">
               {showManualInput ? (
                   <form onSubmit={(e) => { e.preventDefault(); const w = allStaff.find(x => x.id === manualIdInput || x.phone.includes(manualIdInput)); if(w) { closeScanner(); setCurrentAction({workerId: w.id, status: 'P'}); setModalOpen(true); } else alert('Worker not found'); }} className="flex gap-2">
                       <input autoFocus type="text" placeholder="ID or Phone" value={manualIdInput} onChange={e => setManualIdInput(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white outline-none font-bold placeholder-white/30 backdrop-blur-md"/>
                       <button type="submit" className="bg-blue-600 text-white px-6 rounded-2xl font-bold">Go</button>
                   </form>
               ) : (
                   <button onClick={() => setShowManualInput(true)} className="w-full text-white/80 font-bold bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all">
                      <Keyboard size={20}/> ম্যানুয়ালি ID লিখুন
                   </button>
               )}
            </div>
         </div>
      )}
    </div>
  );
};
