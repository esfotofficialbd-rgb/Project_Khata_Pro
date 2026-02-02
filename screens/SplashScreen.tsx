import React, { useEffect, useState } from 'react';
import { Building2, HardHat } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 2; // Faster loading feel
      });
    }, 50);

    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onFinish, 600); 
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between py-12 px-6 transition-opacity duration-700 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
         <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-30 animate-pulse-slow"></div>
         <div className="absolute top-1/3 -left-20 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20"></div>
         <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
         {/* Main Logo Container */}
         <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-blue-500 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
            <div className="relative w-36 h-36 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10 p-1">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-50"></div>
                <Building2 size={64} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                
                {/* Floating Badge */}
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-orange-500 to-amber-500 p-3.5 rounded-2xl shadow-lg border-4 border-slate-950 flex items-center justify-center animate-bounce-slow">
                   <HardHat size={24} className="text-white fill-white/20" />
                </div>
            </div>
         </div>

         {/* Typography */}
         <div className="text-center space-y-3">
            <h1 className="text-5xl font-extrabold text-white tracking-tight font-sans">
               প্রজেক্ট <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">খাতা</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-[0.3em] uppercase opacity-90 border-t border-white/10 pt-3 mt-1 inline-block px-4">
               স্মার্ট কনস্ট্রাকশন ম্যানেজার
            </p>
         </div>
      </div>

      {/* Loading Indicator */}
      <div className="w-full max-w-[200px] flex flex-col items-center gap-3 relative z-10">
         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
         </div>
         <p className="text-[10px] text-slate-500 font-mono animate-pulse"> লোডিং... {Math.min(progress, 100)}%</p>
      </div>
    </div>
  );
}