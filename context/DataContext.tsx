import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Profile, Project, Attendance, Transaction, DailyStats, Notification, WorkReport, MaterialLog } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabaseClient';
import { useAuth } from './SessionContext';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './ToastContext';

export interface AppSettings {
  calcMode: 'weekly' | 'monthly';
  weekStartDay: string; 
  monthStartDate: number;
  language: 'bn' | 'en';
  darkMode: boolean;
}

type RealtimeStatus = 'CONNECTING' | 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

interface DataContextType {
  users: Profile[];
  projects: Project[];
  attendance: Attendance[];
  transactions: Transaction[];
  notifications: Notification[];
  workReports: WorkReport[];
  materialLogs: MaterialLog[];
  appSettings: AppSettings;
  isLoadingData: boolean;
  isOnline: boolean;
  realtimeStatus: RealtimeStatus;
  t: (key: keyof typeof TRANSLATIONS.bn) => string;
  markAttendance: (workerId: string, status: 'P' | 'H' | 'A', projectId: string, date: string) => Promise<void>;
  submitAttendanceRequest: (workerId: string, projectId: string, date: string) => Promise<void>;
  submitAdvanceRequest: (workerId: string, amount: number) => Promise<void>;
  addWorkReport: (report: WorkReport) => Promise<void>;
  addMaterialLog: (log: MaterialLog) => Promise<void>;
  addOvertime: (workerId: string, hours: number, date: string) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  requestProject: (project: Project, supervisorName: string) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  getWorkerBalance: (workerId: string) => number;
  getDailyStats: (date: string) => DailyStats;
  payWorker: (workerId: string, amount: number) => Promise<void>;
  registerUser: (user: Profile) => Promise<void>;
  addUser: (user: Profile) => Promise<void>;
  updateUser: (updatedUser: Profile) => Promise<void>;
  updateAppSettings: (settings: AppSettings) => void;
  sendNotification: (userId: string, message: string, type: 'info' | 'alert' | 'success' | 'payment' | 'project_request' | 'attendance_request' | 'advance_request' | 'work_report', metadata?: any) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
  addTransaction: (transaction: Transaction) => Promise<void>;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Cache Keys
const CACHE_KEYS = {
  USERS: 'pk_data_users',
  PROJECTS: 'pk_data_projects',
  ATTENDANCE: 'pk_data_attendance',
  TRANSACTIONS: 'pk_data_transactions',
  NOTIFICATIONS: 'pk_data_notifications',
  REPORTS: 'pk_data_reports',
  MATERIALS: 'pk_data_materials'
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const loadFromCache = <T,>(key: string, fallback: T): T => {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState<Profile[]>(() => loadFromCache(CACHE_KEYS.USERS, []));
  const [projects, setProjects] = useState<Project[]>(() => loadFromCache(CACHE_KEYS.PROJECTS, []));
  const [attendance, setAttendance] = useState<Attendance[]>(() => loadFromCache(CACHE_KEYS.ATTENDANCE, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromCache(CACHE_KEYS.TRANSACTIONS, []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromCache(CACHE_KEYS.NOTIFICATIONS, []));
  const [workReports, setWorkReports] = useState<WorkReport[]>(() => loadFromCache(CACHE_KEYS.REPORTS, []));
  const [materialLogs, setMaterialLogs] = useState<MaterialLog[]>(() => loadFromCache(CACHE_KEYS.MATERIALS, []));
  
  const [isLoadingData, setIsLoadingData] = useState(() => {
     return !(localStorage.getItem(CACHE_KEYS.PROJECTS) && localStorage.getItem(CACHE_KEYS.USERS));
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('CONNECTING');

  const [appSettings, setAppSettings] = useState<AppSettings>({
    calcMode: 'weekly',
    weekStartDay: 'Saturday',
    monthStartDate: 1,
    language: 'bn',
    darkMode: false
  });

  const debounceRef = useRef<any>(null);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); refreshData(); };
    const handleOffline = () => { setIsOnline(false); setRealtimeStatus('CLOSED'); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('pk_settings');
    if (savedSettings) setAppSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    if (appSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pk_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const refreshData = async () => {
    if (!user || !navigator.onLine) {
        setIsLoadingData(false);
        return;
    }

    try {
      const [usersRes, projectsRes, attRes, txRes, notifRes, reportsRes, matRes] = await Promise.all([
        supabase.from('profiles').select('*').limit(1000),
        supabase.from('projects').select('*').limit(1000),
        supabase.from('attendance').select('*').limit(5000),
        supabase.from('transactions').select('*').limit(2000),
        supabase.from('notifications').select('*').limit(100),
        supabase.from('work_reports').select('*').limit(500),
        supabase.from('material_logs').select('*').limit(500)
      ]);

      if (usersRes.data) { setUsers(usersRes.data); localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(usersRes.data)); }
      if (projectsRes.data) { setProjects(projectsRes.data); localStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projectsRes.data)); }
      if (attRes.data) { setAttendance(attRes.data); localStorage.setItem(CACHE_KEYS.ATTENDANCE, JSON.stringify(attRes.data)); }
      if (txRes.data) { setTransactions(txRes.data); localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(txRes.data)); }
      if (notifRes.data) { setNotifications(notifRes.data); localStorage.setItem(CACHE_KEYS.NOTIFICATIONS, JSON.stringify(notifRes.data)); }
      if (reportsRes.data) { setWorkReports(reportsRes.data); localStorage.setItem(CACHE_KEYS.REPORTS, JSON.stringify(reportsRes.data)); }
      if (matRes.data) { setMaterialLogs(matRes.data); localStorage.setItem(CACHE_KEYS.MATERIALS, JSON.stringify(matRes.data)); }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
        refreshData();
    }
    
    // --- Realtime Subscription Logic ---
    const handleGeneralUpdate = () => {
       if (debounceRef.current) clearTimeout(debounceRef.current);
       debounceRef.current = setTimeout(() => {
          refreshData();
       }, 2000); // 2-second debounce for general data to avoid hammering
    };

    const channel = supabase.channel('app-realtime-channel')
      // 1. Listen for new Notifications specifically for the logged-in user
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.user_id === user?.id) {
             setNotifications(prev => [newNotif, ...prev]); // Instant State Update
             toast.info(newNotif.message); // Instant UI Feedback
          }
      })
      // 2. Listen for other data changes to refresh context
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleGeneralUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleGeneralUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, handleGeneralUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, handleGeneralUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_reports' }, handleGeneralUpdate)
      .subscribe((status) => {
         setRealtimeStatus(status as RealtimeStatus);
      });

