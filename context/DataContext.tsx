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
  sendNotification: (userId: string, message: string, type: 'info' | 'alert' | 'success' | 'payment') => Promise<void>;
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
  
  // Helper to load initial state from cache
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

  // Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    calcMode: 'weekly',
    weekStartDay: 'Saturday',
    monthStartDate: 1,
    language: 'bn',
    darkMode: false
  });

  // Debounce Ref for Realtime
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

  // Fetch Data from Supabase
  const refreshData = async () => {
    if (!user || !navigator.onLine) {
        setIsLoadingData(false);
        return;
    }

    try {
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').limit(1000),
        supabase.from('projects').select('*').limit(1000),
        supabase.from('attendance').select('*').limit(5000),
        supabase.from('transactions').select('*').limit(2000),
        supabase.from('notifications').select('*').limit(100),
        supabase.from('work_reports').select('*').limit(500),
        supabase.from('material_logs').select('*').limit(500)
      ]);

      const [usersRes, projectsRes, attRes, txRes, notifRes, reportsRes, matRes] = results;

      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
         setUsers(usersRes.value.data);
         localStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(usersRes.value.data));
      }
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
         setProjects(projectsRes.value.data);
         localStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projectsRes.value.data));
      }
      if (attRes.status === 'fulfilled' && attRes.value.data) {
         setAttendance(attRes.value.data);
         localStorage.setItem(CACHE_KEYS.ATTENDANCE, JSON.stringify(attRes.value.data));
      }
      if (txRes.status === 'fulfilled' && txRes.value.data) {
         setTransactions(txRes.value.data);
         localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(txRes.value.data));
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.data) {
         setNotifications(notifRes.value.data);
         localStorage.setItem(CACHE_KEYS.NOTIFICATIONS, JSON.stringify(notifRes.value.data));
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value.data) {
         setWorkReports(reportsRes.value.data);
         localStorage.setItem(CACHE_KEYS.REPORTS, JSON.stringify(reportsRes.value.data));
      }
      if (matRes.status === 'fulfilled' && matRes.value.data) {
         setMaterialLogs(matRes.value.data);
         localStorage.setItem(CACHE_KEYS.MATERIALS, JSON.stringify(matRes.value.data));
      }

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
    
    // Realtime Subscription with Debounce logic to save quota on free plan
    const handleRealtimeUpdate = (payload: any) => {
       // console.log('Change received!', payload); // Debug
       if (debounceRef.current) clearTimeout(debounceRef.current);
       debounceRef.current = setTimeout(() => {
          refreshData();
       }, 1000); // 1s debounce
    };

    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleRealtimeUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, handleRealtimeUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, handleRealtimeUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, handleRealtimeUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_reports' }, handleRealtimeUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'material_logs' }, handleRealtimeUpdate)
      .subscribe((status) => {
         setRealtimeStatus(status as RealtimeStatus);
         if (status === 'SUBSCRIBED') {
            // console.log('Realtime Connected');
         }
      });

    return () => { 
        supabase.removeChannel(channel); 
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [user]);

  const t = (key: keyof typeof TRANSLATIONS.bn) => {
    return TRANSLATIONS[appSettings.language][key] || key;
  };

  // --- ACTIONS ---

  const registerUser = async (newUser: Profile) => {};

  const addUser = async (newUser: Profile) => {
    try {
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
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
           skill_type: newUser.skill_type,
           daily_rate: newUser.daily_rate,
           designation: newUser.designation,
           monthly_salary: newUser.monthly_salary,
           payment_type: newUser.payment_type,
           assigned_project_id: newUser.assigned_project_id,
           role: newUser.role,
           phone: newUser.phone,
           full_name: newUser.full_name,
           avatar_url: newUser.avatar_url,
           company_name: newUser.company_name
        };
        await supabase.from('profiles').upsert(updates);
      }
      
      toast.success('নতুন ব্যবহারকারী সফলভাবে তৈরি হয়েছে!');
      refreshData();

    } catch (error: any) {
      console.error(error);
      toast.error('Error: ' + error.message);
    }
  };

  const updateUser = async (updatedUser: Profile) => {
    await supabase.from('profiles').update(updatedUser).eq('id', updatedUser.id);
    toast.success('প্রোফাইল আপডেট হয়েছে');
    refreshData();
  };

  const addProject = async (project: Project) => {
    const { id, ...projectData } = project;
    await supabase.from('projects').insert([projectData]);
    toast.success('নতুন প্রজেক্ট তৈরি হয়েছে');
    refreshData();
  };
  
  const requestProject = async (project: Project, supervisorName: string) => {
     const contractor = users.find(u => u.role === 'contractor');
     if(contractor) {
        await sendNotification(contractor.id, `${supervisorName} একটি নতুন প্রজেক্ট (${project.project_name}) তৈরির অনুরোধ করেছেন।`, 'project_request', project);
        toast.info('অনুরোধ পাঠানো হয়েছে');
     }
  };

  const updateProject = async (project: Project) => {
    await supabase.from('projects').update(project).eq('id', project.id);
    toast.success('প্রজেক্ট আপডেট হয়েছে');
    refreshData();
  };

  const markAttendance = async (workerId: string, status: 'P' | 'H' | 'A', projectId: string, date: string) => {
    const worker = users.find(u => u.id === workerId);
    if (!worker) return;

    let amount = 0;
    if (status === 'P') amount = worker.daily_rate || 0;
    if (status === 'H') amount = (worker.daily_rate || 0) / 2;

    const existing = attendance.find(a => a.worker_id === workerId && a.date === date);

    if (existing) {
      let oldAmount = existing.amount;
      await supabase.from('attendance').update({ status, project_id: projectId, amount }).eq('id', existing.id);
      
      const newBalance = (worker.balance - oldAmount) + amount;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', workerId);
    } else {
      await supabase.from('attendance').insert([{
        worker_id: workerId,
        project_id: projectId,
        date: date,
        status: status,
        amount: amount,
        overtime: 0
      }]);
      await supabase.from('profiles').update({ balance: worker.balance + amount }).eq('id', workerId);
    }
    toast.success('হাজিরা আপডেট হয়েছে');
    refreshData();
  };

  const addOvertime = async (workerId: string, hours: number, date: string) => {
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
    }
  };

  const submitAttendanceRequest = async (workerId: string, projectId: string, date: string) => {
    const worker = users.find(u => u.id === workerId);
    const project = projects.find(p => p.id === projectId);
    const contractor = users.find(u => u.role === 'contractor');
    
    if (contractor && worker && project) {
       await sendNotification(
          contractor.id, 
          `${worker.full_name} হাজিরা রিকোয়েস্ট পাঠিয়েছেন (${project.project_name})`, 
          'attendance_request',
          { workerId, projectId, date, workerName: worker.full_name, projectName: project.project_name }
       );
       toast.success('রিকোয়েস্ট পাঠানো হয়েছে');
    }
  };

  const submitAdvanceRequest = async (workerId: string, amount: number) => {
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
      }
  };

  const addTransaction = async (transaction: Transaction) => {
     const { id, ...txData } = transaction;
     await supabase.from('transactions').insert([txData]);
     
     if (transaction.project_id) {
       const proj = projects.find(p => p.id === transaction.project_id);
       if (proj) {
         const newExpense = proj.current_expense + transaction.amount;
         await supabase.from('projects').update({ current_expense: newExpense }).eq('id', proj.id);
       }
     }
     toast.success('লেনদেন যুক্ত হয়েছে');
     refreshData();
  };

  const payWorker = async (workerId: string, amount: number) => {
    const worker = users.find(u => u.id === workerId);
    if (!worker) return;

    await supabase.from('transactions').insert([{
       type: 'salary',
       amount: amount,
       related_user_id: workerId,
       description: `${worker.full_name} - পেমেন্ট`,
       date: new Date().toISOString().split('T')[0]
    }]);

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
     await supabase.from('notifications').insert([{
        user_id: userId,
        message,
        type,
        date: new Date().toLocaleDateString('bn-BD'),
        is_read: false,
        metadata
     }]);
     refreshData();
  };

  const markNotificationAsRead = async (id: string) => {
     await supabase.from('notifications').update({ is_read: true }).eq('id', id);
     refreshData();
  };

  const getUnreadCount = (userId: string) => {
    return notifications.filter(n => n.user_id === userId && !n.is_read).length;
  };

  const addWorkReport = async (report: WorkReport) => {
      const { id, ...data } = report;
      await supabase.from('work_reports').insert([data]);
      
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
      const { id, ...data } = log;
      await supabase.from('material_logs').insert([data]);
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