"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle, Clock, Tag, Sparkles, Check, ChevronDown, Smile, Volume2, Square } from "lucide-react";
import { campaignService } from "@/lib/services/campaign.service";

export const EMOTIONS = [
  { type: "happy", label: "Happy", icon: "🙂", description: "Warm, upbeat, and cheerful" },
  { type: "sad", label: "Sad", icon: "😢", description: "Somber, empathetic, and gentle" },
  { type: "fearful", label: "Fearful", icon: "😨", description: "Tense, hurried, and urgent" },
  { type: "disgusted", label: "Disgusted", icon: "🤢", description: "Averse and disapproving" },
  { type: "surprised", label: "Surprised", icon: "😮", description: "Excited, lively, and dynamic" },
  { type: "neutral", label: "Neutral", icon: "😐", description: "Default, balanced, and professional" },
  { type: "fluent", label: "Fluent", icon: "🗣", description: "Articulate, confident, and smooth" },
];

export const EMOTION_VOICE_MODULATION: Record<string, { pitch: number; rate: number }> = {
  happy: { pitch: 1.2, rate: 1.05 },
  sad: { pitch: 0.85, rate: 0.85 },
  fearful: { pitch: 1.25, rate: 1.15 },
  disgusted: { pitch: 0.9, rate: 0.9 },
  surprised: { pitch: 1.35, rate: 1.1 },
  neutral: { pitch: 1.0, rate: 1.0 },
  fluent: { pitch: 1.0, rate: 1.05 },
};

export const SCRIPT_TEMPLATES = [
  {
    id: "solar",
    name: "Solar",
    text: `You are an AI voice agent representing Home Solar Experts. Your role is to conduct a natural, friendly, and professional phone conversation with homeowners regarding a promotional solar consultation program.

IMPORTANT INSTRUCTIONS:
* Speak naturally like a real human sales representative.
* Do not read the entire script at once.
* Ask only one question at a time and wait for the customer's response.
* Follow the conversation flow dynamically based on the customer's answers.
* Do not repeat questions if the customer has already provided the information.
* Handle objections naturally using the objection-handling guidelines below.
* Keep the conversation concise and aim to complete it in approximately 2 minutes.
* Collect and validate all required qualifying information before proceeding.
* Never claim that the customer is qualified until all qualification requirements are met.

CONVERSATION FLOW

1. GREETING
Start the call with:
"Hi, my name is [Agent Name], <break time="0.5s" /> and I'm calling you from Home Solar Experts. How are you today?"
Wait for the customer's response before continuing.

2. REASON FOR THE CALL
After the greeting, explain:
"This is not a sales call. We are currently running a promotional program in your area that provides homeowners with a free consultation to see how they may be able to get solar panels without spending money upfront. Solar panels may help reduce electricity bills and can potentially increase home value as well."
"I just need to collect a few details and check your eligibility for the free consultation. Don't worry, I'll finish the call in less than two minutes."

3. QUALIFICATION PROCESS
Ask the following questions one at a time.

Question 1 – Home Ownership:
"Do you currently own your home, or are you renting?"
Qualification requirement:
* Must own the home.
* If the customer rents the home, they do not qualify.

Question 2 – Property Type and Taxpayer Status:
"Is it a single-residence home, and are you currently a taxpayer?"
Qualification requirements:
* Must be a single-residence home.
* Must be a taxpayer.

Question 3 – Homeowner Name:
"For confirmation, am I speaking with the homeowner? May I have your first and last name, please?"
Collect:
* First Name
* Last Name

Question 4 – ZIP Code:
"To validate your location, could you please confirm your 5-digit ZIP code?"
Validation:
* ZIP code must contain exactly 5 digits.
* If the customer provides an invalid ZIP code, politely ask them to confirm it again.

Question 5 – Monthly Electricity Bill:
"Finally, approximately how much is your monthly electricity bill? Is it more than $150?"
Qualification requirement:
* Monthly electricity bill must be more than $150.

4. QUALIFICATION DECISION
The customer qualifies only if ALL of the following conditions are satisfied:
* Owns the home
* Property is a single-residence home
* Is a taxpayer
* Valid 5-digit ZIP code is provided
* Monthly electricity bill is more than $150

If all requirements are met, say:
"Looks like you qualify! Congratulations!"
Then continue with the appointment process.

If the customer does not meet one or more qualification requirements, politely inform them that they are currently not eligible for the consultation program. Do not continue to the appointment scheduling process.

5. EMAIL AND APPOINTMENT SCHEDULING
For qualified customers, say:
"I'll have my supervisor send you a quote to your email for reference before they come and meet with you in person. May I have your email address, please?"
Collect and confirm the email address.

Then ask for availability:
"What day would work better for you, tomorrow or the day after tomorrow?"
Available appointment hours: 10:00 AM to 7:00 PM.
Offer suitable time options, for example:
"We have slots available between 10 AM and 7 PM. Would you prefer a morning, afternoon, or evening appointment?"
Confirm the selected date and time before ending the call.

6. OBJECTION HANDLING
If customer says "I'm not interested":
"I completely understand. Just to clarify, we're not asking you to buy anything on this call. This program is simply to provide information about solar energy and see whether you may qualify for options that could help reduce your electricity costs. Some homeowners may be able to reduce their monthly electricity expenses by around 40 to 50 percent depending on their situation. It will only take a minute or two to check your eligibility."

If customer says "My roof has issues" or "My roof is old":
"I understand. We have solar engineers and analysts who can assess the condition and suitability of the roof. The roof condition does not necessarily mean you cannot check your eligibility, so let me just verify a few details first."

If customer says "Solar is too expensive":
"Yes, solar systems can be expensive, which is exactly why this program may be helpful. Depending on eligibility and available options, some homeowners may be able to explore programs with little or no upfront cost. That's why I just need to verify a few details to see if you qualify for the free consultation."

7. END CALL RESPONSES
Qualified Customer:
"Perfect! You're all set. I've noted your details, and our supervisor will send the quote information to your email before the appointment. Thank you for your time, and have a great day!"

Not Qualified:
"Thank you for your time. Based on the information provided, it looks like you may not currently qualify for this consultation program. We appreciate your interest, and have a great day!"

Not Interested:
"No problem at all. Thank you for your time. Have a wonderful day!"`,
  },
  {
    id: "aca",
    name: "ACA",
    text: "Hello [Lead Name], <break time=\"0.5s\" /> this is [Agent Name] calling to see if you have qualified for the zero-dollar health insurance coverage under the ACA program. <break time=\"1.0s\" /> How are you doing today?",
  },
  {
    id: "mua",
    name: "MUA",
    text: "Hi [Lead Name], <break time=\"0.5s\" /> this is [Agent Name] calling to follow up on your request for Medicare and Medicare Advantage plan options. <break time=\"1.0s\" /> Do you have a few moments to discuss your coverage?",
  },
  {
    id: "custom",
    name: "Custom (Blank)",
    text: "",
  },
];

