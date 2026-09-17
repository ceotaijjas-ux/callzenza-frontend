"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import FlowSteps from "@/components/leads/FlowSteps";
import KpiCards from "@/components/leads/KpiCards";
import ListCard from "@/components/leads/ListCard";
import LeadTable from "@/components/leads/LeadTable";
import ConfirmDialog from "@/components/leads/ConfirmDialog";
import CreateListModal from "@/components/leads/CreateListModal";
import {
  fetchRecycleLists,
  fetchKpis,
  fetchLeadsForList,
  recycleLeads,
  createRecycleList,
  exportRecycleListCsv,
  RecycleList,
  KpiItem,
  RecycleLead,
  CreateRecycleListPayload,
} from "@/lib/services/lead-recycle.service";
import { campaignService, Campaign } from "@/lib/services/campaign.service";
import {
  RefreshCw,
  Plus,
  ArrowLeft,
  Download,
  RotateCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  UserCheck,
  Sparkles,
  Play,
  PhoneCall,
  CheckCircle2,
  X,
} from "lucide-react";

const FLOW_STEPS = [
  "1 Call Disposition",
  "2 Recycle List",
  "3 Campaign",
  "4 Recycle",
  "5 Hopper",
];

export default function LeadRecyclePage() {
  const [lists, setLists] = useState<RecycleList[]>([]);
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);

  // Filters
  const [query, setQuery] = useState("");
  const [disposition, setDisposition] = useState("");
  const [campaign, setCampaign] = useState("");
  const [status, setStatus] = useState("");

  // Views & Detail state
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeList, setActiveList] = useState<RecycleList | null>(null);
  const [leads, setLeads] = useState<RecycleLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Assign & Recycle controls
  const [targetCampaign, setTargetCampaign] = useState("");
  const [targetLane, setTargetLane] = useState("Auto Route to Hopper");
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Start Campaign Process with Recycle List Modal
  const [showStartCampaignModal, setShowStartCampaignModal] = useState(false);
  const [modalListId, setModalListId] = useState("");
  const [modalTargetCampaign, setModalTargetCampaign] = useState("");
  const [modalTargetLane, setModalTargetLane] = useState("Auto Route to Hopper");
  const [autoStartDialer, setAutoStartDialer] = useState(true);
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);
  const [processStartedSuccessfully, setProcessStartedSuccessfully] = useState(false);

  const router = useRouter();
  const campaignBarRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [listsData, kpisData, campsData] = await Promise.all([
        fetchRecycleLists({ query, disposition, campaign, status }).catch((e) => {
          console.warn("fetchRecycleLists note:", e?.message || e);
          return null;
        }),
        fetchKpis().catch((e) => {
          console.warn("fetchKpis note:", e?.message || e);
          return null;
        }),
        campaignService.list().catch((e) => {
          console.warn("campaignService.list note:", e?.message || e);
          return null;
        }),
      ]);
      if (listsData) setLists(listsData);
      if (kpisData) setKpis(kpisData);
      if (campsData) setCampaignsList(campsData);
    } catch (err: any) {
      console.warn("loadData warning:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query, disposition, campaign, status]);

  const eligibleCount = useMemo(() => {
    return leads.filter((l) => l.eligibility !== "Not Eligible").length;
  }, [leads]);

  const flowActiveIndex = useMemo(() => {
    if (processStartedSuccessfully) return 4; // Step 5: Hopper active
    if (view === "list") return 1; // Step 2: Recycle List is active
    if (!targetCampaign || selectedIds.size === 0) return 2; // Step 3: Campaign is active
    return 3; // Step 4: Ready to Recycle
  }, [view, targetCampaign, selectedIds.size, processStartedSuccessfully]);

  const handleStepClick = (idx: number, stepName: string) => {
    switch (stepName) {
      case "Call Disposition":
        router.push("/settings?tab=dispositions");
        break;

      case "Recycle List":
        if (view === "detail") {
          backToLists();
        } else {
          loadData();
          showToast("Recycle lists reloaded");
        }
        break;

      case "Campaign":
        // DO NOT navigate to /campaigns!
        // Open the Start Campaign Process dialog with recycled leads directly!
        {
          const defaultListId = activeList ? activeList.id : (lists[0]?.id || "");
          const defaultListObj = lists.find((l) => l.id === defaultListId) || activeList;
          setModalListId(defaultListId);
          setModalTargetCampaign(targetCampaign || defaultListObj?.campaign || (campaignsList[0]?.name || ""));
          setModalTargetLane(targetLane || "Auto Route to Hopper");
          setShowStartCampaignModal(true);
        }
        break;

      case "Recycle":
        if (view === "detail") {
          handleRecycleSelected();
        } else {
          if (lists.length > 0) {
            openList(lists[0]);
            showToast("Select leads and click Recycle Selected");
          } else {
            showToast("Please open a recycle list to recycle leads");
          }
        }
        break;

      case "Hopper":
        router.push("/leads/hopper");
        break;

      default:
        break;
    }
  };

  const openList = async (list: RecycleList) => {
    setActiveList(list);
    const defaultCamp = list.campaign && list.campaign !== "All Campaigns" ? list.campaign : "";
    setTargetCampaign(defaultCamp);
    setTargetLane("Auto Route to Hopper");
    setShowConfirm(false);
    try {
      const data = await fetchLeadsForList(list.id);
      setLeads(data);
      // Automatically pre-select all eligible leads upon opening
      const eligible = data.filter((l) => l.eligibility !== "Not Eligible");
      setSelectedIds(new Set(eligible.map((l) => l.id)));
      setView("detail");
    } catch (err) {
      console.error("Failed to fetch leads for list:", err);
      showToast("Error loading leads for this list");
    }
  };

  const backToLists = () => {
    setView("list");
    setActiveList(null);
  };

  const selectAllEligible = () => {
    const eligible = leads.filter((l) => l.eligibility !== "Not Eligible");
    setSelectedIds(new Set(eligible.map((l) => l.id)));
  };

  const selectAll = () => {
    setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleLead = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(leads.map((l) => l.id)) : new Set());
  };

  const handleRecycleSelected = () => {
    const n = selectedIds.size;
    if (!n) {
      showToast("Select at least one lead to recycle");
      return;
    }
    if (!targetCampaign) {
      showToast("Select a campaign before recycling");
      return;
    }
    setConfirmText(
      `${n} lead(s) will be assigned to ${targetCampaign} and moved into ${targetLane}. This is the actual recycle action.`
    );
    setShowConfirm(true);
  };

  const handleConfirmRecycle = async () => {
    setShowConfirm(false);
    try {
      const result = await recycleLeads({
        leadIds: Array.from(selectedIds),
        campaign: targetCampaign,
        lane: targetLane,
      });
      showToast(
        `${result.count} leads recycled successfully → ${targetCampaign} → Lead Hopper`
      );
      // Reload KPIs and return to lists view
      loadData();
      setView("list");
      setActiveList(null);
    } catch (err: any) {
      showToast(err.message || "Failed to recycle leads");
    }
  };

  const handleStartCampaignProcess = async (
    customListId?: string,
    customCampName?: string,
    customLane?: string,
    shouldStartDialer: boolean = true
  ) => {
    const listId = customListId || modalListId || (activeList ? activeList.id : (lists[0]?.id || ""));
    const campName = customCampName || modalTargetCampaign || targetCampaign;
    const lane = customLane || modalTargetLane || targetLane || "Auto Route to Hopper";

    if (!campName) {
      showToast("Please select a target campaign first");
      return;
    }

    try {
      setIsStartingCampaign(true);

      // 1. Gather lead IDs
      let leadIdsToProcess: string[] = [];
      if (view === "detail" && activeList && activeList.id === listId && selectedIds.size > 0) {
        leadIdsToProcess = Array.from(selectedIds);
      } else {
        const fetchedLeads = await fetchLeadsForList(listId);
        const eligible = fetchedLeads.filter((l) => l.eligibility !== "Not Eligible");
        leadIdsToProcess = (eligible.length > 0 ? eligible : fetchedLeads).map((l) => l.id);
      }

      if (leadIdsToProcess.length === 0) {
        showToast("No leads available in this recycle list to process");
        setIsStartingCampaign(false);
        return;
      }

      // 2. Recycle leads into Hopper & Target Campaign
      const recycleRes = await recycleLeads({
        leadIds: leadIdsToProcess,
        campaign: campName,
        lane: lane,
      });

      // 3. Resolve target campaign and start campaign & dialer
      const campObj = campaignsList.find(
        (c) => c.name.toLowerCase() === campName.toLowerCase() || c.id === campName
      );

      if (campObj) {
        try {
          await campaignService.start(campObj.id);
        } catch (e: any) {
          console.warn("Campaign start response note:", e);
        }

        if (shouldStartDialer) {
          try {
            await campaignService.startDialer(campObj.id);
          } catch (e: any) {
            console.warn("Dialer start response note:", e);
          }
        }
      }

      setProcessStartedSuccessfully(true);
      setShowStartCampaignModal(false);
      showToast(`Campaign '${campName}' process started successfully with ${recycleRes.count} recycled leads!`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to start campaign process");
    } finally {
      setIsStartingCampaign(false);
    }
  };

  const handleCreateList = async (payload: CreateRecycleListPayload) => {
    setShowCreateModal(false);
    try {
      await createRecycleList(payload);
      showToast("Recycle lead list created from disposition");
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to create recycle list");
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-[200] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-extrabold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Lead Recycle</span>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Automated Pipeline
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Recycle eligible leads created from call disposition lead groups.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                loadData();
                showToast("Lead lists refreshed");
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Recycle List</span>
            </button>
          </div>
        </div>

        {/* Flow Steps Banner */}
        <FlowSteps
          title="Actual Recycle Flow"
          subtitle="Only leads with a recycle-enabled disposition enter the recycle lists."
          steps={FLOW_STEPS}
          activeIndex={flowActiveIndex}
          onStepClick={handleStepClick}
        />

        {/* KPI Cards */}
        <KpiCards items={kpis} />

        {/* VIEW 1: RECYCLE LISTS GRID */}
        {view === "list" && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Search lead list name, campaign or disposition..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value)}
                  >
                    <option value="">All Dispositions</option>
                    <option value="Call Back">Call Back</option>
                    <option value="Voice Mail">Voice Mail</option>
                    <option value="Others">Others</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Busy</option>
                  </select>
                </div>

                <div>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                  >
                    <option value="">All Campaigns</option>
                    {campaignsList.map((camp) => (
                      <option key={camp.id} value={camp.name}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="READY">Ready</option>
                    <option value="REVIEW">Review</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="RECYCLED">Recycled</option>
                  </select>

                  <button
                    onClick={() => {
                      setQuery("");
                      setDisposition("");
                      setCampaign("");
                      setStatus("");
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Lists Grid */}
            {lists.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-[40px_1fr_1fr_1fr_80px_80px_80px_100px_100px_120px] gap-4 items-center p-4 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider select-none">
                  <div className="text-center"></div>
                  <div>Lead List</div>
                  <div>Disposition</div>
                  <div>Campaign</div>
                  <div className="text-center">Total</div>
                  <div className="text-center">Pending</div>
                  <div className="text-center">Recycled</div>
                  <div className="text-center">Created</div>
                  <div className="text-center">Status</div>
                  <div className="text-center">Action</div>
                </div>
                <div className="flex flex-col">
                  {lists.map((list) => (
                    <ListCard key={list.id} list={list} onOpen={openList} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800">No Recycle Lists Found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LIST DETAIL & RECYCLE VIEW */}
        {view === "detail" && activeList && (
          <div className="space-y-5 animate-in fade-in">
            {/* Detail Head */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={backToLists}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Recycle Lists</span>
                </button>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeList.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {leads.length} leads eligible from {activeList.reason} disposition
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={async () => {
                    try {
                      await exportRecycleListCsv(activeList.id);
                      showToast("Lead list exported to CSV successfully!");
                    } catch (err: any) {
                      showToast(err.message || "Failed to export CSV");
                    }
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => handleStartCampaignProcess(activeList.id, targetCampaign, targetLane, true)}
                  disabled={isStartingCampaign}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isStartingCampaign ? "Starting..." : "Start Campaign Process"}</span>
                </button>
                <button
                  onClick={handleRecycleSelected}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Recycle Selected ({selectedIds.size})</span>
                </button>
              </div>
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Total Leads</span>
                <div className="text-xl font-black text-slate-900 mt-1">{leads.length}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Selected</span>
                <div className="text-xl font-black text-indigo-600 mt-1">{selectedIds.size}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Eligible</span>
                <div className="text-xl font-black text-emerald-600 mt-1">{eligibleCount}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Status</span>
                <div className="text-xl font-black text-emerald-600 mt-1">Ready</div>
              </div>
            </div>

            {/* Assign Campaign & Hopper Destination Bar */}
            <div
              ref={campaignBarRef}
              id="step-campaign-bar"
              className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-xl p-5 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-200 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  Step 3 — Assign Campaign &amp; Start Campaign Process
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Select leads, choose target campaign, and launch automated calling process directly without leaving this flow.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-400"
                  value={targetCampaign}
                  onChange={(e) => setTargetCampaign(e.target.value)}
                >
                  <option value="">Select Campaign *</option>
                  {campaignsList.map((camp) => (
                    <option key={camp.id} value={camp.name}>
                      {camp.name} ({camp.status})
                    </option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-400"
                  value={targetLane}
                  onChange={(e) => setTargetLane(e.target.value)}
                >
                  <option value="Auto Route to Hopper">Auto Route to Hopper</option>
                  <option value="Priority Queue">Priority Queue</option>
                  <option value="Callback Queue">Callback Queue</option>
                  <option value="General Queue">General Queue</option>
                </select>

                <button
                  onClick={() => handleStartCampaignProcess(activeList.id, targetCampaign, targetLane, true)}
                  disabled={isStartingCampaign}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Recycle leads and start campaign process immediately"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isStartingCampaign ? "Starting..." : "START CAMPAIGN PROCESS →"}</span>
                </button>

                <button
                  onClick={handleRecycleSelected}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  title="Only recycle leads to hopper without starting dialer"
                >
                  Recycle to Hopper Only
                </button>
              </div>
            </div>

            {/* Quick Action Bar for Selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Quick Selection:
                </span>
                <button
                  type="button"
                  onClick={selectAllEligible}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Select All Eligible ({eligibleCount})</span>
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select All ({leads.length})</span>
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Deselect All</span>
                </button>
              </div>

              <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black">
                  {selectedIds.size} of {leads.length} selected
                </span>
              </div>
            </div>

            {/* Selectable Lead Table */}
            <LeadTable
              leads={leads}
              reason={activeList.reason}
              selectedIds={selectedIds}
              onToggle={toggleLead}
              onToggleAll={toggleAll}
            />

            {/* Confirm Dialog */}
            {showConfirm && (
              <ConfirmDialog
                text={confirmText}
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleConfirmRecycle}
              />
            )}
          </div>
        )}

        {/* Start Campaign Process Modal */}
        {showStartCampaignModal && (
          <div className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Play className="w-5 h-5 fill-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Start Campaign Process</h3>
                    <p className="text-xs text-indigo-200 font-medium mt-0.5">
                      Launch campaign dialing with your recycled lead list
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStartCampaignModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* 1. Select Recycle List */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    1. Select Recycled Lead List
                  </label>
                  {lists.length > 0 ? (
                    <select
                      value={modalListId}
                      onChange={(e) => {
                        setModalListId(e.target.value);
                        const chosen = lists.find((l) => l.id === e.target.value);
                        if (chosen && chosen.campaign && chosen.campaign !== "All Campaigns") {
                          setModalTargetCampaign(chosen.campaign);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {lists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title} — {l.pending} pending ({l.total} total)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      No recycle lists created yet. Please create a recycle list first.
                    </div>
                  )}
                </div>

                {/* 2. Select Target Campaign */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    2. Target Campaign to Run
                  </label>
                  <select
                    value={modalTargetCampaign}
                    onChange={(e) => setModalTargetCampaign(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Campaign *</option>
                    {campaignsList.map((camp) => (
                      <option key={camp.id} value={camp.name}>
                        {camp.name} ({camp.status}) — {camp.agent_type || "Campaign"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Recycled leads will be assigned to this campaign and queued for automated calling.
                  </p>
                </div>

                {/* 3. Destination Queue / Lane */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    3. Hopper Queue Destination
                  </label>
                  <select
                    value={modalTargetLane}
                    onChange={(e) => setModalTargetLane(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Auto Route to Hopper">Auto Route to Hopper</option>
                    <option value="Priority Queue">Priority Queue (Highest priority)</option>
                    <option value="Callback Queue">Callback Queue (Follow-ups)</option>
                    <option value="General Queue">General Queue</option>
                  </select>
                </div>

                {/* 4. Auto Start Dialer Toggle */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">Start Campaign &amp; Predictive Dialer</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Sets campaign to ACTIVE and starts automated dialer immediately
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoStartDialer}
                    onChange={(e) => setAutoStartDialer(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowStartCampaignModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isStartingCampaign || !modalTargetCampaign || lists.length === 0}
                  onClick={() => handleStartCampaignProcess(modalListId, modalTargetCampaign, modalTargetLane, autoStartDialer)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isStartingCampaign ? "Launching Process..." : "Launch Campaign Process"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create List Modal */}
        {showCreateModal && (
          <CreateListModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateList}
          />
        )}
      </div>
    </AppShell>
  );
}
