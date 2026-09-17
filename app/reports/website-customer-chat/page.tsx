"use client";

import { reportService } from "@/lib/services/report.service";
import React, { useState, useEffect } from 'react';
import { AppShell } from "@/components/AppShell";
import Link from 'next/link';
import { 
  ArrowLeft, MessageSquare, User, Send, Clock, Paperclip, MoreVertical, 
  Search, Globe, Monitor, Copy, Check, PhoneForwarded, UserCheck, RefreshCw, X 
} from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'system' | 'customer' | 'agent';
  time: string;
  text: string;
}

interface InboundAgent {
  id: string;
  name: string;
  type: string;
}

export default function WebsiteCustomerChat() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({
    name: "Varun Kapoor",
    phone: "+919876543239",
    email: "varun.kapoor@gmail.com",
    visitor_id: "VIS-640ae6",
    status: "Active Session",
    duration: "05:20",
    waiting_time: "00:00"
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableAgents, setAvailableAgents] = useState<InboundAgent[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  const TEMPLATES = [
    "Greeting (Inbound Support)",
    "Can you confirm your account phone?",
    "Connecting you with voice agent...",
    "I will transfer your call now",
    "Anything else I can assist with?",
    "Thank you for contacting CallMira"
  ];

  const loadLiveChatData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getGenericReport("website-customer-chat");
      if (res && res.data && res.data.length > 0) {
        const session = res.data[0];
        setCustomer({
          name: session.customer_name || "Customer",
          phone: session.customer_phone || "+919876543239",
          email: session.customer_email || "customer@callmira.ai",
          visitor_id: session.visitor_id || "VIS-001",
          status: session.status || "Active Session",
          duration: session.duration || "05:20",
          waiting_time: session.waiting_time || "00:00"
        });
        if (Array.isArray(session.messages) && session.messages.length > 0) {
          setMessages(session.messages);
        }
        if (Array.isArray(session.available_agents) && session.available_agents.length > 0) {
          setAvailableAgents(session.available_agents);
          setSelectedAgent(session.available_agents[0].id);
        }
      }
    } catch (err) {
      console.error("Failed loading live website chat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveChatData();
  }, []);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'agent',
      time: timeStr,
      text: chatInput.trim()
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText("192.168.1.45");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransfer = () => {
    const target = availableAgents.find(a => a.id === selectedAgent);
    const agentName = target ? target.name : "Inbound Agent";
    setTransferStatus(`Call successfully transferred to Inbound Agent ${agentName}!`);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'system',
        time: timeStr,
        text: `Voice Call Transferred to Inbound Voice Agent: ${agentName} (Bridge Active)`
      }
    ]);

    setTimeout(() => {
      setShowTransferModal(false);
      setTransferStatus(null);
    }, 2500);
  };

  const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';

  return (
    <AppShell>
      <div className="p-6 md:p-8 w-full bg-slate-50 min-h-screen">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link 
              href="/reports"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-indigo-500" />
              Website Customer Chat
              <span className="bg-emerald-100 text-emerald-700 text-sm px-3 py-1 rounded-full border border-emerald-200 font-bold ml-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {customer.status}
              </span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={loadLiveChatData}
              disabled={loading}
              className="px-3.5 py-2 bg-white text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors text-sm flex items-center gap-2"
              title="Refresh Live Session"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors text-sm flex items-center gap-2"
            >
              <PhoneForwarded className="w-4 h-4" />
              Transfer to Inbound Agent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)] min-h-[600px]">
          
          {/* Main Chat Interface */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base">
                  {initials}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {customer.name} 
                    <span className="text-slate-400 font-normal text-xs">({customer.visitor_id})</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{customer.phone}</span>
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Wait: {customer.waiting_time}</span>
                    <span>•</span>
                    <span>Duration: {customer.duration}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">Inbound Live Queue</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg border border-indigo-100">
                  {availableAgents.length} Inbound Agents Online
                </span>
                <button className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'system' ? (
                    <div className="w-full flex justify-center my-2">
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs px-3.5 py-1.5 rounded-full font-semibold shadow-xs">
                        {msg.text}
                      </span>
                    </div>
                  ) : (
                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${msg.sender === 'agent' ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                      <div className="text-sm leading-relaxed">{msg.text}</div>
                      <div className={`text-[10px] mt-1 text-right ${msg.sender === 'agent' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {msg.time}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {/* Quick Replies */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
                {TEMPLATES.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setChatInput(t)}
                    className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-3 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  placeholder="Type your response to the customer or click a quick reply..." 
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition-colors text-sm"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handleSendMessage}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center justify-center font-medium"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Visitor Info Sidebar */}
          <div className="space-y-5">
            
            {/* Customer Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-800">Customer Profile</h2>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Live DB Lead</span>
              </div>
              <div className="p-5 space-y-3.5 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</div>
                  <div className="font-semibold text-slate-800 text-base">{customer.name}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                  <div className="font-mono text-slate-800 font-semibold">{customer.phone}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</div>
                  <div className="font-medium text-indigo-600 break-all">{customer.email}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue Routing</div>
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Inbound Voice & Chat Queue
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-slate-500" />
                <h2 className="text-base font-bold text-slate-800">Session Details</h2>
              </div>
              <div className="p-5 space-y-3.5 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">IP Address</div>
                  <div className="font-mono text-slate-700 flex items-center justify-between">
                    192.168.1.45 
                    <button 
                      onClick={handleCopyIp} 
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Copy IP"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</div>
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <Globe className="w-4 h-4 text-slate-400" /> Bengaluru, IN (Asia/Kolkata)
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Routing Mode</div>
                  <div className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded inline-block">
                    Inbound Voice Call Bridge Ready
                  </div>
                </div>
              </div>
            </div>
            
            {/* Inbound Agent Quick Transfer Card */}
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Available Inbound Agents ({availableAgents.length})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {availableAgents.map(ag => (
                  <div key={ag.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="font-semibold text-slate-800">{ag.name}</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">Inbound</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-lg">Transfer Call to Inbound Agent</h3>
                </div>
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {transferStatus ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  {transferStatus}
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-4">
                    Select an online <strong>Inbound Voice Agent</strong> from the database to warm transfer {customer.name}&apos;s session:
                  </p>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Target Inbound Voice Agent
                    </label>
                    <select 
                      value={selectedAgent} 
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      {availableAgents.map(ag => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} (Inbound Voice Agent)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 mb-5 space-y-1">
                    <div className="flex justify-between"><span>Customer:</span> <strong className="text-slate-700">{customer.name}</strong></div>
                    <div className="flex justify-between"><span>Caller ID:</span> <strong className="text-slate-700">{customer.phone}</strong></div>
                    <div className="flex justify-between"><span>Current Queue:</span> <strong className="text-slate-700">Inbound Web / Voice</strong></div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setShowTransferModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleTransfer}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm"
                    >
                      <PhoneForwarded className="w-4 h-4" />
                      Confirm Transfer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
