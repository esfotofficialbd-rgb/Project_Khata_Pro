import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BookOpen, Calculator, PieChart, User, History, Bell, Menu, X, LogOut, Settings, Phone, Info, Users, CalendarClock, CheckCircle, Building2, Cloud, CloudOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const BottomNav = ({ openMenu }: { openMenu: () => void }) => {
  const { user } = useAuth();
  const { t } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const NavButton = ({ path, icon: Icon, label, colorClass = "text-blue-600 dark:text-blue-400" }: any) => (
    <button 
      onClick={() => navigate(path)} 
      className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 group ${isActive(path) ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
    >
      <div className={`p-1.5 rounded-xl transition-all ${isActive(path) ? 'bg-blue-50 dark:bg-slate-800' : 'bg-transparent'}`}>
        <Icon size={24} className={isActive(path) ? colorClass : 'text-slate-500 dark:text-slate-400'} strokeWidth={isActive(path) ? 2.5 : 2} />
      </div>
      <span className={`text-[10px] font-bold mt-1 ${isActive(path) ? colorClass : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </span>
      {isActive(path) && <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 z-50 px-4 pb-2 pt-1">
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"></div>
      
      <div className="relative h-full max-w-md mx-auto flex justify-between items-center">
        {user?.role === 'contractor' && (
          <>
            <NavButton path="/" icon={Home} label={t('home')} />
            <NavButton path="/projects" icon={ClipboardList} label={t('projects')} />
            <div className="relative -top-6">
               <button 
                 onClick={() => navigate('/khata')}
                 className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 border-4 border-slate-50 dark:border-slate-950 flex flex-col items-center justify-center transform active:scale-95 transition-all"
               >
                 <BookOpen size={28} />
               </button>
               <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 dark:text-blue-400">{t('khata')}</span>
            </div>
            <NavButton path="/workers" icon={Users} label={t('workers')} />
            <NavButton path="/accounts" icon={Calculator} label={t('accounts')} />
          </>
        )}

        {user?.role === 'supervisor' && (
          <>
            <NavButton path="/" icon={Home} label={t('home')} colorClass="text-purple-600 dark:text-purple-400" />
            <NavButton path="/khata" icon={BookOpen} label={t('khata')} colorClass="text-purple-600 dark:text-purple-400" />
            <NavButton path="/workers" icon={Users} label={t('workers')} colorClass="text-purple-600 dark:text-purple-400" />
            <NavButton path="/projects" icon={ClipboardList} label={t('projects')} colorClass="text-purple-600 dark:text-purple-400" />
          </>
        )}

        {user?.role === 'worker' && (
          <>
            <NavButton path="/" icon={Home} label={t('home')} colorClass="text-emerald-600 dark:text-emerald-400" />
            <div className="relative -top-6 w-full flex justify-center">
               <button 
                 onClick={() => navigate('/', { state: { openAttendanceModal: true } })}
                 className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 border-4 border-slate-50 dark:border-slate-950 flex flex-col items-center justify-center transform active:scale-95 transition-all"
               >
                 <CheckCircle size={30} />
               </button>
               <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t('give_attendance')}</span>
            </div>
            <NavButton path="/history" icon={History} label={t('history')} colorClass="text-emerald-600 dark:text-emerald-400" />
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

  // Determine Dot Color
  let statusColor = 'bg-red-500'; // Default Offline
  if (isOnline) {
     if (realtimeStatus === 'SUBSCRIBED') statusColor = 'bg-green-500';
     else if (realtimeStatus === 'CONNECTING') statusColor = 'bg-orange-500 animate-pulse';
     else statusColor = 'bg-red-500';
  }

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative pb-24 transition-colors duration-300 font-sans">
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out forwards;
          }
          @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-up {
            animation: scaleUp 0.2s ease-out forwards;
          }
        `}
      </style>
      
      {/* Header */}
      {user && (
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <img src={user.avatar_url || "https://picsum.photos/40"} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover" />
                    {/* Status Dot */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${statusColor}`} title={realtimeStatus}></div>
                 </div>
                 <div className="leading-tight">
                    <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[120px]">{user.full_name}</h1>
                    {/* Display Company Name or Role */}
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[140px] mt-0.5">
                       {companyName || user.role.toUpperCase()}
                       {!isOnline && <span className="text-red-500 ml-1 font-bold text-[9px]">(Offline)</span>}
                    </p>
                 </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => navigate('/notifications')}
                    className="relative p-2.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95"
                 >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                       <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800 animate-pulse"></span>
                    )}
                 </button>
                 <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="p-2.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95"
                 >
                    <Menu size={22} />
                 </button>
            </div>
        </div>
      )}

      {/* Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)} />
           
           <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col animate-slide-in-right border-l border-slate-100 dark:border-slate-800">
               <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} />
               </button>

               <div className="mt-8 mb-8 flex flex-col items-center">
                  <div className="relative mb-3">
                    <img src={user?.avatar_url || "https://picsum.photos/80"} className="w-20 h-20 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-xl object-cover" />
                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 ${statusColor}`}></div>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{user?.full_name}</h2>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full mt-2">{user?.role.toUpperCase()}</p>
               </div>

               <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {[
                    { condition: user?.role !== 'worker', label: t('account_settings'), icon: CalendarClock, action: () => { setTempSettings(appSettings); setIsSettingsModalOpen(true); setIsMenuOpen(false); }, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300' },
                    { condition: user?.role !== 'worker', label: t('reports'), icon: PieChart, action: () => { navigate('/reports'); setIsMenuOpen(false); }, color: 'text-cyan-500', bg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20' },
                    { condition: user?.role === 'worker', label: t('history'), icon: History, action: () => { navigate('/history'); setIsMenuOpen(false); }, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-700 dark:text-orange-300' },
                    { condition: true, label: t('profile'), icon: User, action: () => { navigate('/profile'); setIsMenuOpen(false); }, color: 'text-indigo-500', bg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20' },
                    { condition: true, label: t('app_settings'), icon: Settings, action: () => { navigate('/settings'); setIsMenuOpen(false); }, color: 'text-slate-500', bg: 'hover:bg-slate-50 dark:hover:bg-slate-800' },
                    { condition: true, label: t('support'), icon: Phone, action: () => { navigate('/support'); setIsMenuOpen(false); }, color: 'text-green-500', bg: 'hover:bg-green-50 dark:hover:bg-green-900/20' },
                    { condition: true, label: t('about'), icon: Info, action: () => { navigate('/about'); setIsMenuOpen(false); }, color: 'text-purple-500', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20' },
                  ].map((item, idx) => (
                    item.condition && (
                      <button 
                        key={idx} 
                        onClick={item.action} 
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${item.bg || 'hover:bg-slate-50 dark:hover:bg-slate-800'} ${item.textColor || 'text-slate-600 dark:text-slate-300'}`}
                      >
                         <item.icon size={20} className={item.color} />
                         <span>{item.label}</span>
                      </button>
                    )
                  ))}
               </div>

               <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => { setIsMenuOpen(false); logout(); navigate('/login'); }} className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                     <LogOut size={20} />
                     {t('logout')}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">v1.0.0 • Build 2405</p>
               </div>
           </div>
        </div>
      )}

      {/* Settings Modal - Modernized */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('account_settings')}</h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200"><X size={20}/></button>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 block uppercase tracking-wider">হিসাবের ধরণ</label>
                   <div className="grid grid-cols-2 gap-3">
                      {['weekly', 'monthly'].map((mode) => (
                        <button 
                          key={mode}
                          onClick={() => setTempSettings({...tempSettings, calcMode: mode as any})}
                          className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${tempSettings.calcMode === mode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                           <span className="capitalize">{t(mode as any)}</span>
                           {tempSettings.calcMode === mode && <CheckCircle size={18} className="text-blue-500" />}
                        </button>
                      ))}
                   </div>
                </div>

                {tempSettings.calcMode === 'weekly' ? (
                   <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 block">সপ্তাহ শুরু হবে</label>
                      <select 
                        value={tempSettings.weekStartDay}
                        onChange={(e) => setTempSettings({...tempSettings, weekStartDay: e.target.value})}
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900 dark:text-white font-medium"
                      >
                         {daysOfWeek.map(day => (
                            <option key={day.en} value={day.en}>{day.bn}</option>
                         ))}
                      </select>
                   </div>
                ) : (
                   <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 block">মাস শুরু হবে (তারিখ)</label>
                      <div className="flex items-center gap-3">
                         <input 
                           type="number" 
                           min="1" 
                           max="28"
                           value={tempSettings.monthStartDate}
                           onChange={(e) => setTempSettings({...tempSettings, monthStartDate: parseInt(e.target.value)})}
                           className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center font-bold text-slate-900 dark:text-white text-lg"
                         />
                      </div>
                   </div>
                )}

                <button 
                  onClick={() => { updateAppSettings(tempSettings); setIsSettingsModalOpen(false); }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
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