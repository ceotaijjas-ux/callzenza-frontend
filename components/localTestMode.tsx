"use client";

import { useRef, useState } from "react";

export default function LocalTestMode() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");

  const recognitionRef = useRef<any>(null);

  // your agent/campaign IDs
  const selectedAgentId = 1;
  const campaignId = 1;

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    let langCode = "en-IN";
    if (aiText) {
      if (/[\u0B80-\u0BFF]/.test(aiText)) langCode = "ta-IN";
      else if (/[\u0900-\u097F]/.test(aiText)) langCode = "hi-IN";
      else if (/[\u0C00-\u0C7F]/.test(aiText)) langCode = "te-IN";
      else if (/[\u0D00-\u0D7F]/.test(aiText)) langCode = "ml-IN";
      else if (/[\u0C80-\u0CFF]/.test(aiText)) langCode = "kn-IN";
    }
    recognition.lang = langCode;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setUserText(text);
      setListening(false);
      await sendQuestionToBackend(text);
    };

    recognition.onerror = (event: any) => {
      console.log("Speech error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendQuestionToBackend = async (question: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${baseUrl}/api/rag/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: selectedAgentId,
            campaign_id: campaignId,
            question: question,
          }),
        }
      );

      const data = await response.json();
      setAiText(data.answer);
      speakAnswer(data.answer);
    } catch (error) {
      console.error("RAG API Error:", error);
    }
  };

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

  const speakAnswer = (text: string) => {
    const cleanText = cleanSpeechText(text);
    const speech = new SpeechSynthesisUtterance(cleanText);
    
    const isTamilUnicode = /[\u0B80-\u0BFF]/.test(cleanText);
    const isTanglish = /\b(irukken|irukan|solla|panradhu|pandrathu|aagum|unga|ungaloda|dhaan|nalla|vanakkam|pathi|pesalaam|thavavai|saaptinagala|machan|keetturuka|therinjukanum|mudiyadhu|epdi|eppadi|yeppadi|paarkka|kudukkang|pesa|sariyaana|ennodu|namaskaram)\b/i.test(cleanText);
    const isHindiUnicode = /[\u0900-\u097F]/.test(cleanText);
    const isHinglish = /\b(kaise|kya|nahi|karna|kar|raha|hai|samjh|bataya|apka|aapse|hoga|batao|apne|namaste)\b/i.test(cleanText);

    // Auto-detect language block from text
    if (isTamilUnicode || isTanglish) {
      speech.lang = "ta-IN"; // Tamil / Tanglish
    } else if (isHindiUnicode || isHinglish) {
      speech.lang = "hi-IN"; // Hindi / Hinglish
    } else if (/[\u0C00-\u0C7F]/.test(cleanText)) {
      speech.lang = "te-IN"; // Telugu
    } else if (/[\u0D00-\u0D7F]/.test(cleanText)) {
      speech.lang = "ml-IN"; // Malayalam
    } else if (/[\u0C80-\u0CFF]/.test(cleanText)) {
      speech.lang = "kn-IN"; // Kannada
    } else if (/[\u0980-\u09FF]/.test(cleanText)) {
      speech.lang = "bn-IN"; // Bengali
    } else if (/[\u0A00-\u0A7F]/.test(cleanText)) {
      speech.lang = "pa-IN"; // Punjabi
    } else if (/[\u0A80-\u0AFF]/.test(cleanText)) {
      speech.lang = "gu-IN"; // Gujarati
    } else if (/[\u0B00-\u0B7F]/.test(cleanText)) {
      speech.lang = "or-IN"; // Odia
    } else if (/[\u0600-\u06FF]/.test(cleanText)) {
      speech.lang = "ur-IN"; // Urdu
    } else {
      speech.lang = "en-IN"; // English default
    }

    speech.onend = () => {
      startListening();
    };
    window.speechSynthesis.speak(speech);
  };

  return (
    <div>
      <h2>Local AI Campaign Test</h2>

      <p>
        Status:
        {listening ? " 🎤 Listening..." : " ⏸️ Waiting"}
      </p>

      <p>You: {userText}</p>

      <p>AI: {aiText}</p>

      <button onClick={startListening}>
        🎤 Start Speaking
      </button>
    </div>
  );
}