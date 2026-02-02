import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hammer, Ruler, Component, Box, ChevronRight, Calculator } from 'lucide-react';

export const Tools = () => {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<'brick' | 'rod' | null>(null);
  
  // Brick Calc State
  const [wallSize, setWallSize] = useState({ length: '', height: '', thickness: '5' });
  const [brickResult, setBrickResult] = useState<number | null>(null);

  // Rod Calc State
  const [rodDetails, setRodDetails] = useState({ diameter: '', length: '', quantity: '' });
  const [rodWeight, setRodWeight] = useState<number | null>(null);

  const calculateBricks = () => {
    const l = Number(wallSize.length);
    const h = Number(wallSize.height);
    const t = Number(wallSize.thickness);
    if (l && h) {
      const area = l * h;
      // Approx 12 bricks per sqft for 5 inch wall, 24 for 10 inch
      const rate = t === 5 ? 12.5 : 25; 
      setBrickResult(Math.ceil(area * rate));
    }
  };

  const calculateRod = () => {
    const d = Number(rodDetails.diameter); // mm
    const l = Number(rodDetails.length); // feet
    const q = Number(rodDetails.quantity); // pieces
    
    if (d && l && q) {
      // Formula: (D^2 / 162) * L (meters) | Here L is feet
      // D^2 / 533 * L (feet) approx for kg
      const weightPerFoot = (d * d) / 533;
      const totalWeight = weightPerFoot * l * q;
      setRodWeight(Number(totalWeight.toFixed(2)));
    }
  };

  const inputClass = "w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wide ml-1";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans">
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white">কনস্ট্রাকশন টুলস</h1>
      </div>

      <div className="p-4 space-y-4">
         {!activeTool && (
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setActiveTool('brick')}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 hover:border-orange-200 dark:hover:border-orange-800 transition-all group active:scale-95"
               >
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-full text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                     <Box size={32} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">ইটের হিসাব</span>
               </button>
               <button 
                  onClick={() => setActiveTool('rod')}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-all group active:scale-95"
               >
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                     <Component size={32} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">রডের হিসাব</span>
               </button>
            </div>
         )}

         {activeTool === 'brick' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-scale-up">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                     <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-600"><Box size={20}/></div> 
                     ইটের ক্যালকুলেটর
                  </h3>
                  <button onClick={() => setActiveTool(null)} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">পরিবর্তন</button>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className={labelClass}>দেয়ালের দৈর্ঘ্য (ফুট)</label>
                     <input type="number" value={wallSize.length} onChange={e => setWallSize({...wallSize, length: e.target.value})} className={inputClass} placeholder="0" />
                  </div>
                  <div>
                     <label className={labelClass}>দেয়ালের উচ্চতা (ফুট)</label>
                     <input type="number" value={wallSize.height} onChange={e => setWallSize({...wallSize, height: e.target.value})} className={inputClass} placeholder="0" />
                  </div>
                  <div>
                     <label className={labelClass}>দেয়ালের চওড়া (ইঞ্চি)</label>
                     <div className="relative">
                        <select value={wallSize.thickness} onChange={e => setWallSize({...wallSize, thickness: e.target.value})} className={`${inputClass} appearance-none`}>
                           <option value="5">৫ ইঞ্চি</option>
                           <option value="10">১০ ইঞ্চি</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16}/>
                     </div>
                  </div>
                  <button onClick={calculateBricks} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl mt-2 shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                     <Calculator size={18}/> হিসাব করুন
                  </button>
                  
                  {brickResult !== null && (
                     <div className="mt-6 p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl text-center text-white shadow-lg">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-100 mb-1">প্রয়োজনীয় ইট</p>
                        <p className="text-4xl font-extrabold">{brickResult} টি</p>
                        <p className="text-[10px] text-orange-100 mt-2 font-medium bg-white/20 inline-block px-3 py-1 rounded-full">*মশলা সহ আনুমানিক হিসাব</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {activeTool === 'rod' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-scale-up">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                     <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600"><Component size={20}/></div> 
                     রডের ওজন
                  </h3>
                  <button onClick={() => setActiveTool(null)} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">পরিবর্তন</button>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className={labelClass}>রডের সাইজ (mm)</label>
                     <div className="relative">
                        <select value={rodDetails.diameter} onChange={e => setRodDetails({...rodDetails, diameter: e.target.value})} className={`${inputClass} appearance-none`}>
                           <option value="">সিলেক্ট করুন</option>
                           <option value="8">8 mm</option>
                           <option value="10">10 mm</option>
                           <option value="12">12 mm</option>
                           <option value="16">16 mm</option>
                           <option value="20">20 mm</option>
                           <option value="25">25 mm</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16}/>
                     </div>
                  </div>
                  <div>
                     <label className={labelClass}>প্রতিটির দৈর্ঘ্য (ফুট)</label>
                     <input type="number" value={rodDetails.length} onChange={e => setRodDetails({...rodDetails, length: e.target.value})} className={inputClass} placeholder="সাধারণত ৩৯.৫ ফুট" />
                  </div>
                  <div>
                     <label className={labelClass}>পরিমাণ (সংখ্যা)</label>
                     <input type="number" value={rodDetails.quantity} onChange={e => setRodDetails({...rodDetails, quantity: e.target.value})} className={inputClass} placeholder="0" />
                  </div>
                  <button onClick={calculateRod} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl mt-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                     <Calculator size={18}/> হিসাব করুন
                  </button>
                  
                  {rodWeight !== null && (
                     <div className="mt-6 p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-center text-white shadow-lg">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-100 mb-1">মোট ওজন</p>
                        <p className="text-4xl font-extrabold">{rodWeight} কেজি</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};