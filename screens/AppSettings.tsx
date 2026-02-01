import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Bell, Globe, Moon, Shield, Database, ChevronRight, Upload, Download } from 'lucide-react';

export const AppSettings = () => {
  const navigate = useNavigate();
  const { appSettings, updateAppSettings, t } = useData();
  const [notifications, setNotifications] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDarkMode = () => {
    updateAppSettings({ ...appSettings, darkMode: !appSettings.darkMode });
  };

  const toggleLanguage = () => {
    const newLang = appSettings.language === 'bn' ? 'en' : 'bn';
    updateAppSettings({ ...appSettings, language: newLang });
  };

  // Backup Data
  const handleBackup = () => {
    const data = {
        users: localStorage.getItem('pk_users'),
        projects: localStorage.getItem('pk_projects'),
        attendance: localStorage.getItem('pk_attendance'),
        transactions: localStorage.getItem('pk_transactions'),
        notifications: localStorage.getItem('pk_notifications'),
        settings: localStorage.getItem('pk_settings'),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ProjectKhata_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore Data
  const handleRestoreClick = () => {
    if (window.confirm("সতর্কতা: ব্যাকআপ ফাইল আপলোড করলে বর্তমান ডাটা প্রতিস্থাপন করা হবে। আপনি কি নিশ্চিত?")) {
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            
            if (json.users) localStorage.setItem('pk_users', json.users);
            if (json.projects) localStorage.setItem('pk_projects', json.projects);
            if (json.attendance) localStorage.setItem('pk_attendance', json.attendance);
            if (json.transactions) localStorage.setItem('pk_transactions', json.transactions);
            if (json.notifications) localStorage.setItem('pk_notifications', json.notifications);
            if (json.settings) localStorage.setItem('pk_settings', json.settings);

            alert("ডাটা সফলভাবে রিস্টোর করা হয়েছে! অ্যাপ রিলোড হচ্ছে...");
            window.location.reload();
        } catch (err) {
            alert("ভুল ফাইল ফরম্যাট! দয়া করে সঠিক ব্যাকআপ ফাইল আপলোড করুন।");
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-gray-800 dark:text-white">{t('app_settings')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* General */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
           <h3 className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase">{t('general')}</h3>
           
           <div className="border-b border-gray-50 dark:border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Globe size={18}/></div>
                 <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{t('language')}</span>
              </div>
              <button 
                onClick={toggleLanguage}
                className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {appSettings.language === 'bn' ? 'বাংলা' : 'English'}
              </button>
           </div>

           <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400"><Moon size={18}/></div>
                 <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{t('dark_mode')}</span>
              </div>
              <div 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${appSettings.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${appSettings.darkMode ? 'translate-x-6' : ''}`}></div>
              </div>
           </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
           <h3 className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase">{t('notifications')}</h3>
           <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400"><Bell size={18}/></div>
                 <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">পুশ নোটিফিকেশন</span>
              </div>
              <div 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${notifications ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications ? 'translate-x-6' : ''}`}></div>
              </div>
           </div>
        </div>

        {/* Security & Data */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
           <h3 className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase">{t('security_data')}</h3>
           
           <button className="w-full border-b border-gray-50 dark:border-gray-800 p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800">
              <div className="flex items-center gap-3">
                 <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400"><Shield size={18}/></div>
                 <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{t('change_pass')}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400"/>
           </button>

           {/* Backup & Restore Section */}
           <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                 <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400"><Database size={18}/></div>
                 <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{t('data_backup')}</span>
              </div>
              
              <div className="flex gap-3">
                 <button 
                    onClick={handleBackup}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                 >
                    <Download size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">ব্যাকআপ নিন</span>
                 </button>
                 
                 <button 
                    onClick={handleRestoreClick}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                 >
                    <Upload size={16} className="text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">রিস্টোর করুন</span>
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                 />
              </div>
              <p className="text-[10px] text-gray-400 text-center">ব্যাকআপ ফাইল (.json) আপনার ডিভাইসে সেভ হবে।</p>
           </div>
        </div>
      </div>
    </div>
  );
};