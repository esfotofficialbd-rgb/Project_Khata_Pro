
import React from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Info, AlertTriangle, CheckCircle, Wallet, Check, ClipboardList, X, UserCheck, FileText, Clock, MapPin, ChevronRight, CheckCheck, Banknote, Sparkles, UserCog } from 'lucide-react';
import { Project } from '../types';

export const Notifications = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, addProject, markAttendance, payWorker, users, updateUser } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  const isSupervisor = user.role === 'supervisor';
  const isWorker = user.role === 'worker';

  // Filter for current user and sort by newest
  const myNotifications = notifications
    .filter(n => n.user_id === user.id)
    .sort((a, b) => b.id.localeCompare(a.id));

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle size={20} className="text-orange-500" strokeWidth={2.5}/>;
      case 'success': return <CheckCircle size={20} className="text-green-500" strokeWidth={2.5}/>;
      case 'payment': return <Wallet size={20} className="text-emerald-500" strokeWidth={2.5}/>;
      case 'project_request': return <ClipboardList size={20} className="text-blue-500" strokeWidth={2.5}/>;
      case 'attendance_request': return <UserCheck size={20} className="text-purple-500" strokeWidth={2.5}/>;
      case 'advance_request': return <Banknote size={20} className="text-rose-500" strokeWidth={2.5}/>;
      case 'work_report': return <FileText size={20} className="text-indigo-500" strokeWidth={2.5}/>;
      case 'profile_update_request': return <UserCog size={20} className="text-orange-500" strokeWidth={2.5}/>;
      default: return <Bell size={20} className="text-slate-500" strokeWidth={2.5}/>;
    }
  };

  const getThemeColors = (type: string) => {
     switch(type) {
      case 'alert': return 'bg-orange-50 dark:bg-orange-900/20';
      case 'success': return 'bg-green-50 dark:bg-green-900/20';
      case 'payment': return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'project_request': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'attendance_request': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'advance_request': return 'bg-rose-50 dark:bg-rose-900/20';
      case 'work_report': return 'bg-indigo-50 dark:bg-indigo-900/20';
      case 'profile_update_request': return 'bg-orange-50 dark:bg-orange-900/20';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  }

  // Dynamic Theme Colors
  const themeColor = isWorker ? 'emerald' : (isSupervisor ? 'purple' : 'blue');
  const themeText = isWorker ? 'text-emerald-600' : (isSupervisor ? 'text-purple-600' : 'text-blue-600');

  const getGroupLabel = (dateStr: string) => {
      try {
          const date = new Date(dateStr);
          const today = new Date();
          if (date.toDateString() === today.toDateString()) return 'আজ (Today)';
          
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (date.toDateString() === yesterday.toDateString()) return 'গতকাল (Yesterday)';

          return new Date(dateStr).toLocaleDateString('bn-BD', {day:'numeric', month:'long'});
      } catch (e) {
          return 'অন্যান্য';
      }
  };

  const handleMarkAllRead = () => {
      myNotifications.forEach(n => {
          if(!n.is_read) markNotificationAsRead(n.id);
      });
      toast.success('সব নোটিফিকেশন পড়া হয়েছে');
  };

  const handleApproveProject = (notificationId: string, projectData: Project) => {
      const newProject = { ...projectData, id: Date.now().toString() };
      addProject(newProject);
      markNotificationAsRead(notificationId);
      toast.success('প্রজেক্টটি সফলভাবে তৈরি করা হয়েছে।');
  };

  const handleDeclineProject = (notificationId: string) => {
      if(window.confirm('আপনি কি এই অনুরোধটি বাতিল করতে চান?')) {
          markNotificationAsRead(notificationId);
          toast.info('অনুরোধ বাতিল করা হয়েছে।');
      }
  }

  const handleApproveAttendance = (notificationId: string, data: any) => {
      markAttendance(data.workerId, 'P', data.projectId, data.date);
      markNotificationAsRead(notificationId);
      toast.success('হাজিরা গ্রহণ করা হয়েছে।');
  };

  const handleDeclineAttendance = (notificationId: string) => {
      markNotificationAsRead(notificationId);
      toast.info('হাজিরা অনুরোধ বাতিল করা হয়েছে।');
  }

  const handleApproveAdvance = (notificationId: string, data: any) => {
     if(window.confirm(`আপনি কি ৳${data.amount} পেমেন্ট নিশ্চিত করছেন?`)) {
        payWorker(data.workerId, Number(data.amount));
        markNotificationAsRead(notificationId);
        toast.success('পেমেন্ট সফল হয়েছে এবং ব্যালেন্স আপডেট করা হয়েছে।');
     }
  };

  const handleDeclineAdvance = (notificationId: string) => {
     markNotificationAsRead(notificationId);
     toast.info('অগ্রিম অনুরোধ বাতিল করা হয়েছে।');
  };

  const handleApproveProfileUpdate = async (notificationId: string, data: any) => {
      const { workerId, updatedData } = data;
      const targetUser = users.find(u => u.id === workerId);
      
      if(!targetUser) {
          toast.error('ব্যবহারকারী পাওয়া যায়নি');
          return;
      }

      if(window.confirm('আপনি কি প্রোফাইল আপডেট অনুমোদন করছেন?')) {
          const finalUser = { ...targetUser, ...updatedData };
          await updateUser(finalUser); 
          markNotificationAsRead(notificationId);
          toast.success('প্রোফাইল আপডেট অনুমোদিত হয়েছে।');
      }
  };

  const handleDeclineProfileUpdate = (notificationId: string) => {
      if(window.confirm('আপনি কি এই আপডেট অনুরোধ বাতিল করতে চান?')) {
          markNotificationAsRead(notificationId);
          toast.info('আপডেট অনুরোধ বাতিল করা হয়েছে।');
      }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-slate-950 pb-20 font-sans">
      
      {/* iOS Style Frosted Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 pt-12 pb-4 transition-all">
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-1">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-blue-600 dark:text-blue-400 hover:opacity-70 transition-opacity">
                   <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">নোটিফিকেশন</h1>
             </div>
             
             {myNotifications.some(n => !n.is_read) && (
                <button 
                    onClick={handleMarkAllRead} 
                    className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
                    title="সব পড়ুন"
                >
                   <CheckCheck size={16} />
                </button>
             )}
         </div>
      </div>

      <div className="px-4 py-2 space-y-6">
        {myNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <Bell size={32} className="text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">কোন নোটিফিকেশন নেই</h3>
             <p className="text-sm text-slate-400 mt-1">আপনার সব আপডেট এখানে দেখা যাবে।</p>
          </div>
        ) : (
          // Grouped List
          (() => {
             let lastGroup = '';
             return myNotifications.map((notification) => {
                const group = getGroupLabel(notification.date);
                const showHeader = group !== lastGroup;
                lastGroup = group;

                // Extract Amount
                const amountMatch = notification.message.match(/৳\s?([0-9,]+)/);
                const displayAmount = amountMatch ? amountMatch[0] : null;

                const isRequest = ['project_request', 'attendance_request', 'advance_request', 'profile_update_request'].includes(notification.type);
                const isPayment = notification.type === 'payment';

                return (
                   <React.Fragment key={notification.id}>
                      {showHeader && (
                         <div className="sticky top-[108px] z-10 py-2 bg-[#F2F2F7] dark:bg-slate-950/95 backdrop-blur-sm -mx-4 px-4 transition-all">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{group}</h3>
                         </div>
                      )}
                      
                      <div 
                         className={`relative overflow-hidden rounded-[1.5rem] transition-all duration-300 group
                            ${!notification.is_read 
                                ? 'bg-white dark:bg-slate-900 shadow-lg shadow-blue-100 dark:shadow-none scale-[1.01]' 
                                : 'bg-white/60 dark:bg-slate-900/60 shadow-sm border border-transparent'
                            }
                         `}
                      >
                         {/* Card Content */}
                         <div className="p-4 flex gap-4 relative z-10">
                            
                            {/* Icon Box (Squircle) */}
                            <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${getThemeColors(notification.type)}`}>
                               {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                               {/* Payment Special Header */}
                               {isPayment && (
                                  <div className="flex items-center gap-1.5 mb-1">
                                     <Sparkles size={12} className="text-emerald-500 fill-emerald-500" />
                                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">পেমেন্ট রিসিভড</span>
                                  </div>
                               )}

                               {/* Message Body */}
                               <div className="flex justify-between items-start">
                                  <div className="pr-6">
                                     {isPayment ? (
                                        <>
                                            <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-tight mb-1">
                                                {displayAmount || 'টাকা'} জমা হয়েছে
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                আপনার বর্তমান ব্যালেন্স আপডেট করা হয়েছে।
                                            </p>
                                        </>
                                     ) : (
                                        <p className={`text-sm leading-snug ${!notification.is_read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                                            {notification.message}
                                        </p>
                                     )}
                                  </div>
                                  
                                  {/* Unread Dot (iOS Style) */}
                                  {!notification.is_read && !isRequest && (
                                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 shadow-sm animate-pulse mt-1.5"></div>
                                  )}
                               </div>

                               {/* Action Buttons (iOS Style) */}
                               {isRequest && !notification.is_read && (
                                  <div className="mt-4 flex gap-3">
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(notification.type === 'project_request') handleApproveProject(notification.id, notification.metadata);
                                            if(notification.type === 'attendance_request') handleApproveAttendance(notification.id, notification.metadata);
                                            if(notification.type === 'advance_request') handleApproveAdvance(notification.id, notification.metadata);
                                            if(notification.type === 'profile_update_request') handleApproveProfileUpdate(notification.id, notification.metadata);
                                        }}
                                        className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform"
                                     >
                                        গ্রহণ করুন
                                     </button>
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(notification.type === 'project_request') handleDeclineProject(notification.id);
                                            if(notification.type === 'attendance_request') handleDeclineAttendance(notification.id);
                                            if(notification.type === 'advance_request') handleDeclineAdvance(notification.id);
                                            if(notification.type === 'profile_update_request') handleDeclineProfileUpdate(notification.id);
                                        }}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                                     >
                                        বাতিল
                                     </button>
                                  </div>
                               )}

                               {/* Time Footer */}
                               <div className="mt-2.5 flex items-center gap-1.5 text-slate-400">
                                  {notification.is_read && <CheckCheck size={12} className="text-blue-500" />}
                                  <p className="text-[10px] font-semibold">
                                     {new Date(notification.date).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                               </div>
                            </div>
                         </div>

                         {/* Click handler for marking read (Invisible Overlay) */}
                         {!isRequest && !notification.is_read && (
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