interface ScriptStepProps {
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  customScript: string;
  setCustomScript: (v: string) => void;
  parsingPdf: boolean;
  pdfFileName: string | null;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ScriptStep({
  selectedTemplateId,
  onTemplateChange,
  customScript,
  setCustomScript,
  parsingPdf,
  pdfFileName,
  onPdfUpload,
}: ScriptStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSeconds, setCustomSeconds] = useState("2.0");
  const [notification, setNotification] = useState<string | null>(null);
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const emotionMenuRef = useRef<HTMLDivElement>(null);
  const customPauseRef = useRef<HTMLDivElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emotionMenuRef.current && !emotionMenuRef.current.contains(e.target as Node)) {
        setShowEmotionMenu(false);
      }
      if (customPauseRef.current && !customPauseRef.current.contains(e.target as Node)) {
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Inserts text precisely at cursor selection
  const insertAtCursor = (textToInsert: string, notificationMsg?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setCustomScript(customScript ? `${customScript} ${textToInsert}` : textToInsert);
      return;
    }

    const start = textarea.selectionStart ?? customScript.length;
    const end = textarea.selectionEnd ?? customScript.length;
    const currentVal = customScript || "";
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const newVal = before + textToInsert + after;
    setCustomScript(newVal);

    if (notificationMsg) {
      setNotification(notificationMsg);
      setTimeout(() => setNotification(null), 2400);
    }

    // Move cursor right after the inserted tag and refocus
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + textToInsert.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 15);
  };

  const handleInsertPause = (sec: string | number) => {
    const formatted = typeof sec === "number" ? `${sec}s` : (sec.endsWith("s") ? sec : `${sec}s`);
    insertAtCursor(`<break time="${formatted}" />`, `Inserted ${formatted} pause gap at cursor`);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customSeconds);
    if (isNaN(val) || val < 0.1 || val > 10.0) {
      setNotification("Pause duration must be between 0.1s and 10.0s");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const cleanStr = val.toFixed(2).replace(/\.?0+$/, "") || "0.1";
    handleInsertPause(cleanStr);
  };

  const handleInsertEmotion = (emotionType: string) => {
    const textarea = textareaRef.current;
    const tag = `<emotion type="${emotionType}" />`;
    if (!textarea) {
      insertAtCursor(tag, `Inserted ${emotionType} emotion tag`);
      setShowEmotionMenu(false);
      return;
    }

    const start = textarea.selectionStart ?? (customScript || "").length;
    const end = textarea.selectionEnd ?? (customScript || "").length;
    const currentVal = customScript || "";
    const selectedText = currentVal.substring(start, end);

    let textToInsert = tag;
    let nextCursor = start + tag.length;

    if (selectedText.length > 0) {
      textToInsert = `<emotion type="${emotionType}" />${selectedText}<emotion type="neutral" />`;
      nextCursor = start + textToInsert.length;
    }

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    setCustomScript(before + textToInsert + after);

    setNotification(`Applied ${emotionType} emotion`);
    setTimeout(() => setNotification(null), 2400);
    setShowEmotionMenu(false);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    }, 15);
  };

  const stopPreview = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      } catch (e) {}
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setLoadingPreview(false);
  };

  const playBrowserSynthesisFallback = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setNotification("Speech synthesis is not supported in this browser");
      setTimeout(() => setNotification(null), 2400);
      setIsPlayingPreview(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlayingPreview(true);

    const combinedRegex = /(<emotion\s+type=["']?([a-zA-Z]+)["']?\s*\/?>)|(<break\s+time=["']?(\d*\.?\d+)s?["']?\s*\/?>)/gi;
    const segments: Array<{ text: string; emotion: string; pauseAfterMs: number }> = [];
    let currentEmotion = "neutral";
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(textToSpeak)) !== null) {
      const chunk = textToSpeak.substring(lastIdx, match.index).replace(/<[^>]+>/g, "").trim();
      const emotionTag = match[2];
      const breakTag = match[4];

      if (emotionTag) {
        if (chunk) {
          segments.push({ text: chunk, emotion: currentEmotion, pauseAfterMs: 0 });
        }
        currentEmotion = emotionTag.toLowerCase();
      } else if (breakTag) {
        const pauseSec = Math.max(0.1, Math.min(10.0, parseFloat(breakTag) || 0));
        const pauseMs = Math.round(pauseSec * 1000);
        if (chunk) {
          segments.push({ text: chunk, emotion: currentEmotion, pauseAfterMs: pauseMs });
        } else if (segments.length > 0) {
          segments[segments.length - 1].pauseAfterMs += pauseMs;
        } else {
          segments.push({ text: "", emotion: currentEmotion, pauseAfterMs: pauseMs });
        }
      }
      lastIdx = combinedRegex.lastIndex;
    }

    const remaining = textToSpeak.substring(lastIdx).replace(/<[^>]+>/g, "").trim();
    if (remaining) {
      segments.push({ text: remaining, emotion: currentEmotion, pauseAfterMs: 0 });
    }

    if (segments.length === 0) {
      setIsPlayingPreview(false);
      return;
    }

    let segIdx = 0;
    const playNext = () => {
      if (segIdx >= segments.length) {
        setIsPlayingPreview(false);
        return;
      }

      const seg = segments[segIdx++];
      if (!seg.text) {
        if (seg.pauseAfterMs > 0) {
          setTimeout(playNext, seg.pauseAfterMs);
        } else {
          playNext();
        }
        return;
      }

      const cleanText = seg.text.replace(/\[Lead Name\]/gi, "Alex").replace(/\[Agent Name\]/gi, "Sarah");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const mod = EMOTION_VOICE_MODULATION[seg.emotion] || EMOTION_VOICE_MODULATION.neutral;
      utterance.pitch = mod.pitch;
      utterance.rate = mod.rate;

      utterance.onend = () => {
        if (seg.pauseAfterMs > 0) {
          setTimeout(playNext, seg.pauseAfterMs);
        } else {
          playNext();
        }
      };

      utterance.onerror = () => {
        if (seg.pauseAfterMs > 0) {
          setTimeout(playNext, seg.pauseAfterMs);
        } else {
          playNext();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  const handlePreviewScript = async () => {
    if (isPlayingPreview || loadingPreview) {
      stopPreview();
      return;
    }

    const textToSpeak = (customScript || "").trim();
    if (!textToSpeak) {
      setNotification("Please write or select a script to preview");
      setTimeout(() => setNotification(null), 2400);
      return;
    }

    stopPreview();
    setLoadingPreview(true);

    try {
      const res = await campaignService.previewSpeech({
        script: textToSpeak,
        lead_name: "Customer",
        agent_name: "Alex",
      });

      if (res && res.audio_url) {
        const audio = new Audio(res.audio_url);
        previewAudioRef.current = audio;
        setIsPlayingPreview(true);
        setLoadingPreview(false);

        audio.onended = () => {
          setIsPlayingPreview(false);
          previewAudioRef.current = null;
        };

        audio.onerror = () => {
          console.warn("Speech preview audio playback error, falling back to browser synthesis");
          setIsPlayingPreview(false);
          previewAudioRef.current = null;
          playBrowserSynthesisFallback(textToSpeak);
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("Speech preview API failed, using browser synthesis fallback:", err);
    } finally {
      setLoadingPreview(false);
    }

    playBrowserSynthesisFallback(textToSpeak);
  };

  const PAUSE_PRESETS = ["0.25s", "0.5s", "1.0s", "1.5s"];

  return (
    <Card className="p-6 md:p-8 space-y-6 shadow-sm border-gray-200/80 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-indigo-600" /> Step 2: Configure Script
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Design your campaign conversation flow, dynamic lead variables, speech emotions, and exact pause gaps.
          </p>
        </div>
        {notification && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium animate-in fade-in">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Select a Script Template
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {SCRIPT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTemplateChange(t.id)}
                className={`p-3 text-sm font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  selectedTemplateId === t.id
                    ? "bg-indigo-50/90 border-indigo-600 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50/60"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* PDF Script Upload */}
        <div className="bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/30 p-4 rounded-xl border border-indigo-100/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900">Upload Script from PDF</h4>
              <p className="text-xs text-gray-500">Automatically extract text from a PDF document to populate the script box.</p>
            </div>
          </div>
          <div className="shrink-0">
            <input
              type="file"
              accept=".pdf"
              onChange={onPdfUpload}
              className="hidden"
              id="pdf-script-upload"
              disabled={parsingPdf}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("pdf-script-upload")?.click()}
              disabled={parsingPdf}
              className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-semibold shadow-xs"
            >
              {parsingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-600" />
                  Parsing PDF...
                </>
              ) : (
                "Choose PDF File"
              )}
            </Button>
          </div>
        </div>

        {pdfFileName && (
          <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Success! Loaded script text from: <strong>{pdfFileName}</strong></span>
          </div>
        )}

        {/* Script Editor with ElevenLabs-style Pause, Emotion & Tag Toolbar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Edit / Write Campaign Script
            </label>
            <span className="text-[11px] text-gray-400 font-medium">
              Click anywhere in the script to place cursor, then choose pause durations or emotions below.
            </span>
          </div>

          <div className="rounded-xl border border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 overflow-hidden shadow-xs transition-all bg-white">
            <textarea
              ref={textareaRef}
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Hello [Lead Name], <emotion type=&quot;happy&quot; /> welcome! <break time=&quot;0.5s&quot; /> This is [Agent Name] calling from..."
              rows={11}
              className="w-full text-sm font-normal text-gray-800 p-3.5 bg-white border-0 focus:outline-none focus:ring-0 font-mono leading-relaxed resize-y min-h-[220px]"
            />

            {/* Bottom ElevenLabs-style Speech Synthesis Toolbar */}
            <div className="bg-gray-50/90 border-t border-gray-200/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Left Side: Pause duration pills, Emotion dropdown & dynamic tags */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Pause Button Label */}
                <div className="flex items-center gap-1 font-semibold text-gray-700 mr-1 select-none">
                  <span className="font-mono text-indigo-600">&lt;/&gt;</span>
                  <span>Pause:</span>
                </div>

                {/* Quick Pause Preset Pills */}
                {PAUSE_PRESETS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleInsertPause(sec)}
                    title={`Insert ${sec} gap at cursor`}
                    className="px-2.5 py-1 font-medium bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-300 hover:border-indigo-400 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    {sec}
                  </button>
                ))}

                {/* Customize Duration Button & Inline Popover */}
                <div ref={customPauseRef} className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(!showCustomInput);
                      setShowEmotionMenu(false);
                    }}
                    className={`px-2.5 py-1 font-medium rounded-lg border transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95 ${
                      showCustomInput
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    <span>Customize</span>
                    <ChevronDown className={`h-3 w-3 ${showCustomInput ? "rotate-180" : ""}`} />
                  </button>

                  {showCustomInput && (
                    <form
                      onSubmit={handleCustomSubmit}
                      className="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-30 flex items-center gap-2 min-w-[210px] animate-in fade-in zoom-in-95 duration-150"
                    >
                      <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                      <input
                        type="number"
                        min="0.1"
                        max="10.0"
                        step="0.1"
                        value={customSeconds}
                        onChange={(e) => setCustomSeconds(e.target.value)}
                        placeholder="Seconds"
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <span className="text-xs text-gray-500 font-medium">sec</span>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md cursor-pointer transition-colors"
                      >
                        Insert
                      </button>
                    </form>
                  )}
                </div>

                <div className="h-4 w-[1px] bg-gray-300 mx-1 hidden sm:block" />

                {/* Emotion Control Dropdown & Popover */}
                <div ref={emotionMenuRef} className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmotionMenu(!showEmotionMenu);
                      setShowCustomInput(false);
                    }}
                    title="Insert emotion control tag at cursor"
                    className={`px-2.5 py-1 font-medium rounded-lg border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95 ${
                      showEmotionMenu
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    <Smile className={`h-3.5 w-3.5 ${showEmotionMenu ? "text-white" : "text-indigo-600"}`} />
                    <span>Emotion</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showEmotionMenu ? "rotate-180 text-white" : "opacity-70"}`} />
                  </button>

                  {showEmotionMenu && (
                    <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-40 w-64 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                          <Smile className="h-3.5 w-3.5 text-indigo-600" />
                          Speech Emotion
                        </span>
                        <span className="text-[10px] text-gray-400">7 presets</span>
                      </div>
                      <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                        {EMOTIONS.map((emo) => (
                          <button
                            key={emo.type}
                            type="button"
                            onClick={() => handleInsertEmotion(emo.type)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50/80 hover:text-indigo-900 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none">{emo.icon}</span>
                              <div>
                                <div className="font-medium text-gray-800 group-hover:text-indigo-700">{emo.label}</div>
                                <div className="text-[10px] text-gray-400 font-normal leading-tight">{emo.description}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-indigo-600 bg-gray-50 group-hover:bg-indigo-100/60 px-1.5 py-0.5 rounded">
                              &lt;{emo.type}&gt;
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="pt-1.5 border-t border-gray-100 text-[10px] text-gray-400 px-2 text-center">
                        Active until next emotion tag or defaults to neutral
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-4 w-[1px] bg-gray-300 mx-1 hidden sm:block" />

                {/* Dynamic Variable Tags */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertAtCursor("[Lead Name]", "Inserted [Lead Name] variable")}
                    title="Insert customer lead's name"
                    className="px-2 py-1 font-mono text-[11px] bg-white hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 border border-gray-300 hover:border-indigo-400 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    + [Lead Name]
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor("[Agent Name]", "Inserted [Agent Name] variable")}
                    title="Insert AI voice agent's name"
                    className="px-2 py-1 font-mono text-[11px] bg-white hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 border border-gray-300 hover:border-indigo-400 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    + [Agent Name]
                  </button>
                </div>
              </div>

              {/* Right Side: Preview & Character Counter */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviewScript}
                  title={isPlayingPreview ? "Stop speech preview" : "Listen to script speech preview with emotions and pauses"}
                  className={`px-2.5 py-1 rounded-lg border font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    isPlayingPreview
                      ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                      : loadingPreview
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border-gray-300 hover:border-emerald-400"
                  }`}
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                      <span>Generating...</span>
                    </>
                  ) : isPlayingPreview ? (
                    <>
                      <Square className="h-3 w-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Preview</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-gray-500 font-mono text-[11px]">
                  <span>{(customScript || "").length.toLocaleString()}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-400">10,000 characters</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-1 px-1 gap-2">
            <span>
              Tags like <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">&lt;break time=&quot;0.5s&quot; /&gt;</code> and <code className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded">&lt;emotion type=&quot;happy&quot; /&gt;</code> customize voice pacing &amp; tone.
            </span>
            <span>Supports 7 emotions &amp; 0.1s to 10.0s pauses</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
