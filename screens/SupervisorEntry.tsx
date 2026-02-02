import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, MapPin, CheckCircle, PlayCircle, Building2, ChevronRight, Clock, Calendar } from 'lucide-react';

export const SupervisorEntry = () => {
  const { user } = useAuth();
  const { projects, markAttendance, attendance, t } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedProject, setSelectedProject] = useState('');
  
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Check if already present
  const myAttendance = attendance.find(a => a.worker_id === user?.id && a.date === today);
  const alreadyPresent = !!myAttendance;

  // Input Class (Purple Focus)
  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm focus:shadow-md appearance-none";

  useEffect(() => {
    if (user?.assigned_project_id) {
        setSelectedProject(user.assigned_project_id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (user && selectedProject) {
          await markAttendance(user.id, 'P', selectedProject, today);
          toast.success('আপনার সাইট এন্ট্রি সম্পন্ন হয়েছে');
          navigate('/'); // Go back to dashboard
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col justify-center font-sans">
        <div className="w-full max-w-sm mx-auto">
            <button 
                onClick={() => navigate('/')} 
                className="mb-6 p-3 bg-white dark:bg-slate-900 rounded-full w-fit shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Header with Clock */}
            <div className="text-center mb-8 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 animate-pulse-slow">
                    <UserCheck size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('self_entry_title')}</h1>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 inline-flex flex-col items-center border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide mb-1">
                        <Calendar size={12} /> {dateString}
                    </div>
                    <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock size={20} className="text-purple-500" />
                        {timeString}
                    </div>
                </div>
            </div>

            {alreadyPresent ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-8 rounded-[2.5rem] text-center shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    
                    <CheckCircle size={56} className="text-green-500 mx-auto mb-4 relative z-10" />
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-400 relative z-10">এন্ট্রি সম্পন্ন হয়েছে</h3>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1 mb-6 relative z-10">আপনি আজকের জন্য উপস্থিত আছেন।</p>
                    
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-slate-700 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Building2 size={18} className="text-slate-500" />
                        </div>
                        {projects.find(p => p.id === myAttendance.project_id)?.project_name || 'প্রজেক্ট'}
                    </div>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-6 w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 dark:shadow-none hover:bg-green-700 transition-all active:scale-95 relative z-10"
                    >
                        ড্যাশবোর্ডে ফিরে যান
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide ml-1">প্রজেক্ট সিলেক্ট করুন</label>
                        <div className="relative">
                            <select 
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className={inputClass}
                                required
                            >
                                <option value="">{t('click_list')}</option>
                                {projects.filter(p => p.status === 'active').map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18}/>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800">
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium leading-relaxed text-center">
                            বিঃদ্রঃ এন্ট্রি দেওয়ার পর আপনার হাজিরা আজকের জন্য লক হয়ে যাবে। ভুল হলে ঠিকাদারের সাথে যোগাযোগ করুন।
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!selectedProject}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <PlayCircle size={20} fill="currentColor" />
                        {t('confirm_self_entry')}
                    </button>
                </form>
            )}
        </div>
    </div>
  );
};