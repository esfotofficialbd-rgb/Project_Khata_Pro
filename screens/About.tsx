import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ExternalLink } from 'lucide-react';

export const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-gray-800">আমাদের সম্পর্কে</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-10 px-4">
         <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Building2 className="text-white w-12 h-12" />
         </div>
         <h1 className="text-2xl font-bold text-gray-800 font-serif">প্রজেক্ট খাতা</h1>
         <p className="text-gray-500 text-sm mt-1">ভার্সন ১.০.০</p>

         <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full text-center space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
               প্রজেক্ট খাতা হলো বাংলাদেশের কনস্ট্রাকশন প্রজেক্ট ম্যানেজমেন্টের জন্য একটি পূর্ণাঙ্গ সমাধান। আমরা ঠিকাদার এবং কর্মীদের কাজের হিসাব রাখা সহজ করতে প্রতিজ্ঞাবদ্ধ।
            </p>
         </div>

         <div className="mt-6 w-full space-y-3">
            <button className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm active:bg-gray-50">
               <span className="font-bold text-gray-700 text-sm">প্রাইভেসি পলিসি</span>
               <ExternalLink size={16} className="text-gray-400" />
            </button>
            <button className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm active:bg-gray-50">
               <span className="font-bold text-gray-700 text-sm">টার্মস অফ সার্ভিস</span>
               <ExternalLink size={16} className="text-gray-400" />
            </button>
            <button className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm active:bg-gray-50">
               <span className="font-bold text-gray-700 text-sm">ওয়েবসাইট ভিজিট করুন</span>
               <ExternalLink size={16} className="text-gray-400" />
            </button>
         </div>

         <div className="mt-10 text-center">
            <p className="text-xs text-gray-400">Developed with ❤️ in Bangladesh</p>
            <p className="text-[10px] text-gray-300 mt-1">© 2024 Project Khata. All rights reserved.</p>
         </div>
      </div>
    </div>
  );
};