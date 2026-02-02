import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BookOpen, Calculator, PieChart, User, History, Bell, Menu, X, LogOut, Settings, Phone, Info, Users, CalendarClock, CheckCircle, Building2, ChevronRight, ShieldCheck, Wallet, PlayCircle, PlusCircle, Grid, Search, Map } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const BottomNav = ({ openMenu }: { openMenu: () => void }) => {
  const { user } = useAuth();
  const { t } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Role-based Theme Colors (Refined - NO BLACK)
  const getThemeColor = () => {
    if (user?.role === 'supervisor') return { 
        activeText: 'text-purple-600 dark:text-purple-400', 
        activeBg: 'bg-purple-50 dark:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-800',
        glow: 'shadow-[0_0_20px_rgba(147,51,234,0.25)]'
    };
    if (user?.role === 'worker') return { 
        activeText: 'text-emerald-600 dark:text-emerald-400', 
        activeBg: 'bg-emerald-50 dark:bg-emerald-900/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]'
    };
    // Contractor (Royal Blue - No Black)
    return { 
        activeText: 'text-blue-700 dark:text-blue-300', 
        activeBg: 'bg-blue-50 dark:bg-blue-900/40',
        border: 'border-blue-200 dark:border-blue-700',
        glow: 'shadow-[0_0_20px_rgba(29,78,216,0.3)]'
    };
  };

  const theme = getThemeColor();
  
  const NavButton = ({ path, icon: Icon, label }: any) => {
    const active = isActive(path);
    return (
      <button 
        onClick={() => navigate(path)} 
        className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group ${active ? '-translate-y-2' : 'hover:bg-slate-50 dark:hover:bg-indigo-900/50'}`}
      >
        <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? `${theme.activeBg} ${theme.activeText} ${theme.glow} ring-1 ${theme.border}` : 'text-slate-400 dark:text-slate-400'}`}>
           <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </div>
        
        {/* Animated Label */}
        <span className={`absolute -bottom-4 text-[9px] font-bold transition-all duration-300 ${active ? `opacity-100 translate-y-0 ${theme.activeText}` : 'opacity-0 -translate-y-2'}`}>
            {label}
        </span>
        
        {/* Active Dot */}
        {active && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${theme.activeText.replace('text', 'bg')}`}></div>}
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 w-full z-50 px-3 pb-3 pt-0 pointer-events-none">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 flex justify-around items-center h-20 pointer-events-auto max-w-md mx-auto relative overflow-visible">
          {user?.role === 'contractor' && (
            <>
              <NavButton path="/" icon={Home} label={t('home')} />
              <NavButton path="/projects" icon={ClipboardList} label={t('projects')} />
              
              {/* Premium Floating Center Button - Royal Blue Gradient */}
              <div className="relative -top-8 group cursor-pointer" onClick={() => navigate('/khata')}>
                 <div className={`absolute inset-0 bg-blue-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity animate-pulse-slow`}></div>
                 <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 dark:from-blue-600 dark:to-indigo-700 text-white shadow-xl shadow-blue-900/30 border-[5px] border-slate-50 dark:border-slate-800 flex items-center justify-center transform active:scale-95 transition-all hover:-translate-y-1">
                   <BookOpen size={24} />
                 </div>
                 <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('khata')}
                 </span>
              </div>

              <NavButton path="/workers" icon={Users} label={t('workers')} />
              <NavButton path="/accounts" icon={Calculator} label={t('accounts')} />
            </>
          )}

          {user?.role === 'supervisor' && (
            <>
              <NavButton path="/" icon={Home} label={t('home')} />
              <NavButton path="/projects" icon={ClipboardList} label={t('projects')} />
              
              <div className="relative -top-8 group cursor-pointer" onClick={() => navigate('/entry')}>
                 <div className="absolute inset-0 bg-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                 <button className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl border-[5px] border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transform active:scale-95 transition-all hover:-translate-y-1">
                   <PlayCircle size={26} fill="currentColor" className="text-white ml-1" />
                 </button>
              </div>

              <NavButton path="/khata" icon={BookOpen} label={t('khata')} />
              <NavButton path="/workers" icon={Users} label={t('workers')} />
            </>
          )}

          {user?.role === 'worker' && (
            <>
              <NavButton path="/" icon={Home} label={t('home')} />
              
              <div className="relative -top-8 group cursor-pointer" onClick={() => navigate('/', { state: { openAttendanceModal: true } })}>
                 <div className="absolute inset-0 bg-emerald-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                 <button className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl border-[5px] border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transform active:scale-95 transition-all hover:-translate-y-1">
                   <CheckCircle size={26} />
                 </button>
              </div>

              <NavButton path="/history" icon={History} label={t('history')} />
            </>
          )}
        </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { users, appSettings, updateAppSettings, getUnreadCount, t, isOnline, realtimeStatus } = useData();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(appSettings);

  const unreadCount = user ? getUnreadCount(user.id) : 0;
  const contractor = users.find(u => u.role === 'contractor');
  const companyName = user?.role === 'contractor' ? user.company_name : contractor?.company_name || 'Project Khata';

  const isSupervisor = user?.role === 'supervisor';
  const isWorker = user?.role === 'worker';

  // Enhanced Drawer Header Gradient (No Black)
  const drawerHeaderClass = isSupervisor 
    ? 'bg-gradient-to-br from-purple-800 via-indigo-800 to-blue-900' 
    : isWorker 
      ? 'bg-gradient-to-br from-emerald-800 via-teal-800 to-cyan-900' 
      : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-800'; // Contractor Premium Blue/Slate

  // Bell Icon Theme Logic
  const bellIconClass = isSupervisor
    ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 shadow-purple-100'
    : isWorker
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 shadow-emerald-100'
      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 shadow-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:border-slate-700';

  let statusColor = 'bg-red-500';
  if (isOnline) {
     if (realtimeStatus === 'SUBSCRIBED') statusColor = 'bg-emerald-500';
     else if (realtimeStatus === 'CONNECTING') statusColor = 'bg-amber-500 animate-pulse';
     else statusColor = 'bg-red-500';
  }

  const handleLogout = async () => {
      setIsMenuOpen(false);
      await logout();
      navigate('/login');
  };

  const daysOfWeek = [
    { en: 'Saturday', bn: 'শনিবার' },
    { en: 'Sunday', bn: 'রবিবার' },
    { en: 'Monday', bn: 'সোমবার' },
    { en: 'Tuesday', bn: 'মঙ্গলবার' },
    { en: 'Wednesday', bn: 'বুধবার' },
    { en: 'Thursday', bn: 'বৃহস্পতিবার' },
    { en: 'Friday', bn: 'শুক্রবার' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative pb-24 transition-colors duration-300 font-sans">
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in-right {
            animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>
      
      {/* Premium Header - Tactile Buttons & Detailed Theme */}
      {user && (
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-4 py-3 flex items-center justify-between transition-all">
            {/* Left: Profile & Company */}
            <div className="flex items-center gap-3">
                 <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src={user.avatar_url || "https://picsum.photos/40"} alt="Avatar" className="relative w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 object-cover shadow-sm" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-700 ${statusColor} shadow-sm z-10`}></div>
                 </div>
                 <div className="leading-tight">
                    <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[140px] tracking-tight">{user.full_name}</h1>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[140px] flex items-center gap-1 mt-0.5">
                       <Building2 size={10} className="text-blue-600" /> {companyName}
                    </p>
                 </div>
            </div>
            
            {/* Right: Actions (Tactile Buttons) */}
            <div className="flex items-center gap-2.5">
                 {/* Notification Bell - Themed & Detailed */}
                 <button 
                    onClick={() => navigate('/notifications')}
                    className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 border-b-2 active:border-b-0 active:translate-y-0.5 shadow-sm ${bellIconClass}`}
                 >
                    <Bell size={20} strokeWidth={2.5} />
                    {unreadCount > 0 && (
                       <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-700 animate-pulse"></span>
                    )}
                 </button>
                 
                 {/* Menu Grid - Tactile Primary Color */}
                 <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 border-b-2 active:border-b-0 active:translate-y-0.5 shadow-sm
                      ${isSupervisor 
                        ? 'bg-purple-600 text-white border-purple-800 shadow-purple-200' 
                        : isWorker 
                          ? 'bg-emerald-600 text-white border-emerald-800 shadow-emerald-200'
                          : 'bg-blue-600 text-white border-blue-800 shadow-blue-200 dark:bg-blue-700 dark:border-blue-900'}
                    `}
                 >
                    <Grid size={20} strokeWidth={2.5} />
                 </button>
            </div>
        </div>
      )}

      {/* Modern Drawer - NO BLACK BACKGROUND */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
           <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)} />
           
           <div className="relative w-[85%] max-w-xs bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col animate-slide-in-right rounded-l-[2.5rem] overflow-hidden border-l border-white/20">
               {/* Drawer Header with Premium Gradient */}
               <div className={`relative ${drawerHeaderClass} p-6 pt-12 text-white overflow-hidden shrink-0`}>
                  {/* Abstract Shapes */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none"></div>
                  
                  <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md active:scale-90">
                     <X size={20} />
                  </button>

                  <div className="relative z-10 flex flex-col items-center">
                     <div className="relative mb-3 group cursor-pointer" onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>
                        <div className="absolute -inset-1 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src={user?.avatar_url || "https://picsum.photos/80"} className="relative w-20 h-20 rounded-full border-4 border-white/20 shadow-xl object-cover" />
                        {user?.is_verified && (
                           <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full border-2 border-white/20">
                              <ShieldCheck size={12} className="text-white"/>
                           </div>
                        )}
                     </div>
                     <h2 className="text-xl font-bold tracking-tight text-center leading-tight">{user?.full_name}</h2>
                     <p className="text-[10px] font-bold text-slate-200 bg-white/10 px-3 py-1 rounded-full mt-2 backdrop-blur-md border border-white/5 uppercase tracking-widest flex items-center gap-1">
                        <User size={10} />
                        {user?.role === 'contractor' ? 'Contractor' : user?.role === 'supervisor' ? 'Site Engineer' : user?.skill_type || 'Worker'}
                     </p>
                  </div>
               </div>

               {/* Drawer Items - Refined Typography & Spacing */}
               <div className="flex-1 overflow-y-auto py-6 px-5 space-y-1 bg-white dark:bg-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 mb-2 opacity-80">Menu</p>
                  
                  {[
                    { 
                        condition: true, 
                        label: t('profile'), 
                        icon: User, 
                        action: () => { navigate('/profile'); setIsMenuOpen(false); }, 
                        color: isSupervisor ? 'text-purple-600' : isWorker ? 'text-emerald-600' : 'text-indigo-600', 
                        bg: isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20' : isWorker ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20' 
                    },
                    { condition: user?.role !== 'worker', label: t('account_settings'), icon: CalendarClock, action: () => { setTempSettings(appSettings); setIsSettingsModalOpen(true); setIsMenuOpen(false); }, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { condition: user?.role !== 'worker', label: t('reports'), icon: PieChart, action: () => { navigate('/reports'); setIsMenuOpen(false); }, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
                    { condition: user?.role !== 'worker', label: t('tools'), icon: Calculator, action: () => { navigate('/tools'); setIsMenuOpen(false); }, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  ].map((item, idx) => (
                    item.condition && (
                      <button 
                        key={idx} 
                        onClick={item.action} 
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group active:scale-[0.98] border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${item.bg}`}>
                               <item.icon size={18} strokeWidth={2.5} className={item.color} />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    )
                  ))}

                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-4 mx-3"></div>
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 mb-2 opacity-80">General</p>

                  {[
                    { condition: true, label: t('app_settings'), icon: Settings, action: () => { navigate('/settings'); setIsMenuOpen(false); }, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
                    { condition: true, label: t('support'), icon: Phone, action: () => { navigate('/support'); setIsMenuOpen(false); }, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { 
                        condition: true, 
                        label: t('about'), 
                        icon: Info, 
                        action: () => { navigate('/about'); setIsMenuOpen(false); }, 
                        color: isSupervisor ? 'text-purple-600' : isWorker ? 'text-emerald-600' : 'text-blue-600', 
                        bg: isSupervisor ? 'bg-purple-50 dark:bg-purple-900/20' : isWorker ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-blue-50 dark:bg-blue-900/20' 
                    },
                  ].map((item, idx) => (
                    item.condition && (
                      <button 
                        key={idx} 
                        onClick={item.action} 
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group active:scale-[0.98] border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${item.bg}`}>
                               <item.icon size={18} strokeWidth={2.5} className={item.color} />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    )
                  ))}
               </div>

               {/* Drawer Footer */}
               <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                  <button 
                     onClick={handleLogout} 
                     className="w-full flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-700 text-red-500 rounded-2xl font-bold shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-600 group"
                  >
                     <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                     {t('logout')}
                  </button>
                  <p className="text-center text-[9px] text-slate-400 mt-4 font-bold tracking-wider opacity-60">
                     PROJECT KHATA v1.0.0
                  </p>
               </div>
           </div>
        </div>
      )}

      {/* Settings Modal (Unchanged) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-800/60 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('account_settings')}</h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"><X size={20}/></button>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 block uppercase tracking-wider">হিসাবের ধরণ</label>
                   <div className="grid grid-cols-2 gap-3">
                      {['weekly', 'monthly'].map((mode) => (
                        <button 
                          key={mode}
                          onClick={() => setTempSettings({...tempSettings, calcMode: mode as any})}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${tempSettings.calcMode === mode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                           <span className="capitalize">{t(mode as any)}</span>
                           {tempSettings.calcMode === mode && <CheckCircle size={18} className="text-blue-500" />}
                        </button>
                      ))}
                   </div>
                </div>

                {tempSettings.calcMode === 'weekly' ? (
                   <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 block">সপ্তাহ শুরু হবে</label>
                      <select 
                        value={tempSettings.weekStartDay}
                        onChange={(e) => setTempSettings({...tempSettings, weekStartDay: e.target.value})}
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white font-medium"
                      >
                         {daysOfWeek.map(day => (
                            <option key={day.en} value={day.en}>{day.bn}</option>
                         ))}
                      </select>
                   </div>
                ) : (
                   <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 block">মাস শুরু হবে (তারিখ)</label>
                      <div className="flex items-center gap-3">
                         <input 
                           type="number" 
                           min="1" 
                           max="28"
                           value={tempSettings.monthStartDate}
                           onChange={(e) => setTempSettings({...tempSettings, monthStartDate: parseInt(e.target.value)})}
                           className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-center font-bold text-slate-900 dark:text-white text-lg"
                         />
                      </div>
                   </div>
                )}

                <button 
                  onClick={() => { updateAppSettings(tempSettings); setIsSettingsModalOpen(false); }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                >
                   {t('save_settings')}
                </button>
             </div>
          </div>
        </div>
      )}
      
      <main className="max-w-md mx-auto min-h-screen">
        {children}
      </main>

      {user && <BottomNav openMenu={() => setIsMenuOpen(true)} />}
    </div>
  );
};