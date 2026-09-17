// ---------------------------------------------------------------------------
// Mock data only. In a real integration:
//  - `contacts` / `leads` come from the CRM's lead table (the same record the
//    Customer Data panel and the Dial Control panel already read from).
//  - `whatsappThreads` are populated by your WhatsApp webhook handler
//    (inbound messages) and by this UI's own send calls (outbound).
//  - `emails` are populated by your inbound-mail handler (IMAP poll or an
//    inbound-parse webhook) and by this UI's own send calls via your SMTP relay.
// See the integration notes in each component for exactly where to swap
// this out for real API calls.
// ---------------------------------------------------------------------------

export const leads = [
  {
    id: 'john-smith',
    name: 'John Smith',
    phone: '+1 (555) 019-2834',
    email: 'john@example.com',
    initials: 'JS',
    color: '#6C63F5',
  },
  {
    id: 'sara-lee',
    name: 'Sara Lee',
    phone: '+1 (555) 044-7719',
    email: 'sara@example.com',
    initials: 'SL',
    color: '#C77DFF',
  },
  {
    id: 'mike-chen',
    name: 'Mike Chen',
    phone: '+1 (555) 088-1122',
    email: 'mike@example.com',
    initials: 'MC',
    color: '#3AAFA9',
  },
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    phone: '+1 (555) 067-3390',
    email: 'priya@example.com',
    initials: 'PN',
    color: '#F0965A',
  },
]

// WhatsApp: one message array per lead id. Leads with no entry here show up
// in "New Conversation" as "no chat yet" until the agent starts one.
export const initialWhatsAppThreads = {
  'john-smith': [
    { id: 1, from: 'customer', text: "Hi, following up on the plan you asked about — want me to send the details over here?", time: '10:52 AM' },
    { id: 2, from: 'agent', text: "Yes please, that'd be great", time: '10:53 AM', read: true },
    { id: 3, from: 'customer', text: 'Sent! It covers the setup fee and the monthly rate we discussed on the call.', time: '10:55 AM' },
    { id: 4, from: 'agent', text: 'Sure, that works for me!', time: '10:58 AM', read: true },
  ],
  'sara-lee': [
    { id: 1, from: 'customer', text: 'Can you resend the quote?', time: '9:20 AM' },
  ],
  'mike-chen': [
    { id: 1, from: 'customer', text: 'Thanks for the callback', time: 'Yesterday' },
  ],
}

// Email: one inbox thread per lead id, in the shape a reading pane needs.
export const initialEmails = [
  {
    id: 'e1',
    leadId: 'john-smith',
    subject: 'Re: Pricing information',
    from: 'John Smith',
    fromEmail: 'john@example.com',
    time: 'Aug 27, 11:02 AM',
    unread: false,
    body:
      "Hi agent1,\n\nThanks for the quick response on the call. Could you send over the formal quote in writing so I can share it with my team? Happy to move ahead once I have it in hand.\n\nBest,\nJohn",
    replies: [],
  },
  {
    id: 'e2',
    leadId: 'sara-lee',
    subject: 'Quote follow-up',
    from: 'Sara Lee',
    fromEmail: 'sara@example.com',
    time: '9:41 AM',
    unread: true,
    body: 'Could you resend the attached quote? I think it got lost in my spam folder.',
    replies: [],
  },
  {
    id: 'e3',
    leadId: 'mike-chen',
    subject: 'Callback confirmation',
    from: 'Mike Chen',
    fromEmail: 'mike@example.com',
    time: 'Yesterday',
    unread: false,
    body: 'Appreciate the callback earlier today — talk soon.',
    replies: [],
  },
]
