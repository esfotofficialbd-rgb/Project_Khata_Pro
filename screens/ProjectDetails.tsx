import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { ArrowLeft, MapPin, User, Phone, Calendar, Wallet, ArrowUpRight, ArrowDownLeft, Settings, CheckCircle, FileText, Package, Truck, Image, X, UserCog } from 'lucide-react';
import { Project } from '../types';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, transactions, attendance, updateProject, workReports, users, materialLogs } = useData();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'materials'>('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const project = projects.find(p => p.id === id);

  if (!project) {
    return <div className="p-4 text-center text-slate-500 font-bold mt-10">প্রজেক্ট পাওয়া যায়নি</div>;
  }

  // Filter related data
  const projectTransactions = transactions.filter(t => t.project_id === id);
  const projectAttendance = attendance.filter(a => a.project_id === id);
  const projectReports = workReports.filter(r => r.project_id === id).sort((a,b) => b.id.localeCompare(a.id));
  const projectMaterials = materialLogs.filter(m => m.project_id === id).sort((a,b) => b.id.localeCompare(a.id));
  
  // Stats
  const totalLaborCost = projectAttendance.reduce((sum, a) => sum + a.amount, 0);
  const otherExpenses = projectTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Expense is Labor + Materials
  const calculatedTotalExpense = totalLaborCost + otherExpenses;

  const progress = project.budget_amount > 0 
    ? (calculatedTotalExpense / project.budget_amount) * 100 
    : 0;

  // Edit Logic
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});

  const handleEditClick = () => {
     setEditFormData({
        project_name: project.project_name,
        client_name: project.client_name,
        client_phone: project.client_phone,
        location: project.location,
        budget_amount: project.budget_amount,
        status: project.status
     });
     setIsEditModalOpen(true);
  };

  const saveProject = (e: React.FormEvent) => {
     e.preventDefault();
     const updated = { ...project, ...editFormData };
     updateProject(updated as Project);
     setIsEditModalOpen(false);
  };

  const getUserDetails = (userId: string) => {
      const u = users.find(user => user.id === userId);
      return u ? { name: u.full_name, role: u.role, avatar: u.avatar_url } : { name: 'অজানা', role: 'unknown', avatar: null };
  };

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase ml-1";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
             <ArrowLeft size={22} />
           </button>
           <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[200px]">{project.project_name}</h1>
        </div>
        {user?.role === 'contractor' && (
          <button 
             onClick={handleEditClick}
             className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
          >
             <Settings size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
         <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
             {['overview', 'reports', 'materials'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all capitalize ${
                     activeTab === tab 
                     ? 'bg-white dark:bg-slate-700 shadow text-blue-700 dark:text-white' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                   {tab === 'overview' ? 'ওভারভিউ' : tab === 'reports' ? 'রিপোর্ট' : 'ম্যাটেরিয়াল'}
                </button>
             ))}
         </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
           <>
                {/* Status Banner */}
                {project.status === 'completed' && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-sm">
                    <CheckCircle size={18} />
                    এই প্রজেক্টটি সমাপ্ত হয়েছে
                </div>
                )}

                {/* Overview Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 font-bold">ক্লায়েন্ট</p>
                            <h2 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                                <User size={18} className="text-blue-500"/> {project.client_name || 'নাম নেই'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                <MapPin size={12}/> {project.location}
                            </p>
                        </div>
                        <a href={`tel:${project.client_phone}`} className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm">
                            <Phone size={20} />
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">শুরু হয়েছে</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-1">
                                <Calendar size={14} className="text-purple-500" /> {project.start_date}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">টাইপ</p>
                            <span className="text-[10px] font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg inline-block mt-1 border border-slate-200 dark:border-slate-700">
                                {project.project_type === 'daily' ? 'ডেইলি' : project.project_type === 'fixed' ? 'ফিক্সড' : 'স্কয়ার ফিট'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Financials - Premium Gradient */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                    {/* Background Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                    
                    <h3 className="text-slate-400 text-[10px] font-bold mb-4 uppercase flex items-center gap-2 tracking-[0.2em] relative z-10">
                        <Wallet size={14}/> ফিনান্সিয়াল ওভারভিউ
                    </h3>
                    
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div>
                            <p className="text-slate-300 text-xs mb-1 font-bold">মোট খরচ</p>
                            <p className="text-3xl font-extrabold tracking-tight">৳ {calculatedTotalExpense.toLocaleString()}</p>
                        </div>
                        {project.budget_amount > 0 && (
                            <div className="text-right">
                                <p className="text-slate-400 text-xs mb-1 font-bold">বাজেট</p>
                                <p className="text-lg font-bold text-slate-200">৳ {project.budget_amount.toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {project.budget_amount > 0 && (
                        <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden mt-2 relative z-10">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ${progress > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                        <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                            <p className="text-[10px] text-slate-300 mb-1 font-bold uppercase">লেবার খরচ</p>
                            <p className="font-bold text-yellow-400 text-lg">৳ {totalLaborCost.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                            <p className="text-[10px] text-slate-300 mb-1 font-bold uppercase">অন্যান্য খরচ</p>
                            <p className="font-bold text-orange-400 text-lg">৳ {otherExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-3 px-1 flex items-center justify-between text-xs uppercase tracking-wider">
                        সাম্প্রতিক লেনদেন
                        <button onClick={() => navigate('/accounts')} className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">সব দেখুন</button>
                    </h3>
                    
                    <div className="space-y-3">
                        {projectTransactions.length === 0 ? (
                            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-400 text-xs font-bold">কোন লেনদেন নেই</p>
                            </div>
                        ) : (
                            projectTransactions.slice(0, 5).map(tx => (
                                <div key={tx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                                            {tx.type === 'income' ? <ArrowDownLeft size={18} strokeWidth={2.5}/> : <ArrowUpRight size={18} strokeWidth={2.5}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{tx.description}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{tx.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
           </>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-4">
              {/* Reports List */}
              {projectReports.length === 0 ? (
                 <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                    <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">কোন রিপোর্ট জমা দেওয়া হয়নি</p>
                 </div>
              ) : (
                 projectReports.map((report) => {
                    const submitter = getUserDetails(report.submitted_by);
                    return (
                        <div key={report.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-800">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className={`p-0.5 rounded-full border ${submitter.role === 'supervisor' ? 'border-purple-200' : 'border-blue-200'}`}>
                                    <img src={submitter.avatar || 'https://picsum.photos/40'} className="w-9 h-9 rounded-full object-cover" alt="User" />
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                                       {submitter.name}
                                       {submitter.role === 'supervisor' && <UserCog size={12} className="text-purple-600"/>}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                                       <Calendar size={10}/> {new Date(report.date).toLocaleDateString('bn-BD', {day: 'numeric', month: 'long'})}
                                    </p>
                                 </div>
                              </div>
                              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">
                                 Report #{report.id.slice(-4)}
                              </span>
                           </div>
                           
                           <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 border border-slate-100 dark:border-slate-700">
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                 {report.description}
                              </p>
                           </div>

                           {report.image_url && (
                              <div 
                                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                                onClick={() => setSelectedImage(report.image_url!)}
                              >
                                 <img src={report.image_url} alt="Report" className="w-full h-auto object-cover max-h-64" />
                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1">
                                       <Image size={14}/> জুম করুন
                                    </span>
                                 </div>
                              </div>
                           )}
                        </div>
                    );
                 })
              )}
           </div>
        )}

        {activeTab === 'materials' && (
           <div className="space-y-4">
              {/* Material Logs List */}
              {projectMaterials.length === 0 ? (
                 <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Package size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">কোন মালামাল এন্ট্রি নেই</p>
                 </div>
              ) : (
                 projectMaterials.map((log) => {
                    const submitter = getUserDetails(log.submitted_by);
                    return (
                        <div key={log.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                           {/* Left Stripe */}
                           <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-purple-500"></div>
                           
                           <div className="flex justify-between items-start mb-3 pl-3">
                              <div>
                                 <h3 className="font-bold text-slate-800 dark:text-white text-base">{log.item_name}</h3>
                                 <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-bold uppercase tracking-wide">
                                    <Truck size={10} /> {log.supplier_name || 'সাপ্লায়ার নেই'}
                                 </p>
                              </div>
                              <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-100 dark:border-purple-800 shadow-sm">
                                 {log.quantity} {log.unit}
                              </span>
                           </div>

                           <div className="flex items-center justify-between pl-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                 <img src={submitter.avatar || 'https://picsum.photos/20'} className="w-5 h-5 rounded-full object-cover" />
                                 <p className="text-[10px] font-bold">{submitter.name}</p>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">{log.date}</p>
                           </div>

                           {log.challan_photo && (
                              <div className="mt-3 pl-3">
                                 <button 
                                   onClick={() => setSelectedImage(log.challan_photo!)}
                                   className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                                 >
                                    <Image size={12} /> চালান দেখুন
                                 </button>
                              </div>
                           )}
                        </div>
                    );
                 })
              )}
           </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">প্রজেক্ট এডিট</h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={saveProject} className="space-y-4">
                 <div>
                    <label className={labelClass}>প্রজেক্ট নাম</label>
                    <input 
                        value={editFormData.project_name} 
                        onChange={e => setEditFormData({...editFormData, project_name: e.target.value})}
                        className={inputClass}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>ক্লায়েন্ট</label>
                        <input 
                            value={editFormData.client_name} 
                            onChange={e => setEditFormData({...editFormData, client_name: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>ফোন</label>
                        <input 
                            value={editFormData.client_phone} 
                            onChange={e => setEditFormData({...editFormData, client_phone: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                 </div>

                 <div>
                    <label className={labelClass}>লোকেশন</label>
                    <input 
                        value={editFormData.location} 
                        onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                        className={inputClass}
                    />
                 </div>

                 <div>
                    <label className={labelClass}>বাজেট</label>
                    <input 
                        type="number"
                        value={editFormData.budget_amount} 
                        onChange={e => setEditFormData({...editFormData, budget_amount: Number(e.target.value)})}
                        className={inputClass}
                    />
                 </div>

                 <div>
                    <label className={labelClass}>স্ট্যাটাস</label>
                    <select 
                       value={editFormData.status}
                       onChange={e => setEditFormData({...editFormData, status: e.target.value as any})}
                       className={`${inputClass} appearance-none`}
                    >
                       <option value="active">চলমান (Active)</option>
                       <option value="completed">সমাপ্ত (Completed)</option>
                    </select>
                 </div>

                 <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-bold mt-2 shadow-lg transition-all active:scale-95">সেভ করুন</button>
              </form>
           </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
         <div className="fixed inset-0 z-[80] bg-slate-950/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
               <X size={24} />
            </button>
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain animate-scale-up" />
         </div>
      )}
    </div>
  );
};