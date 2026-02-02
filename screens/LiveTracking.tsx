import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Navigation, RefreshCw, Clock } from 'lucide-react';

export const LiveTracking = () => {
  const { activeLocations, users } = useData();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
  };

  const getWorkerDetails = (userId: string) => {
      return users.find(u => u.id === userId);
  };

  const openGoogleMaps = (lat: number, lng: number) => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'এইমাত্র';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} মিনিট আগে`;
      return date.toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
             <ArrowLeft size={20} />
           </button>
           <h1 className="font-bold text-lg text-slate-800 dark:text-white">লাইভ ট্র্যাকিং</h1>
        </div>
        <button 
           onClick={handleRefresh}
           className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
        >
           <RefreshCw size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4">
         {/* Map Placeholder / Header */}
         <div className="bg-blue-600 rounded-[2rem] p-6 text-white text-center shadow-lg shadow-blue-200 dark:shadow-none relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
             <MapPin size={48} className="mx-auto mb-2 opacity-80" />
             <h2 className="text-2xl font-bold">{activeLocations.length} জন</h2>
             <p className="text-sm text-blue-100 font-medium">লাইভ লোকেশন শেয়ার করছেন</p>
         </div>

         <div className="space-y-3">
            {activeLocations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold text-sm bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    এখনও কেউ লোকেশন শেয়ার করেনি
                </div>
            ) : (
                activeLocations.map(loc => {
                    const worker = getWorkerDetails(loc.user_id);
                    if (!worker) return null;

                    return (
                        <div key={loc.user_id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={worker.avatar_url || 'https://picsum.photos/50'} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">{worker.full_name}</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                                        <Clock size={10} /> {formatTime(loc.last_updated)}
                                    </p>
                                </div>
                            </div>
                            <button 
                               onClick={() => openGoogleMaps(loc.lat, loc.lng)}
                               className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1 min-w-[70px]"
                            >
                                <Navigation size={18} />
                                <span className="text-[9px] font-bold">ম্যাপ দেখুন</span>
                            </button>
                        </div>
                    );
                })
            )}
         </div>
      </div>
    </div>
  );
};