const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'call-times', name: 'Call Times' },
  { path: 'shifts', name: 'Shifts' },
  { path: 'phones', name: 'Phones' },
  { path: 'templates', name: 'Templates' },
  { path: 'carriers', name: 'Carriers' },
  { path: 'servers', name: 'Servers' },
  { path: 'conferences', name: 'Conferences' },
  { path: 'system-settings', name: 'System Settings' },
  { path: 'agent-screen-labels', name: 'Agent Screen Labels' },
  { path: 'screen-colors', name: 'Screen Colors' },
  { path: 'system-statuses', name: 'System Statuses' },
  { path: 'status-groups', name: 'Status Groups' },
  { path: 'cid-groups', name: 'CID Groups' },
  { path: 'voicemail', name: 'Voicemail' },
  { path: 'email-accounts', name: 'Email Accounts' },
  { path: 'audio-store', name: 'Audio Store' },
  { path: 'music-on-hold', name: 'Music On Hold' },
  { path: 'languages', name: 'Languages' },
  { path: 'audio-soundboards', name: 'Audio Soundboards' },
  { path: 'text-to-speech', name: 'Text To Speech' },
  { path: 'callcard-admin', name: 'CallCard Admin' },
  { path: 'contacts', name: 'Contacts' },
  { path: 'settings-containers', name: 'Settings Containers' },
  { path: 'automated-reports', name: 'Automated Reports' },
  { path: 'ip-lists', name: 'IP Lists' }
];

const basePath = path.join(__dirname, 'app', 'admin');

pages.forEach(page => {
  const dirPath = path.join(basePath, page.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, 'page.tsx');
  const content = `"use client";
import React from 'react';
import Link from 'next/link';
import { AppShell } from "@/components/AppShell";
import { ArrowLeft } from 'lucide-react';

export default function ${page.name.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl hover:shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Administration
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{page.name}</h1>
          <p className="text-slate-500 font-medium">Manage and configure your {page.name.toLowerCase()} settings here.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{page.name} Configuration</h3>
            <p className="text-slate-500 max-w-md">This is a placeholder page for the {page.name} module. You can customize this page later with specific tables, forms, and settings.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
`;
  fs.writeFileSync(filePath, content.replace('{page.name}', page.name).replace('{page.name}', page.name).replace('{page.name.toLowerCase()}', page.name.toLowerCase()).replace('{page.name}', page.name).replace('{page.name}', page.name));
});
console.log('Pages updated successfully with back buttons.');
