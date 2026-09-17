import { apiFetch } from "@/lib/api-client";

export interface WhatsAppMessage {
  id: string;
  from_type: "customer" | "agent";
  text: string;
  time: string;
  conversation_id?: string;
  contact_id?: string;
  lead_id?: string;
  phone?: string;
  recipient_phone?: string;
  status?: string;
  latest_message?: string;
  timestamp?: string;
}

export interface WhatsAppConversationItem {
  id: string;
  conversation_id: string;
  lead_id: string;
  contact_id: string;
  name: string;
  phone: string;
  recipient_phone: string;
  last_message: string;
  latest_message: string;
  last_message_at: string;
  timestamp: string;
  time: string;
  unread: number;
  unread_count: number;
  status: string;
  updated_at?: string;
}

export interface EmailReply {
  id: string;
  from_name: string;
  time: string;
  body: string;
}

export interface EmailThread {
  id: string;
  leadId: string;
  subject: string;
  from_name: string;
  fromEmail: string;
  time: string;
  unread: boolean;
  body: string;
  replies: EmailReply[];
}

export const messagesService = {
  getGmailStatus: () =>
    apiFetch<{ connected: boolean }>("/api/messages/gmail/oauth/status"),

  disconnectGmail: () =>
    apiFetch<{ success: boolean }>("/api/messages/gmail/oauth/disconnect", {
      method: "POST",
    }),

  getWhatsAppConfig: () =>
    apiFetch<{ connected: boolean; config?: { provider: string; phone_number_id: string; phone_number: string; business_account_id?: string; template?: string } }>("/api/messages/whatsapp/config"),

  saveWhatsAppConfig: (config: { provider: string; phone_number_id: string; access_token: string; phone_number: string; business_account_id?: string; template?: string }) =>
    apiFetch<{ success: boolean }>("/api/messages/whatsapp/config", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  disconnectWhatsApp: () =>
    apiFetch<{ success: boolean }>("/api/messages/whatsapp/config/disconnect", {
      method: "POST",
    }),

  testWhatsAppConnection: () =>
    apiFetch<{ success: boolean; detail?: string }>("/api/messages/whatsapp/config/test", {
      method: "POST",
    }),

  sendTestWhatsAppMessage: (data: {
    to_phone: string;
    phone_number_id?: string;
    access_token?: string;
    message?: string;
  }) =>
    apiFetch<{ success: boolean; message: string; id?: string; details?: any }>(
      "/api/messages/whatsapp/config/send-test",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  getWhatsAppConversations: () =>
    apiFetch<WhatsAppConversationItem[]>("/api/messages/whatsapp/conversations"),

  getWhatsAppMessages: (leadId: string) =>
    apiFetch<WhatsAppMessage[]>(`/api/messages/whatsapp/${leadId}`),

  sendWhatsAppMessage: (leadId: string, content: string) =>
    apiFetch<WhatsAppMessage>(`/api/messages/whatsapp/${leadId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getEmails: (leadId: string) =>
    apiFetch<EmailThread[]>(`/api/messages/emails/${leadId}`),

  sendEmail: (
    leadId: string,
    toEmail: string,
    subject: string,
    body: string,
    attachments?: Array<{ filename: string; file_id?: string; content_base64?: string; content_type?: string }>,
  ) =>
    apiFetch<EmailThread>(`/api/messages/emails/${leadId}`, {
      method: "POST",
      body: JSON.stringify({ to_email: toEmail, subject, body, attachments }),
    }),

  replyEmail: (leadId: string, messageId: string, body: string) =>
    apiFetch<{ success: boolean }>(`/api/messages/emails/${leadId}/${messageId}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  getResendStatus: () =>
    apiFetch<{
      connected: boolean;
      provider?: string;
      from_email?: string;
      from_name?: string;
      key_configured?: boolean;
      has_resend_integration?: boolean;
      error?: string;
    }>("/api/integrations/email/status"),

  saveResendConfig: (config: { api_key?: string; from_email?: string; from_name?: string }) =>
    apiFetch<{ success: boolean; message?: string; detail?: string }>("/api/integrations/email/resend", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  disconnectResend: () =>
    apiFetch<{ success: boolean; message?: string }>("/api/integrations/email/disconnect", {
      method: "POST",
    }),

  checkEmailConnectivity: () =>
    apiFetch<{
      connected: boolean;
      resend_package: boolean;
      api_key_source: string;
      from_email?: string;
      from_name?: string;
      error?: string;
      detail?: string;
    }>("/api/email/connectivity-check"),

  getEmailConfig: () =>
    apiFetch<{
      provider: "smtp" | "resend" | "sendgrid";
      smtp_host: string;
      smtp_port: number;
      email_address: string;
      has_password?: boolean;
      sender_name: string;
      encryption: string;
      template: string;
      resend_from_email?: string;
      has_resend_api_key?: boolean;
      sendgrid_from_email?: string;
      has_sendgrid_api_key?: boolean;
      connected: boolean;
      is_active: boolean;
    }>("/api/integrations/email/config"),

  saveEmailConfig: (data: {
    provider: string;
    smtp_host?: string;
    smtp_port?: number;
    email_address?: string;
    password?: string;
    sender_name?: string;
    encryption?: string;
    template?: string;
    resend_api_key?: string;
    resend_from_email?: string;
    sendgrid_api_key?: string;
    sendgrid_from_email?: string;
  }) =>
    apiFetch<{ success: boolean; status: string; message: string; provider: string }>(
      "/api/integrations/email/config",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  testEmailConnection: (data: {
    provider: string;
    smtp_host?: string;
    smtp_port?: number;
    email_address?: string;
    password?: string;
    encryption?: string;
    resend_api_key?: string;
    resend_from_email?: string;
    sendgrid_api_key?: string;
    sendgrid_from_email?: string;
  }) =>
    apiFetch<{ connected: boolean; provider?: string; error?: string; detail?: string }>(
      "/api/integrations/email/test-connection",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  sendTestEmail: (data: {
    to_email: string;
    provider?: string;
    smtp_host?: string;
    smtp_port?: number;
    email_address?: string;
    password?: string;
    sender_name?: string;
    encryption?: string;
    resend_api_key?: string;
    resend_from_email?: string;
    sendgrid_api_key?: string;
    sendgrid_from_email?: string;
    template?: string;
  }) =>
    apiFetch<{ success: boolean; message: string; id?: string; provider?: string }>(
      "/api/integrations/email/send-test",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
};


