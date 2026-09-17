"use client";

import React, { useState } from 'react';
import { AppShell } from "@/components/AppShell";
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Filter, MoreVertical, 
  Activity, CheckCircle2, XCircle, Clock, ShieldAlert,
  Edit, Trash2, Copy, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_MODULES } from '@/lib/adminModules';

interface ModulePageProps {
  moduleKey: string;
  config?: {
    key: string;
    name: string;
    icon: any;
  };
}

// Data Loader for Admin Module Views (returns empty data until connected to custom admin module endpoints)
const getModuleData = (moduleKey: string): any[] => {
  return [];
};

const getColumnsForModule = (moduleKey: string) => {
  switch (moduleKey) {
    case 'call-times':
      return ['ID', 'Name', 'Start Time', 'End Time', 'Days', 'Status', 'Actions'];
    case 'shifts':
      return ['ID', 'Name', 'Group', 'Agents', 'Type', 'Status', 'Actions'];
    case 'phones':
      return ['ID', 'Extension', 'Protocol', 'Server IP', 'Status', 'Actions'];
    case 'templates':
      return ['ID', 'Name', 'Channel', 'Last Modified', 'Status', 'Actions'];
    case 'ip-lists':
      return ['ID', 'Name', 'IP / Range', 'Type', 'Status', 'Actions'];
    default:
      return ['ID', 'Name', 'Created By', 'Date', 'Status', 'Actions'];
  }
};

export default function ModulePage({ moduleKey, config }: ModulePageProps) {
  const Icon = config?.icon || Activity;
  const moduleName = config?.name || moduleKey;
  
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const moduleData = getModuleData(moduleKey);
  const columns = getColumnsForModule(moduleKey);

  const filteredData = moduleData.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Banner Header Section */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#241A47] via-[#4A3FC9] to-[#7C5CFF] p-[26px_28px] text-white mb-6 shadow-[0_8px_30px_rgba(124,92,255,0.3)]">
          <div className="absolute w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] -top-[160px] -right-[100px] pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_70%)] bottom-[10px] left-[200px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-4">
              <Link 
                href="/admin"
                className="inline-flex items-center gap-2 text-[11px] text-white/70 hover:text-white font-black uppercase tracking-widest transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Administration
              </Link>
              <div className="flex items-center gap-[14px]">
                <div className="w-[50px] h-[50px] shrink-0 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-white leading-none mb-1 font-['Space_Grotesk']">
                    {moduleName}
                  </h1>
                  <p className="text-[11px] text-white/70 font-black tracking-widest uppercase">
                    Manage and configure settings for {moduleName}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{moduleData.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-900">
                {moduleData.filter((d: any) => d.status === 'active').length}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Inactive</p>
              <p className="text-2xl font-bold text-slate-900">
                {moduleData.filter((d: any) => d.status === 'inactive').length}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Recently Updated</p>
              <p className="text-2xl font-bold text-slate-900">{moduleData.length > 0 ? 1 : 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-6">
            {['list', 'settings', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-semibold capitalize relative transition-colors ${
                  activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {activeTab === 'list' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-full"
            >
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={`Search ${moduleName}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      {columns.map((col, idx) => (
                        <th key={idx} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                      filteredData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          {Object.entries(row).map(([key, val], cellIdx) => (
                            <td key={cellIdx} className="px-6 py-4 whitespace-nowrap">
                              {key === 'status' ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  val === 'active' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${val === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  {String(val).toUpperCase()}
                                </span>
                              ) : key === 'id' ? (
                                <span className="font-mono text-sm text-indigo-600 font-semibold">{String(val)}</span>
                              ) : (
                                <span className="text-sm text-slate-700 font-medium">{String(val)}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Copy className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <ShieldAlert className="w-10 h-10 text-slate-300" />
                            <p className="font-medium text-lg">No records found</p>
                            <p className="text-sm text-slate-400">Try adjusting your search query.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination (Visual Only) */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30">
                <p className="text-sm text-slate-500 font-medium">
                  Showing 1 to {filteredData.length} of {filteredData.length} entries
                </p>
                <div className="flex gap-1">
                  <button className="px-3 py-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 text-sm font-medium">Prev</button>
                  <button className="px-3 py-1 border border-slate-300 rounded-lg bg-indigo-600 text-white text-sm font-medium">1</button>
                  <button className="px-3 py-1 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 text-sm font-medium">Next</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Global Settings for {moduleName}</h2>
              <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <h3 className="font-semibold text-slate-800">Enable Module</h3>
                    <p className="text-sm text-slate-500">Turn on or off the features for this module across the entire platform.</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-600 checked:bg-indigo-600 transition-all duration-300 border-slate-300 right-6" defaultChecked />
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Default View Mode</label>
                  <select className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                    <option>List View</option>
                    <option>Grid View</option>
                    <option>Compact View</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-slate-400" />
                <h2 className="text-xl font-bold text-slate-900">Activity Logs</h2>
              </div>
              <div className="space-y-4">
                <div className="p-8 text-center text-slate-400 text-sm">
                  No activity logs recorded for this module.
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Modal Overlay */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Create New {moduleName}</h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Name / Identifier</label>
                  <input type="text" placeholder="Enter name..." className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <select className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea rows={3} placeholder="Add some notes..." className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"></textarea>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 rounded-xl transition-all"
                >
                  Save & Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .toggle-checkbox:checked {
          right: 0;
          border-color: #4f46e5;
          background-color: #4f46e5;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #818cf8;
        }
        .toggle-checkbox {
          right: 0;
          z-index: 1;
          transition: all 0.3s;
        }
      `}} />
    </AppShell>
  );
}