    return () => { 
        supabase.removeChannel(channel); 
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [user]);

  const t = (key: keyof typeof TRANSLATIONS.bn) => {
    return TRANSLATIONS[appSettings.language][key] || key;
  };

  const checkOnline = () => {
    if (!navigator.onLine) {
        toast.error('ইন্টারনেট সংযোগ নেই। ডাটা সেভ করা যাচ্ছে না।');
        return false;
    }
    return true;
  };

  const registerUser = async (newUser: Profile) => {};

  const addUser = async (newUser: Profile) => {
    if (!checkOnline()) return;
    try {
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { 
            persistSession: false, 
            autoRefreshToken: false, 
            detectSessionInUrl: false 
        }
      });

      const email = newUser.phone + '@projectkhata.local';
      const password = newUser.phone.slice(-6);

      const { data, error } = await tempSupabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: newUser.full_name,
            phone: newUser.phone,
            role: newUser.role,
            company_name: newUser.company_name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const updates: any = {
           id: data.user.id,
           is_verified: true,
           balance: 0,
           skill_type: newUser.skill_type || null,
           daily_rate: newUser.daily_rate || 0,
           designation: newUser.designation || null,
           monthly_salary: newUser.monthly_salary || 0,
           payment_type: newUser.payment_type || null,
           assigned_project_id: newUser.assigned_project_id || null,
           role: newUser.role,
           phone: newUser.phone,
           full_name: newUser.full_name,
           avatar_url: newUser.avatar_url,
           company_name: newUser.company_name,
           email: email
        };
        
