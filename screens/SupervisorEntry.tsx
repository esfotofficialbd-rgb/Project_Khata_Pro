
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Building2, Clock, Calendar, Fingerprint, Loader2, Navigation } from 'lucide-react';

export const SupervisorEntry = () => {
  const { user } = useAuth();
  const { projects, markAttendance, attendance, t } = useData();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedProject, setSelectedProject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locationText, setLocationText] = useState('লোকেশন খোঁজা হচ্ছে...');
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fake Geolocation Fetch for UI Feedback
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocationText(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            },
            () => {
                setLocationText('GPS সিগনাল নেই');
            }
        );
    }

    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  const secondsString = currentTime.toLocaleTimeString('bn-BD', { second: '2-digit' }).split(':')[0]; // Just seconds logic placeholder if needed, mostly formatting via locale
  const dateString = currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Check if already present
  const myAttendance = attendance.find(a => a.worker_id === user?.id && a.date === today);
  const alreadyPresent = !!myAttendance;

  useEffect(() => {
    if (user?.assigned_project_id) {
        setSelectedProject(user.assigned_project_id);
    }
  }, [user]);

  const handleSubmit = async () => {
      if (user && selectedProject) {
          // Haptic Feedback
          if (navigator.vibrate) navigator.vibrate(50);
          
          setIsSubmitting(true);
          
          // Artificial delay for better UX feeling
          setTimeout(async () => {
              await markAttendance(user.id, 'P', selectedProject, today);
              setIsSubmitting(false);
              setShowSuccess(true);
              
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

              // Redirect after showing success
              setTimeout(() => {
                  navigate('/');
              }, 2000);
          }, 1500);
      }
  };

  if (showSuccess) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100 dark:shadow-none">
                <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">এন্ট্রি সফল হয়েছে!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">আপনার উপস্থিতি নিশ্চিত করা হয়েছে।</p>
            <p className="text-sm text-slate-400 mt-8">ড্যাশবোর্ডে ফিরে যাওয়া হচ্ছে...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-6 font-sans flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm">
            <button 
                onClick={() => navigate('/')} 
                className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors border border-slate-100 dark:border-slate-800"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-slate-700 dark:text-slate-200">সাইট এন্ট্রি</h1>
            <div className="w-10"></div> {/* Spacer */}
        </div>

        <div className="flex-1 px-5 flex flex-col max-w-md mx-auto w-full">
            
            {/* Digital Clock Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-6 text-white text-center shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden mb-6">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full opacity-10 blur-3xl"></div>
                
                <div className="relative z-10">
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Calendar size={12} /> {dateString}
                    </p>
                    <div className="text-5xl font-extrabold tracking-tight my-2 font-mono flex items-center justify-center gap-2">
                        <Clock size={32} className="opacity-60" />
                        {timeString}
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 backdrop-blur-md">
                        <Navigation size={10} className="text-green-400 animate-pulse"/>
                        {locationText}
                    </div>
                </div>
            </div>

            {alreadyPresent ? (
                // Success Ticket View
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center flex-1 flex flex-col justify-center items-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full border-b-2 border-slate-200 dark:border-slate-800"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full border-t-2 border-slate-200 dark:border-slate-800"></div>
                    
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                        <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">এন্ট্রি সম্পন্ন হয়েছে</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">আজকের জন্য আপনার হাজিরা লক করা হয়েছে।</p>
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl w-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">প্রজেক্ট</p>
                        <p className="font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
                            <Building2 size={16} className="text-blue-500"/>
                            {projects.find(p => p.id === myAttendance.project_id)?.project_name || 'জেনারেল'}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-8 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                    >
                        ড্যাশবোর্ডে ফিরে যান
                    </button>
                </div>
            ) : (
                <>
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 pl-1">
                        প্রজেক্ট নিশ্চিত করুন
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto mb-6 pr-1 custom-scrollbar">
                        <div className="space-y-3">
                            {projects.filter(p => p.status === 'active').map(project => (
                                <label 
                                    key={project.id} 
                                    className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${selectedProject === project.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-1 ring-purple-500/50' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-200 dark:hover:border-slate-700'}`}
                                >
                                    <input 
                                        type="radio" 
                                        name="project" 
                                        value={project.id} 
                                        checked={selectedProject === project.id}
                                        onChange={() => setSelectedProject(project.id)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedProject === project.id ? 'border-purple-600 bg-purple-600' : 'border-slate-300'}`}>
                                        {selectedProject === project.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${selectedProject === project.id ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {project.project_name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                            <MapPin size={10} /> {project.location}
                                        </p>
                                    </div>
                                    {selectedProject === project.id && (
                                        <div className="absolute right-4 text-purple-600 dark:text-purple-400 animate-pulse">
                                            <CheckCircle size={18} />
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-4">
                        <button 
                            onClick={handleSubmit}
                            disabled={!selectedProject || isSubmitting}
                            className={`w-full py-5 rounded-[1.5rem] font-bold text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group ${!selectedProject ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/30'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>যাচাই করা হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-[1.5rem]"></div>
                                    <Fingerprint size={24} className={selectedProject ? "animate-pulse" : ""} />
                                    <span className="text-lg">এন্ট্রি নিশ্চিত করুন</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">
                            এটি আপনার আজকের উপস্থিতির চুড়ান্ত প্রমাণ হিসেবে গণ্য হবে।
                        </p>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};
