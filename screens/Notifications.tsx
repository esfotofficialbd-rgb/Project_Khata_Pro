import React from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Info, AlertTriangle, CheckCircle, Wallet, Check, ClipboardList, X, UserCheck, FileText, Clock, MapPin } from 'lucide-react';
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
      case 'alert': return <AlertTriangle size={20} className="text-orange-500"/>;
      case 'success': return <CheckCircle size={20} className="text-green-500"/>;
      case 'payment': return <Wallet size={20} className="text-purple-500"/>;
      case 'project_request': return <ClipboardList size={20} className="text-indigo-500"/>;
      case 'attendance_request': return <UserCheck size={20} className="text-emerald-500"/>;
      case 'advance_request': return <Wallet size={20} className="text-red-500"/>;
      case 'work_report': return <FileText size={20} className="text-blue-500"/>;
      default: return <Info size={20} className="text-blue-500"/>;
    }
  };

  const getBgColor = (type: string) => {
     switch(type) {
      case 'alert': return 'bg-orange-50 dark:bg-orange-900/20';
      case 'success': return 'bg-green-50 dark:bg-green-900/20';
      case 'payment': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'project_request': return 'bg-indigo-50 dark:bg-indigo-900/20';
      case 'attendance_request': return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'advance_request': return 'bg-red-50 dark:bg-red-900/20';
      case 'work_report': return 'bg-blue-50 dark:bg-blue-900/20';
      default: return 'bg-blue-50 dark:bg-blue-900/20';
    }
  }

  const formatDate = (dateStr: string) => {
      try {
          const date = new Date(dateStr);
          const today = new Date();
          if (date.toDateString() === today.toDateString()) return 'আজকে';
          
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (date.toDateString() === yesterday.toDateString()) return 'গতকাল';

          return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
      } catch (e) {
          return dateStr;
      }
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
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
               <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white">নোটিফিকেশন</h1>
         </div>
         <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {myNotifications.filter(n => !n.is_read).length} নতুন
         </div>
      </div>

      <div className="p-4 space-y-3">
        {myNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                <Bell size={32} className="opacity-50" />
             </div>
             <p className="font-medium">কোন নোটিফিকেশন নেই</p>
          </div>
        ) : (
          myNotifications.map((notification, index) => {
            const formattedDate = formatDate(notification.date);
            const prevNotif = myNotifications[index - 1];
            const prevDate = prevNotif ? formatDate(prevNotif.date) : '';
            const showHeader = index === 0 || formattedDate !== prevDate;

            return (
            <React.Fragment key={notification.id}>
               {showHeader && (
                  <div className="py-2">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                        {formattedDate}
                     </span>
                  </div>
               )}
               
               <div 
                  className={`relative p-4 rounded-2xl border transition-all animate-scale-up ${
                     notification.is_read 
                     ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-80' 
                     : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900 shadow-lg shadow-blue-50 dark:shadow-none'
                  }`}
               >
                  {!notification.is_read && (
                     <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm animate-pulse"></span>
                  )}
                  
                  <div className="flex gap-4">
                     <div className={`p-3 h-fit rounded-full shrink-0 ${getBgColor(notification.type)}`}>
                        {getIcon(notification.type)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${notification.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white font-bold'}`}>
                           {notification.message}
                        </p>
                        
                        {/* Action Cards */}
                        {notification.type === 'project_request' && !notification.is_read && notification.metadata && (
                            <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">{notification.metadata.project_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1"><MapPin size={10}/> {notification.metadata.location}</p>
                                <div className="flex gap-2">
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); handleApproveProject(notification.id, notification.metadata); }}
                                       className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <CheckCircle size={14} /> অনুমোদন
                                    </button>
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); handleDeclineProject(notification.id); }}
                                       className="flex-1 bg-white dark:bg-slate-700 text-red-500 text-xs font-bold py-2.5 rounded-lg border border-red-100 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1"
                                    >
                                        <X size={14} /> বাতিল
                                    </button>
                                </div>
                            </div>
                        )}

                        {notification.type === 'attendance_request' && !notification.is_read && notification.metadata && (
                            <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between mb-2">
                                   <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{notification.metadata.workerName}</p>
                                   <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{notification.metadata.date}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">প্রজেক্ট: {notification.metadata.projectName}</p>
                                <div className="flex gap-2">
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); handleApproveAttendance(notification.id, notification.metadata); }}
                                       className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <CheckCircle size={14} /> গ্রহণ করুন
                                    </button>
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); handleDeclineAttendance(notification.id); }}
                                       className="flex-1 bg-white dark:bg-slate-700 text-red-500 text-xs font-bold py-2.5 rounded-lg border border-red-100 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1"
                                    >
                                        <X size={14} /> বাতিল
                                    </button>
                                </div>
                            </div>
                        )}

                        {notification.type === 'advance_request' && !notification.is_read && notification.metadata && (
                           <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-2">
                                 <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{notification.metadata.workerName}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                       বকেয়া: 
                                       <span className={`font-bold ${getWorkerLiveBalance(notification.metadata.workerId) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          ৳{getWorkerLiveBalance(notification.metadata.workerId).toLocaleString()}
                                       </span>
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">চাচ্ছে</span>
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">৳ {notification.metadata.amount}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleApproveAdvance(notification.id, notification.metadata); }}
                                    className="flex-1 bg-green-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 shadow-sm"
                                 >
                                    <Wallet size={14} /> প্রদান করুন
                                 </button>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeclineAdvance(notification.id); }}
                                    className="flex-1 bg-white dark:bg-slate-700 text-red-500 text-xs font-bold py-2.5 rounded-lg border border-red-100 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1"
                                 >
                                    <X size={14} /> বাতিল
                                 </button>
                              </div>
                           </div>
                        )}

                        {notification.type === 'work_report' && notification.metadata && (
                           <div className="mt-2">
                              <button 
                                onClick={() => navigate(`/projects/${notification.metadata.projectId}`)}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg w-fit"
                              >
                                 রিপোর্ট দেখুন <ArrowLeft size={12} className="rotate-180" />
                              </button>
                           </div>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                           <Clock size={10} className="text-slate-400" />
                           <p className="text-[10px] text-slate-400">{formattedDate}</p>
                           {notification.is_read && <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 ml-auto"><Check size={10}/> পঠিত</span>}
                        </div>
                     </div>
                  </div>
                  
                  {/* Invisible Overlay to Mark Read */}
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
          })
        )}
      </div>
    </div>
  );
};