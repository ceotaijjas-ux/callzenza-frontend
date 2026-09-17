import os

files_to_update = [
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\voice-agent\dashboard\page.tsx',
    r'j:\INTERNSHIP\INTERNSHIP\project\callmira-replica-phase3\fullstack-app\frontend\app\supervisor\voice-agents\page.tsx'
]

state_code = """  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayRecording = (id: number) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Using a dummy recording. In future integration, replace with actual call.recordingUrl
      const audio = new Audio("/dummy-recording.wav");
      audio.play();
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      setPlayingId(id);
    }
  };

"""

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the top of the component to insert state
    if "const [totalCalls, setTotalCalls] = useState(0);" in content:
        content = content.replace(
            "const [totalCalls, setTotalCalls] = useState(0);",
            "const [totalCalls, setTotalCalls] = useState(0);\n" + state_code
        )
    
    # Replace the Listen button
    target_button = """                        {call.hasRecording && (
                          <button 
                            className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Play Recording"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Listen</span>
                          </button>
                        )}"""

    replacement_button = """                        {call.hasRecording && (
                          <button 
                            onClick={() => handlePlayRecording(call.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all shadow-sm ${
                              playingId === call.id 
                                ? 'text-indigo-600 bg-indigo-50 border border-indigo-200 opacity-100' 
                                : 'text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 opacity-0 group-hover:opacity-100'
                            }`}
                            title={playingId === call.id ? "Stop Recording" : "Play Recording"}
                          >
                            {playingId === call.id ? (
                              <Pause className="w-3.5 h-3.5 animate-pulse" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[9px] uppercase font-bold tracking-widest">
                              {playingId === call.id ? "Playing" : "Listen"}
                            </span>
                          </button>
                        )}"""
    
    if target_button in content:
        content = content.replace(target_button, replacement_button)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Target button not found in {filepath}")

print("Success")
