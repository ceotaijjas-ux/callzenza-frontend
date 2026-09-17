"use client";

import React from 'react';
import Link from 'next/link';
import { ALL_MODULES } from "@/lib/adminModules";
import { AppShell } from "@/components/AppShell";
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.email === "admin@callzenza.com";

  // Filter modules:
  // 1. Tenancy module MUST NEVER be visible to tenant admins ("administration la tenancy la theriya kudathu")
  // 2. If user has scoped permissions, only show modules that are permitted
  const visibleModules = ALL_MODULES.filter((tile) => {
    if (tile.key === "tenants") {
      return isSuperAdmin;
    }
    if (user?.permissions && Object.keys(user.permissions).length > 0 && !isSuperAdmin) {
      if (user.permissions[tile.key] !== undefined) {
        return !!user.permissions[tile.key];
      }
      return !!user.permissions.admin;
    }
    return true;
  });
  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Administration
          </h1>
          <p className="text-slate-500 font-medium">
            Manage system configurations, users, and platform settings.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleModules.map((tile) => (
            <Link 
              key={tile.key} 
              href={`/admin/${tile.key}`}
              className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300 gap-3 text-center"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-110 transition-all duration-300">
                <tile.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">
                {tile.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