        const { error: dbError } = await tempSupabase.from('profiles').upsert(updates);
        if (dbError) throw dbError;
      }
      
      toast.success('নতুন কর্মী সফলভাবে যুক্ত হয়েছে! পাসওয়ার্ড: ' + password);
      refreshData();

    } catch (error: any) {
      console.error(error);
      toast.error('ত্রুটি: ' + error.message);
    }
  };

  const updateUser = async (updatedUser: Profile) => {
    if (!checkOnline()) return;
    const { error } = await supabase.from('profiles').update(updatedUser).eq('id', updatedUser.id);
    if (error) {
       toast.error('আপডেট ব্যর্থ: ' + error.message);
       return;
    }
    toast.success('প্রোফাইল আপডেট হয়েছে');
    refreshData();
  };

  const addProject = async (project: Project) => {
    if (!checkOnline()) return;
    
    const sanitizedProject = {
        ...project,
        budget_amount: isNaN(Number(project.budget_amount)) ? 0 : Number(project.budget_amount),
        sqft_rate: project.sqft_rate ? Number(project.sqft_rate) : null,
        total_area: project.total_area ? Number(project.total_area) : null,
        mistri_rate: project.mistri_rate ? Number(project.mistri_rate) : null,
        helper_rate: project.helper_rate ? Number(project.helper_rate) : null,
        current_expense: 0
    };

    const { error } = await supabase.from('projects').insert([sanitizedProject]);
    
    if (error) {
       console.error("Project Insert Error:", error);
       toast.error('প্রজেক্ট তৈরি করা যায়নি: ' + (error.message || error.details || 'Unknown Error'));
       return;
    }
    toast.success('নতুন প্রজেক্ট তৈরি হয়েছে');
    refreshData();
  };
  
  const requestProject = async (project: Project, supervisorName: string) => {
     if (!checkOnline()) return;
     const contractor = users.find(u => u.role === 'contractor');
     if(contractor) {
        await sendNotification(contractor.id, `${supervisorName} একটি নতুন প্রজেক্ট (${project.project_name}) তৈরির অনুরোধ করেছেন।`, 'project_request', project);
        toast.info('অনুরোধ পাঠানো হয়েছে');
     } else {
        toast.error('ঠিকাদার খুঁজে পাওয়া যায়নি। রিকোয়েস্ট পাঠানো যায়নি।');
     }
  };

  const updateProject = async (project: Project) => {
    if (!checkOnline()) return;
    const { error } = await supabase.from('projects').update(project).eq('id', project.id);
    if (error) {
       toast.error('আপডেট ব্যর্থ: ' + error.message);
       return;
    }
    toast.success('প্রজেক্ট আপডেট হয়েছে');
    refreshData();
  };

  const markAttendance = async (workerId: string, status: 'P' | 'H' | 'A', projectId: string, date: string) => {
    if (!checkOnline()) return;
    const worker = users.find(u => u.id === workerId);
    if (!worker) return;

    let amount = 0;
    if (status === 'P') amount = worker.daily_rate || 0;
    if (status === 'H') amount = (worker.daily_rate || 0) / 2;
    if (status === 'A') amount = 0;

    const existing = attendance.find(a => a.worker_id === workerId && a.date === date);
    
    const pid = projectId === '' ? null : projectId;

    try {
      if (existing) {
        let oldAmount = existing.amount;
        const { error: attError } = await supabase.from('attendance').update({ status, project_id: pid, amount }).eq('id', existing.id);
        if (attError) throw attError;
        
        const newBalance = (worker.balance - oldAmount) + amount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', workerId);
      } else {
        const { error: attError } = await supabase.from('attendance').insert([{
          worker_id: workerId,
          project_id: pid,
          date: date,
          status: status,
          amount: amount,
          overtime: 0
        }]);
        if (attError) throw attError;
        await supabase.from('profiles').update({ balance: worker.balance + amount }).eq('id', workerId);
      }
      toast.success('হাজিরা আপডেট হয়েছে');
      refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error('হাজিরা আপডেট ব্যর্থ হয়েছে: ' + e.message);
    }
  };

  const addOvertime = async (workerId: string, hours: number, date: string) => {
    if (!checkOnline()) return;
    const worker = users.find(u => u.id === workerId);
    const existing = attendance.find(a => a.worker_id === workerId && a.date === date);

    if (worker && existing) {
       const hourlyRate = (worker.daily_rate || 0) / 8;
       const otAmount = Math.round(hourlyRate * hours);
       
       let baseAmount = 0;
       if (existing.status === 'P') baseAmount = worker.daily_rate || 0;
       if (existing.status === 'H') baseAmount = (worker.daily_rate || 0) / 2;

       const totalAmount = baseAmount + otAmount;
       const diff = totalAmount - existing.amount;

       await supabase.from('attendance').update({ 
         overtime: hours, 
         amount: totalAmount 
       }).eq('id', existing.id);

       await supabase.from('profiles').update({ balance: worker.balance + diff }).eq('id', workerId);
       toast.success('ওভারটাইম যুক্ত হয়েছে');
       refreshData();
    } else {
        toast.error('শ্রমিক উপস্থিত নেই, ওভারটাইম দেওয়া যাবে না।');
    }
  };

  const submitAttendanceRequest = async (workerId: string, projectId: string, date: string) => {
    if (!checkOnline()) return;
    const worker = users.find(u => u.id === workerId);
    const project = projects.find(p => p.id === projectId);
    const contractor = users.find(u => u.role === 'contractor');
    
    // Find Supervisors: Assigned to this project OR General supervisors (no project assigned)
    const supervisors = users.filter(u => u.role === 'supervisor' && (!u.assigned_project_id || u.assigned_project_id === projectId));
    
    if (worker && project) {
       const message = `${worker.full_name} হাজিরা রিকোয়েস্ট পাঠিয়েছেন (${project.project_name})`;
       const metadata = { workerId, projectId, date, workerName: worker.full_name, projectName: project.project_name };

       // 1. Send to Contractor
       if (contractor) {
          await sendNotification(
             contractor.id, 
             message, 
             'attendance_request',
             metadata
          );
       }

       // 2. Send to Supervisors
       for (const sup of supervisors) {
           await sendNotification(
             sup.id, 
             message, 
             'attendance_request',
             metadata
          );
       }

       toast.success('রিকোয়েস্ট পাঠানো হয়েছে');
    } else {
        if (!contractor) toast.error('ঠিকাদার খুঁজে পাওয়া যায়নি। রিকোয়েস্ট পাঠানো যায়নি।');
        else if (!project) toast.error('প্রজেক্ট খুঁজে পাওয়া যায়নি।');
    }
  };

  const submitAdvanceRequest = async (workerId: string, amount: number) => {
      if (!checkOnline()) return;
      const worker = users.find(u => u.id === workerId);
      const contractor = users.find(u => u.role === 'contractor');
      if (contractor && worker) {
         await sendNotification(
            contractor.id,
            `${worker.full_name} ৳${amount} অগ্রিম/বেতন আবেদন করেছেন।`,
            'advance_request',
            { workerId, amount, workerName: worker.full_name }
         );
         toast.success('আবেদন পাঠানো হয়েছে');
      } else {
         toast.error('ঠিকাদার খুঁজে পাওয়া যায়নি। আবেদন পাঠানো যায়নি।');
      }
  };

  const addTransaction = async (transaction: Transaction) => {
     if (!checkOnline()) return;
     
     const txPayload = {
         ...transaction,
         project_id: transaction.project_id || null,
         amount: isNaN(Number(transaction.amount)) ? 0 : Number(transaction.amount)
     };

     const { error } = await supabase.from('transactions').insert([txPayload]);
     if (error) {
        console.error("Transaction Error:", error);
        toast.error('লেনদেন সেভ হয়নি: ' + error.message);
        return;
     }
     
     if (transaction.project_id) {
       const proj = projects.find(p => p.id === transaction.project_id);
       if (proj) {
         const newExpense = (proj.current_expense || 0) + txPayload.amount;
         await supabase.from('projects').update({ current_expense: newExpense }).eq('id', proj.id);
       }
     }
     toast.success('লেনদেন যুক্ত হয়েছে');
     refreshData();
  };

  const payWorker = async (workerId: string, amount: number) => {
    if (!checkOnline()) return;
    const worker = users.find(u => u.id === workerId);
    if (!worker) return;

    const { error: txError } = await supabase.from('transactions').insert([{
       id: Date.now().toString(),
       type: 'salary',
       amount: amount,
       related_user_id: workerId,
       description: `${worker.full_name} - পেমেন্ট`,
       date: new Date().toISOString().split('T')[0]
    }]);

    if (txError) {
        toast.error('পেমেন্ট রেকর্ড করা যায়নি: ' + txError.message);
        return;
    }

    const newBalance = worker.balance - amount;
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', workerId);

    await sendNotification(workerId, `আপনার ৳${amount} পেমেন্ট সম্পন্ন হয়েছে।`, 'payment');
    
    toast.success('পেমেন্ট সফল হয়েছে');
    refreshData();
  };

  const getWorkerBalance = (workerId: string) => {
    const worker = users.find(u => u.id === workerId);
    return worker ? worker.balance : 0;
  };

  const getDailyStats = (date: string): DailyStats => {
    const present = attendance.filter(a => a.date === date && (a.status === 'P' || a.status === 'H')).length;
    const laborCost = attendance.filter(a => a.date === date).reduce((sum, a) => sum + a.amount, 0);
    const otherCost = transactions.filter(t => t.date === date && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalDue = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    return {
      totalPresent: present,
      totalExpense: laborCost + otherCost,
      totalDue: totalDue
    };
  };

  const sendNotification = async (userId: string, message: string, type: any, metadata: any = null) => {
     if (!checkOnline()) return;
     const dateStr = new Date().toISOString().split('T')[0];
     await supabase.from('notifications').insert([{
        user_id: userId,
        message,
        type,
        date: dateStr, 
        is_read: false,
        metadata
     }]);
  };

  const markNotificationAsRead = async (id: string) => {
     await supabase.from('notifications').update({ is_read: true }).eq('id', id);
     // Update local state immediately for UI responsiveness
     setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const getUnreadCount = (userId: string) => {
    return notifications.filter(n => n.user_id === userId && !n.is_read).length;
  };

  const addWorkReport = async (report: WorkReport) => {
      if (!checkOnline()) return;
      const { error } = await supabase.from('work_reports').insert([report]);
      
      if (error) {
         toast.error('রিপোর্ট পাঠানো যায়নি');
         return;
      }
      
      const contractor = users.find(u => u.role === 'contractor');
      const sender = users.find(u => u.id === report.submitted_by);
      if (contractor && sender) {
         await sendNotification(
            contractor.id,
            `${sender.full_name} কাজের রিপোর্ট পাঠিয়েছেন।`,
            'work_report',
            { projectId: report.project_id }
         );
      }
      refreshData();
  };

  const addMaterialLog = async (log: MaterialLog) => {
      if (!checkOnline()) return;
      const { error } = await supabase.from('material_logs').insert([log]);
      if (error) {
         toast.error('মালামাল এন্ট্রি হয়নি');
         return;
      }
      refreshData();
  };

  const updateAppSettings = (settings: AppSettings) => {
    setAppSettings(settings);
    toast.info('সেটিংস আপডেট হয়েছে');
  };

  return (
    <DataContext.Provider value={{
      users,
      projects,
      attendance,
      transactions,
      notifications,
      workReports,
      materialLogs,
      appSettings,
      isLoadingData,
      isOnline,
      realtimeStatus,
      t,
      markAttendance,
      submitAttendanceRequest,
      submitAdvanceRequest,
      addOvertime,
      addProject,
      requestProject,
      updateProject,
      getWorkerBalance,
      getDailyStats,
      payWorker,
      registerUser,
      addUser,
      updateUser,
      updateAppSettings,
      sendNotification,
      markNotificationAsRead,
      getUnreadCount,
      addTransaction,
      addWorkReport,
      addMaterialLog,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};