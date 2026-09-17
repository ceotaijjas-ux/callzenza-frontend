"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { campaignService } from "@/lib/services/campaign.service";
import { agentService, Agent } from "@/lib/services/agent.service";
import { expertService, Expert as HumanExpert } from "@/lib/services/expert.service";
import { voiceAgentService } from "@/lib/services/voice-agent.service";
import { leadGroupService, LeadGroup } from "@/lib/services/lead-group.service";
import { leadService, Lead } from "@/lib/services/lead.service";
import { clientService, Client as ClientModel } from "@/lib/services/client.service";
import { CampaignStepper } from "./CampaignStepper";
import { BasicInfoStep } from "./BasicInfoStep";
import { ScriptStep, SCRIPT_TEMPLATES } from "./ScriptStep";
import { AgentStep } from "./AgentStep";
import { LeadsStep } from "./LeadsStep";
import { CallingConfigStep } from "./CallingConfigStep";
import { ReviewStep } from "./ReviewStep";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Play, Save, Sparkles } from "lucide-react";

interface CampaignCreateFlowProps {
  redirectPath?: string;
  role?: "ADMIN" | "USER";
  campaignId?: string;
}

export function CampaignCreateFlow({ redirectPath = "/campaigns", role, campaignId: propCampaignId }: CampaignCreateFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCampaignId = searchParams.get("edit") || propCampaignId || undefined;
  const isEditMode = Boolean(editCampaignId);

  const initialStepParam = searchParams.get("step");
  const initialStep = initialStepParam ? parseInt(initialStepParam, 10) : 1;
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const nextStep = () => {
    setError(null);
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Backend state lists
  const [agents, setAgents] = useState<Agent[]>([]);
  const [voiceAgents, setVoiceAgents] = useState<HumanExpert[]>([]);
  const [leadLibraries, setLeadLibraries] = useState<LeadGroup[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [customObjective, setCustomObjective] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("auto");
  const [dialerType, setDialerType] = useState<"AUTO" | "MANUAL">("AUTO");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Step 2: Script
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [parsingPdf, setParsingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileUrl, setPdfFileUrl] = useState<string | null>(null);

  // Step 3: Agent Selection & Mode
  const [callingAgentMode, setCallingAgentMode] = useState<"AI" | "VOICE">("AI");
  const [agentId, setAgentId] = useState("");
  const [voiceAgentId, setVoiceAgentId] = useState("");
  const [autoDialRatio, setAutoDialRatio] = useState("1:1");
  const [agentGender, setAgentGender] = useState("female");
  const [previewingVoice, setPreviewingVoice] = useState(false);

  // Step 4: Leads Selection State
  const [leadSelectionMode, setLeadSelectionMode] = useState<"ALL" | "LIBRARY" | "MANUAL">("ALL");
  const [libraryId, setLibraryId] = useState("");
  const [libraryLeadsCount, setLibraryLeadsCount] = useState(0);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Step 5: Calling Config
  const [callingMode, setCallingMode] = useState("twilio");
  const [twilioNumber, setTwilioNumber] = useState("");
  const [callingHours, setCallingHours] = useState("09:00-18:00");
  const [timezone, setTimezone] = useState("Local");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [retryDelay, setRetryDelay] = useState("60");
  const [concurrency, setConcurrency] = useState("1");

  useEffect(() => {
    Promise.all([
      agentService.list().catch(() => []),
      expertService.list().catch(() => []),
      voiceAgentService.list().catch(() => []),
      leadGroupService.list().catch(() => []),
      leadService.list().catch(() => []),
      campaignService.getTwilioNumber().catch(() => ({ twilio_phone_number: "", configured: false })),
      clientService.list().catch(() => []),
    ])
      .then(([a, e, va, g, l, t, c]) => {
        setAgents(a);
        const mergedVoice = [...e];
        for (const v of va) {
          if (!mergedVoice.some((x) => x.id === v.id || x.email === v.email)) {
            mergedVoice.push(v);
          }
        }
        setVoiceAgents(mergedVoice);
        setLeadLibraries(g);
        setAllLeads(l);
        setClients(c);
        if (l.length > 0) {
          setSelectedLeadIds(l.map((x) => x.id));
        }
        if (g.length > 0) {
          setLibraryId(g[0].id);
          setLibraryLeadsCount(g[0].lead_count);
        } else if (l.length > 0) {
          setLeadSelectionMode("ALL");
        }
        if (t.twilio_phone_number) {
          setTwilioNumber(t.twilio_phone_number);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // Load existing campaign data when editing
  useEffect(() => {
    if (editCampaignId) {
      Promise.all([
        campaignService.get(editCampaignId).catch(() => null),
        campaignService.getLeads(editCampaignId).catch(() => []),
      ]).then(([camp, cLeads]) => {
        if (camp) {
          setName(camp.name || "");
          if (camp.client_id) setClientId(camp.client_id);
          if (camp.schedule) {
            setDescription(camp.schedule.description || "");
            if (camp.schedule.objective) {
              if (["Solar", "Insurance", "Real Estate", "SaaS"].includes(camp.schedule.objective)) {
                setObjective(camp.schedule.objective);
              } else {
                setObjective("Custom");
                setCustomObjective(camp.schedule.objective);
              }
            }
            if (camp.schedule.default_language) setDefaultLanguage(camp.schedule.default_language);
            if (camp.schedule.script) setCustomScript(camp.schedule.script);
            if (camp.schedule.pdf_filename) setPdfFileName(camp.schedule.pdf_filename);
            if (camp.schedule.pdf_url) setPdfFileUrl(camp.schedule.pdf_url);
            if (camp.schedule.agent_gender) setAgentGender(camp.schedule.agent_gender);
            if (camp.schedule.calling_mode) setCallingMode(camp.schedule.calling_mode);
            if (camp.schedule.calling_hours) setCallingHours(camp.schedule.calling_hours);
            if (camp.schedule.timezone) setTimezone(camp.schedule.timezone);
            if (camp.schedule.max_attempts) setMaxAttempts(String(camp.schedule.max_attempts));
            if (camp.schedule.retry_delay) setRetryDelay(String(camp.schedule.retry_delay));
            if (camp.schedule.concurrency) setConcurrency(String(camp.schedule.concurrency));
          }
          if (camp.calling_mode) setCallingAgentMode(camp.calling_mode);
          if (camp.agent_type) setCallingAgentMode(camp.agent_type === "AI_VOICE" ? "AI" : "VOICE");
          if (camp.client_name) setClientName(camp.client_name);
          if (camp.client_phone) setClientPhone(camp.client_phone);
          if (camp.agent_id) setAgentId(camp.agent_id);
          if (camp.voice_agent_id) setVoiceAgentId(camp.voice_agent_id);
          if (camp.twilio_number) setTwilioNumber(camp.twilio_number);
          if (cLeads && cLeads.length > 0) {
            setSelectedLeadIds(cLeads.map((x) => x.lead_id));
            setLeadSelectionMode("MANUAL");
          }
        }
      });
    }
  }, [editCampaignId]);

  // Load generic draft state
  useEffect(() => {
    if (typeof window !== "undefined" && !editCampaignId) {
      const draftStr = localStorage.getItem("campaign_generic_draft");
      if (draftStr) {
        try {
          const parsed = JSON.parse(draftStr);
          if (parsed.name) setName(parsed.name);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.objective) setObjective(parsed.objective);
          if (parsed.customObjective) setCustomObjective(parsed.customObjective);
          if (parsed.defaultLanguage) setDefaultLanguage(parsed.defaultLanguage);
          if (parsed.clientId) setClientId(parsed.clientId);
          if (parsed.clientName) setClientName(parsed.clientName);
          if (parsed.clientPhone) setClientPhone(parsed.clientPhone);

          if (parsed.callingAgentMode) setCallingAgentMode(parsed.callingAgentMode);
          if (parsed.agentId) setAgentId(parsed.agentId);
          if (parsed.voiceAgentId) setVoiceAgentId(parsed.voiceAgentId);
          if (parsed.autoDialRatio) setAutoDialRatio(parsed.autoDialRatio);
          if (parsed.agentGender) setAgentGender(parsed.agentGender);

          if (parsed.leadSelectionMode) setLeadSelectionMode(parsed.leadSelectionMode);
          if (parsed.libraryId) setLibraryId(parsed.libraryId);
          if (parsed.selectedLeadIds) setSelectedLeadIds(parsed.selectedLeadIds);

          if (parsed.callingMode) setCallingMode(parsed.callingMode);
          if (parsed.twilioNumber) setTwilioNumber(parsed.twilioNumber);
          if (parsed.callingHours) setCallingHours(parsed.callingHours);
          if (parsed.timezone) setTimezone(parsed.timezone);
          if (parsed.maxAttempts) setMaxAttempts(parsed.maxAttempts);
          if (parsed.retryDelay) setRetryDelay(parsed.retryDelay);
          if (parsed.concurrency) setConcurrency(parsed.concurrency);
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      }
    }
    setIsDraftLoaded(true);
  }, [editCampaignId]);

  // Save generic draft state (excluding step so user always starts at Step 1: Basic Info)
  useEffect(() => {
    if (isDraftLoaded && !editCampaignId) {
      const draft = {
        name, description, objective, customObjective, defaultLanguage, clientId, clientName, clientPhone,
        callingAgentMode, agentId, voiceAgentId, autoDialRatio, agentGender,
        leadSelectionMode, libraryId, selectedLeadIds,
        callingMode, twilioNumber, callingHours, timezone, maxAttempts, retryDelay, concurrency,
      };
      localStorage.setItem("campaign_generic_draft", JSON.stringify(draft));
    }
  }, [
    name, description, objective, customObjective, defaultLanguage, clientId, clientName, clientPhone,
    callingAgentMode, agentId, voiceAgentId, autoDialRatio, agentGender,
    leadSelectionMode, libraryId, selectedLeadIds,
    callingMode, twilioNumber, callingHours, timezone, maxAttempts, retryDelay, concurrency,
    isDraftLoaded, editCampaignId
  ]);

  // Ensure CREATE mode starts at Step 1: Basic Info and resets script template
  useEffect(() => {
    if (!editCampaignId) {
      if (!initialStepParam) {
        setStep(1);
      }
      setSelectedTemplateId("");
      setCustomScript("");
      setPdfFileName(null);
      setPdfFileUrl(null);
    }
  }, [editCampaignId, initialStepParam]);

  useEffect(() => {
    if (selectedTemplateId && !editCampaignId) {
      localStorage.setItem(`campaign_new_script_${selectedTemplateId}`, customScript);
    }
  }, [customScript, selectedTemplateId, editCampaignId]);

  useEffect(() => {
    if (selectedTemplateId && !editCampaignId) {
      if (pdfFileName !== null) {
        localStorage.setItem(`campaign_new_pdf_name_${selectedTemplateId}`, pdfFileName);
      } else {
        localStorage.removeItem(`campaign_new_pdf_name_${selectedTemplateId}`);
      }
    }
  }, [pdfFileName, selectedTemplateId, editCampaignId]);

  useEffect(() => {
    if (selectedTemplateId && !editCampaignId) {
      if (pdfFileUrl !== null) {
        localStorage.setItem(`campaign_new_pdf_url_${selectedTemplateId}`, pdfFileUrl);
      } else {
        localStorage.removeItem(`campaign_new_pdf_url_${selectedTemplateId}`);
      }
    }
  }, [pdfFileUrl, selectedTemplateId, editCampaignId]);

  useEffect(() => {
    if (!editCampaignId) {
      localStorage.setItem("campaign_new_template_id", selectedTemplateId);
    }
  }, [selectedTemplateId, editCampaignId]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);

    const savedScript = localStorage.getItem(`campaign_new_script_${templateId}`);
    if (savedScript !== null) {
      setCustomScript(savedScript);
    } else {
      const template = SCRIPT_TEMPLATES.find((t) => t.id === templateId);
      setCustomScript(template ? template.text : "");
    }

    const savedPdfName = localStorage.getItem(`campaign_new_pdf_name_${templateId}`);
    const savedPdfUrl = localStorage.getItem(`campaign_new_pdf_url_${templateId}`);
    if (savedPdfName !== null) {
      setPdfFileName(savedPdfName);
      setPdfFileUrl(savedPdfUrl);
    } else {
      setPdfFileName(null);
      setPdfFileUrl(null);
    }
  };

  const handleLibraryChange = (id: string) => {
    setLibraryId(id);
    const lib = leadLibraries.find((g) => g.id === id);
    setLibraryLeadsCount(lib ? lib.lead_count : 0);
  };

  const handleCheckVoice = async () => {
    setPreviewingVoice(true);
    setError(null);
    try {
      const targetAgentId = agentId || (agents.length > 0 ? agents[0].id : "preview");
      const selectedAgent = agents.find((a) => a.id === agentId);
      const voiceId = selectedAgent?.voice_id;

      const TEST_GREETINGS: Record<string, string> = {
        en: `Hello! I am your ${agentGender} AI assistant. How can I help you today?`,
        ta: `வணக்கம்! நான் உங்கள் ${agentGender === "male" ? "ஆண்" : "பெண்"} AI உதவியாளர். இன்று உங்களுக்கு எப்படி உதவலாம்?`,
        te: "నమస్కారం! నేను మీ AI సహాయకుడిని.",
        ml: "ഹലോ! ഞാൻ നിങ്ങളുടെ AI സഹായിയാണ്.",
        hi: "नमस्ते! मैं आपका AI सहायक हूँ।",
      };

      const text = TEST_GREETINGS[defaultLanguage] || TEST_GREETINGS.en;

      let played = false;
      try {
        const url = await agentService.previewVoice(targetAgentId, text, voiceId, agentGender, defaultLanguage);
        if (url) {
          const audio = new Audio(url);
          await audio.play();
          played = true;
        }
      } catch (backendErr) {
        console.warn("Backend voice preview error, using browser speech synthesis fallback:", backendErr);
      }

      if (!played && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (agentGender === "male") {
          utterance.pitch = 0.75;
          utterance.rate = 0.95;
        } else {
          utterance.pitch = 1.25;
          utterance.rate = 1.0;
        }

        const voices = window.speechSynthesis.getVoices();
        const langCode = defaultLanguage === "ta" ? "ta" : defaultLanguage === "hi" ? "hi" : "en";
        const isMale = agentGender === "male";

        const matchedVoice = voices.find((v) => {
          const nameLower = v.name.toLowerCase();
          const matchesLang = v.lang.toLowerCase().startsWith(langCode);
          const matchesGender = isMale
            ? nameLower.includes("male") || nameLower.includes("david") || nameLower.includes("george") || nameLower.includes("mark") || nameLower.includes("guy")
            : nameLower.includes("female") || nameLower.includes("zira") || nameLower.includes("hazel") || nameLower.includes("susan") || nameLower.includes("aria");
          return matchesLang && matchesGender;
        }) || voices.find((v) => v.lang.toLowerCase().startsWith(langCode)) || voices[0];

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setError(err.message || "Failed to preview agent voice.");
    } finally {
      setPreviewingVoice(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingPdf(true);
    setError(null);
    try {
      const uploadRes = await campaignService.uploadPdf(file);
      setPdfFileUrl(uploadRes.url);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extractedText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        extractedText += pageText + "\n";
      }

      if (extractedText.trim()) {
        setCustomScript(extractedText.trim());
        setPdfFileName(file.name);
      } else {
        throw new Error("Could not extract any readable text from the selected PDF");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse PDF file");
    } finally {
      setParsingPdf(false);
      e.target.value = "";
    }
  };

  // Compute total active lead count for display
  let targetLeadsCount = 0;
  if (leadSelectionMode === "ALL") {
    targetLeadsCount = allLeads.length;
  } else if (leadSelectionMode === "LIBRARY") {
    const lib = leadLibraries.find((g) => g.id === libraryId);
    targetLeadsCount = lib ? lib.lead_count : 0;
  } else {
    targetLeadsCount = selectedLeadIds.length;
  }

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!name.trim()) throw new Error("Campaign name is required");
      if (!clientId && !clientName.trim()) throw new Error("Please select or enter a Client for this campaign");
      if (!customScript.trim()) throw new Error("Script cannot be empty");
      if (callingAgentMode === "AI" && !agentId) throw new Error("Please select an AI Agent");
      if (callingAgentMode === "VOICE" && !voiceAgentId) throw new Error("Please select a Voice Agent");
      if (callingMode === "twilio" && !twilioNumber.trim()) throw new Error("Caller number is required for Twilio mode");
      if (isNaN(Number(maxAttempts)) || Number(maxAttempts) <= 0) throw new Error("Max attempts must be a positive number");
      if (isNaN(Number(retryDelay)) || Number(retryDelay) <= 0) throw new Error("Retry delay must be a positive number");
      if (isNaN(Number(concurrency)) || Number(concurrency) <= 0) throw new Error("Concurrency must be a positive number");

      let targetLeadIds: string[] = [];

      if (leadSelectionMode === "ALL") {
        targetLeadIds = allLeads.map((l) => l.id);
      } else if (leadSelectionMode === "LIBRARY") {
        if (!libraryId) throw new Error("Please select a Lead Library");
        const libraryLeads = await leadGroupService.getLeads(libraryId);
        targetLeadIds = libraryLeads.map((l) => l.id);
      } else {
        targetLeadIds = selectedLeadIds;
      }

      if (targetLeadIds.length === 0) {
        throw new Error("Please select at least 1 lead to start this campaign");
      }

      const payload = {
        name,
        calling_mode: callingAgentMode,
        agent_type: (callingAgentMode === "AI" ? "AI_VOICE" : "HUMAN") as "AI_VOICE" | "HUMAN",
        agent_id: agentId || null,
        voice_agent_id: voiceAgentId || null,
        lead_group_id: leadSelectionMode === "LIBRARY" ? libraryId : null,
        client_id: clientId || null,
        client_name: clientName,
        client_phone: clientPhone,
        twilio_number: callingMode === "twilio" ? twilioNumber : "LOCAL_TEST",
        lead_ids: targetLeadIds,
        auto_dial_enabled: dialerType === "AUTO",
        auto_dial_ratio: parseInt(autoDialRatio.split(":")[1] || "1", 10),
        schedule: {
          description,
          objective: objective === "Custom" ? customObjective : objective,
          script: customScript,
          dialer_type: dialerType,
          agent_gender: agentGender,
          calling_mode: callingMode,
          calling_hours: callingHours,
          timezone,
          max_attempts: Number(maxAttempts),
          retry_delay: Number(retryDelay),
          concurrency: Number(concurrency),
          lead_library_name:
            leadSelectionMode === "LIBRARY"
              ? leadLibraries.find((g) => g.id === libraryId)?.filename || "Spreadsheet Library"
              : "Direct Leads",
          pdf_filename: pdfFileName,
          pdf_url: pdfFileUrl,
          default_language: defaultLanguage,
        },
      };

      const basePath = redirectPath.includes("admin") ? "/admin/campaigns/create" : "/campaigns/new";

      if (isEditMode && editCampaignId) {
        await campaignService.update(editCampaignId, payload);
        setSuccess("Campaign updated successfully!");
        setTimeout(() => {
          router.push(redirectPath);
        }, 1200);
      } else {
        const created = await campaignService.create(payload);
        await campaignService.start(created.id);
        setSuccess("Campaign created & launched successfully!");

        localStorage.removeItem("campaign_generic_draft");
        localStorage.removeItem("campaign_new_template_id");
        
        // Remove individual script keys
        SCRIPT_TEMPLATES.forEach(t => {
          localStorage.removeItem(`campaign_new_script_${t.id}`);
          localStorage.removeItem(`campaign_new_pdf_name_${t.id}`);
          localStorage.removeItem(`campaign_new_pdf_url_${t.id}`);
        });

        setTimeout(() => {
          router.push(redirectPath);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(redirectPath)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            {isEditMode ? "Edit Campaign" : "Create Campaign"} <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode
              ? "Update campaign script, agent parameters, target leads, and calling configuration"
              : "Deploy an outbound calling campaign with active AI & Voice Agents"}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 mb-4 bg-rose-50 border border-rose-200 p-3.5 rounded-xl font-medium">{error}</p>}
      {success && <p className="text-sm text-emerald-800 mb-4 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl font-bold flex items-center gap-2">✓ {success}</p>}

      {/* Stepper */}
      <CampaignStepper currentStep={step} onSelectStep={(s) => setStep(s)} />

      {/* Step Components */}
      <div className={step === 2 ? "max-w-6xl w-full transition-all duration-300" : "max-w-4xl w-full transition-all duration-300"}>
        {step === 1 && (
          <BasicInfoStep
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            objective={objective}
            setObjective={setObjective}
            customObjective={customObjective}
            setCustomObjective={setCustomObjective}
            defaultLanguage={defaultLanguage}
            setDefaultLanguage={setDefaultLanguage}
            dialerType={dialerType}
            setDialerType={setDialerType}
            clientId={clientId}
            setClientId={setClientId}
            clientName={clientName}
            setClientName={setClientName}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            clients={clients}
          />
        )}

        {step === 2 && (
          <ScriptStep
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
            customScript={customScript}
            setCustomScript={setCustomScript}
            parsingPdf={parsingPdf}
            pdfFileName={pdfFileName}
            onPdfUpload={handlePdfUpload}
          />
        )}

        {step === 3 && (
          <AgentStep
            callingAgentMode={callingAgentMode}
            setCallingAgentMode={setCallingAgentMode}
            agents={agents}
            voiceAgents={voiceAgents}
            agentId={agentId}
            setAgentId={setAgentId}
            voiceAgentId={voiceAgentId}
            setVoiceAgentId={setVoiceAgentId}
            autoDialRatio={autoDialRatio}
            setAutoDialRatio={setAutoDialRatio}
            agentGender={agentGender}
            setAgentGender={setAgentGender}
            previewingVoice={previewingVoice}
            onCheckVoice={handleCheckVoice}
          />
        )}

        {step === 4 && (
          <LeadsStep
            allLeads={allLeads}
            leadLibraries={leadLibraries}
            leadSelectionMode={leadSelectionMode}
            setLeadSelectionMode={setLeadSelectionMode}
            libraryId={libraryId}
            onLibraryChange={handleLibraryChange}
            selectedLeadIds={selectedLeadIds}
            setSelectedLeadIds={setSelectedLeadIds}
          />
        )}

        {step === 5 && (
          <CallingConfigStep
            callingMode={callingMode}
            setCallingMode={setCallingMode}
            twilioNumber={twilioNumber}
            setTwilioNumber={setTwilioNumber}
            callingHours={callingHours}
            setCallingHours={setCallingHours}
            timezone={timezone}
            setTimezone={setTimezone}
            maxAttempts={maxAttempts}
            setMaxAttempts={setMaxAttempts}
            retryDelay={retryDelay}
            setRetryDelay={setRetryDelay}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
          />
        )}

        {step === 6 && (
          <ReviewStep
            name={name}
            description={description}
            objective={objective}
            customObjective={customObjective}
            customScript={customScript}
            clientName={clientName}
            clientPhone={clientPhone}
            callingAgentMode={callingAgentMode}
            agentId={agentId}
            agents={agents}
            voiceAgentId={voiceAgentId}
            voiceAgents={voiceAgents}
            agentGender={agentGender}
            leadSelectionMode={leadSelectionMode}
            targetLeadsCount={targetLeadsCount}
            libraryId={libraryId}
            leadLibraries={leadLibraries}
            defaultLanguage={defaultLanguage}
            callingMode={callingMode}
            twilioNumber={twilioNumber}
            callingHours={callingHours}
            timezone={timezone}
            maxAttempts={maxAttempts}
            retryDelay={retryDelay}
            concurrency={concurrency}
            onGotoStep={(targetStep) => setStep(targetStep)}
          />
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? () => router.push(redirectPath) : prevStep}
            className="gap-1.5 font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step === 6 ? (
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold shadow-sm px-6 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {isEditMode ? "Saving..." : "Launching..."}
                </>
              ) : isEditMode ? (
                <>
                  <Save className="h-4 w-4" /> Save Campaign Changes
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Run Campaign
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-semibold shadow-sm cursor-pointer"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
