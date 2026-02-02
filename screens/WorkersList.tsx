import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/SessionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Phone, Briefcase, UserCog, HardHat, X, ChevronDown, CheckCircle, Plus, MessageSquare } from 'lucide-react';
import { Profile } from '../types';

export const WorkersList = () => {
  const { users, projects, addUser } = useData();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'worker' | 'supervisor'>('worker');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // If user is supervisor, they can only manage workers
  const isSupervisor = user?.role === 'supervisor';

  useEffect(() => {
    if (location.state && (location.state as any).openAddModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [formRole, setFormRole] = useState<'worker' | 'supervisor'>('worker');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    skill_type: 'রাজমিস্ত্রি',
    rate: '',
    payment_type: 'daily' as 'daily' | 'monthly',
    project_id: ''
  });

  const workerSkills = ['রাজমিস্ত্রি', 'রডমিস্ত্রি', 'হেল্পার', 'সিনিয়র হেল্পার', 'হাব মিস্ত্রী', 'ইলেকট্রিশিয়ান', 'পেইন্টার'];

  const filteredUsers = users.filter(user => {
    const matchesRole = user.role === activeTab;
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordPreview = () => {
    // Show preview based on strictly sanitized phone
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 6) {
      return cleanPhone.slice(-6);
    }
    return "......";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize phone number (remove non-digits)
    const cleanPhone = formData.phone.replace(/\D/g, '');

    const newUser: Profile = {
      id: Date.now().toString(), // Temp ID, will be replaced by Auth ID
      role: formRole,
      full_name: formData.full_name,
      phone: cleanPhone,
      is_verified: true,
      balance: 0,
      avatar_url: `https://ui-avatars.com/api/?name=${formData.full_name}&background=random`
    };

    if (formRole === 'worker') {
      newUser.skill_type = formData.skill_type;
      newUser.daily_rate = Number(formData.rate);
    } else {
      newUser.designation = 'সাইট সুপারভাইজার';
      newUser.payment_type = formData.payment_type;
      newUser.assigned_project_id = formData.project_id || undefined;
      
      if (formData.payment_type === 'daily') {
        newUser.daily_rate = Number(formData.rate);
      } else {
        newUser.monthly_salary = Number(formData.rate);
      }
    }

    const result: any = await addUser(newUser);
    
    if (result && result.success) {
        setIsModalOpen(false);
        setFormData({
          full_name: '',
          phone: '',
          skill_type: 'রাজমিস্ত্রি',
          rate: '',
          payment_type: 'daily',
          project_id: ''
        });
    }
  };

  // Input Class
  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide ml-1";

  return (
    <div className="p-4 pb-24 min-h-screen relative bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">কর্মী তালিকা</h2>
         <button 
           onClick={() => setIsModalOpen(true)}
           className={`w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform ${isSupervisor ? 'bg-purple-600 shadow-purple-200 dark:shadow-none' : 'bg-slate-900 dark:bg-blue-600'}`}
         >
            <Plus size={24} />
         </button>
      </div>

      {!isSupervisor && (
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('worker')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'worker' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <HardHat size={16} />
            শ্রমিক
          </button>
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'supervisor' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <UserCog size={16} />
            সুপারভাইজার
          </button>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="নাম বা ফোন নম্বর খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 font-medium shadow-sm ${isSupervisor ? 'focus:ring-purple-500' : 'focus:ring-blue-500'}`}
        />
      </div>

      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">কোন তথ্য পাওয়া যায়নি</div>
        ) : (
          filteredUsers.map(user => (
            <div 
               key={user.id} 
               onClick={() => navigate(`/workers/${user.id}`)}
               className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform cursor-pointer relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-900"
            >
              {/* Left Stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${user.role === 'worker' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>

              <div className="relative">
                 <img src={user.avatar_url || 'https://picsum.photos/50'} className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                 <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white dark:border-slate-900 ${user.balance > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
              </div>
              
              <div className="flex-1 min-w-0 pl-1">
                <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">{user.full_name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${user.role === 'worker' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                     {activeTab === 'worker' ? user.skill_type : user.designation}
                  </span>
                  
                  {user.payment_type === 'monthly' ? (
                     <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                       ৳ {user.monthly_salary}/মাস
                     </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      ৳ {user.daily_rate}/দিন
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                 <a 
                    href={`sms:${user.phone}`} 
                    onClick={(e) => e.stopPropagation()} 
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                 >
                   <MessageSquare size={18} />
                 </a>
                 <a 
                    href={`tel:${user.phone}`} 
                    onClick={(e) => e.stopPropagation()} 
                    className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                 >
                   <Phone size={18} />
                 </a>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md relative z-10 p-8 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">নতুন যুক্ত করুন</h3>
                <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 text-slate-500"><X size={20}/></button>
              </div>

              {!isSupervisor && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button 
                    onClick={() => setFormRole('worker')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${formRole === 'worker' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                     <HardHat size={28}/>
                     শ্রমিক
                  </button>
                  <button 
                    onClick={() => setFormRole('supervisor')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${formRole === 'supervisor' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                     <UserCog size={28}/>
                     সুপারভাইজার
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>নাম</label>
                  <input 
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="পুরো নাম লিখুন"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>মোবাইল নাম্বার</label>
                  <input 
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="017xxxxxxxx"
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <CheckCircle size={12} className="text-green-500"/>
                    অটো পাসওয়ার্ড: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{getPasswordPreview()}</span>
                  </p>
                </div>

                {formRole === 'worker' && (
                  <>
                    <div>
                      <label className={labelClass}>পদবী / কাজের ধরণ</label>
                      <div className="relative">
                         <select 
                            name="skill_type"
                            value={formData.skill_type}
                            onChange={handleInputChange}
                            className={`${inputClass} appearance-none`}
                         >
                            {workerSkills.map(skill => (
                              <option key={skill} value={skill}>{skill}</option>
                            ))}
                         </select>
                         <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>প্রতিদিনের হাজিরা (মজুরি)</label>
                      <input 
                        name="rate"
                        type="number"
                        required
                        value={formData.rate}
                        onChange={handleInputChange}
                        placeholder="৳ ৫০০"
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                {formRole === 'supervisor' && !isSupervisor && (
                   <>
                     <div>
                        <label className={labelClass}>বেতন / হাজিরার ধরণ</label>
                        <div className="flex gap-4">
                           <label className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-2xl flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <input 
                                type="radio" 
                                name="payment_type" 
                                value="daily" 
                                checked={formData.payment_type === 'daily'}
                                onChange={() => setFormData({...formData, payment_type: 'daily'})}
                                className="accent-purple-600 w-4 h-4"
                              />
                              <span className="text-sm font-bold text-slate-700 dark:text-white">প্রতিদিন হাজিরা</span>
                           </label>
                           <label className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-2xl flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <input 
                                type="radio" 
                                name="payment_type" 
                                value="monthly" 
                                checked={formData.payment_type === 'monthly'}
                                onChange={() => setFormData({...formData, payment_type: 'monthly'})}
                                className="accent-purple-600 w-4 h-4"
                              />
                              <span className="text-sm font-bold text-slate-700 dark:text-white">মাসিক বেতন</span>
                           </label>
                        </div>
                     </div>

                     <div>
                        <label className={labelClass}>
                           {formData.payment_type === 'daily' ? 'প্রতিদিনের পরিমাণ' : 'মাসিক বেতনের পরিমাণ'}
                        </label>
                        <input 
                          name="rate"
                          type="number"
                          required
                          value={formData.rate}
                          onChange={handleInputChange}
                          placeholder="৳"
                          className={inputClass}
                        />
                     </div>

                     <div>
                        <label className={labelClass}>প্রজেক্ট (অপশনাল)</label>
                        <div className="relative">
                          <select 
                              name="project_id"
                              value={formData.project_id}
                              onChange={handleInputChange}
                              className={`${inputClass} appearance-none`}
                          >
                              <option value="">কোন প্রজেক্ট সিলেক্ট করা নেই</option>
                              {projects.filter(p => p.status === 'active').map(p => (
                                <option key={p.id} value={p.id}>{p.project_name}</option>
                              ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                   </>
                )}

                <button 
                  type="submit" 
                  className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg mt-4 transition-all active:scale-95 ${formRole === 'worker' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none'}`}
                >
                   {formRole === 'worker' ? 'শ্রমিক যুক্ত করুন' : 'সুপারভাইজার যুক্ত করুন'}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};