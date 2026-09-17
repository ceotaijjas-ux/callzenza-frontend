"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { callService } from "@/lib/services/call.service";
import {
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";

interface DispositionItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  color: string;
  is_selectable: boolean;
  is_active: boolean;
  is_system: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function DispositionsTab() {
  const [dispositions, setDispositions] = useState<DispositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DispositionItem | null>(null);
  const [formData, setFormData] = useState({
    status_name: "",
    status_code: "",
    description: "",
    category: "POSITIVE",
    color: "emerald",
    is_selectable: true,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<DispositionItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await callService.adminGetDispositions();
      setDispositions(data);
    } catch (err: any) {
      console.error("Failed to load dispositions:", err);
      showToast("Error loading dispositions from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      status_name: "",
      status_code: "",
      description: "",
      category: "POSITIVE",
      color: "emerald",
      is_selectable: true,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: DispositionItem) => {
    setEditingItem(item);
    setFormData({
      status_name: item.name,
      status_code: item.code,
      description: item.description,
      category: item.category,
      color: item.color || "indigo",
      is_selectable: item.is_selectable,
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.status_name.trim()) {
      showToast("Disposition name is required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await callService.adminUpdateDisposition(editingItem.id, formData);
        showToast(`Disposition "${formData.status_name}" updated successfully!`);
      } else {
        await callService.adminCreateDisposition(formData);
        showToast(`New disposition "${formData.status_name}" added to Agent Dashboard!`);
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to save disposition");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: DispositionItem) => {
    try {
      const nextActive = !item.is_active;
      await callService.adminUpdateDisposition(item.id, { is_active: nextActive });
      setDispositions((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, is_active: nextActive } : d))
      );
      showToast(
        `"${item.name}" is now ${nextActive ? "ENABLED" : "DISABLED"} on Agent Dashboard`
      );
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await callService.adminDeleteDisposition(deleteTarget.id);
      showToast(`Disposition "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete disposition");
    }
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        "Are you sure you want to restore default call dispositions? This will reset custom entries."
      )
    ) {
      return;
    }
    try {
      await callService.adminResetDefaults();
      showToast("Dispositions restored to factory defaults.");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to reset defaults");
    }
  };

  // Filtered List
  const filtered = dispositions.filter((d) => {
    const matchesCategory =
      categoryFilter === "ALL" || d.category.toUpperCase() === categoryFilter.toUpperCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      d.name.toLowerCase().includes(query) ||
      d.code.toLowerCase().includes(query) ||
      (d.description && d.description.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "POSITIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CALLBACK":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "NEGATIVE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "SYSTEM":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[200] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-extrabold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Call Dispositions &amp; Outcomes
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Agent Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage call disposition outcomes. Dispositions created or updated here appear instantly in the Voice Agent Dashboard call wrap-up screen.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/voice-agent/dashboard"
            target="_blank"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>Test in Agent</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Disposition</span>
          </button>
        </div>
      </div>

      {/* Live Agent Dropdown Preview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice Agent Dashboard Preview</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Here is what Voice Agents see in the disposition dropdown during call closure:
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl">
          <span className="text-xs font-bold text-slate-400">Agent Dropdown:</span>
          <select
            className="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
            defaultValue={dispositions[0]?.name || "Sale / Success"}
          >
            {dispositions
              .filter((d) => d.is_active && d.is_selectable)
              .map((d) => (
                <option key={d.id} value={d.name}>
                  [{d.code}] {d.name}
                </option>
              ))}
            <option value="Others">Others</option>
          </select>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            {dispositions.filter((d) => d.is_active && d.is_selectable).length} active
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search disposition name, code, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to standard default dispositions"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
            Category:
          </span>
          {["ALL", "POSITIVE", "CALLBACK", "NEGATIVE", "SYSTEM", "GENERAL"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dispositions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th className="p-3.5 w-24">Status Code</th>
                <th className="p-3.5">Disposition Name &amp; Description</th>
                <th className="p-3.5 w-32">Category</th>
                <th className="p-3.5 w-28 text-center">Voice Agent</th>
                <th className="p-3.5 w-28 text-center">Status</th>
                <th className="p-3.5 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading call dispositions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No dispositions found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Code */}
                    <td className="p-3.5">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 inline-block shadow-2xs">
                        {item.code}
                      </span>
                    </td>

                    {/* Name & Description */}
                    <td className="p-3.5">
                      <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.is_system && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            System
                          </span>
                        )}
                      </div>
                      {item.description ? (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.description}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          Standard disposition outcome
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md border font-extrabold text-[10px] uppercase tracking-wider ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Selectable in Voice Agent */}
                    <td className="p-3.5 text-center">
                      {item.is_selectable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          <span>Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Hidden</span>
                        </span>
                      )}
                    </td>

                    {/* Active Toggle */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        ></span>
                        <span>{item.is_active ? "Active" : "Disabled"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit disposition details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete disposition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingItem ? "Edit Call Disposition" : "Add New Call Disposition"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instantly synced with Voice Agent Dashboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Disposition Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Product Demo"
                  value={formData.status_name}
                  onChange={(e) => setFormData({ ...formData, status_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DEMO"
                    value={formData.status_code}
                    onChange={(e) =>
                      setFormData({ ...formData, status_code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="POSITIVE">Positive / Success</option>
                    <option value="CALLBACK">Callback / Retry</option>
                    <option value="NEGATIVE">Negative / DNC</option>
                    <option value="SYSTEM">System / Audio</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description &amp; Guidance for Agents
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide short instructions for voice agents when to select this disposition..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_selectable}
                    onChange={(e) =>
                      setFormData({ ...formData, is_selectable: e.target.checked })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">
                    Show in Voice Agent Dispo Dropdown
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Status is Active</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? "Saving..." : editingItem ? "Save Changes" : "Create Disposition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base">Delete Disposition?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong>&quot;{deleteTarget.name}&quot;</strong>? It will no longer appear in the Voice Agent Dashboard.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
