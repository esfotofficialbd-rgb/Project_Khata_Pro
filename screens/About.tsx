
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Building2, ExternalLink } from 'lucide-react';

export const About = () => {
  const navigate = useNavigate();
  const { t } = useData();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white">{t('about_us')}</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-10 px-4">
         <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Building2 className="text-white w-12 h-12" />
         </div>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-serif">প্রজেক্ট খাতা</h1>
         <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('version')} ১.০.০</p>

         <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 w-full text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
               প্রজেক্ট খাতা হলো বাংলাদেশের কনস্ট্রাকশন প্রজেক্ট ম্যানেজমেন্টের জন্য একটি পূর্ণাঙ্গ সমাধান। আমরা ঠিকাদার এবং কর্মীদের কাজের হিসাব রাখা সহজ করতে প্রতিজ্ঞাবদ্ধ।
            </p>
         </div>

         <div className="mt-6 w-full space-y-3">
            <button className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t('privacy_policy')}</span>
               <ExternalLink size={16} className="text-slate-400" />
            </button>
            <button className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t('terms_service')}</span>
               <ExternalLink size={16} className="text-slate-400" />
            </button>
            <button className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t('visit_website')}</span>
               <ExternalLink size={16} className="text-slate-400" />
            </button>
         </div>

         <div className="mt-10 text-center">
            <p className="text-xs text-slate-400">{t('made_in')}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-1">© ২০২৫ প্রজেক্ট খাতা। সর্বস্বত্ব সংরক্ষিত।</p>
         </div>
      </div>
    </div>
  );
};
