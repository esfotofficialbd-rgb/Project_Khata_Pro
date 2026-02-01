import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BookOpen, Calculator, PieChart, User, History, Bell, Menu, X, LogOut, Settings, Phone, Info, Users, CalendarClock, CheckCircle, Building2, ChevronRight, ShieldCheck, Wallet } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const BottomNav = ({ openMenu }: { openMenu: () => void }) => {
  const { user } = useAuth();
  const { t } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const NavButton = ({ path, icon: Icon, label }: any) => (
    <button 
      onClick={() => navigate(path)} 
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive(path) ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon size={24} strokeWidth={isActive(path) ? 2.5 : 2} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );

  return (
    <div className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 z-50 pb-safe safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {user?.role === 'contractor' && (
        <>
          <NavButton path="/" icon={Home} label={t('home')} />
          <NavButton path="/projects" icon={ClipboardList} label={t('projects')} />
          <div className="relative -top-5">
             <button 
               onClick={() => navigate('/khata')}
               className="w-14 h-14 rounded-full bg-slate-900 dark:bg-blue-600 text-white shadow-lg border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center transform active:scale-95 transition-transform"
             >
               <BookOpen size={24} />
             </button>
          </div>
          <NavButton path="/workers" icon={Users} label={t('workers')} />
          <NavButton path="/accounts" icon={Calculator} label={t('accounts')} />
        </>
      )}

      {user?.role === 'supervisor' && (
        <>
          <NavButton path="/" icon={Home} label={t('home')} />
          <NavButton path="/khata" icon={BookOpen} label={t('khata')} />
          <NavButton path="/workers" icon={Users} label={t('workers')} />
          <NavButton path="/projects" icon={ClipboardList} label={t('projects')} />
        </>
      )}

      {user?.role === 'worker' && (
        <>
          <NavButton path="/" icon={Home} label={t('home')} />
          
          <div className="relative -top-5">
             <button 
               onClick={() => navigate('/', { state: { openAttendanceModal: true } })}
               className="w-16 h-16 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 border-4 border-slate-50 dark:border-slate-950 flex flex-col items-center justify-center transform active:scale-95 transition-transform"
             >
               <CheckCircle size={28} />
             </button>
             <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('give_attendance')}</span>
          </div>

          <NavButton path="/history" icon={History} label={t('history')} />
        </>
      )}
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

  let statusColor = 'bg-red-500';
  if (isOnline) {
     if (realtimeStatus === 'SUBSCRIBED') statusColor = 'bg-green-500';
     else if (realtimeStatus === 'CONNECTING') statusColor = 'bg-orange-500 animate-pulse';
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative pb-24 transition-colors duration-300 font-sans">
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
      
      {/* Header */}
      {user && (
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <img src={user.avatar_url || "https://picsum.photos/40"} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${statusColor}`} title={realtimeStatus}></div>
                 </div>
                 <div className="leading-tight">
                    <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[120px]">{user.full_name}</h1>
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

      {/* Modern Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)} />
           
           <div className="relative w-[85%] max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right rounded-l-[2.5rem] overflow-hidden">
               {/* Drawer Header */}
               <div className="relative bg-slate-900 p-6 pt-10 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/30 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none"></div>
                  
                  <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md">
                     <X size={20} />
                  </button>

                  <div className="relative z-10 flex flex-col items-center">
                     <div className="relative mb-3 group">
                        <img src={user?.avatar_url || "https://picsum.photos/80"} className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl object-cover" />
                        {user?.is_verified && (
                           <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full border-2 border-slate-900">
                              <ShieldCheck size={12} className="text-white"/>
                           </div>
                        )}
                     </div>
                     <h2 className="text-xl font-bold tracking-tight">{user?.full_name}</h2>
                     <p className="text-xs font-medium text-slate-300 bg-white/10 px-3 py-1 rounded-full mt-2 backdrop-blur-md border border-white/5 uppercase tracking-wider">
                        {user?.role === 'contractor' ? 'Contractor' : user?.role === 'supervisor' ? 'Site Engineer' : 'Team Member'}
                     </p>
                  </div>
               </div>

               {/* Drawer Items */}
               <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">Menu</p>
                  
                  {[
                    { condition: true, label: t('profile'), icon: User, action: () => { navigate('/profile'); setIsMenuOpen(false); }, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { condition: user?.role !== 'worker', label: t('account_settings'), icon: CalendarClock, action: () => { setTempSettings(appSettings); setIsSettingsModalOpen(true); setIsMenuOpen(false); }, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { condition: user?.role !== 'worker', label: t('reports'), icon: PieChart, action: () => { navigate('/reports'); setIsMenuOpen(false); }, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
                    { condition: user?.role !== 'worker', label: t('tools'), icon: Calculator, action: () => { navigate('/tools'); setIsMenuOpen(false); }, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  ].map((item, idx) => (
                    item.condition && (
                      <button 
                        key={idx} 
                        onClick={item.action} 
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${item.bg}`}>
                               <item.icon size={20} className={item.color} />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    )
                  ))}

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-4 mx-2"></div>
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">General</p>

                  {[
                    { condition: true, label: t('app_settings'), icon: Settings, action: () => { navigate('/settings'); setIsMenuOpen(false); }, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
                    { condition: true, label: t('support'), icon: Phone, action: () => { navigate('/support'); setIsMenuOpen(false); }, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { condition: true, label: t('about'), icon: Info, action: () => { navigate('/about'); setIsMenuOpen(false); }, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  ].map((item, idx) => (
                    item.condition && (
                      <button 
                        key={idx} 
                        onClick={item.action} 
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group active:scale-95 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${item.bg}`}>
                               <item.icon size={20} className={item.color} />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    )
                  ))}
               </div>

               {/* Drawer Footer */}
               <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <button 
                     onClick={handleLogout} 
                     className="w-full flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 text-red-500 rounded-2xl font-bold shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                  >
                     <LogOut size={20} />
                     {t('logout')}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-4 font-medium flex justify-center gap-2">
                     <span>v1.0.0</span> • <span>Project Khata</span>
                  </p>
               </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
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