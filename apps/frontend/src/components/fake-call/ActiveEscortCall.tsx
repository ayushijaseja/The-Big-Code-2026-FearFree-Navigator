import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { useEscortCall } from '../../hooks/useEscortCall';

export const ActiveEscortCall = ({ onClose }: { onClose: () => void }) => {
  const escort = useEscortCall(onClose);

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-between bg-slate-900 px-6 py-16 text-white backdrop-blur-xl sm:px-10">
      
      <audio 
        ref={escort.audioRef} 
        onEnded={() => {
          escort.isProcessingRef.current = false;
          escort.setTranscript("Listening...");
          if (!escort.isMuted) {
            try { escort.recognitionRef.current?.start(); } catch(e) {}
          }
        }} 
      />

      <CallerProfile callState={escort.callState} timer={escort.timer} />

      {escort.callState === 'active' && (
        <div className="w-full max-w-sm text-center">
          <p className="min-h-12 text-sm italic text-slate-400">{escort.transcript}</p>
        </div>
      )}

      <CallControls 
        callState={escort.callState}
        isMuted={escort.isMuted}
        onAccept={escort.handleAcceptCall}
        onEnd={escort.handleEndCall}
        onMuteToggle={escort.toggleMute}
        onClose={onClose}
      />
    </div>
  );
};


const CallerProfile = ({ callState, timer }: { callState: string, timer: number }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="mt-10 flex flex-col items-center space-y-6">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-700 shadow-2xl">
        <User size={64} className="text-slate-400" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-light tracking-wide text-slate-100">Guardian AI</h1>
        <p className="mt-2 text-lg text-slate-400">
          {callState === 'incoming' ? 'Incoming Mobile Call...' : formatTime(timer)}
        </p>
      </div>
    </div>
  );
};

const CallControls = ({ 
  callState, isMuted, onAccept, onEnd, onMuteToggle, onClose 
}: any) => {
  return (
    <div className="mb-10 w-full max-w-sm">
      {callState === 'incoming' ? (
        <div className="flex w-full justify-between px-8">
          <button 
            onClick={onClose}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform hover:scale-105"
          >
            <PhoneOff size={32} className="text-white" />
          </button>
          <button 
            onClick={onAccept}
            className="flex h-20 w-20 animate-pulse flex-col items-center justify-center rounded-full bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-transform hover:scale-105"
          >
            <Phone size={32} className="text-white fill-white" />
          </button>
        </div>
      ) : (
        <div className="flex w-full justify-evenly">
          <button 
            onClick={onMuteToggle}
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-full transition-colors ${
              isMuted ? 'bg-slate-100 text-slate-900' : 'bg-slate-700/50 text-white'
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button 
            onClick={onEnd}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform hover:scale-105"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};