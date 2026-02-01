import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hammer, Ruler, Component, Box } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-gray-800">কনস্ট্রাকশন টুলস</h1>
      </div>

      <div className="px-4 space-y-4">
         {!activeTool && (
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setActiveTool('brick')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:border-orange-500 transition-colors"
               >
                  <div className="bg-orange-50 p-4 rounded-full text-orange-600">
                     <Box size={32} />
                  </div>
                  <span className="font-bold text-gray-700">ইটের হিসাব</span>
               </button>
               <button 
                  onClick={() => setActiveTool('rod')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:border-blue-500 transition-colors"
               >
                  <div className="bg-blue-50 p-4 rounded-full text-blue-600">
                     <Component size={32} />
                  </div>
                  <span className="font-bold text-gray-700">রডের হিসাব</span>
               </button>
            </div>
         )}

         {activeTool === 'brick' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Box className="text-orange-500"/> ইটের ক্যালকুলেটর</h3>
                  <button onClick={() => setActiveTool(null)} className="text-sm text-blue-600">পরিবর্তন</button>
               </div>
               
               <div className="space-y-3">
                  <div>
                     <label className="text-xs font-bold text-gray-500">দেয়ালের দৈর্ঘ্য (ফুট)</label>
                     <input type="number" value={wallSize.length} onChange={e => setWallSize({...wallSize, length: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" placeholder="0" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500">দেয়ালের উচ্চতা (ফুট)</label>
                     <input type="number" value={wallSize.height} onChange={e => setWallSize({...wallSize, height: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" placeholder="0" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500">দেয়ালের চওড়া (ইঞ্চি)</label>
                     <select value={wallSize.thickness} onChange={e => setWallSize({...wallSize, thickness: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <option value="5">৫ ইঞ্চি</option>
                        <option value="10">১০ ইঞ্চি</option>
                     </select>
                  </div>
                  <button onClick={calculateBricks} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl mt-2">হিসাব করুন</button>
                  
                  {brickResult !== null && (
                     <div className="mt-4 p-4 bg-orange-50 rounded-xl text-center">
                        <p className="text-sm text-orange-800">প্রয়োজনীয় ইট</p>
                        <p className="text-3xl font-bold text-orange-600">{brickResult} টি</p>
                        <p className="text-[10px] text-gray-500 mt-1">*মশলা সহ আনুমানিক হিসাব</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {activeTool === 'rod' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Component className="text-blue-500"/> রডের ওজন ক্যালকুলেটর</h3>
                  <button onClick={() => setActiveTool(null)} className="text-sm text-blue-600">পরিবর্তন</button>
               </div>
               
               <div className="space-y-3">
                  <div>
                     <label className="text-xs font-bold text-gray-500">রডের সাইজ (mm)</label>
                     <select value={rodDetails.diameter} onChange={e => setRodDetails({...rodDetails, diameter: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <option value="">সিলেক্ট করুন</option>
                        <option value="8">8 mm</option>
                        <option value="10">10 mm</option>
                        <option value="12">12 mm</option>
                        <option value="16">16 mm</option>
                        <option value="20">20 mm</option>
                        <option value="25">25 mm</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500">প্রতিটির দৈর্ঘ্য (ফুট)</label>
                     <input type="number" value={rodDetails.length} onChange={e => setRodDetails({...rodDetails, length: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" placeholder="সাধারণত ৩৯.৫ ফুট" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500">পরিমাণ (সংখ্যা)</label>
                     <input type="number" value={rodDetails.quantity} onChange={e => setRodDetails({...rodDetails, quantity: e.target.value})} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" placeholder="0" />
                  </div>
                  <button onClick={calculateRod} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">হিসাব করুন</button>
                  
                  {rodWeight !== null && (
                     <div className="mt-4 p-4 bg-blue-50 rounded-xl text-center">
                        <p className="text-sm text-blue-800">মোট ওজন</p>
                        <p className="text-3xl font-bold text-blue-600">{rodWeight} কেজি</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};