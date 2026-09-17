"use client";

import { useEffect, useState } from "react";
import { messagesService } from "@/lib/services/messages.service";
import { CheckCircle2, ShieldAlert, RefreshCw, ChevronDown, Mail, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmailConfigurationCard() {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<"smtp" | "resend" | "sendgrid">("smtp");

  // SMTP states
  const [smtpHost, setSipHost] = useState("smtp.gmail.com");
  const [smtpPort, setSipPort] = useState("587");
  const [emailAddress, setEmailAddress] = useState("");
  const [smtpPassword, setSipPassword] = useState("");
  const [senderName, setSenderName] = useState("AI Receptionist");
  const [encryption, setEncryption] = useState("TLS");

  // Resend states
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFromEmail, setResendFromEmail] = useState("");

  // SendGrid states
  const [sendgridApiKey, setSendgridApiKey] = useState("");
  const [sendgridFromEmail, setSendgridFromEmail] = useState("");

  // Template state
  const [emailTemplate, setEmailTemplate] = useState(
    `Hi {{name}},\n\nYour appointment is confirmed for {{appointment_date}} at {{appointment_time}} with {{agent_name}}.\n\nIf you need to reschedule or have any questions, please reply to this email or call us directly.\n\nBest regards,\n{{sender_name}}`
  );

  // Status & Feedback
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await messagesService.getEmailConfig();
        if (data) {
          if (data.provider) setProvider(data.provider);
          if (data.smtp_host) setSipHost(data.smtp_host);
          if (data.smtp_port) setSipPort(String(data.smtp_port));
          if (data.email_address) {
            setEmailAddress(data.email_address);
            setTestRecipient(data.email_address);
          }
          if (data.has_password) setSipPassword("••••••••••••••••••••");
          if (data.sender_name) setSenderName(data.sender_name);
          if (data.encryption) setEncryption(data.encryption);
          if (data.template) setEmailTemplate(data.template);
          if (data.resend_from_email) setResendFromEmail(data.resend_from_email);
          if (data.has_resend_api_key) setResendApiKey("••••••••••••••••••••");
          if (data.sendgrid_from_email) setSendgridFromEmail(data.sendgrid_from_email);
          if (data.has_sendgrid_api_key) setSendgridApiKey("••••••••••••••••••••");
          setIsActive(data.connected);
        }
      } catch (err: any) {
        console.warn("Could not load email configuration:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const payload = {
        provider,
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort) || 587,
        email_address: emailAddress.trim(),
        password: smtpPassword === "••••••••••••••••••••" ? undefined : smtpPassword,
        sender_name: senderName.trim(),
        encryption,
        template: emailTemplate,
        resend_api_key: resendApiKey === "••••••••••••••••••••" ? undefined : resendApiKey.trim(),
        resend_from_email: resendFromEmail.trim(),
        sendgrid_api_key: sendgridApiKey === "••••••••••••••••••••" ? undefined : sendgridApiKey.trim(),
        sendgrid_from_email: sendgridFromEmail.trim(),
      };

      const res = await messagesService.saveEmailConfig(payload);
      setIsActive(true);
      setSuccess(res.message || "Email configuration saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save email configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setSuccess(null);
    setTesting(true);

    try {
      const payload = {
        provider,
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort) || 587,
        email_address: emailAddress.trim(),
        password: smtpPassword === "••••••••••••••••••••" ? undefined : smtpPassword,
        encryption,
        resend_api_key: resendApiKey === "••••••••••••••••••••" ? undefined : resendApiKey.trim(),
        resend_from_email: resendFromEmail.trim(),
        sendgrid_api_key: sendgridApiKey === "••••••••••••••••••••" ? undefined : sendgridApiKey.trim(),
        sendgrid_from_email: sendgridFromEmail.trim(),
      };

      const res = await messagesService.testEmailConnection(payload);
      if (res.connected) {
        setIsActive(true);
        setSuccess(`✅ Connection verified! Successfully connected to ${provider.toUpperCase()}.`);
      } else {
        setError(res.error || res.detail || `Failed to connect to ${provider.toUpperCase()}. Please verify credentials.`);
      }
    } catch (err: any) {
      setError(err.message || "Connection test failed. Please verify credentials.");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setSuccess(null);
    setDisconnecting(true);
    try {
      await messagesService.disconnectResend();
      setIsActive(false);
      setSuccess("Email configuration disconnected.");
    } catch (err: any) {
      setError(err.message || "Failed to disconnect email.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTestEmail = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const target = testRecipient.trim() || emailAddress.trim() || "jasminesusmitha209@gmail.com";
    if (!target) {
      setError("Please enter a recipient email address to send test email.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSendingTest(true);

    try {
      const payload = {
        to_email: target,
        provider,
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort) || 587,
        email_address: emailAddress.trim(),
        password: smtpPassword === "••••••••••••••••••••" ? undefined : smtpPassword,
        sender_name: senderName.trim(),
        encryption,
        resend_api_key: resendApiKey === "••••••••••••••••••••" ? undefined : resendApiKey.trim(),
        resend_from_email: resendFromEmail.trim(),
        sendgrid_api_key: sendgridApiKey === "••••••••••••••••••••" ? undefined : sendgridApiKey.trim(),
        sendgrid_from_email: sendgridFromEmail.trim(),
        template: emailTemplate,
      };

      const res = await messagesService.sendTestEmail(payload);
      setIsActive(true);
      setSuccess(res.message || `✅ Test email successfully sent to ${target}! Please check your inbox.`);
    } catch (err: any) {
      setError(err.message || "Failed to send test email.");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-[20px] border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-[#5B4DF6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      {/* Alerts */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2.5 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Configuration Card (WhatsApp Match) */}
      <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
        
        {/* Header matching WhatsApp */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#1D2433] uppercase tracking-wider">
                Email Configuration
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Agent Email Configuration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`text-[10px] uppercase font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isActive ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
          <span className="text-base select-none leading-none pt-0.5">💡</span>
          <div className="leading-relaxed text-[11px]">
            <span className="font-bold text-emerald-900">Railway &amp; Cloud Tier Notice:</span> Resend and SendGrid use standard <strong className="font-semibold text-emerald-950">HTTPS Port 443</strong>, which is never blocked by cloud hosting providers (unlike Gmail SMTP ports 587/465).
          </div>
        </div>

        {/* Email Provider Selector */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Provider
          </label>
          <div className="relative">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-[#1D2433] focus:outline-none focus:border-[#5B4DF6] appearance-none cursor-pointer pr-10"
            >
              <option value="smtp">SMTP / Gmail (Standard Port 587/465)</option>
              <option value="resend">Resend (Standard HTTPS Port 443 API)</option>
              <option value="sendgrid">SendGrid (Port 443 HTTPS API)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Conditional Fields based on Provider */}
        {provider === "smtp" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  SMTP Host
                </label>
                <Input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSipHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  SMTP Port
                </label>
                <Input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSipPort(e.target.value)}
                  placeholder="587"
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="yourname@gmail.com"
                className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Password / App Password
              </label>
              <Input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSipPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-11 bg-slate-50 border-slate-200 text-xs text-[#1D2433]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Sender Name
                </label>
                <Input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="AI Receptionist"
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Encryption
                </label>
                <div className="relative">
                  <select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-[#1D2433] focus:outline-none focus:border-[#5B4DF6] appearance-none cursor-pointer pr-10"
                  >
                    <option value="TLS">TLS</option>
                    <option value="SSL">SSL</option>
                    <option value="None">None</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {provider === "resend" && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Resend API Key
              </label>
              <Input
                type="password"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxxxx"
                className="h-11 bg-slate-50 border-slate-200 text-xs text-[#1D2433]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                From Email Address
              </label>
              <Input
                type="email"
                value={resendFromEmail}
                onChange={(e) => setResendFromEmail(e.target.value)}
                placeholder="onboarding@resend.dev or domain email"
                className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Sender Name
                </label>
                <Input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="AI Receptionist"
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Protocol &amp; Port
                </label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value="HTTPS Port 443 (REST API)"
                  className="h-11 bg-slate-100/70 border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {provider === "sendgrid" && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                SendGrid API Key
              </label>
              <Input
                type="password"
                value={sendgridApiKey}
                onChange={(e) => setSendgridApiKey(e.target.value)}
                placeholder="SG.xxxxxxxxxxxxxxxx"
                className="h-11 bg-slate-50 border-slate-200 text-xs text-[#1D2433]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                From Email Address
              </label>
              <Input
                type="email"
                value={sendgridFromEmail}
                onChange={(e) => setSendgridFromEmail(e.target.value)}
                placeholder="verified_sender@domain.com"
                className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Sender Name
                </label>
                <Input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="AI Receptionist"
                  className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Protocol &amp; Port
                </label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value="HTTPS Port 443 (REST API)"
                  className="h-11 bg-slate-100/70 border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Appointment Email Template */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Appointment Email Template
          </label>
          <textarea
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            rows={4}
            placeholder="Hi {{name}}, your appointment is confirmed..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-[#1D2433] focus:outline-none focus:border-[#5B4DF6] leading-relaxed resize-y font-mono"
          />
        </div>

        {/* Buttons Row - Exact Match to WhatsApp Card */}
        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            {saving ? "SAVING..." : "SAVE CREDENTIALS"}
          </Button>

          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-5 h-11 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all cursor-pointer whitespace-nowrap"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "TEST CONNECTION"}
          </Button>
        </div>

        {/* Send Real Test Email Row inside card */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#5B4DF6]" />
              Send Real Test Email to Inbox
            </label>
            <span className="text-[10px] text-slate-400 font-semibold">
              Verify inbox delivery
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Recipient email address (e.g. test@gmail.com)"
              className="h-11 bg-slate-50 font-bold border-slate-200 text-xs text-[#1D2433] flex-1"
            />
            <Button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="h-11 px-5 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 justify-center"
            >
              {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{sendingTest ? "SENDING..." : "SEND TEST EMAIL"}</span>
            </Button>
          </div>
        </div>

        {/* Disconnect button - matching WhatsApp disconnect */}
        {isActive && (
          <div className="pt-2 border-t border-slate-100 mt-2">
            <Button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full h-11 bg-[#5B4DF6] hover:bg-[#4E3FE6] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(91,77,246,0.3)] transition-all cursor-pointer"
            >
              {disconnecting ? "DISCONNECTING..." : "DISCONNECT EMAIL"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
