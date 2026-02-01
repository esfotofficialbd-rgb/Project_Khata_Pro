import React from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Info, AlertTriangle, CheckCircle, Wallet, Check, ClipboardList, X, UserCheck, FileText, Clock, MapPin, ChevronRight, CheckCheck, Banknote } from 'lucide-react';
import { Project } from '../types';

export const Notifications = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, addProject, markAttendance, payWorker, users } = useData();
  const navigate = useNavigate();

  if (!user) return null;

  // Filter for current user and sort by newest
  const myNotifications = notifications
    .filter(n => n.user_id === user.id)
    .sort((a, b) => b.id.localeCompare(a.id));

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400"/>;
      case 'success': return <CheckCircle size={18} className="text-green-600 dark:text-green-400"/>;
      case 'payment': return <Banknote size={18} className="text-emerald-600 dark:text-emerald-400"/>;
      case 'project_request': return <ClipboardList size={18} className="text-blue-600 dark:text-blue-400"/>;
      case 'attendance_request': return <UserCheck size={18} className="text-purple-600 dark:text-purple-400"/>;
      case 'advance_request': return <Wallet size={18} className="text-rose-600 dark:text-rose-400"/>;
      case 'work_report': return <FileText size={18} className="text-indigo-600 dark:text-indigo-400"/>;
      default: return <Info size={18} className="text-slate-600 dark:text-slate-400"/>;
    }
  };

  const getBgColor = (type: string) => {
     switch(type) {
      case 'alert': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'success': return 'bg-green-100 dark:bg-green-900/30';
      case 'payment': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'project_request': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'attendance_request': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'advance_request': return 'bg-rose-100 dark:bg-rose-900/30';
      case 'work_report': return 'bg-indigo-100 dark:bg-indigo-900/30';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  }

  const getGroupLabel = (dateStr: string) => {
      try {
          const date = new Date(dateStr);
          const today = new Date();
          if (date.toDateString() === today.toDateString()) return 'আজ';
          
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (date.toDateString() === yesterday.toDateString()) return 'গতকাল';

          return new Date(dateStr).toLocaleDateString('bn-BD', {day:'numeric', month:'long'});
      } catch (e) {
          return 'অন্যান্য';
      }
  };

  const handleMarkAllRead = () => {
      myNotifications.forEach(n => {
          if(!n.is_read) markNotificationAsRead(n.id);
      });
  };

  const handleApproveProject = (notificationId: string, projectData: Project) => {
      addProject(projectData);
      markNotificationAsRead(notificationId);
      alert('প্রজেক্টটি সফলভাবে তৈরি করা হয়েছে।');
  };

  const handleDeclineProject = (notificationId: string) => {
      if(window.confirm('আপনি কি এই অনুরোধটি বাতিল করতে চান?')) {
          markNotificationAsRead(notificationId);
      }
  }

  const handleApproveAttendance = (notificationId: string, data: any) => {
      markAttendance(data.workerId, 'P', data.projectId, data.date);
      markNotificationAsRead(notificationId);
      alert('হাজিরা গ্রহণ করা হয়েছে।');
  };

  const handleDeclineAttendance = (notificationId: string) => {
      markNotificationAsRead(notificationId);
  }

  const handleApproveAdvance = (notificationId: string, data: any) => {
     if(window.confirm(`আপনি কি ৳${data.amount} পেমেন্ট নিশ্চিত করছেন?`)) {
        payWorker(data.workerId, Number(data.amount));
        markNotificationAsRead(notificationId);
        alert('পেমেন্ট সফল হয়েছে এবং ব্যালেন্স আপডেট করা হয়েছে।');
     }
  };

  const handleDeclineAdvance = (notificationId: string) => {
     markNotificationAsRead(notificationId);
  };

  const getWorkerLiveBalance = (workerId: string) => {
      const w = users.find(u => u.id === workerId);
      return w ? w.balance : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
               <ArrowLeft size={22} />
            </button>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white">ব্যক্তিগত নোটিফিকেশন</h1>
         </div>
         {myNotifications.some(n => !n.is_read) && (
            <button onClick={handleMarkAllRead} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
               <CheckCheck size={14}/> সব পড়ুন
            </button>
         )}
      </div>

      <div className="p-4 space-y-6">
        {myNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                <Bell size={32} className="opacity-50" />
             </div>
             <p className="font-medium text-sm">কোন নোটিফিকেশন নেই</p>
          </div>
        ) : (
          // Render Logic with Grouping
          (() => {
             let lastGroup = '';
             return myNotifications.map((notification) => {
                const group = getGroupLabel(notification.date);
                const showHeader = group !== lastGroup;
                lastGroup = group;

                // Extract Amount if available in message (Simple heuristic for display)
                const amountMatch = notification.message.match(/৳\s?([0-9,]+)/);
                const displayAmount = amountMatch ? amountMatch[0] : null;

                return (
                   <React.Fragment key={notification.id}>
                      {showHeader && (
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mt-2 sticky top-16 z-0 bg-slate-50 dark:bg-slate-950 py-1">{group}</h3>
                      )}
                      
                      <div 
                         className={`relative p-4 rounded-2xl border transition-all duration-300 active:scale-[0.99] ${
                            !notification.is_read 
                            ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900 shadow-lg shadow-blue-50 dark:shadow-none' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-80'
                         }`}
                      >
                         {!notification.is_read && (
                            <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-pulse"></span>
                         )}
                         
                         <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${getBgColor(notification.type)}`}>
                               {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                               
                               {/* Special Layout for Payment Notifications (Worker View) */}
                               {notification.type === 'payment' ? (
                                  <div>
                                     <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">পেমেন্ট রিসিভড</p>
                                     <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-1">
                                        {displayAmount || 'টাকা'} জমা হয়েছে
                                     </p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">
                                        আপনার অ্যাকাউন্টে ব্যালেন্স আপডেট করা হয়েছে।
                                     </p>
                                  </div>
                               ) : (
                                  /* Standard Layout */
                                  <p className={`text-sm leading-relaxed ${!notification.is_read ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                     {notification.message}
                                  </p>
                               )}
                               
                               {/* --- Action Cards for Contractors/Supervisors --- */}
                               
                               {/* Project Request Action */}
                               {notification.type === 'project_request' && !notification.is_read && notification.metadata && (
                                   <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                       <div className="flex items-center gap-2 mb-2">
                                          <div className="bg-white dark:bg-slate-700 p-1.5 rounded-lg border border-slate-100 dark:border-slate-600">
                                             <ClipboardList size={14} className="text-blue-500"/>
                                          </div>
                                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{notification.metadata.project_name}</p>
                                       </div>
                                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1 pl-1"><MapPin size={10}/> {notification.metadata.location}</p>
                                       <div className="flex gap-2">
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); handleApproveProject(notification.id, notification.metadata); }}
                                              className="flex-1 bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-1 shadow-sm"
                                           >
                                               <CheckCircle size={12} /> অনুমোদন
                                           </button>
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeclineProject(notification.id); }}
                                              className="flex-1 bg-white dark:bg-slate-700 text-red-500 text-xs font-bold py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
                                           >
                                               <X size={12} /> বাতিল
                                           </button>
                                       </div>
                                   </div>
                               )}

                               {/* Attendance Request Action */}
                               {notification.type === 'attendance_request' && !notification.is_read && notification.metadata && (
                                   <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                       <div className="flex justify-between mb-2 items-center">
                                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{notification.metadata.workerName}</p>
                                          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono text-slate-600 dark:text-slate-300">{notification.metadata.date}</span>
                                       </div>
                                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1"><MapPin size={10}/> {notification.metadata.projectName}</p>
                                       <div className="flex gap-2">
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); handleApproveAttendance(notification.id, notification.metadata); }}
                                              className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1 shadow-sm"
                                           >
                                               <CheckCircle size={12} /> গ্রহণ করুন
                                           </button>
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeclineAttendance(notification.id); }}
                                              className="flex-1 bg-white dark:bg-slate-700 text-slate-500 text-xs font-bold py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
                                           >
                                               <X size={12} /> বাতিল
                                           </button>
                                       </div>
                                   </div>
                               )}

                               {/* Advance Request Action */}
                               {notification.type === 'advance_request' && !notification.is_read && notification.metadata && (
                                  <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                     <div className="flex justify-between items-center mb-2">
                                        <div>
                                           <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{notification.metadata.workerName}</p>
                                           <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                              বকেয়া: <span className={`font-bold ${getWorkerLiveBalance(notification.metadata.workerId) > 0 ? 'text-red-500' : 'text-green-500'}`}>৳{getWorkerLiveBalance(notification.metadata.workerId).toLocaleString()}</span>
                                           </p>
                                        </div>
                                        <div className="text-right">
                                           <span className="text-[10px] text-slate-400 block uppercase">রিকোয়েস্ট</span>
                                           <p className="text-base font-bold text-slate-800 dark:text-white">৳ {notification.metadata.amount}</p>
                                        </div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button 
                                           onClick={(e) => { e.stopPropagation(); handleApproveAdvance(notification.id, notification.metadata); }}
                                           className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 shadow-sm"
                                        >
                                           <Wallet size={12} /> প্রদান করুন
                                        </button>
                                        <button 
                                           onClick={(e) => { e.stopPropagation(); handleDeclineAdvance(notification.id); }}
                                           className="flex-1 bg-white dark:bg-slate-700 text-slate-500 text-xs font-bold py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
                                        >
                                           <X size={12} /> বাতিল
                                        </button>
                                     </div>
                                  </div>
                               )}

                               {/* Work Report Link */}
                               {notification.type === 'work_report' && notification.metadata && (
                                  <div className="mt-2">
                                     <button 
                                       onClick={() => navigate(`/projects/${notification.metadata.projectId}`)}
                                       className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg w-fit transition-colors"
                                     >
                                        রিপোর্ট দেখুন <ArrowLeft size={10} className="rotate-180" />
                                     </button>
                                  </div>
                               )}

                               <div className="flex items-center justify-between mt-3 border-t border-slate-50 dark:border-slate-800 pt-2">
                                  <div className="flex items-center gap-1 text-slate-400">
                                     <Clock size={10} />
                                     <p className="text-[10px] font-medium">
                                        {new Date(notification.date).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})}
                                     </p>
                                  </div>
                                  {notification.is_read && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Check size={10}/>Seen</span>}
                               </div>
                            </div>
                         </div>
                         
                         {/* Mark as read overlay for simple notifications */}
                         {['project_request', 'attendance_request', 'advance_request'].indexOf(notification.type) === -1 && !notification.is_read && (
                            <button 
                              onClick={() => markNotificationAsRead(notification.id)}
                              className="absolute inset-0 w-full h-full cursor-pointer z-0"
                              style={{ background: 'transparent' }}
                              aria-label="Mark as read"
                            ></button>
                         )}
                      </div>
                   </React.Fragment>
                );
             });
          })()
        )}
      </div>
    </div>
  );
};