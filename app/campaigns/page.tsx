"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { campaignService, Campaign, CampaignLead } from "@/lib/services/campaign.service";
import { agentService, Agent } from "@/lib/services/agent.service";
import { leadService, Lead } from "@/lib/services/lead.service";
import { localVoiceTestService, ScriptStepItem } from "@/lib/services/local-voice-test.service";
import {
  Play,
  Pause,
  Plus,
  List,
  Edit2,
  Copy,
  Trash2,
  Phone,
  FileText,
  Bot,
  FolderOpen,
  Calendar,
  Loader2,
  RefreshCw,
  X,
  TrendingUp,
  User,
  Sparkles,
  Check,
  ArrowRight,
  Circle,
  Send,
  Clock,
} from "lucide-react";

function CampaignTimer({ campaign }: { campaign: Campaign }) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!campaign.started_at) return;
    
    const calculateElapsed = () => {
      const start = new Date(campaign.started_at!).getTime();
      let end = Date.now();
      
      if (campaign.status === "COMPLETED" && campaign.completed_at) {
        end = new Date(campaign.completed_at).getTime();
      } else if (campaign.status !== "RUNNING" && campaign.updated_at) {
        // Fallback for paused or other states if we want to freeze it
        end = new Date(campaign.updated_at).getTime();
      }
      
      setElapsed(Math.max(0, Math.floor((end - start) / 1000)));
    };

    calculateElapsed();

    if (campaign.status === "RUNNING") {
      const interval = setInterval(calculateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [campaign.started_at, campaign.completed_at, campaign.updated_at, campaign.status]);

  if (!campaign.started_at) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  
  return (
    <div className="text-xs text-gray-500 mt-1 font-mono flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {mins}m {secs}s
    </div>
  );
}

function VoiceSessionTimer({ startTime }: { startTime: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <div className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-mono font-medium shadow-sm ml-4">
      <Clock className="h-3 w-3 text-emerald-400" />
      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </div>
  );
}

function CampaignsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [systemLeads, setSystemLeads] = useState<Lead[]>([]);
  const [campaignLeadsMapping, setCampaignLeadsMapping] = useState<Record<string, CampaignLead[]>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editTwilioNumber, setEditTwilioNumber] = useState("");
  const [editAgentId, setEditAgentId] = useState("");

  // Local voice testing modal state
  const [activeVoiceCampaign, setActiveVoiceCampaign] = useState<Campaign | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "transcribing" | "thinking" | "speaking">("idle");
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [voiceSessionId, setVoiceSessionId] = useState<string | undefined>(undefined);
  const [currentScriptStep, setCurrentScriptStep] = useState<string>("Greeting");
  const [scriptSteps, setScriptSteps] = useState<ScriptStepItem[]>([]);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [qualificationStatus, setQualificationStatus] = useState<string>("IN_PROGRESS");
  const [typedInputMessage, setTypedInputMessage] = useState<string>("");
  const [voiceSessionStartTime, setVoiceSessionStartTime] = useState<number | null>(null);

  const activeSessionRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const voiceSessionIdRef = useRef<string | undefined>(undefined);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean markdown formatting from spoken speech
  const cleanSpeechText = (raw: string): string => {
    if (!raw) return "";
    return raw
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^[*-]\s+/gm, "")
      .replace(/[*_#`~]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Play voice helper with support for physical pause gaps, emotion modulation & markdown stripping
  const playVoiceResponse = (text: string, onEndCallback: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    // Stop recognition if it's currently running to avoid feedback loop
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn("Error aborting recognition:", e);
      }
    }

    const EMOTION_VOICE_MODULATION: Record<string, { pitch: number; rate: number }> = {
      happy: { pitch: 1.2, rate: 1.05 },
      sad: { pitch: 0.85, rate: 0.85 },
      fearful: { pitch: 1.25, rate: 1.15 },
      disgusted: { pitch: 0.9, rate: 0.9 },
      surprised: { pitch: 1.35, rate: 1.1 },
      neutral: { pitch: 1.0, rate: 1.0 },
      fluent: { pitch: 1.0, rate: 1.05 },
    };

    const combinedRegex = /(<emotion\s+type=["']?([a-zA-Z]+)["']?\s*\/?>)|(<break\s+time=["']?(\d*\.?\d+)s?["']?\s*\/?>|\[pause:?\s*(\d*\.?\d+)s?\])/gi;
    const segments: Array<{ text: string; emotion: string; pauseAfterMs: number }> = [];
    let currentEmotion = "neutral";
    let lastIdx = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      const rawChunk = text.substring(lastIdx, match.index).replace(/<[^>]+>/g, "").trim();
      const chunkText = cleanSpeechText(rawChunk);
      const emotionTag = match[2];
      const pauseSec = parseFloat(match[4] || match[5] || "0");
      const pauseMs = Math.max(0, Math.round(pauseSec * 1000));

      if (emotionTag) {
        if (chunkText) {
          segments.push({ text: chunkText, emotion: currentEmotion, pauseAfterMs: 0 });
        }
        currentEmotion = emotionTag.toLowerCase();
      } else if (pauseMs > 0 || match[3]) {
        if (chunkText) {
          segments.push({ text: chunkText, emotion: currentEmotion, pauseAfterMs: pauseMs });
        } else if (segments.length > 0) {
          segments[segments.length - 1].pauseAfterMs += pauseMs;
        } else if (pauseMs > 0) {
          segments.push({ text: "", emotion: currentEmotion, pauseAfterMs: pauseMs });
        }
      }
      lastIdx = combinedRegex.lastIndex;
    }

    const trailingRaw = text.substring(lastIdx).replace(/<[^>]+>/g, "").trim();
    const trailingText = cleanSpeechText(trailingRaw);
    if (trailingText) {
      segments.push({ text: trailingText, emotion: currentEmotion, pauseAfterMs: 0 });
    }

    if (segments.length === 0) {
      const cleanAll = cleanSpeechText(text.replace(/<[^>]+>/g, "").trim());
      segments.push({ text: cleanAll, emotion: "neutral", pauseAfterMs: 0 });
    }

    let segmentIndex = 0;

    const playNext = () => {
      if (!activeSessionRef.current) return;
      if (segmentIndex >= segments.length) {
        setTimeout(onEndCallback, 400);
        return;
      }

      const segment = segments[segmentIndex];
      segmentIndex++;

      if (!segment.text) {
        if (segment.pauseAfterMs > 0) {
          setVoiceStatus("speaking");
          pauseTimerRef.current = setTimeout(() => {
            playNext();
          }, segment.pauseAfterMs);
        } else {
          playNext();
        }
        return;
      }

      setVoiceStatus("speaking");
      const utterance = new SpeechSynthesisUtterance(segment.text);
      const mod = EMOTION_VOICE_MODULATION[segment.emotion] || EMOTION_VOICE_MODULATION.neutral;
      utterance.pitch = mod.pitch;
      utterance.rate = mod.rate;
      
      const isTamilUnicode = /[\u0B80-\u0BFF]/.test(segment.text);
      const isTanglish = /\b(irukken|irukan|solla|panradhu|pandrathu|aagum|unga|ungaloda|dhaan|nalla|vanakkam|pathi|pesalaam|thavavai|saaptinagala|machan|keetturuka|therinjukanum|mudiyadhu|epdi|eppadi|yeppadi|paarkka|kudukkang|pesa|sariyaana|ennodu|namaskaram)\b/i.test(segment.text);
      const isHindiUnicode = /[\u0900-\u097F]/.test(segment.text);
      const isHinglish = /\b(kaise|kya|nahi|karna|kar|raha|hai|samjh|bataya|apka|aapse|hoga|batao|apne|namaste)\b/i.test(segment.text);

      // Auto-detect language block from text
      if (isTamilUnicode || isTanglish) {
        utterance.lang = "ta-IN"; // Tamil / Tanglish
      } else if (isHindiUnicode || isHinglish) {
        utterance.lang = "hi-IN"; // Hindi / Hinglish
      } else if (/[\u0C00-\u0C7F]/.test(segment.text)) {
        utterance.lang = "te-IN"; // Telugu
      } else if (/[\u0D00-\u0D7F]/.test(segment.text)) {
        utterance.lang = "ml-IN"; // Malayalam
      } else if (/[\u0C80-\u0CFF]/.test(segment.text)) {
        utterance.lang = "kn-IN"; // Kannada
      } else if (/[\u0980-\u09FF]/.test(segment.text)) {
        utterance.lang = "bn-IN"; // Bengali
      } else if (/[\u0A00-\u0A7F]/.test(segment.text)) {
        utterance.lang = "pa-IN"; // Punjabi
      } else if (/[\u0A80-\u0AFF]/.test(segment.text)) {
        utterance.lang = "gu-IN"; // Gujarati
      } else if (/[\u0B00-\u0B7F]/.test(segment.text)) {
        utterance.lang = "or-IN"; // Odia
      } else if (/[\u0600-\u06FF]/.test(segment.text)) {
        utterance.lang = "ur-IN"; // Urdu
      } else {
        utterance.lang = "en-IN"; // English default
      }

      utterance.onend = () => {
        if (!activeSessionRef.current) return;
        if (segment.pauseAfterMs > 0) {
          // PHYSICAL PAUSE GAP
          setVoiceStatus("speaking");
          pauseTimerRef.current = setTimeout(() => {
            playNext();
          }, segment.pauseAfterMs);
        } else {
          playNext();
        }
      };
      utterance.onerror = (e) => {
        if (!activeSessionRef.current) return;
        if (segment.pauseAfterMs > 0) {
          pauseTimerRef.current = setTimeout(() => {
            playNext();
          }, segment.pauseAfterMs);
        } else {
          playNext();
        }
      };
      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  // Listen helper
  const initiateListening = (campaignId: string) => {
    if (!activeSessionRef.current) return;

    // Prevent listening if speech synthesis is currently active/speaking
    if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const campaign = campaigns.find(c => c.id === campaignId || c.agent_id === campaignId);
    let langCode = "ta-IN";
    if (campaign && campaign.schedule && campaign.schedule.default_language) {
      const lang = campaign.schedule.default_language;
      if (lang === "ta") langCode = "ta-IN";
      else if (lang === "hi") langCode = "hi-IN";
      else if (lang === "te") langCode = "te-IN";
      else if (lang === "ml") langCode = "ml-IN";
      else if (lang === "kn") langCode = "kn-IN";
      else if (lang === "bn") langCode = "bn-IN";
      else if (lang === "pa") langCode = "pa-IN";
      else if (lang === "gu") langCode = "gu-IN";
      else if (lang === "or") langCode = "or-IN";
      else if (lang === "ur") langCode = "ur-IN";
      else if (lang === "en") langCode = "en-IN";
    } else {
      // Auto-detect based on last AI text if available
      const lastAiMsg = voiceTranscript.findLast(m => m.sender === "ai");
      if (lastAiMsg) {
        const text = lastAiMsg.text;
        const isTam = /[\u0B80-\u0BFF]/.test(text) || /\b(irukken|irukan|solla|panradhu|pandrathu|aagum|unga|ungaloda|dhaan|nalla|vanakkam|pathi|pesalaam|thavavai|saaptinagala|machan|keetturuka|therinjukanum|mudiyadhu|epdi|eppadi|yeppadi)\b/i.test(text);
        const isHin = /[\u0900-\u097F]/.test(text) || /\b(kaise|kya|nahi|karna|kar|raha|hai|samjh|bataya|apka|aapse|hoga|batao|apne|namaste)\b/i.test(text);
        if (isTam) langCode = "ta-IN";
        else if (isHin) langCode = "hi-IN";
        else if (/[\u0C00-\u0C7F]/.test(text)) langCode = "te-IN";
        else if (/[\u0D00-\u0D7F]/.test(text)) langCode = "ml-IN";
        else if (/[\u0C80-\u0CFF]/.test(text)) langCode = "kn-IN";
      }
    }
    
    recognition.lang = langCode;
    
    recognition.onstart = () => {
      if (activeSessionRef.current) {
        setVoiceStatus("listening");
      }
    };
    
    recognition.onerror = (event: any) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech recognition event:", event.error);
      }
      if (!activeSessionRef.current) return;

      // Automatically restart listening on any temporary error (aborted, no-speech, etc.)
      setTimeout(() => {
        if (activeSessionRef.current) {
          initiateListening(campaignId);
        }
      }, 500);
    };

    recognition.onend = () => {
      if (!activeSessionRef.current) return;
      // Restart listening if SpeechRecognition stopped and synthesis is not speaking
      setTimeout(() => {
        if (activeSessionRef.current && typeof window !== "undefined" && !window.speechSynthesis.speaking) {
          initiateListening(campaignId);
        }
      }, 400);
    };
    
    recognition.onresult = async (event: any) => {
      if (!activeSessionRef.current) return;

      const result = event.results[0];
      if (!result.isFinal) return;

      const text = result[0].transcript;
      if (!text.trim()) return;

      handleSendVoiceTestMessage(text);
    };

    try {
      recognition.start();
      setRecognitionInstance(recognition);
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Error starting speech recognition:", e);
    }
  };

  const handleSendVoiceTestMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !voiceSessionIdRef.current || !activeSessionRef.current) return;

    setVoiceTranscript((prev) => [...prev, { sender: "user", text: textToSend }]);
    setVoiceStatus("thinking");

    try {
      const data = await localVoiceTestService.sendMessage(voiceSessionIdRef.current, textToSend);
      if (!activeSessionRef.current) return;

      setCurrentScriptStep(data.current_step);
      setScriptSteps(data.script_steps);
      setCollectedData(data.collected_data);
      setQualificationStatus(data.qualification_status);

      const reply = data.response;
      setVoiceTranscript((prev) => [...prev, { sender: "ai", text: reply }]);

      playVoiceResponse(reply, () => {
        if (activeSessionRef.current && activeVoiceCampaign) {
          initiateListening(activeVoiceCampaign.id);
        }
      });
    } catch (err: any) {
      console.warn("Error processing local voice test message:", err);
      if (activeSessionRef.current) {
        setVoiceStatus("listening");
      }
    }
  };

  const startLocalVoiceSession = async (campaign: Campaign) => {
    activeSessionRef.current = true;
    setActiveVoiceCampaign(campaign);
    setVoiceStatus("thinking");
    setVoiceSessionStartTime(Date.now());

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    setVoiceTranscript([{ sender: "ai", text: "Initializing Local Voice Test & Loading Campaign Script..." }]);
    setVoiceSessionId(undefined);
    voiceSessionIdRef.current = undefined;

    try {
      const data = await localVoiceTestService.start(campaign.id);
      setVoiceSessionId(data.session_id);
      voiceSessionIdRef.current = data.session_id;
      setCurrentScriptStep(data.current_step || "Greeting");
      setScriptSteps(data.script_steps || []);
      setCollectedData(data.collected_data || {});
      setQualificationStatus(data.qualification_status || "IN_PROGRESS");

      const greeting = data.greeting || (data as any).initial_message || "Hello! How can I assist you today?";
      setVoiceTranscript([{ sender: "ai", text: greeting }]);

      playVoiceResponse(greeting, () => {
        if (activeSessionRef.current) {
          initiateListening(campaign.id);
        }
      });
    } catch (err: any) {
      console.warn("Failed to start script-based local voice test session:", err);
      setError(err.message || "Failed to start local voice test");
      stopLocalVoiceSession();
    }
  };

  const stopLocalVoiceSession = () => {
    if (voiceSessionIdRef.current) {
      localVoiceTestService.end(voiceSessionIdRef.current).catch(() => {});
    }
    activeSessionRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (recognitionInstance) {
      try {
        recognitionInstance.abort();
      } catch (e) {}
    }
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveVoiceCampaign(null);
    setVoiceStatus("idle");
    setVoiceTranscript([]);
    setRecognitionInstance(null);
    setVoiceSessionId(undefined);
    voiceSessionIdRef.current = undefined;
    setTypedInputMessage("");
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsList, agentsList, leadsList] = await Promise.all([
        campaignService.list(),
        agentService.list(),
        leadService.list(),
      ]);

      setCampaigns(campaignsList);
      setAgents(agentsList);
      setSystemLeads(leadsList);

      // Fetch campaign leads in parallel
      const leadsMap: Record<string, CampaignLead[]> = {};
      await Promise.all(
        campaignsList.map(async (c) => {
          try {
            const cLeads = await campaignService.getLeads(c.id);
            leadsMap[c.id] = cLeads;
          } catch (e) {
            leadsMap[c.id] = [];
          }
        })
      );
      setCampaignLeadsMapping(leadsMap);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const runTestingCampaignId = searchParams.get("run_testing");
    if (runTestingCampaignId) {
      campaignService
        .get(runTestingCampaignId)
        .then((campaign: any) => {
          if (campaign) {
            window.history.replaceState({}, "", "/campaigns");
            startLocalVoiceSession(campaign);
          }
        })
        .catch((err: any) => {
          console.warn("Failed to fetch testing campaign by ID:", err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleStart = async (id: string) => {
    try {
      await campaignService.startDialer(id);
      loadData();
    } catch (err: any) {
      try {
        await campaignService.start(id);
        loadData();
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || err.message);
      }
    }
  };

  const handlePause = async (id: string) => {
    try {
      await campaignService.pauseDialer(id);
      loadData();
    } catch (err: any) {
      try {
        await campaignService.pause(id);
        loadData();
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || err.message);
      }
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    setLoading(true);
    try {
      const cLeads = campaignLeadsMapping[campaign.id] || [];
      await campaignService.create({
        name: `Copy of ${campaign.name}`,
        agent_id: campaign.agent_id,
        twilio_number: campaign.twilio_number,
        lead_ids: cLeads.map((l) => l.lead_id),
        schedule: campaign.schedule ? { ...campaign.schedule } : undefined,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to duplicate campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) return;
    try {
      await campaignService.remove(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete campaign");
    }
  };

  const handleOpenEdit = (campaign: Campaign) => {
    router.push(`/campaigns/new?edit=${campaign.id}`);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;
    setError(null);
    try {
      await campaignService.update(editingCampaign.id, {
        name: editName,
        twilio_number: editTwilioNumber,
        agent_id: editAgentId,
      });
      setEditingCampaign(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save edits");
    }
  };

  const getMetrics = (campaignId: string) => {
    const cLeads = campaignLeadsMapping[campaignId] || [];
    const total = cLeads.length;

    let completed = 0;
    let connected = 0;
    let qualified = 0;
    let failed = 0;

    cLeads.forEach((cl) => {
      if (cl.status !== "PENDING" && cl.status !== "CALLING") {
        completed++;
      }
      if (cl.status === "COMPLETED") {
        connected++;
      }
      if (cl.status === "FAILED") {
        failed++;
      }

      const lead = systemLeads.find((l) => l.id === cl.lead_id);
      if (lead) {
        if (lead.qualification_status === "QUALIFIED" || lead.qualification_status === "SUCCESS") {
          qualified++;
        }
      }
    });

    return { total, completed, connected, qualified, failed };
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Calling Campaigns <TrendingUp className="h-6 w-6 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure and monitor outbound calling campaigns</p>
        </div>
        <div className="flex gap-2">
          <Link href="/campaigns/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm gap-1">
              <Plus className="h-4 w-4" /> Create Campaign
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="border-gray-250">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 mb-6 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main campaigns table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && campaigns.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Fetching campaigns list...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto space-y-4">
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-indigo-100">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">No campaigns active</h3>
            <p className="text-sm text-gray-500">Create an outbound dialing campaign to automatically follow up and qualify spreadsheet leads.</p>
            <Link href="/campaigns/new" className="inline-block pt-2">
              <Button className="bg-indigo-600 text-white">Create Campaign Now</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/75 text-gray-500 border-b border-gray-150 font-semibold">
                <tr>
                  <th className="px-6 py-4">Campaign details</th>
                  <th className="px-6 py-4">AI Agent / Library</th>
                  <th className="px-6 py-4">Calling Script</th>
                  <th className="px-6 py-4">Call Metrics</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {campaigns.filter(c => c.status === "RUNNING" || c.status === "PAUSED").map((campaign) => {
                  const agentName = agents.find((a) => a.id === campaign.agent_id)?.name || "Default Agent";
                  const metrics = getMetrics(campaign.id);
                  const scriptSnippet = campaign.schedule?.script
                    ? campaign.schedule.script.substring(0, 50) + "..."
                    : "No Script configured / Default";
                  
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 space-y-1">
                        <div 
                          className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => router.push(`/campaigns/new?edit=${campaign.id}&step=6`)}
                          title="Click to Review Campaign"
                        >
                          {campaign.name}
                        </div>
                        <div className="text-xs text-gray-400 font-normal">
                          Twilio caller ID: <span className="font-mono text-gray-500">{campaign.twilio_number || "Default"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 font-normal">
                          <Calendar className="h-3 w-3" />
                          {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-indigo-700">
                          <Bot className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{agentName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                          <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{campaign.schedule?.lead_library_name || "Custom Library"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">
                        <div className="flex items-start gap-1">
                          <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                          <span className="italic">{scriptSnippet}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs w-[130px]">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 font-semibold">Total:</span>
                            <span className="text-gray-900 font-bold">{metrics.total}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-500 font-semibold">Done:</span>
                            <span className="text-blue-700 font-bold">{metrics.completed}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-600 font-semibold">Connected:</span>
                            <span className="text-emerald-800 font-bold">{metrics.connected}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-600 font-semibold">Qualified:</span>
                            <span className="text-purple-800 font-bold">{metrics.qualified}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-rose-500 font-semibold">Failed:</span>
                            <span className="text-rose-700 font-bold">{metrics.failed}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            className={`font-semibold border-none ${
                              campaign.status === "RUNNING"
                                ? "bg-green-50 text-green-700 hover:bg-green-50"
                                : campaign.status === "PAUSED"
                                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-50"
                                : campaign.status === "COMPLETED"
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {campaign.status}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-extrabold border-none px-2 py-0.5 rounded-full ${
                              campaign.auto_dial_enabled || campaign.status === "RUNNING"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            PD: {campaign.auto_dial_enabled || campaign.status === "RUNNING" ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </div>
                        <CampaignTimer campaign={campaign} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {campaign.status === "RUNNING" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-yellow-600 hover:bg-yellow-50"
                              title="Pause Campaign"
                              onClick={() => handlePause(campaign.id)}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:bg-green-50"
                              title="Start Campaign"
                              onClick={() => handleStart(campaign.id)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                            title="Local Voice Test"
                            onClick={() => startLocalVoiceSession(campaign)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Link href={`/campaigns/${campaign.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                              title="View Leads"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                            title="Edit Campaign"
                            onClick={() => handleOpenEdit(campaign)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                            title="Duplicate Campaign"
                            onClick={() => handleDuplicate(campaign)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Campaign"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Edit campaign settings</h3>
              <button
                onClick={() => setEditingCampaign(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Autumn Retention Drive"
                  className="font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Twilio Caller ID</label>
                <Input
                  value={editTwilioNumber}
                  onChange={(e) => setEditTwilioNumber(e.target.value)}
                  placeholder="e.g. +1234567890"
                  className="font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Calling Agent</label>
                <select
                  value={editAgentId}
                  onChange={(e) => setEditAgentId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium focus:ring-1 focus:ring-indigo-500"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (ID: {a.id.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-150 flex justify-end gap-2 bg-gray-50/50">
              <Button variant="ghost" onClick={() => setEditingCampaign(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeVoiceCampaign && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col h-[680px] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">Local Voice Testing</h3>
                    <VoiceSessionTimer startTime={voiceSessionStartTime} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      qualificationStatus === "QUALIFIED" ? "bg-emerald-100 text-emerald-800" :
                      qualificationStatus === "UNQUALIFIED" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800"
                    }`}>
                      ● {qualificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Campaign: <strong>{activeVoiceCampaign.name}</strong></p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={stopLocalVoiceSession} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Script Progress Section */}
            <div className="bg-slate-50 border-b border-slate-200/60 px-6 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Script Progress
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  Current Stage: {currentScriptStep || "Greeting"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {scriptSteps.map((stepItem, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                      stepItem.status === "DONE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : stepItem.status === "CURRENT"
                        ? "bg-indigo-600 text-white font-bold shadow-sm"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    {stepItem.status === "DONE" && <Check className="h-3 w-3 text-emerald-600" />}
                    {stepItem.status === "CURRENT" && <ArrowRight className="h-3 w-3 text-white animate-pulse" />}
                    {stepItem.status === "PENDING" && <Circle className="h-2.5 w-2.5 text-slate-300" />}
                    <span>{stepItem.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Status Indicator / Mic Waveform */}
            <div className="p-4 flex items-center justify-center gap-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/20 via-white to-indigo-50/20">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow transition-all ${
                voiceStatus === "listening" ? "bg-indigo-600 scale-105" :
                voiceStatus === "speaking" ? "bg-emerald-600" :
                voiceStatus === "thinking" ? "bg-amber-500 animate-bounce" : "bg-gray-400"
              }`}>
                {voiceStatus === "listening" ? <Phone className="h-4 w-4" /> :
                 voiceStatus === "speaking" ? <Sparkles className="h-4 w-4" /> :
                 voiceStatus === "thinking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-800">
                  {voiceStatus === "listening" ? "Listening to your voice..." :
                   voiceStatus === "speaking" ? "AI is speaking..." :
                   voiceStatus === "thinking" ? "Gemini LLM reasoning & searching script..." : "Connecting..."}
                </p>
              </div>
            </div>

            {/* Transcript Chat Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {voiceTranscript.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 items-start ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`p-2 rounded-full border ${msg.sender === "user" ? "bg-indigo-600 border-indigo-700" : "bg-white border-gray-200"}`}>
                    {msg.sender === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-gray-600" />}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white font-medium rounded-tr-none shadow-sm"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-150 shadow-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Controls: Text Input & End Session */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
              <Input
                value={typedInputMessage}
                onChange={(e) => setTypedInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && typedInputMessage.trim()) {
                    const msg = typedInputMessage;
                    setTypedInputMessage("");
                    handleSendVoiceTestMessage(msg);
                  }
                }}
                placeholder="Type a response or speak into your mic..."
                className="text-xs font-medium"
              />
              <Button
                type="button"
                disabled={!typedInputMessage.trim()}
                onClick={() => {
                  const msg = typedInputMessage;
                  setTypedInputMessage("");
                  handleSendVoiceTestMessage(msg);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4"
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Send
              </Button>
              <Button
                onClick={stopLocalVoiceSession}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 shrink-0"
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={null}>
      <CampaignsPageContent />
    </Suspense>
  );
}
