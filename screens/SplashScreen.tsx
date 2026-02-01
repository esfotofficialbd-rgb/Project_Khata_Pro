import React, { useEffect, useState } from 'react';
import { Building2, HardHat } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Progress bar animation simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Random increment for realistic effect
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 40);

    // Finish timeout (approx 2.5s)
    const timer = setTimeout(() => {
      setFade(true); // Trigger fade out
      setTimeout(onFinish, 500); // Wait for fade out animation to finish before unmounting
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <style>
        {`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 3s infinite ease-in-out;
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .animate-pulse-ring {
            animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
         <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px]"></div>
         <div className="absolute top-1/2 -right-20 w-72 h-72 bg-purple-600 rounded-full blur-[100px]"></div>
         <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-emerald-600 rounded-full blur-[100px]"></div>
      </div>

      {/* Logo Section */}
      <div className="relative mb-10">
         {/* Animated Ring */}
         <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse-ring"></div>
         
         {/* Main Icon Box */}
         <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-bounce-slow z-10 border border-white/10">
            <Building2 size={64} className="text-white" strokeWidth={1.5} />
            
            {/* Badge Icon */}
            <div className="absolute -bottom-3 -right-3 bg-white p-2.5 rounded-2xl shadow-lg flex items-center justify-center">
               <HardHat size={24} className="text-orange-500 fill-orange-100" />
            </div>
         </div>
      </div>

      {/* Text Section */}
      <div className="text-center z-10 space-y-2">
         <h1 className="text-4xl font-bold text-white tracking-tight font-serif drop-shadow-lg">
            প্রজেক্ট <span className="text-blue-400">খাতা</span>
         </h1>
         <p className="text-blue-200 text-xs font-medium tracking-[0.2em] uppercase opacity-80">
            স্মার্ট কনস্ট্রাকশন ম্যানেজমেন্ট
         </p>
      </div>

      {/* Loading Bar Section */}
      <div className="absolute bottom-16 w-64 flex flex-col items-center gap-3">
         <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-100 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
         </div>
         <div className="flex justify-between w-full text-[10px] text-slate-400 font-mono">
            <span>Loading...</span>
            <span>{Math.min(progress, 100)}%</span>
         </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center opacity-30">
         <p className="text-[10px] text-white tracking-widest">MADE WITH ❤️ IN BANGLADESH</p>
      </div>
    </div>
  );
}