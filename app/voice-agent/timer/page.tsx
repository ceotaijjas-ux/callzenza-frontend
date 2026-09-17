"use client";

import { Clock, X, LogIn, LogOut, PhoneCall, CheckCircle2, PauseCircle, PlayCircle, History, Download, RefreshCw, Coffee, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatISTTime, getTodayISTDateString } from "@/lib/date-utils";

type Activity = {
  id: string | number;
  type: string;
  label: string;
  time: string;
  timestamp: string;
  duration: string | null;
  icon: any;
  color: string;
  bg: string;
};

const mapActivity = (act: any): Activity => {
  let icon = History;
  let color = "text-slate-500";
  let bg = "bg-slate-50";

  switch (act.type) {
    case "login":
      icon = LogIn; color = "text-emerald-500"; bg = "bg-emerald-50"; break;
    case "logout":
      icon = LogOut; color = "text-slate-500"; bg = "bg-slate-100"; break;
    case "call":
      icon = PhoneCall; color = "text-blue-500"; bg = "bg-blue-50"; break;
    case "dispose":
      icon = CheckCircle2; color = "text-indigo-500"; bg = "bg-indigo-50"; break;
    case "pause":
      icon = PauseCircle; color = "text-amber-500"; bg = "bg-amber-50"; break;
    case "coffee_break":
      icon = Coffee; color = "text-amber-600"; bg = "bg-amber-50"; break;
    case "lunch_break":
      icon = Utensils; color = "text-rose-500"; bg = "bg-rose-50"; break;
    case "resume":
      icon = PlayCircle; color = "text-emerald-500"; bg = "bg-emerald-50"; break;
    default:
      icon = History; color = "text-indigo-500"; bg = "bg-indigo-50"; break;
  }

  // format time from timestamp in Asia/Kolkata (IST)
  const time = formatISTTime(act.timestamp, { hour: '2-digit', minute: '2-digit' });

  return {
    id: act.id,
    type: act.type,
    label: act.label,
    timestamp: act.timestamp,
    time: time,
    duration: act.duration,
    icon, color, bg
  };
};

export default function TimerPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getTodayISTDateString());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/voice/timeline?date=${selectedDate}`);
        if (Array.isArray(data)) {
          setActivities(data.map(mapActivity));
        }
      } catch (e) {
        console.error("Failed to fetch timeline", e);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [selectedDate]);
  
  const handleDownloadCSV = () => {
    const headers = ["ID", "Type", "Activity", "Time", "Duration"];
    const csvContent = [
      headers.join(","),
      ...activities.map(act => [
        act.id,
        act.type,
        `"${act.label}"`,
        `"${act.time}"`,
        `"${act.duration || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agent_timeline_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex h-full animate-in fade-in duration-300 bg-slate-50">
      <div className="flex-1 flex flex-col min-w-0 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-600" />
                Session Timeline
              </h2>
              <p className="text-slate-500 font-medium mt-1">
                Activity log for {selectedDate}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={() => router.push("/voice-agent/dashboard")}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
                title="Close Timeline"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 relative">
            <div className="absolute top-0 bottom-0 left-[41px] md:left-[57px] w-px bg-slate-200" />
            
            <div className="space-y-8 relative">
              {loading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="flex justify-center py-10 text-slate-400 font-medium">
                  No activity recorded for this date.
                </div>
              ) : (
                activities.map((act, index) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex gap-4 md:gap-6 items-start relative z-10">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${act.bg} ${act.color}`}>
                        <Icon className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      
                      <div className="flex-1 pt-1.5 md:pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                          <h3 className="text-base md:text-lg font-bold text-slate-800">
                            {act.label}
                          </h3>
                          <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {act.time}
                          </span>
                        </div>
                        
                        {act.duration && (
                          <p className="text-sm text-slate-500 font-medium mt-1">
                            Duration: <span className="text-slate-700">{act.duration}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-8 flex gap-4 md:gap-6 items-start relative z-10 opacity-50">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white bg-slate-100 text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
               </div>
               <div className="flex-1 pt-2 md:pt-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Session Active...</h3>
               </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
