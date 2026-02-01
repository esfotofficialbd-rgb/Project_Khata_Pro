import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useLocation } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, X, Search, QrCode, Clock, CheckCircle, UserCheck, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';
import jsQR from 'jsqr';

export const Khata = () => {
  const { users, projects, markAttendance, addOvertime, attendance, getDailyStats } = useData();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<{workerId: string, status: 'P' | 'H'} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Overtime State
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [selectedWorkerForOt, setSelectedWorkerForOt] = useState<string | null>(null);
  const [otHours, setOtHours] = useState('');

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const workers = users.filter(u => u.role === 'worker');
  const stats = getDailyStats(selectedDate);

  const filteredWorkers = workers.filter(worker => 
    worker.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.phone.includes(searchQuery) ||
    (worker.skill_type && worker.skill_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check for auto-start scan via navigation state
  useEffect(() => {
    if (location.state && (location.state as any).autoStartScan) {
        startScanning();
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  const getStatus = (workerId: string) => {
    const record = attendance.find(a => a.worker_id === workerId && a.date === selectedDate);
    return record ? record.status : null;
  };

  const getOvertime = (workerId: string) => {
    const record = attendance.find(a => a.worker_id === workerId && a.date === selectedDate);
    return record?.overtime || 0;
  };

  const handleStatusClick = (workerId: string, status: 'P' | 'H' | 'A') => {
    if (status === 'A') {
      markAttendance(workerId, status, '', selectedDate);
    } else {
      setCurrentAction({ workerId, status });
      setModalOpen(true);
    }
  };

  const handleOvertimeClick = (workerId: string) => {
     const status = getStatus(workerId);
     if (status !== 'P' && status !== 'H') {
       alert('শ্রমিক উপস্থিত না থাকলে ওভারটাইম দেওয়া যাবে না।');
       return;
     }
     setSelectedWorkerForOt(workerId);
     setOtModalOpen(true);
  };

  const submitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkerForOt && otHours) {
      addOvertime(selectedWorkerForOt, Number(otHours), selectedDate);
      setOtModalOpen(false);
      setOtHours('');
      setSelectedWorkerForOt(null);
    }
  };

  const confirmProject = (projectId: string) => {
    if (currentAction) {
      markAttendance(currentAction.workerId, currentAction.status, projectId, selectedDate);
      setModalOpen(false);
      setCurrentAction(null);
      stopScanning();
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const displayDate = new Date(selectedDate).toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- QR Scanner Logic ---

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => {
          oscillator.stop();
          audioContext.close();
      }, 150);

      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanError('');
    
    // Ensure cleanup first
    stopScanning();

    navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Crucial for iOS
          videoRef.current.setAttribute("playsinline", "true"); 
          videoRef.current.play().then(() => {
             requestRef.current = requestAnimationFrame(tick);
          }).catch(e => {
             console.error("Video play error:", e);
             setScanError("ক্যামেরা চালু করতে সমস্যা হচ্ছে।");
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setScanError("ক্যামেরা পারমিশন পাওয়া যায়নি।");
        // Don't close immediately, show error
      });
  };

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Re-init on camera toggle
  useEffect(() => {
      if (isScanning && !scanError) {
          startScanning();
      }
  }, [facingMode]);

  const stopScanning = () => {
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          
          if (code) {
             const worker = workers.find(w => w.id === code.data);
             if (worker) {
               // Found valid worker
               if (requestRef.current) cancelAnimationFrame(requestRef.current);
               playBeep();
               
               // Pause video to freeze frame
               video.pause();
               
               setTimeout(() => {
                 stopScanning();
                 setCurrentAction({ workerId: worker.id, status: 'P' });
                 setModalOpen(true);
               }, 500);
               return; 
             }
          }
        }
      }
    }
    if (isScanning) requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => { return () => stopScanning(); }, []);

  return (
    <div className="pb-24 min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      {/* Header & Stats */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm border-b border-slate-100 dark:border-slate-800 space-y-4">
        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
          <button onClick={() => changeDate(-1)} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all text-slate-500 dark:text-slate-300">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
                <Calendar size={16} className="text-blue-500" />
                {displayDate}
             </div>
             {selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-2 rounded-full mt-0.5">আজ</span>
             )}
          </div>
          
          <button onClick={() => changeDate(1)} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all text-slate-500 dark:text-slate-300">
             <ChevronRight size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-center border border-blue-100 dark:border-blue-900/30">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPresent}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">উপস্থিত</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl text-center border border-red-100 dark:border-red-900/30">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">৳{Math.round(stats.totalDue / 1000)}k</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">বকেয়া</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-center border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">৳{stats.totalExpense}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">খরচ</p>
          </div>
        </div>

        {/* Search & QR */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="কর্মী খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white font-medium"
            />
          </div>
          <button 
             onClick={startScanning}
             className="bg-slate-900 dark:bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
             title="QR স্ক্যানার চালু করুন"
          >
             <QrCode size={20} />
          </button>
        </div>
      </div>

      {/* Worker List */}
      <div className="p-4 space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-10">
             <UserCheck size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-2"/>
             <p className="text-slate-400 text-sm">কোন কর্মী নেই</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const status = getStatus(worker.id);
            const ot = getOvertime(worker.id);
            return (
              <div key={worker.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <img src={worker.avatar_url} className="w-12 h-12 rounded-full object-cover bg-slate-100 dark:bg-slate-800" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{worker.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{worker.skill_type} • ৳{worker.daily_rate}/দিন</p>
                      </div>
                   </div>
                   {ot > 0 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg font-bold">+ OT: {ot}h</span>}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOvertimeClick(worker.id)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all ${ot > 0 ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                     <Clock size={16} /> OT
                  </button>

                  <div className="flex-1 flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                     <button 
                        onClick={() => handleStatusClick(worker.id, 'P')}
                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${status === 'P' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm scale-105' : 'text-slate-400'}`}
                     >
                        P
                     </button>
                     <button 
                        onClick={() => handleStatusClick(worker.id, 'H')}
                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${status === 'H' ? 'bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm scale-105' : 'text-slate-400'}`}
                     >
                        H
                     </button>
                     <button 
                        onClick={() => handleStatusClick(worker.id, 'A')}
                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${status === 'A' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm scale-105' : 'text-slate-400'}`}
                     >
                        A
                     </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Project Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl animate-scale-up border border-slate-100 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <CheckCircle className="text-green-500" />
                 {currentAction?.status === 'P' ? 'উপস্থিতি নিশ্চিত করুন' : 'হাফ-ডে নিশ্চিত করুন'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200"><X size={20} /></button>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">আজ কোন প্রজেক্টে কাজ করছে?</p>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {projects.filter(p => p.status === 'active').map(project => (
                <button
                  key={project.id}
                  onClick={() => confirmProject(project.id)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <p className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">{project.project_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{project.location}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Overtime Modal */}
      {otModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOtModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">ওভারটাইম যুক্ত করুন</h3>
                <button onClick={() => setOtModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500"><X size={20}/></button>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl mb-6 text-center border border-purple-100 dark:border-purple-900/30">
                 <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                 <p className="text-sm text-purple-800 dark:text-purple-300 font-bold">অতিরিক্ত কাজের সময়</p>
              </div>

              <form onSubmit={submitOvertime}>
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">কত ঘণ্টা কাজ করেছে?</label>
                 <div className="relative mb-6">
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="12"
                      value={otHours}
                      onChange={(e) => setOtHours(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 text-3xl font-bold text-slate-900 dark:text-white text-center"
                    />
                    <span className="absolute right-4 top-5 text-slate-400 font-bold text-sm">ঘণ্টা</span>
                 </div>

                 <button 
                   type="submit" 
                   className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <CheckCircle size={20} /> নিশ্চিত করুন
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* QR Scanner Overlay */}
      {isScanning && (
         <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center">
            <button onClick={stopScanning} className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white z-20 hover:bg-white/20 transition-colors">
               <X size={24} />
            </button>
            
            <button 
               onClick={toggleCamera}
               className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white z-20 hover:bg-white/20 transition-colors"
               title="ক্যামেরা ঘোরান"
            >
               <RefreshCw size={24} />
            </button>
            
            <div className="relative w-full max-w-sm aspect-square bg-slate-900 overflow-hidden rounded-3xl shadow-2xl mx-4 border border-slate-800">
               {scanError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                     <AlertTriangle size={48} className="text-red-500 mb-2"/>
                     <p className="text-white text-sm font-bold">{scanError}</p>
                     <button onClick={startScanning} className="mt-4 px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold">পুনরায় চেষ্টা করুন</button>
                  </div>
               ) : (
                  <>
                     <video ref={videoRef} className="w-full h-full object-cover" />
                     <canvas ref={canvasRef} className="hidden" />
                     <div className="absolute inset-0 border-2 border-blue-500/50 m-12 rounded-2xl flex items-center justify-center">
                        <div className="w-full h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-scan absolute"></div>
                     </div>
                  </>
               )}
               <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                  <p className="text-white/90 text-sm font-bold bg-slate-900/60 inline-block px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                     শ্রমিকের QR কোডটি ফ্রেমে ধরুন
                  </p>
               </div>
            </div>
            
            <div className="mt-8 text-white/60 text-xs flex flex-col items-center gap-1">
               <Smartphone size={24} className="mb-2"/>
               <p>আপনার মোবাইলটি সোজা করে ধরুন</p>
            </div>
         </div>
      )}
    </div>
  );
};