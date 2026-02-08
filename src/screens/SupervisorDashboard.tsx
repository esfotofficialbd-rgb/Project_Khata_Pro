import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Wallet, DollarSign, ArrowUpRight, CheckCircle, X, MapPin, PlusCircle, Briefcase, Camera, FileText, Truck, PackageCheck, UserCheck, PlayCircle, History, QrCode, Calendar, Sun, Clock, Send, Image as ImageIcon, Activity, Megaphone, TrendingUp, Construction, ChevronRight, AlertCircle, ArrowRight, User, Radio, Loader2, Sparkles, ArrowDownLeft, Hammer, ChevronDown, Check, Search } from 'lucide-react';
import { Transaction, WorkReport, MaterialLog } from '../types';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

// --- CUSTOM SELECTOR COMPONENT ---
interface SelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { value: string; label: string; sub?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon?: React.ElementType;
}

const SelectorSheet = ({ isOpen, onClose, title, options, selectedValue, onSelect, icon: Icon }: SelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.sub && opt.sub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {Icon && <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600"><Icon size={20}/></div>}
                        {title}
                    </h3>
                    <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="খুঁজুন..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white"
                        autoFocus
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar space-y-2">
                {filteredOptions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">কোন তথ্য পাওয়া যায়নি</div>
                ) : (
                    filteredOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onSelect(opt.value); onClose(); setSearchTerm(''); }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                                selectedValue === opt.value 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/20' 
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="text-left">
                                <p className={`font-bold text-sm ${selectedValue === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>
                                    {opt.label}
                                </p>
                                {opt.sub && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{opt.sub}</p>
                                )}
                            </div>
                            {selectedValue === opt.value && (
                                <div className="bg-blue-500 text-white p-1 rounded-full">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export const SupervisorDashboard = () => {
  const { user } = useAuth();
  const { projects, users, getDailyStats, transactions, attendance, addTransaction, payWorker, getWorkerBalance, addWorkReport, addMaterialLog, materialLogs, workReports, t, sendNotification, addPublicNotice, publicNotices, updateUserLocation, isLoadingData } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const stats = getDailyStats(today);

  // Reactivity Fix: Use user from 'users' list
  const currentUser = users.find(u => u.id === user?.id) || user;

  const myAttendance = attendance.find(a => a.worker_id === user?.id && a.date === today);
  const myProject = projects.find(p => p.id === (myAttendance ? myAttendance.project_id : user?.assigned_project_id));

  const myHistory = attendance.filter(a => a.worker_id === user?.id);
  const myTotalWorkDays = myHistory.filter(a => a.status === 'P' || a.status === 'H').length;
  const myBalance = currentUser?.balance || 0;

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

  const workers = users.filter(u => u.role === 'worker');
  const contractor = users.find(u => u.role === 'contractor');

  // Modal States
  const [activeModal, setActiveModal] = useState<'expense' | 'payment' | 'report' | 'material' | 'notice' | null>(null);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // Custom Selector States
  const [showWorkerSelector, setShowWorkerSelector] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  // Automatic Tracking Ref
  const watchIdRef = useRef<number | null>(null);

  // Forms
  const [txForm, setTxForm] = useState({ amount: '', description: '', projectId: '' });
  const [payForm, setPayForm] = useState({ workerId: '', amount: '' });
  const [reportForm, setReportForm] = useState({ projectId: '', description: '', image_url: '' });
  const [materialForm, setMaterialForm] = useState({ projectId: '', item_name: '', quantity: '', unit: '', supplier: '', challan_photo: '' });
  
  const [noticeText, setNoticeText] = useState('');
  const [noticeType, setNoticeType] = useState<'contractor' | 'public'>('contractor');

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm focus:shadow-md";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide ml-1";

  useEffect(() => {
    if (user?.assigned_project_id) {
        const assignedId = user.assigned_project_id;
        setTxForm(prev => ({ ...prev, projectId: prev.projectId || assignedId }));
        setReportForm(prev => ({ ...prev, projectId: prev.projectId || assignedId }));
        setMaterialForm(prev => ({ ...prev, projectId: prev.projectId || assignedId }));
    }
  }, [user, activeModal]);

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
              // Silent fail
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Cleanup on unmount
      return () => {
          if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
              // Mark inactive on leave
              if(user) updateUserLocation(0, 0, false);
          }
      };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'report' | 'material') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
          toast.error('ভুল ফাইল', 'শুধুমাত্র ছবি আপলোড করা যাবে।');
          return;
      }

      setIsProcessingImage(true);
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
          try {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800; 
              let width = img.width;
              let height = img.height;

              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(async (blob) => {
                  if (blob) {
                      const folder = type === 'report' ? 'reports' : 'materials';
                      const fileName = `${folder}/${user!.id}-${Date.now()}.jpg`;
                      
                      try {
                          const { data, error } = await supabase.storage
                              .from('images')
                              .upload(fileName, blob, {
                                  contentType: 'image/jpeg',
                                  upsert: true
                              });

                          if (error) throw error;

                          const { data: publicData } = supabase.storage
                              .from('images')
                              .getPublicUrl(fileName);

                          if (type === 'report') {
                             setReportForm(prev => ({ ...prev, image_url: publicData.publicUrl }));
                          } else {
                             setMaterialForm(prev => ({ ...prev, challan_photo: publicData.publicUrl }));
                          }
                          toast.success('ছবি আপলোড হয়েছে');
                      } catch (uploadError) {
                          console.warn("Storage failed, using Base64 fallback", uploadError);
                          
                          // Fallback to Base64
                          const base64String = canvas.toDataURL('image/jpeg', 0.7);
                          if (type === 'report') {
                             setReportForm(prev => ({ ...prev, image_url: base64String }));
                          } else {
                             setMaterialForm(prev => ({ ...prev, challan_photo: base64String }));
                          }
                          toast.success('ছবি সেভ হয়েছে (অফলাইন মোড)');
                      } finally {
                          setIsProcessingImage(false);
                      }
                  } else {
                      setIsProcessingImage(false);
                  }
              }, 'image/jpeg', 0.7);

          } catch (error: any) {
              console.error(error);
              toast.error('ছবি আপলোডে সমস্যা', error.message);
              setIsProcessingImage(false);
          }
      };
      img.src = objectUrl;
    }
    if (e.target) e.target.value = '';
  };

  // --- SMART FEED LOGIC (ENHANCED) ---
  const feedItems = useMemo(() => {
     let items: any[] = [];

     const recentNotices = publicNotices.sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
     recentNotices.forEach(notice => {
         items.push({
             id: `notice-${notice.id}`,
             type: 'public_notice',
             title: 'পাবলিক নোটিশ',
             desc: notice.message,
             icon: Megaphone,
             color: 'text-red-600 dark:text-red-400',
             bg: 'bg-red-100 dark:bg-red-900/30',
             border: 'border-red-200 dark:border-red-800'
         });
     });

     // 1. Attendance Check (Alert if low after 10 AM)
     const totalPresent = attendance.filter(a => a.date === today && (a.status === 'P' || a.status === 'H')).length;
     const currentHour = new Date().getHours();
     
     if (currentHour >= 10 && totalPresent === 0) {
        items.push({
            id: 'att-alert',
            type: 'alert',
            title: 'হাজিরা রিমাইন্ডার',
            desc: 'সকাল ১০টা বেজে গেছে, এখনো হাজিরা এন্ট্রি হয়নি। দ্রুত হাজিরা নিন।',
            icon: Clock,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            border: 'border-orange-200 dark:border-orange-800'
        });
     } else if (totalPresent > 0) {
        items.push({
            id: `att-${today}`,
            type: 'attendance',
            title: 'সাইট উপস্থিতি',
            desc: `আজ মোট ${totalPresent} জন কর্মী বিভিন্ন সাইটে কাজ করছে।`,
            icon: Users,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            border: 'border-purple-200 dark:border-purple-800'
        });
     }

     // 2. Material Logic
     const lastMaterial = materialLogs.sort((a,b) => b.id.localeCompare(a.id))[0];
     // Show only if created today
     if (lastMaterial && lastMaterial.date === today) {
        const pName = projects.find(p => p.id === lastMaterial.project_id)?.project_name || 'Unknown';
        items.push({
            id: `mat-${lastMaterial.id}`,
            type: 'material',
            title: 'নতুন মালামাল',
            desc: `${pName}-এ ${lastMaterial.quantity} ${lastMaterial.unit} ${lastMaterial.item_name} রিসিভ হয়েছে।`,
            icon: PackageCheck,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            border: 'border-emerald-200 dark:border-emerald-800'
        });
     }

     // 3. Expense Logic
     const lastExpense = transactions
        .filter(t => t.type === 'expense' && t.date === today)
        .sort((a,b) => b.id.localeCompare(a.id))[0];
     
     if (lastExpense) {
        const projName = projects.find(p => p.id === lastExpense.project_id)?.project_name || 'General';
        items.push({
            id: `exp-${lastExpense.id}`,
            type: 'expense',
            title: 'খরচ আপডেট',
            desc: `${projName}: ${lastExpense.description} বাবদ ৳${lastExpense.amount} খরচ হয়েছে।`,
            icon: TrendingUp,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-100 dark:bg-rose-900/30',
            border: 'border-rose-200 dark:border-rose-800'
        });
     }

     // Fallback
     if (items.length === 0) {
        items.push({
           id: 'default',
           type: 'info',
           title: 'প্রজেক্ট খাতা',
           desc: 'আপনার সাইটের কাজের আপডেট এখানে আসবে।',
           icon: Activity,
           color: 'text-slate-600 dark:text-slate-400',
           bg: 'bg-slate-100 dark:bg-slate-800',
           border: 'border-slate-200 dark:border-slate-700'
        });
     }

     return items;
  }, [transactions, attendance, materialLogs, today, projects, publicNotices]);

  useEffect(() => {
    if (feedItems.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentFeedIndex((prev) => (prev + 1) % feedItems.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [feedItems.length, isPaused]);

  const currentItem = feedItems[currentFeedIndex] || feedItems[0];

  // --- RECENT ACTIVITY LOGIC (SUPERVISOR) ---
  const smartActivityFeed = useMemo(() => {
      let activities: any[] = [];

      // Helper to safely parse date
      const safeDate = (d: string) => {
          const date = new Date(d);
          return isNaN(date.getTime()) ? new Date() : date;
      };

      // 1. Transactions (Last 5)
      transactions.filter(t => t.type === 'expense' || t.type === 'salary').slice(0, 5).forEach(t => {
          activities.push({
              id: `tx-${t.id}`,
              date: safeDate(t.created_at || t.date),
              title: t.type === 'salary' ? 'বেতন প্রদান' : 'খরচ',
              desc: `${t.description} - ৳${t.amount}`,
              icon: ArrowUpRight,
              color: 'text-rose-600',
              bg: 'bg-rose-100 dark:bg-rose-900/30'
          });
      });

      // 2. Material Logs
      materialLogs.slice(0, 5).forEach(m => {
          activities.push({
              id: `mat-${m.id}`,
              date: safeDate(m.created_at || m.date),
              title: 'ম্যাটেরিয়াল',
              desc: `${m.item_name} - ${m.quantity} ${m.unit}`,
              icon: PackageCheck,
              color: 'text-orange-600',
              bg: 'bg-orange-100 dark:bg-orange-900/30'
          });
      });

      // 3. Work Reports
      workReports.slice(0, 5).forEach(r => {
          const pName = projects.find(p => p.id === r.project_id)?.project_name || 'Project';
          activities.push({
              id: `rep-${r.id}`,
              date: safeDate(r.created_at || r.date),
              title: 'কাজের রিপোর্ট',
              desc: `${pName}: ${r.description.substring(0, 30)}...`,
              icon: FileText,
              color: 'text-indigo-600',
              bg: 'bg-indigo-100 dark:bg-indigo-900/30'
          });
      });

      // Sort by Date Descending
      return activities.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [transactions, workReports, materialLogs, projects]);

  const formatTimeAgo = (date: Date) => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'এইমাত্র';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes} মি. আগে`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} ঘণ্টা আগে`;
      return date.toLocaleDateString('bn-BD', {day: 'numeric', month:'short'});
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      amount: Number(txForm.amount),
      description: txForm.description || 'Site Expense',
      project_id: txForm.projectId || undefined,
      date: today,
      created_at: new Date().toISOString()
    };
    await addTransaction(newTx);
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
    if (!reportForm.projectId || !reportForm.description) {
        toast.error('ত্রুটি', 'প্রজেক্ট এবং বিবরণ আবশ্যক।');
        return;
    }

    setIsSubmitting(true);
    try {
        const newReport: WorkReport = {
            id: Date.now().toString(),
            project_id: reportForm.projectId,
            submitted_by: user!.id,
            date: today,
            description: reportForm.description,
            image_url: reportForm.image_url || undefined,
            created_at: new Date().toISOString()
        };
        
        await addWorkReport(newReport);
        toast.success('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে।');
        setActiveModal(null);
        setReportForm({ projectId: '', description: '', image_url: '' });
    } catch (error) {
        toast.error('রিপোর্ট পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
        setIsSubmitting(false);
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
          challan_photo: materialForm.challan_photo,
          created_at: new Date().toISOString()
       };
       await addMaterialLog(newLog);
       setActiveModal(null);
       setMaterialForm({ projectId: '', item_name: '', quantity: '', unit: '', supplier: '', challan_photo: '' });
       toast.success('মালামাল এন্ট্রি সফল হয়েছে।');
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!noticeText.trim()) return;

      setIsSubmitting(true);
      
      if (noticeType === 'contractor') {
          if (!contractor) {
              toast.error('ঠিকাদার খুঁজে পাওয়া যায়নি।');
              setIsSubmitting(false);
              return;
          }
          await sendNotification(contractor.id, `জরুরি নোটিশ: ${noticeText}`, 'alert', { sender: user?.full_name });
          toast.success('ঠিকাদারকে নোটিশ পাঠানো হয়েছে।');
      } else {
          await addPublicNotice(noticeText);
          toast.success('পাবলিক নোটিশ প্রকাশিত হয়েছে।');
      }

      setIsSubmitting(false);
      setNoticeText('');
      setActiveModal(null);
  };

  const selectedWorkerBalance = payForm.workerId ? getWorkerBalance(payForm.workerId) : 0;

  // --- SKELETON COMPONENT ---
  const DashboardSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {/* Project Card Skeleton */}
        <div className="h-44 rounded-[1.8rem] bg-slate-200 dark:bg-slate-800 w-full mb-4"></div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2.5">
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>

        {/* Actions Grid Skeleton */}
        <div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mb-3"></div>
            <div className="grid grid-cols-3 gap-2.5">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                ))}
            </div>
        </div>

        {/* List Skeleton */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="pb-24 relative bg-slate-50 dark:bg-slate-950 min-h-screen font-sans selection:bg-purple-100">

      <div className="bg-white dark:bg-slate-900 px-4 pt-3 pb-5 rounded-b-[2rem] shadow-sm border-b border-slate-100 dark:border-slate-800 mb-3 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
         
         <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Sun size={10} className="text-orange-400" /> {greeting}
               </p>
               <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
                  সাইট ইঞ্জিনিয়ার
               </h1>
            </div>
            
            {/* Auto Tracking Indicator */}
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="opacity-80">লাইভ ট্র্যাকিং</span>
                </div>
                {isLoadingData && <p className="text-[9px] text-slate-400 animate-pulse flex items-center gap-1"><Loader2 size={8} className="animate-spin"/> Syncing...</p>}
            </div>
         </div>

         {/* SMART FEED SECTION */}
         <div className="mb-2 flex items-center gap-1.5 opacity-80">
            <Sparkles size={12} className="text-purple-500" />
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">স্মার্ট ফিড</h3>
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
            <DashboardSkeleton />
        ) : (
            <>
                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 dark:from-slate-900 dark:to-purple-900 rounded-[1.8rem] p-5 shadow-lg shadow-purple-500/10 dark:shadow-none relative overflow-hidden text-white group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="bg-white/20 p-1 rounded-md backdrop-blur-sm">
                                    <Construction size={10} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">সাইট স্ট্যাটাস</span>
                                </div>
                                <h2 className="text-xl font-bold truncate max-w-[200px] text-white tracking-tight">{myProject?.project_name || 'জেনারেল'}</h2>
                                <p className="text-[10px] text-purple-200 mt-0.5 flex items-center gap-1 font-medium">
                                    <MapPin size={10} /> {myProject?.location || 'N/A'}
                                </p>
                            </div>
                            {myAttendance ? (
                                <div className="bg-green-500/20 text-green-300 px-2.5 py-1 rounded-lg text-[9px] font-bold border border-green-500/30 flex items-center gap-1 backdrop-blur-md">
                                    <CheckCircle size={10} /> উপস্থিত
                                </div>
                            ) : (
                                <button onClick={() => navigate('/entry')} className="bg-white text-purple-900 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm animate-pulse flex items-center gap-1">
                                    <PlayCircle size={12} /> এন্ট্রি দিন
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/5 text-center">
                                <p className="text-[9px] text-purple-200 uppercase tracking-wider font-bold mb-0.5">মোট লেবার</p>
                                <p className="text-lg font-bold text-white">{stats.totalPresent}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/5 text-center">
                                <p className="text-[9px] text-purple-200 uppercase tracking-wider font-bold mb-0.5">আজকের খরচ</p>
                                <p className="text-lg font-bold text-white">৳{stats.totalExpense.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                            <UserCheck size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">আমার হাজিরা</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white leading-none mt-0.5">{myTotalWorkDays} <span className="text-[10px] text-slate-400">দিন</span></p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg text-purple-600 dark:text-purple-400">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">পাওনা বেতন</p>
                            <p className={`text-lg font-bold leading-none mt-0.5 ${myBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>৳ {myBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-3 bg-purple-500 rounded-full"></div> {t('site_management')}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                    <button 
                        onClick={() => setActiveModal('expense')}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-full text-purple-600 dark:text-purple-400 shadow-sm">
                            <DollarSign size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] text-center leading-none">{t('expense_entry')}</span>
                    </button>

                    <button 
                        onClick={() => setActiveModal('payment')}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-full text-emerald-600 dark:text-emerald-400 shadow-sm">
                            <Wallet size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] text-center leading-none">{t('labor_payment')}</span>
                    </button>

                    <button 
                        onClick={() => setActiveModal('material')}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-full text-orange-600 dark:text-orange-400 shadow-sm">
                            <PackageCheck size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] text-center leading-none">{t('material_stock')}</span>
                    </button>

                    <button 
                        onClick={() => setActiveModal('report')}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-full text-indigo-600 dark:text-indigo-400 shadow-sm">
                            <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] text-center leading-none">{t('daily_report')}</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveModal('notice')}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-full text-red-600 dark:text-red-400 shadow-sm">
                            <Megaphone size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] text-center leading-none">নোটিশ দিন</span>
                    </button>

                    <button 
                        onClick={() => navigate('/workers', { state: { openAddModal: true } })}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-full text-blue-600 dark:text-blue-400 shadow-sm">
                            <PlusCircle size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] text-center leading-none">{t('add_worker')}</span>
                    </button>
                    </div>
                </div>

                {/* RECENT ACTIVITY LIST (SMART) */}
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                        <Activity size={14} className="text-purple-500"/>
                        সাম্প্রতিক কার্যক্রম
                        </h3>
                    </div>
                    
                    <div className="space-y-0 relative">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                        {smartActivityFeed.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <ClipboardList size={20} className="mx-auto mb-1 opacity-50"/>
                            {t('no_expense_today')}
                        </div>
                        ) : (
                        smartActivityFeed.map(act => (
                            <div key={act.id} className="relative pl-12 pb-5 last:pb-0 group">
                                {/* Timeline Dot */}
                                <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-slate-900 ${act.bg} ${act.color}`}>
                                    <act.icon size={16} strokeWidth={2.5} />
                                </div>
                                
                                {/* Content */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 dark:text-white text-xs">{act.title}</p>
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {formatTimeAgo(act.date)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium line-clamp-2">
                                        {act.desc}
                                    </p>
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                </div>
            </>
         )}
      </div>

      {/* Bottom Sheet Modals */}
      {(activeModal === 'expense' || activeModal === 'payment') && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
           <div className="absolute inset-0 bg-slate-800/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}></div>
           
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm sm:rounded-[2.5rem] rounded-t-[2.5rem] relative z-10 p-6 shadow-2xl animate-slide-up border-t border-slate-100 dark:border-slate-800">
              {/* Drag Handle for Mobile */}
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>

              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {activeModal === 'expense' ? <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600"><ArrowUpRight size={20}/></div> : 
                     <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><Wallet size={20}/></div>}
                    <span className="text-lg">{activeModal === 'expense' ? t('expense_title') : t('payment_title')}</span>
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={activeModal === 'payment' ? handlePaySubmit : handleTxSubmit} className="space-y-5">
                 {activeModal === 'payment' && (
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('select_worker')}</label>
                       
                       {/* Custom Worker Selector Trigger */}
                       <button
                          type="button"
                          onClick={() => setShowWorkerSelector(true)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-left flex justify-between items-center group transition-all active:scale-[0.98]"
                       >
                          <span className={`text-sm font-bold ${payForm.workerId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                             {payForm.workerId ? workers.find(w => w.id === payForm.workerId)?.full_name : t('click_list')}
                          </span>
                          <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                       </button>

                       {payForm.workerId && (
                          <div className="flex justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                             <span className="text-slate-500 dark:text-slate-400">বর্তমান বকেয়া</span>
                             <span className={`font-bold ${selectedWorkerBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>৳ {selectedWorkerBalance}</span>
                          </div>
                       )}
                    </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('amount')}</label>
                    <div className="relative group">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">৳</span>
                       <input 
                         type="number" 
                         inputMode="decimal"
                         required
                         autoFocus
                         value={activeModal === 'payment' ? payForm.amount : txForm.amount}
                         onChange={(e) => activeModal === 'payment' ? setPayForm({...payForm, amount: e.target.value}) : setTxForm({...txForm, amount: e.target.value})}
                         placeholder="0"
                         className={`${inputClass} pl-14 pr-6 text-3xl font-bold`}
                       />
                    </div>
                 </div>

                 {activeModal !== 'payment' && (
                   <>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('description')}</label>
                        <input 
                          type="text" 
                          required
                          value={txForm.description}
                          onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                          placeholder={t('expense_placeholder')}
                          className={inputClass}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">{t('project_optional')}</label>
                        
                        {/* Custom Project Selector Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowProjectSelector(true)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-left flex justify-between items-center group transition-all active:scale-[0.98]"
                        >
                           <span className={`text-sm font-bold ${txForm.projectId ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                              {txForm.projectId ? projects.find(p => p.id === txForm.projectId)?.project_name : t('general_project')}
                           </span>
                           <ChevronDown size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </button>
                     </div>
                   </>
                 )}

                 <button 
                   type="submit" 
                   className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg mt-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base bg-gradient-to-r
                     ${activeModal === 'payment' ? 'from-blue-600 to-indigo-600 shadow-blue-200 dark:shadow-none' : 
                       'from-rose-600 to-pink-600 shadow-rose-200 dark:shadow-none'}`}
                 >
                    <CheckCircle size={20} />
                    নিশ্চিত করুন
                 </button>
              </form>
           </div>
        </div>
      )}
      
      {/* --- CUSTOM SELECTOR MODALS --- */}
      
      {/* Worker Selector */}
      <SelectorSheet 
         isOpen={showWorkerSelector}
         onClose={() => setShowWorkerSelector(false)}
         title="কর্মী সিলেক্ট করুন"
         icon={Users}
         options={workers.map(w => ({ value: w.id, label: w.full_name, sub: w.skill_type }))}
         selectedValue={payForm.workerId}
         onSelect={(val) => setPayForm({...payForm, workerId: val})}
      />

      {/* Project Selector */}
      <SelectorSheet 
         isOpen={showProjectSelector}
         onClose={() => setShowProjectSelector(false)}
         title="প্রজেক্ট সিলেক্ট করুন"
         icon={Briefcase}
         options={[
             { value: '', label: t('general_project'), sub: 'General' },
             ...projects.filter(p => p.status === 'active').map(p => ({ value: p.id, label: p.project_name, sub: p.location }))
         ]}
         selectedValue={txForm.projectId}
         onSelect={(val) => setTxForm({...txForm, projectId: val})}
      />

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