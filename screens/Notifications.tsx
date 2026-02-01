import React from 'react';
import { useAuth } from '../context/SessionContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Info, AlertTriangle, CheckCircle, Wallet, Check, ClipboardList, X, UserCheck, FileText } from 'lucide-react';
import { Project } from '../types';

export const Notifications = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, addProject, markAttendance, payWorker, users } = useData();
  const navigate = useNavigate();

  if (!user) return null;

  // Filter for current user and sort by newest
  const myNotifications = notifications
    .filter(n => n.user_id === user.id)
    .sort((a, b) => {
       // Assuming IDs are timestamp based or just sort by index reversed for mock
       return a.id > b.id ? -1 : 1; 
    });

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
      case 'alert': return 'bg-orange-50';
      case 'success': return 'bg-green-50';
      case 'payment': return 'bg-purple-50';
      case 'project_request': return 'bg-indigo-50';
      case 'attendance_request': return 'bg-emerald-50';
      case 'advance_request': return 'bg-red-50';
      case 'work_report': return 'bg-blue-50';
      default: return 'bg-blue-50';
    }
  }

  const handleApproveProject = (notificationId: string, projectData: Project) => {
      // Create the project
      addProject(projectData);
      // Mark notification read
      markNotificationAsRead(notificationId);
      alert('প্রজেক্টটি সফলভাবে তৈরি করা হয়েছে।');
  };

  const handleDeclineProject = (notificationId: string) => {
      if(window.confirm('আপনি কি এই অনুরোধটি বাতিল করতে চান?')) {
          markNotificationAsRead(notificationId);
      }
  }

  const handleApproveAttendance = (notificationId: string, data: any) => {
      // Mark attendance
      markAttendance(data.workerId, 'P', data.projectId, data.date);
      // Mark notification read
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

  // Helper to get live balance for advance requests
  const getWorkerLiveBalance = (workerId: string) => {
      const w = users.find(u => u.id === workerId);
      return w ? w.balance : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
               <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg text-gray-800">নোটিফিকেশন</h1>
         </div>
      </div>

      <div className="p-4 space-y-3">
        {myNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Bell size={32} />
             </div>
             <p>কোন নোটিফিকেশন নেই</p>
          </div>
        ) : (
          myNotifications.map(notification => (
            <div 
               key={notification.id}
               className={`relative p-4 rounded-xl border transition-all ${notification.is_read ? 'bg-white border-gray-100' : 'bg-white border-blue-200 shadow-sm'}`}
            >
               {!notification.is_read && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
               )}
               
               <div className="flex gap-4">
                  <div className={`p-3 h-fit rounded-full ${getBgColor(notification.type)}`}>
                     {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                     <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-800 font-bold'}`}>
                        {notification.message}
                     </p>
                     
                     {/* Logic for Project Request Approval */}
                     {notification.type === 'project_request' && !notification.is_read && notification.metadata && (
                         <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <p className="text-xs font-bold text-gray-700 mb-1">{notification.metadata.project_name}</p>
                             <p className="text-xs text-gray-500 mb-2">{notification.metadata.location}</p>
                             <div className="flex gap-2">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleApproveProject(notification.id, notification.metadata); }}
                                    className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1"
                                 >
                                     <CheckCircle size={14} /> অনুমোদন
                                 </button>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeclineProject(notification.id); }}
                                    className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1"
                                 >
                                     <X size={14} /> বাতিল
                                 </button>
                             </div>
                         </div>
                     )}

                     {/* Logic for Attendance Request Approval */}
                     {notification.type === 'attendance_request' && !notification.is_read && notification.metadata && (
                         <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <p className="text-xs font-bold text-gray-700 mb-1">{notification.metadata.workerName}</p>
                             <p className="text-xs text-gray-500 mb-2">প্রজেক্ট: {notification.metadata.projectName} | তারিখ: {notification.metadata.date}</p>
                             <div className="flex gap-2">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleApproveAttendance(notification.id, notification.metadata); }}
                                    className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1"
                                 >
                                     <CheckCircle size={14} /> গ্রহণ করুন
                                 </button>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeclineAttendance(notification.id); }}
                                    className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1"
                                 >
                                     <X size={14} /> বাতিল
                                 </button>
                             </div>
                         </div>
                     )}

                     {/* Logic for Advance Request Approval */}
                     {notification.type === 'advance_request' && !notification.is_read && notification.metadata && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                           <div className="flex justify-between items-center mb-2">
                              <div>
                                 <p className="text-xs font-bold text-gray-700">{notification.metadata.workerName}</p>
                                 <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                    বর্তমান বকেয়া: 
                                    <span className={`font-bold ${getWorkerLiveBalance(notification.metadata.workerId) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                       ৳{getWorkerLiveBalance(notification.metadata.workerId).toLocaleString()}
                                    </span>
                                 </p>
                              </div>
                              <p className="text-lg font-bold text-red-600">৳ {notification.metadata.amount}</p>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleApproveAdvance(notification.id, notification.metadata); }}
                                 className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                              >
                                 <CheckCircle size={14} /> প্রদান করুন
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeclineAdvance(notification.id); }}
                                 className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1"
                              >
                                 <X size={14} /> বাতিল
                              </button>
                           </div>
                        </div>
                     )}

                     {/* Logic for Work Report View */}
                     {notification.type === 'work_report' && notification.metadata && (
                        <div className="mt-2">
                           <button 
                             onClick={() => navigate(`/projects/${notification.metadata.projectId}`)}
                             className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                           >
                              রিপোর্ট দেখুন <ArrowLeft size={12} className="rotate-180" />
                           </button>
                        </div>
                     )}

                     <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-2">
                        {notification.date}
                        {notification.is_read && <span className="flex items-center gap-1 text-green-600"><Check size={10}/> পঠিত</span>}
                     </p>
                  </div>
               </div>
               
               {/* Click to mark read for normal notifications */}
               {['project_request', 'attendance_request', 'advance_request'].indexOf(notification.type) === -1 && !notification.is_read && (
                  <button 
                    onClick={() => markNotificationAsRead(notification.id)}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    style={{ background: 'transparent' }}
                  ></button>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};