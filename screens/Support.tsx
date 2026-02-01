import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const Support = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'কিভাবে নতুন প্রজেক্ট যুক্ত করবো?', a: 'ড্যাশবোর্ড থেকে "প্রজেক্ট +" বাটনে ক্লিক করুন অথবা প্রজেক্ট পেজে গিয়ে নতুন প্রজেক্ট তৈরি করুন।' },
    { q: 'কর্মীর হাজিরা কিভাবে দেব?', a: 'খাতা মেনুতে যান, তারিখ সিলেক্ট করুন এবং কর্মীর নামের পাশে P (Present), H (Half-day) বা A (Absent) বাটনে ক্লিক করুন।' },
    { q: 'ডাটা কি হারিয়ে যাবে?', a: 'না, আপনার সকল ডাটা লোকাল স্টোরেজে সংরক্ষিত থাকে। তবে অ্যাপ ডিলিট করলে ডাটা মুছে যেতে পারে। শীঘ্রই ক্লাউড ব্যাকআপ আসছে।' },
    { q: 'পাসওয়ার্ড ভুলে গেলে কি করবো?', a: 'লগইন পেজে "পাসওয়ার্ড ভুলে গেছি" অপশন ব্যবহার করুন অথবা সাপোর্টে যোগাযোগ করুন।' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-gray-800">সাপোর্ট সেন্টার</h1>
      </div>

      <div className="p-4 space-y-6">
         {/* Contact Cards */}
         <div className="grid grid-cols-2 gap-3">
            <a href="tel:+8801700000000" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
               <div className="bg-green-50 p-3 rounded-full text-green-600"><Phone size={24}/></div>
               <span className="font-bold text-gray-700 text-sm">কল করুন</span>
            </a>
            <a href="mailto:support@projectkhata.com" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
               <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Mail size={24}/></div>
               <span className="font-bold text-gray-700 text-sm">ইমেইল</span>
            </a>
         </div>

         <div className="bg-indigo-600 rounded-xl p-6 text-white text-center shadow-lg shadow-indigo-200">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-80" />
            <h3 className="text-lg font-bold">লাইভ চ্যাট</h3>
            <p className="text-indigo-100 text-xs mb-4">আমাদের প্রতিনিধির সাথে সরাসরি কথা বলুন</p>
            <button className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-50">
               চ্যাট শুরু করুন
            </button>
         </div>

         {/* FAQs */}
         <div>
            <h3 className="font-bold text-gray-800 mb-3">সচরাচর জিজ্ঞাসা (FAQ)</h3>
            <div className="space-y-2">
               {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                     <button 
                       onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                       className="w-full flex items-center justify-between p-4 text-left"
                     >
                        <span className="font-bold text-sm text-gray-700">{faq.q}</span>
                        {openFaq === idx ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                     </button>
                     {openFaq === idx && (
                        <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-2">
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