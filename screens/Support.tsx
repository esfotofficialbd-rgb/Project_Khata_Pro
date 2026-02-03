
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Phone, Mail, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const Support = () => {
  const navigate = useNavigate();
  const { t } = useData();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'কিভাবে নতুন প্রজেক্ট যুক্ত করবো?', a: 'ড্যাশবোর্ড থেকে "প্রজেক্ট +" বাটনে ক্লিক করুন অথবা প্রজেক্ট পেজে গিয়ে নতুন প্রজেক্ট তৈরি করুন।' },
    { q: 'কর্মীর হাজিরা কিভাবে দেব?', a: 'খাতা মেনুতে যান, তারিখ সিলেক্ট করুন এবং কর্মীর নামের পাশে P (Present), H (Half-day) বা A (Absent) বাটনে ক্লিক করুন।' },
    { q: 'ডাটা কি হারিয়ে যাবে?', a: 'না, আপনার সকল ডাটা লোকাল স্টোরেজে সংরক্ষিত থাকে। তবে অ্যাপ ডিলিট করলে ডাটা মুছে যেতে পারে। শীঘ্রই ক্লাউড ব্যাকআপ আসছে।' },
    { q: 'পাসওয়ার্ড ভুলে গেলে কি করবো?', a: 'লগইন পেজে "পাসওয়ার্ড ভুলে গেছি" অপশন ব্যবহার করুন অথবা সাপোর্টে যোগাযোগ করুন।' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white">{t('support_center')}</h1>
      </div>

      <div className="p-4 space-y-6">
         {/* Contact Cards */}
         <div className="grid grid-cols-2 gap-3">
            <a href="tel:+8801700000000" className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 active:scale-95 transition-transform">
               <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full text-green-600 dark:text-green-400"><Phone size={24}/></div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t('call_us')}</span>
            </a>
            <a href="mailto:support@projectkhata.com" className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 active:scale-95 transition-transform">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400"><Mail size={24}/></div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t('email_us')}</span>
            </a>
         </div>

         <div className="bg-indigo-600 rounded-xl p-6 text-white text-center shadow-lg shadow-indigo-200 dark:shadow-none">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-80" />
            <h3 className="text-lg font-bold">{t('live_chat')}</h3>
            <p className="text-indigo-100 text-xs mb-4">আমাদের প্রতিনিধির সাথে সরাসরি কথা বলুন</p>
            <button className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-50 transition-colors">
               {t('start_chat')}
            </button>
         </div>

         {/* FAQs */}
         <div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-3">{t('faq')}</h3>
            <div className="space-y-2">
               {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                     <button 
                       onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                       className="w-full flex items-center justify-between p-4 text-left"
                     >
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{faq.q}</span>
                        {openFaq === idx ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                     </button>
                     {openFaq === idx && (
                        <div className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-2">
                           {faq.a}
                        </div>
                     )}
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
