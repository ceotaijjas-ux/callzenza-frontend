"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { messagesService } from "@/lib/services/messages.service";
import { Settings, CheckCircle2, RefreshCw, ShieldAlert, Mail, MessageSquare, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmailConfigurationCard } from "@/components/settings/EmailConfigurationCard";

export default function VoiceAgentSettings() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<"email" | "whatsapp">("email");

  // WhatsApp states
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [waProvider, setWaProvider] = useState("Meta Cloud API (direct)");
  const [waPhone, setWaPhone] = useState("+1 (555) 159-5909");
  const [waPhoneId, setWaPhoneId] = useState("1213001098572930");
  const [waBusinessAccountId, setWaBusinessAccountId] = useState("916553811148360");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waTemplate, setWaTemplate] = useState("Hi {{name}}, your appointment is confirmed with CallZenza.");

  const [testingWa, setTestingWa] = useState(false);
  const [savingWa, setSavingWa] = useState(false);
  const [disconnectingWa, setDisconnectingWa] = useState(false);
  const [testWaRecipient, setTestWaRecipient] = useState("+918608949822");
  const [sendingWaTest, setSendingWaTest] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "whatsapp" || tabParam === "email") {
        setActiveChannel(tabParam);
      }
    }

    async function loadSettings() {
      try {
        const waRes = await messagesService.getWhatsAppConfig().catch(() => ({ connected: false, config: null }));
        if (waRes?.connected && waRes.config) {
          setWhatsappConnected(true);
          setWaProvider(waRes.config.provider || "Meta Cloud API (direct)");
          setWaPhone(waRes.config.phone_number || "+1 (555) 159-5909");
          setWaPhoneId(waRes.config.phone_number_id || "1213001098572930");
          setWaBusinessAccountId(waRes.config.business_account_id || "916553811148360");
          setWaAccessToken("••••••••••••••••••••");
          if (waRes.config.template) {
            setWaTemplate(waRes.config.template);
          }
        }
      } catch (err: any) {
        console.error("Failed to load integrations status:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveWhatsApp = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!waPhone.trim()) return setError("WhatsApp Phone Number is required");
    if (!waPhoneId.trim()) return setError("WhatsApp Phone Number ID is required");
    if (!waAccessToken.trim()) return setError("Access Token is required");

    setSavingWa(true);
    setError(null);
    setSuccess(null);
    try {
      await messagesService.saveWhatsAppConfig({
        provider: waProvider,
        phone_number: waPhone.trim(),
        phone_number_id: waPhoneId.trim(),
        access_token: waAccessToken.trim() === "••••••••••••••••••••" ? "" : waAccessToken.trim(),
        template: waTemplate.trim(),
      });
      setWhatsappConnected(true);
      setSuccess("WhatsApp configurations saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save WhatsApp configurations.");
    } finally {
      setSavingWa(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setDisconnectingWa(true);
    setError(null);
    setSuccess(null);
    try {
      await messagesService.disconnectWhatsApp();
      setWhatsappConnected(false);
      setWaPhone("");
      setWaPhoneId("");
      setWaAccessToken("");
      setSuccess("WhatsApp configurations disconnected.");
    } catch (err: any) {
      setError(err.message || "Failed to disconnect WhatsApp.");
    } finally {
      setDisconnectingWa(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWa(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await messagesService.testWhatsAppConnection();
      if (res.success) {
        setSuccess(`${res.detail || "Meta API connection healthy and verified!"} (To receive a real test message on your phone, click 'SEND TEST MESSAGE' below).`);
      } else {
        setError(res.detail || "Test failed. Please verify credentials.");
      }
    } catch (err: any) {
      setError(err.message || "Test failed. Meta API unreachable.");
    } finally {
      setTestingWa(false);
    }
  };

  const handleSendTestWhatsApp = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const target = testWaRecipient.trim() || "+918608949822";
    if (!target) {
      setError("Please enter a recipient phone number to send test message.");
      return;
    }
    setSendingWaTest(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await messagesService.sendTestWhatsAppMessage({
        to_phone: target,
        phone_number_id: waPhoneId.trim(),
        access_token: waAccessToken.trim() === "••••••••••••••••••••" ? undefined : waAccessToken.trim(),
        message: waTemplate.trim(),
      });
      if (res.success) {
        setWhatsappConnected(true);
        setSuccess(res.message || `✅ Test WhatsApp message successfully sent to ${target}!`);
      } else {
        setError(res.message || "Failed to send test WhatsApp message.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send test WhatsApp message.");
    } finally {
      setSendingWaTest(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-16">
        
        {/* Header section */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E1B4B] via-[#4F46E5] to-[#818CF8] p-[26px_28px] text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)]">
        <div className="absolute w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15),transparent_70%)] -top-[160px] -right-[100px] pointer-events-none" />
        <div className="flex items-center gap-[14px]">
          <div className="w-[50px] h-[50px] shrink-0 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-white leading-none mb-1 font-['Space_Grotesk']">
              Communication Channels
            </h1>
            <p className="text-[11px] text-white/70 font-black tracking-widest uppercase">
              Configure WhatsApp &amp; Email integrations for your agent account
            </p>
          </div>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveChannel("email")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeChannel === "email"
              ? "bg-[#5B4DF6] text-white shadow-[0_4px_14px_rgba(91,77,246,0.25)] border border-[#5B4DF6]"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Configuration</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeChannel === "whatsapp"
              ? "bg-[#5B4DF6] text-white shadow-[0_4px_14px_rgba(91,77,246,0.25)] border border-[#5B4DF6]"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Business</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Active Tab View */}
      {activeChannel === "email" ? (
        <EmailConfigurationCard />
      ) : (
        <Card className="p-6 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-[20px] border-slate-200 flex flex-col justify-between max-w-xl mx-auto w-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-[#1D2433] uppercase tracking-wider">WhatsApp Business</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">Agent Line Configuration</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${whatsappConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`text-[10px] uppercase font-bold ${whatsappConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {whatsappConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveWhatsApp(e); }} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone Number</label>
                <Input 
                  type="text" 
                  value={waPhone} 
                  onChange={(e) => setWaPhone(e.target.value)} 
                  placeholder="e.g. +1 555 123 4567" 
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone Number ID</label>
                <Input 
                  type="text" 
                  value={waPhoneId} 
                  onChange={(e) => setWaPhoneId(e.target.value)} 
                  placeholder="Meta Phone Number ID" 
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                <Input 
                  type="text" 
                  value={waBusinessAccountId} 
                  onChange={(e) => setWaBusinessAccountId(e.target.value)} 
                  placeholder="916553811148360" 
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Access Token</label>
                <Input 
                  type="password" 
                  value={waAccessToken} 
                  onChange={(e) => setWaAccessToken(e.target.value)} 
                  placeholder="WhatsApp Token Secrets" 
                  className="h-11 bg-slate-50 border-slate-200 text-xs" 
                />
              </div>

              {/* WhatsApp Message Template - Exact Match to Email Card */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  WhatsApp Message Template
                </label>
                <textarea
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  rows={4}
                  placeholder="Hi {{name}}, your appointment is confirmed with CallZenza..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-[#1D2433] focus:outline-none focus:border-[#5B4DF6] leading-relaxed resize-y font-mono"
                />
              </div>

              {/* Buttons Row - Exact Match to Email Card */}
              <div className="flex gap-2.5 pt-2">
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveWhatsApp(e);
                  }}
                  disabled={savingWa}
                  className="flex-1 h-11 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all cursor-pointer"
                >
                  {savingWa ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  {savingWa ? "SAVING..." : "SAVE CREDENTIALS"}
                </Button>

                <Button 
                  type="button" 
                  onClick={handleTestWhatsApp}
                  disabled={testingWa}
                  className="px-5 h-11 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all cursor-pointer whitespace-nowrap"
                >
                  {testingWa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "TEST CONNECTION"}
                </Button>
              </div>

              {/* Send Real Test WhatsApp Message Row inside card - Exact Match to Email Card */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#5B4DF6]" />
                    Send Real Test WhatsApp Message
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Verify phone delivery
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input 
                    type="text" 
                    value={testWaRecipient} 
                    onChange={(e) => setTestWaRecipient(e.target.value)} 
                    placeholder="Recipient phone number (e.g. +918608949822)" 
                    className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433] flex-1" 
                  />
                  <Button 
                    type="button" 
                    onClick={handleSendTestWhatsApp}
                    disabled={sendingWaTest}
                    className="h-11 px-5 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 justify-center"
                  >
                    {sendingWaTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{sendingWaTest ? "SENDING..." : "SEND TEST MESSAGE"}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {whatsappConnected && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <Button 
                type="button"
                onClick={handleDisconnectWhatsApp} 
                disabled={disconnectingWa}
                className="w-full h-11 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all cursor-pointer"
              >
                {disconnectingWa ? "DISCONNECTING..." : "DISCONNECT WHATSAPP"}
              </Button>
            </div>
          )}
        </Card>
      )}

      </div>
    </div>
  );
}

