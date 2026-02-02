import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Search, Ruler, Clock, Coins, X, CheckCircle, Calculator, User, Phone, Send, Plus, ArrowRight, Building, LayoutTemplate, Briefcase, ChevronRight, Wallet } from 'lucide-react';
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

  const isSupervisor = user?.role === 'supervisor';
  const themeColor = isSupervisor ? 'purple' : 'blue';

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

  // Consistent Input Styles (Theme Aware)
  const inputClass = `w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-${themeColor}-500 focus:ring-4 focus:ring-${themeColor}-500/10 text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-sm focus:shadow-md`;
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide ml-1";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
      {/* Header with Search */}
      <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 px-4 pt-4 pb-2 shadow-sm border-b border-slate-100 dark:border-slate-800">
         <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2`}>
               <LayoutTemplate className={isSupervisor ? "text-purple-600" : "text-blue-600"} />
               প্রজেক্ট তালিকা
            </h2>
            <button 
               onClick={() => setIsModalOpen(true)}
               className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform bg-gradient-to-r ${isSupervisor ? 'from-purple-600 to-indigo-600 shadow-purple-200' : 'from-blue-600 to-indigo-600 shadow-blue-200'}`}
            >
               <Plus size={24} />
            </button>
         </div>
         
         <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
               type="text"
               placeholder="প্রজেক্ট বা লোকেশন খুঁজুন..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className={`w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-${themeColor}-500 outline-none text-sm transition-all text-slate-800 dark:text-white placeholder-slate-400 font-medium`}
            />
         </div>

         <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'active', 'completed'].map((tab) => (
               <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                     activeTab === tab 
                     ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/30 text-${themeColor}-700 dark:text-${themeColor}-300 border-${themeColor}-200 dark:border-${themeColor}-800` 
                     : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
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
            
            // Refined Color Configs
            let typeConfig = { label: 'ফিক্সড', icon: Coins, bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-800' };
            if (project.project_type === 'daily') typeConfig = { label: 'ডেইলি', icon: Clock, bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800' };
            if (project.project_type === 'sqft') typeConfig = { label: 'স্কয়ার ফিট', icon: Ruler, bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-800' };

            return (
              <div 
                key={project.id} 
                onClick={() => navigate(`/projects/${project.id}`)}
                className={`bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden active:scale-[0.99] transition-all group hover:border-${themeColor}-200 dark:hover:border-${themeColor}-800 hover:shadow-md`}
              >
                {/* Advanced List Card Design */}
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${typeConfig.bg} border ${typeConfig.border} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                         <Building className={typeConfig.text} size={22} />
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight truncate max-w-[180px]">{project.project_name}</h3>
                         <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                            <MapPin size={10} className={typeConfig.text} /> {project.location}
                         </p>
                      </div>
                   </div>
                   <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${typeConfig.bg} ${typeConfig.text} flex items-center gap-1 border ${typeConfig.border}`}>
                      <typeConfig.icon size={12} /> {typeConfig.label}
                   </div>
                </div>

                {/* Metrics */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 mb-4">
                   <div className="flex justify-between items-end mb-2">
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">খরচ / বাজেট</p>
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            ৳ {project.current_expense.toLocaleString()} 
                            {project.budget_amount > 0 && <span className="text-slate-400 text-xs font-medium"> / {project.budget_amount.toLocaleString()}</span>}
                         </p>
                      </div>
                      {project.project_type !== 'daily' && (
                         <span className={`text-xs font-bold text-${themeColor}-600 dark:text-${themeColor}-400 bg-${themeColor}-50 dark:bg-${themeColor}-900/20 px-2 py-0.5 rounded`}>{Math.round(progress)}%</span>
                      )}
                   </div>
                   
                   {project.project_type !== 'daily' && (
                     <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                           className={`h-full rounded-full transition-all duration-700 ${progress > 100 ? 'bg-red-500' : `bg-${themeColor}-600`}`}
                           style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                     </div>
                   )}
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                   <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                         <div key={i} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">
                            <User size={12} />
                         </div>
                      ))}
                   </div>
                   <div className={`flex items-center gap-1 text-slate-400 font-bold group-hover:text-${themeColor}-600 transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg`}>
                      বিস্তারিত <ChevronRight size={14} />
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
              <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
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
                          ? `bg-white dark:bg-slate-700 text-${themeColor}-600 dark:text-${themeColor}-400 shadow-md border border-slate-100 dark:border-slate-600` 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-white/50'
                       }`}
                    >
                       <mode.icon size={20} className="mb-1" />
                       <span className="text-[10px] font-bold">{mode.label}</span>
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
                  className={`w-full py-4 bg-gradient-to-r ${isSupervisor ? 'from-purple-600 to-indigo-600 shadow-purple-200' : 'from-blue-600 to-indigo-600 shadow-blue-200'} text-white rounded-2xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95`}
                >
                   {isSupervisor ? <Send size={18} /> : <CheckCircle size={18} />}
                   {isSupervisor ? 'অনুরোধ পাঠান' : 'প্রজেক্ট শুরু করুন'}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};