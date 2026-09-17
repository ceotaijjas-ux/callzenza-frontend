"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, X, AlertTriangle, CheckCircle2, RefreshCcw } from "lucide-react";

interface AudioDeviceCheckModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function AudioDeviceCheckModal({ onClose, onComplete }: AudioDeviceCheckModalProps) {
  const [step, setStep] = useState<"MIC" | "SPEAKER">("MIC");
  const [micFrequencies, setMicFrequencies] = useState<number[]>(Array(20).fill(0));
  const [micError, setMicError] = useState<string | null>(null);
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === "MIC") {
      startMicTest();
    }
    
    return () => {
      stopMicTest();
    };
  }, [step]);

  const startMicTest = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // We have 128 bins (fftSize 256 / 2). Let's divide them into 20 bars.
        const barCount = 20;
        const binsPerBar = Math.floor(dataArray.length / barCount);
        
        const newFrequencies = [];
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < binsPerBar; j++) {
            sum += dataArray[i * binsPerBar + j];
          }
          const average = sum / binsPerBar;
          // Normalize to 0-100%
          const normalized = Math.min(100, Math.max(2, (average / 255) * 100));
          newFrequencies.push(normalized);
        }
        
        setMicFrequencies(newFrequencies);
        
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err: any) {
      console.error("Microphone test error:", err);
      setMicError("Microphone not detected or permission denied. Please check your system settings.");
    }
  };

  const stopMicTest = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleMicSuccess = () => {
    // If all bars are basically flat (e.g. <= 2%), we assume no sound
    if (micFrequencies.every(val => val <= 5)) {
      setMicError("We didn't detect any sound from your microphone. Please speak louder or select a different device.");
      return;
    }
    stopMicTest();
    setStep("SPEAKER");
    // Auto play sound when entering speaker step
    setTimeout(() => {
      playTestSound();
    }, 500);
  };

  const playTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Failed to play test sound", e);
    }
  };

  const handleSpeakerFail = () => {
    setSpeakerError("Please check if your speakers/headphones are connected and your system volume is turned up.");
    playTestSound();
  };

  const handleSpeakerSuccess = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {step === "MIC" ? "Microphone Check" : "Speaker Check"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {step === "MIC" && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Mic className="w-10 h-10" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-slate-600 font-medium text-lg">Say something to test your mic</p>
                <p className="text-slate-400 text-sm">Make sure the frequency bars move when you speak.</p>
              </div>

              {/* Frequency Visualizer */}
              <div className="w-full h-16 flex items-end justify-center gap-1">
                {micFrequencies.map((freq, i) => (
                  <div
                    key={i}
                    className="w-full max-w-[12px] bg-indigo-500 rounded-t-sm transition-all duration-75 ease-out"
                    style={{ height: `${freq}%` }}
                  />
                ))}
              </div>

              {micError && (
                <div className="w-full flex flex-col gap-2 mt-4">
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-700 text-sm font-medium">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>{micError}</p>
                  </div>
                  <button 
                    onClick={startMicTest}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold uppercase transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              <button
                onClick={handleMicSuccess}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
              >
                Yes, it's working
              </button>
            </div>
          )}

          {step === "SPEAKER" && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-inner cursor-pointer hover:bg-emerald-100 transition-colors" onClick={playTestSound}>
                <Volume2 className="w-10 h-10" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-slate-600 font-medium text-lg">Can you hear the test sound?</p>
                <p className="text-slate-400 text-sm">Click the speaker icon to play the sound again.</p>
              </div>

              {speakerError && (
                <div className="w-full p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-700 text-sm font-medium">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{speakerError}</p>
                </div>
              )}

              <div className="w-full flex flex-col gap-3 mt-4">
                <button
                  onClick={handleSpeakerSuccess}
                  className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Yes, I heard it
                </button>
                <button
                  onClick={handleSpeakerFail}
                  className="w-full py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  No, play it again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
