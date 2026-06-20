import React from 'react';

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Dynamic Keyframes injected into the page locally */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-blob-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -80px) scale(1.15); }
          66% { transform: translate(-40px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-blob-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-80px, 60px) scale(0.95); }
          66% { transform: translate(60px, -70px) scale(1.12); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-blob-3 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(80px, 90px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-blob-4 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-90px, -70px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}} />

      {/* Floating Liquid Blobs */}
      <div 
        className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/10 blur-[130px] animate-[float-blob-1_28s_infinite_ease-in-out]" 
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute bottom-[-15%] right-[-10%] w-[65%] h-[65%] rounded-full bg-purple-600/10 blur-[140px] animate-[float-blob-2_34s_infinite_ease-in-out]"
        style={{ animationDelay: '2s' }}
      />
      <div 
        className="absolute top-[25%] right-[15%] w-[45%] h-[45%] rounded-full bg-indigo-500/8 blur-[120px] animate-[float-blob-3_24s_infinite_ease-in-out]"
        style={{ animationDelay: '4s' }}
      />
      <div 
        className="absolute bottom-[20%] left-[10%] w-[50%] h-[50%] rounded-full bg-pink-500/4 blur-[130px] animate-[float-blob-4_32s_infinite_ease-in-out]"
        style={{ animationDelay: '6s' }}
      />
    </div>
  );
}
