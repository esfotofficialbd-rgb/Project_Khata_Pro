import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Search, Ruler, Clock, Coins, X, CheckCircle, Calculator, User, Phone, Send, Plus, ArrowRight, Building, LayoutTemplate } from 'lucide-react';
import { Project } from '../types';

export const Projects = () => {
  const { projects, addProject, requestProject } = useData();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [projectMode, setProjectMode] = useState<'daily' | 'fixed' | 'sqft'>('daily');
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_phone: '',
    location: '',
    budget_amount: '',
    sqft_rate: '',
    total_area: '',
    mistri_rate: '',
    helper_rate: ''
  });

  // Redirect worker if they somehow access this page
  useEffect(() => {
    if (user?.role === 'worker') {
        navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state && (location.state as any).openAddModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (user?.role === 'worker') return null;

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : project.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCalculatedBudget = () => {
    if (projectMode === 'sqft') {
      return (Number(formData.sqft_rate) || 0) * (Number(formData.total_area) || 0);
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let budget = projectMode === 'fixed' ? Number(formData.budget_amount) : projectMode === 'sqft' ? getCalculatedBudget() : 0;
    
    const newProject: Project = {
      id: Date.now().toString(),
      project_name: formData.project_name,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      location: formData.location || 'ঠিকানা নেই',
      project_type: projectMode,
      budget_amount: budget,
      current_expense: 0,
      status: 'active',
      start_date: new Date().toLocaleDateString('bn-BD'),
      sqft_rate: projectMode === 'sqft' ? Number(formData.sqft_rate) : undefined,
      total_area: projectMode === 'sqft' ? Number(formData.total_area) : undefined,
      mistri_rate: projectMode === 'daily' ? Number(formData.mistri_rate) : undefined,
      helper_rate: projectMode === 'daily' ? Number(formData.helper_rate) : undefined,
    };

    if (user?.role === 'supervisor') {
        requestProject(newProject, user.full_name);
        alert('আপনার অনুরোধ ঠিকাদারের কাছে পাঠানো হয়েছে।');
    } else {
        addProject(newProject);
    }
    setIsModalOpen(false);
    setFormData({ project_name: '', client_name: '', client_phone: '', location: '', budget_amount: '', sqft_rate: '', total_area: '', mistri_rate: '', helper_rate: '' });
  };

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
      {/* Header with Search */}
      <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 px-4 pt-4 pb-2 shadow-sm border-b border-slate-100 dark:border-slate-800">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <LayoutTemplate className="text-blue-600" />
               প্রজেক্ট তালিকা
            </h2>
            <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-blue-600 text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:bg-blue-700 transition-colors active:scale-95"
            >
               <Plus size={16} /> নতুন
            </button>
         </div>
         
         <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
               type="text"
               placeholder="প্রজেক্ট বা লোকেশন খুঁজুন..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
            />
         </div>

         <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'active', 'completed'].map((tab) => (
               <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                     activeTab === tab 
                     ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                     : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
               >
                  {tab === 'all' ? 'সব প্রজেক্ট' : tab === 'active' ? 'চলমান' : 'সমাপ্ত'}
               </button>
            ))}
         </div>
      </div>

      <div className="p-4 space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
             <div className="bg-slate-100 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-sm animate-pulse">
                <Clock size={32} className="text-slate-400" />
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">কোন প্রজেক্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const progress = project.budget_amount > 0 ? (project.current_expense / project.budget_amount) * 100 : 0;
            let typeConfig = { label: 'ফিক্সড', icon: Coins, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' };
            if (project.project_type === 'daily') typeConfig = { label: 'ডেইলি', icon: Clock, bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/30' };
            if (project.project_type === 'sqft') typeConfig = { label: 'স্কয়ার ফিট', icon: Ruler, bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/30' };

            return (
              <div 
                key={project.id} 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden active:scale-[0.98] transition-all group"
              >
                {/* Background Decor */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${typeConfig.bg} opacity-50 blur-xl group-hover:scale-150 transition-transform duration-500`}></div>

                <div className="flex gap-4 items-start relative z-10">
                   {/* Icon Box */}
                   <div className={`w-14 h-14 rounded-2xl ${typeConfig.bg} border ${typeConfig.border} flex items-center justify-center shrink-0`}>
                      <Building className={typeConfig.text} size={24} />
                   </div>
                   
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight mb-1 truncate max-w-[180px]">{project.project_name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                               <MapPin size={10} /> {project.location}
                            </p>
                         </div>
                         <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${typeConfig.bg} ${typeConfig.text} flex items-center gap-1 border ${typeConfig.border}`}>
                            <typeConfig.icon size={10} /> {typeConfig.label}
                         </div>
                      </div>

                      <div className="mt-5">
                         <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">খরচ স্ট্যাটাস</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                               ৳ {project.current_expense.toLocaleString()} 
                               <span className="text-slate-400 font-normal"> / {project.budget_amount > 0 ? project.budget_amount.toLocaleString() : '∞'}</span>
                            </span>
                         </div>
                         
                         {project.project_type !== 'daily' ? (
                           <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                              <div 
                                 className={`h-full rounded-full transition-all duration-700 ${progress > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                 style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                           </div>
                         ) : (
                           <div className="w-full bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2 text-center border border-orange-100 dark:border-orange-900/30 border-dashed">
                              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">ডেইলি বেসিস প্রজেক্ট (বাজেট নেই)</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                   <div className="bg-slate-900 dark:bg-white p-2 rounded-full text-white dark:text-slate-900 shadow-lg">
                      <ArrowRight size={14} />
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md relative z-10 p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">নতুন প্রজেক্ট</h3>
                <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 text-slate-500"><X size={20}/></button>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                 {[
                    { id: 'daily', label: 'ডেইলি', icon: Clock },
                    { id: 'fixed', label: 'ফিক্সড', icon: Coins },
                    { id: 'sqft', label: 'স্কয়ার ফিট', icon: Ruler }
                 ].map((mode) => (
                    <button 
                       key={mode.id}
                       onClick={() => setProjectMode(mode.id as any)}
                       className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${
                          projectMode === mode.id 
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold scale-105' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                       }`}
                    >
                       <mode.icon size={20} className="mb-1" />
                       <span className="text-[10px]">{mode.label}</span>
                    </button>
                 ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                   <div>
                     <label className={labelClass}>প্রজেক্ট নাম</label>
                     <input 
                       name="project_name"
                       required
                       value={formData.project_name}
                       onChange={handleInputChange}
                       className={inputClass}
                       placeholder="যেমন: চৌধুরী ভিলা"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className={labelClass}>ক্লায়েন্ট</label>
                       <input 
                         name="client_name"
                         required
                         value={formData.client_name}
                         onChange={handleInputChange}
                         className={inputClass}
                         placeholder="নাম"
                       />
                     </div>
                     <div>
                       <label className={labelClass}>মোবাইল</label>
                       <input 
                         name="client_phone"
                         required
                         value={formData.client_phone}
                         onChange={handleInputChange}
                         className={inputClass}
                         placeholder="017..."
                       />
                     </div>
                   </div>
                   <div>
                     <label className={labelClass}>লোকেশন</label>
                     <input 
                       name="location"
                       value={formData.location}
                       onChange={handleInputChange}
                       className={inputClass}
                       placeholder="ঠিকানা"
                     />
                   </div>
                </div>

                {/* Conditional Inputs - Standardized Style */}
                {projectMode === 'daily' && (
                   <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase">
                         <Calculator size={14} /> দৈনিক মজুরী সেটআপ
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className={labelClass}>মিস্ত্রী রেট</label>
                            <input 
                              name="mistri_rate"
                              type="number"
                              value={formData.mistri_rate}
                              onChange={handleInputChange}
                              className={inputClass}
                              placeholder="৳"
                            />
                         </div>
                         <div>
                            <label className={labelClass}>হেল্পার রেট</label>
                            <input 
                              name="helper_rate"
                              type="number"
                              value={formData.helper_rate}
                              onChange={handleInputChange}
                              className={inputClass}
                              placeholder="৳"
                            />
                         </div>
                      </div>
                   </div>
                )}

                {projectMode === 'fixed' && (
                   <div className="pt-2">
                      <label className={labelClass}>ফিক্সড বাজেট</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                         <input 
                           name="budget_amount"
                           type="number"
                           required
                           value={formData.budget_amount}
                           onChange={handleInputChange}
                           className={`${inputClass} pl-8`}
                           placeholder="0"
                        />
                      </div>
                   </div>
                )}

                {projectMode === 'sqft' && (
                   <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className={labelClass}>রেট (প্রতি sqft)</label>
                            <input 
                              name="sqft_rate"
                              type="number"
                              required
                              value={formData.sqft_rate}
                              onChange={handleInputChange}
                              className={inputClass}
                              placeholder="৳"
                            />
                         </div>
                         <div>
                            <label className={labelClass}>মোট এরিয়া</label>
                            <input 
                              name="total_area"
                              type="number"
                              required
                              value={formData.total_area}
                              onChange={handleInputChange}
                              className={inputClass}
                              placeholder="sqft"
                            />
                         </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                         <span className="text-sm font-bold text-slate-500 dark:text-slate-400">মোট বাজেট:</span>
                         <span className="text-lg font-bold text-slate-800 dark:text-white">৳ {getCalculatedBudget().toLocaleString()}</span>
                      </div>
                   </div>
                )}

                <button 
                  type="submit" 
                  className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-blue-700 transition-all active:scale-95"
                >
                   {user?.role === 'supervisor' ? <Send size={18} /> : <CheckCircle size={18} />}
                   {user?.role === 'supervisor' ? 'অনুরোধ পাঠান' : 'প্রজেক্ট শুরু করুন'}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};