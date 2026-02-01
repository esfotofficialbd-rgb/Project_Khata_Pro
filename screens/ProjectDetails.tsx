import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { ArrowLeft, MapPin, User, Phone, Calendar, Wallet, ArrowUpRight, ArrowDownLeft, Settings, CheckCircle, FileText } from 'lucide-react';
import { Project } from '../types';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, transactions, attendance, updateProject, workReports, users } = useData();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');

  const project = projects.find(p => p.id === id);

  if (!project) {
    return <div className="p-4 text-center text-gray-500">প্রজেক্ট পাওয়া যায়নি</div>;
  }

  // Filter related data
  const projectTransactions = transactions.filter(t => t.project_id === id);
  const projectAttendance = attendance.filter(a => a.project_id === id);
  const projectReports = workReports.filter(r => r.project_id === id).sort((a,b) => b.id.localeCompare(a.id));
  
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

  const getUserName = (userId: string) => {
      const u = users.find(user => user.id === userId);
      return u ? u.full_name : 'অজানা';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
             <ArrowLeft size={20} />
           </button>
           <h1 className="font-bold text-lg text-gray-800 dark:text-white truncate max-w-[200px]">{project.project_name}</h1>
        </div>
        {user?.role === 'contractor' && (
          <button 
             onClick={handleEditClick}
             className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
          >
             <Settings size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
         <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('overview')}
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
             >
                 ওভারভিউ
             </button>
             <button 
               onClick={() => setActiveTab('reports')}
               className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'reports' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
             >
                 কাজের রিপোর্ট
             </button>
         </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' ? (
           <>
                {/* Status Banner */}
                {project.status === 'completed' && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-sm">
                    <CheckCircle size={18} />
                    এই প্রজেক্টটি সমাপ্ত হয়েছে
                </div>
                )}

                {/* Overview Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">ক্লায়েন্ট</p>
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-base">
                            <User size={16} className="text-blue-500"/> {project.client_name || 'নাম নেই'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin size={12}/> {project.location}
                        </p>
                    </div>
                    <a href={`tel:${project.client_phone}`} className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                        <Phone size={18} />
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">শুরু হয়েছে</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} /> {project.start_date}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">টাইপ</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded inline-block mt-0.5">
                            {project.project_type === 'daily' ? 'ডেইলি' : project.project_type === 'fixed' ? 'ফিক্সড' : 'স্কয়ার ফিট'}
                        </span>
                    </div>
                </div>
                </div>

                {/* Financials */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
                <h3 className="text-slate-300 text-xs font-bold mb-4 uppercase flex items-center gap-2 tracking-wide">
                    <Wallet size={14}/> ফিনান্সিয়াল ওভারভিউ
                </h3>
                
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-slate-400 text-xs mb-0.5">মোট খরচ</p>
                        <p className="text-2xl font-bold">৳ {calculatedTotalExpense.toLocaleString()}</p>
                    </div>
                    {project.budget_amount > 0 && (
                        <div className="text-right">
                        <p className="text-slate-400 text-xs mb-0.5">বাজেট</p>
                        <p className="text-lg font-bold text-slate-200">৳ {project.budget_amount.toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {project.budget_amount > 0 && (
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden mt-2">
                        <div 
                        className={`h-2 rounded-full transition-all duration-500 ${progress > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                        <p className="text-[10px] text-slate-300 mb-1">লেবার খরচ</p>
                        <p className="font-bold text-yellow-400">৳ {totalLaborCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                        <p className="text-[10px] text-slate-300 mb-1">অন্যান্য খরচ</p>
                        <p className="font-bold text-orange-400">৳ {otherExpenses.toLocaleString()}</p>
                    </div>
                </div>
                </div>

                {/* Recent Transactions */}
                <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 px-1 flex items-center justify-between text-sm uppercase tracking-wider">
                    সাম্প্রতিক লেনদেন
                    <button onClick={() => navigate('/accounts')} className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">সব দেখুন</button>
                </h3>
                
                <div className="space-y-3">
                    {projectTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-400 text-xs font-bold">কোন লেনদেন নেই</p>
                        </div>
                    ) : (
                        projectTransactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                    {tx.type === 'income' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{tx.description}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{tx.date}</p>
                                </div>
                                </div>
                                <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                </div>
           </>
        ) : (
           <div className="space-y-4">
              {/* Reports List */}
              {projectReports.length === 0 ? (
                 <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">কোন রিপোর্ট জমা দেওয়া হয়নি</p>
                 </div>
              ) : (
                 projectReports.map(report => (
                    <div key={report.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full text-blue-600 dark:text-blue-400">
                                <FileText size={16} />
                             </div>
                             <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{getUserName(report.submitted_by)}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{report.date}</p>
                             </div>
                          </div>
                       </div>
                       <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-3 leading-relaxed font-medium">
                          {report.description}
                       </p>
                       {report.image_url && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                             <img src={report.image_url} alt="Report" className="w-full h-auto object-cover max-h-60" />
                          </div>
                       )}
                    </div>
                 ))
              )}
           </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm relative z-10 p-6 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">প্রজেক্ট এডিট</h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Settings size={20}/></button>
              </div>
              <form onSubmit={saveProject} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">প্রজেক্ট নাম</label>
                    <input 
                        value={editFormData.project_name} 
                        onChange={e => setEditFormData({...editFormData, project_name: e.target.value})}
                        placeholder="প্রজেক্ট নাম"
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">ক্লায়েন্ট</label>
                        <input 
                            value={editFormData.client_name} 
                            onChange={e => setEditFormData({...editFormData, client_name: e.target.value})}
                            placeholder="নাম"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">ফোন</label>
                        <input 
                            value={editFormData.client_phone} 
                            onChange={e => setEditFormData({...editFormData, client_phone: e.target.value})}
                            placeholder="ফোন"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">লোকেশন</label>
                    <input 
                        value={editFormData.location} 
                        onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                        placeholder="লোকেশন"
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                    />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase">বাজেট</label>
                    <input 
                        type="number"
                        value={editFormData.budget_amount} 
                        onChange={e => setEditFormData({...editFormData, budget_amount: Number(e.target.value)})}
                        placeholder="বাজেট"
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
                    />
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">স্ট্যাটাস</label>
                    <select 
                       value={editFormData.status}
                       onChange={e => setEditFormData({...editFormData, status: e.target.value as any})}
                       className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none font-medium text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                       <option value="active">চলমান (Active)</option>
                       <option value="completed">সমাপ্ত (Completed)</option>
                    </select>
                 </div>

                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg transition-all active:scale-95">সেভ করুন</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};