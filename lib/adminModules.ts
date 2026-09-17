import { 
  Clock, CalendarRange, Phone, LayoutTemplate, Network, Server, 
  Users2, Settings, Monitor, Palette, ActivitySquare, LayoutGrid, 
  Contact, Voicemail, Mail, AudioLines, Music, Globe, FileAudio, 
  Mic2, CreditCard, BookUser, Archive, FileBarChart, Globe2,
  PhoneIncoming, Bot, Sparkles, Building2
} from 'lucide-react';

export const ALL_MODULES = [
  { key: 'tenants', name: 'Tenants & Multi-Tenancy', icon: Building2 },
  { key: 'ai-chatbot', name: 'AI Chatbot & RAG', icon: Bot },
  { key: 'inbound', name: 'Inbound', icon: PhoneIncoming },
  { key: 'user-groups', name: 'User Groups', icon: Users2 },
  { key: 'call-times', name: 'Call Times', icon: Clock },
  { key: 'shifts', name: 'Shifts', icon: CalendarRange },
  { key: 'phones', name: 'Phones', icon: Phone },
  { key: 'templates', name: 'Templates', icon: LayoutTemplate },
  { key: 'carriers', name: 'Carriers', icon: Network },
  { key: 'servers', name: 'Servers', icon: Server },
  { key: 'conferences', name: 'Conferences', icon: Users2 },
  { key: 'system-settings', name: 'System Settings', icon: Settings },
  { key: 'agent-screen-labels', name: 'Agent Screen Labels', icon: Monitor },
  { key: 'screen-colors', name: 'Screen Colors', icon: Palette },
  { key: 'system-statuses', name: 'Call Dispositions & Statuses', icon: ActivitySquare },
  { key: 'status-groups', name: 'Status Groups', icon: LayoutGrid },
  { key: 'cid-groups', name: 'CID Groups', icon: Contact },
  { key: 'voicemail', name: 'Voicemail', icon: Voicemail },
  { key: 'email-accounts', name: 'Email Accounts', icon: Mail },
  { key: 'audio-store', name: 'Audio Store', icon: AudioLines },
  { key: 'music-on-hold', name: 'Music On Hold', icon: Music },
  { key: 'languages', name: 'Languages', icon: Globe },
  { key: 'audio-soundboards', name: 'Audio Soundboards', icon: FileAudio },
  { key: 'text-to-speech', name: 'Text To Speech', icon: Mic2 },
  { key: 'callcard-admin', name: 'CallCard Admin', icon: CreditCard },
  { key: 'contacts', name: 'Contacts', icon: BookUser },
  { key: 'settings-containers', name: 'Settings Containers', icon: Archive },
  { key: 'automated-reports', name: 'Automated Reports', icon: FileBarChart },
  { key: 'ip-lists', name: 'IP Lists', icon: Globe2 }
];
