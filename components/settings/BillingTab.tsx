"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { CreditCard, Receipt, FileText, Settings as PrefIcon, CheckCircle2, AlertCircle, Sparkles, Wallet, X, Check, Shield, Coins, Clock, UserCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { adminService, AdminUser } from "@/lib/services/admin.service";
import { jsPDF } from "jspdf";

interface BillingPreferences {
  billing_company_name: string;
  billing_email: string;
  billing_address: string;
  billing_tax_id: string;
  wallet_balance?: number;
  current_plan?: string;
}

interface Invoice {
  id: string;
  date: string;
  desc: string;
  amount: string;
  status: string;
}

const PLANS = [
  {
    name: "Starter Plan",
    price: "$49",
    leads: "1,000",
    minutes: "200",
    desc: "Perfect for small projects or testing qualify flows.",
    popular: false,
  },
  {
    name: "Growth Plan",
    price: "$149",
    leads: "5,000",
    minutes: "1,000",
    desc: "Optimized for growing sales teams requiring full CRM integrations.",
    popular: true,
  },
  {
    name: "Pro Plan",
    price: "$399",
    leads: "15,000",
    minutes: "3,500",
    desc: "For large campaigns and enterprises with high daily lead volumes.",
    popular: false,
  },
];

export function BillingTab() {
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isAdmin = hydrated && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  const [activeTab, setActiveTab] = useState<"overview" | "payment" | "history" | "preferences">("overview");
  
  // Plan purchase state
  const [hasActivePlan, setHasActivePlan] = useState<boolean>(false);
  const [currentPlanName, setCurrentPlanName] = useState<string>("Free Plan");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingPlan, setPendingPlan] = useState<{name: string, price: string} | null>(null);

  // Preferences State
  const [companyName, setCompanyName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  
  // Wallet billing state
  const [walletAmount, setWalletAmount] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [showGateway, setShowGateway] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<"options" | "card" | "upi" | "processing" | "success">("options");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "">("");

  // Fetch billing preferences or simulated user directory on mount
  useEffect(() => {
    if (!hydrated || !user) return;

    if (isAdmin) {
      setAdminLoading(true);
      adminService.getUsers()
        .then((data) => {
          setAdminUsers(data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setAdminLoading(false));
      setLoading(true);
      apiFetch<BillingPreferences>("/api/businesses/me/billing")
        .then((data) => {
          setCompanyName(data.billing_company_name || "");
          setBillingEmail(data.billing_email || "");
          setBillingAddress(data.billing_address || "");
          setBillingTaxId(data.billing_tax_id || "");
          if (data.current_plan) {
            setCurrentPlanName(data.current_plan);
            setHasActivePlan(data.current_plan !== "Free Plan");
          }
          if (data.wallet_balance !== undefined) {
            setWalletBalance(data.wallet_balance);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));

      // Fetch invoice records from DB
      apiFetch<any[]>("/api/businesses/me/billing/invoices")
        .then((data) => {
          const mapped = data.map((inv: any) => ({
            id: inv.id,
            date: inv.date,
            desc: inv.description,
            amount: inv.amount,
            status: inv.status,
          }));
          setInvoices(mapped);
        })
        .catch((err) => setError(err.message));
    }
  }, [hydrated, user, isAdmin]);

  const handleSelectPlan = (planName: string, price: string) => {
    // Save selection as pending plan
    setPendingPlan({ name: planName, price: price });
    
    // Convert USD plan price to INR equivalent for gateway display
    const numericUSD = Number(price.replace("$", ""));
    const inrValue = numericUSD * 80; // Simple simulation rate (e.g. $149 = ₹11,920)
    setWalletAmount(String(inrValue));
    
    // Redirect visually to payment method view
    setShowPlansModal(false);
    setActiveTab("payment");
    
    // Launch payment gateway automatically
    setGatewayStep("options");
    setShowGateway(true);
  };

  const handleCancelPlan = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch<any>("/api/businesses/me/billing/cancel-plan", {
        method: "DELETE",
      });
      setHasActivePlan(false);
      setCurrentPlanName("Free Plan");
      setSuccess("Subscription cancelled successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to cancel plan");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const downloadPdf = (id: string, date: string, amount: string, desc: string) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Color Palette
      const primaryColor = "#4f46e5"; // Indigo
      const textColor = "#1f2937"; // Gray-800
      const lightTextColor = "#6b7280"; // Gray-500

      // Title / Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor);
      doc.text("CallZenza", 20, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightTextColor);
      doc.text("AI Outbound Calling Platform", 20, 31);
      doc.text("Email: support@callzenza.com", 20, 36);

      // Invoice Meta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(textColor);
      doc.text("INVOICE", 140, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(lightTextColor);
      doc.text(`Invoice ID: ${id}`, 140, 31);
      doc.text(`Date: ${date}`, 140, 36);
      doc.text(`Status: Paid`, 140, 41);

      // Horizontal separator line
      doc.setDrawColor(229, 231, 235); // border-gray-200
      doc.setLineWidth(0.5);
      doc.line(20, 50, 190, 50);

      // Billing details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textColor);
      doc.text("Billed To:", 20, 60);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      doc.text(billingEmail || user?.email || "Valued Customer", 20, 66);
      if (companyName) {
        doc.text(companyName, 20, 71);
      }
      if (billingAddress) {
        // split text into multiple lines if long
        const addressLines = doc.splitTextToSize(billingAddress, 80);
        doc.text(addressLines, 20, 76);
      }

      // Table Header
      doc.setFillColor(243, 244, 246); // bg-gray-100
      doc.rect(20, 100, 170, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(textColor);
      doc.text("Description", 25, 105);
      doc.text("Qty", 120, 105);
      doc.text("Rate", 140, 105);
      doc.text("Amount", 165, 105);

      // Table content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      
      const descLines = doc.splitTextToSize(desc, 90);
      doc.text(descLines, 25, 115);
      doc.text("1", 120, 115);
      doc.text(amount, 140, 115);
      doc.text(amount, 165, 115);

      // Table footer line
      doc.line(20, 130, 190, 130);

      // Summary / Totals
      doc.setFont("helvetica", "bold");
      doc.text("Total Paid:", 120, 140);
      doc.text(amount, 165, 140);

      // Footer notes
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(lightTextColor);
      doc.text("Thank you for choosing CallZenza! If you have any billing inquiries, please contact support@callzenza.com.", 20, 270);

      doc.save(`Invoice_${id}.pdf`);
    } catch (err: any) {
      setError(err.message || "Failed to generate PDF");
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await apiFetch<BillingPreferences>("/api/businesses/me/billing", {
        method: "PUT",
        body: JSON.stringify({
          billing_company_name: companyName,
          billing_email: billingEmail,
          billing_address: billingAddress,
          billing_tax_id: billingTaxId,
        }),
      });
      setSuccess("Billing preferences updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };



  // Triggers mock redirection to Checkout
  const handleOpenGateway = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const amount = Number(walletAmount);
    if (!walletAmount.trim() || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }
    setGatewayStep("options");
    setShowGateway(true);
  };

  const handleSimulatePayment = async () => {
    setGatewayStep("processing");
    const addedAmount = Number(walletAmount);
    let invoiceDesc = `CallZenza Wallet Credits (₹${addedAmount.toFixed(2)})`;
    if (pendingPlan) {
      invoiceDesc = `CallZenza ${pendingPlan.name} Subscription (Wallet Load + Plan Activation)`;
    }

    try {
      const billingData = await apiFetch<any>("/api/businesses/me/billing/payment", {
        method: "POST",
        body: JSON.stringify({
          amount_added: addedAmount,
          plan_name: pendingPlan ? pendingPlan.name : null,
          invoice_description: invoiceDesc,
        }),
      });

      if (billingData.wallet_balance !== undefined) {
        setWalletBalance(billingData.wallet_balance);
      }
      if (billingData.current_plan) {
        setCurrentPlanName(billingData.current_plan);
        setHasActivePlan(billingData.current_plan !== "Free Plan");
      }
      setPendingPlan(null);

      // Re-fetch invoices
      const invoicesData = await apiFetch<any[]>("/api/businesses/me/billing/invoices");
      const mapped = invoicesData.map((inv: any) => ({
        id: inv.id,
        date: inv.date,
        desc: inv.description,
        amount: inv.amount,
        status: inv.status,
      }));
      setInvoices(mapped);

      setGatewayStep("success");
      setTimeout(() => {
        setShowGateway(false);
        setWalletAmount("");
        setSuccess(`Payment successful! Credits loaded and plan updated.`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
      setShowGateway(false);
    }
  };

  const getUserPlanBilling = (u: AdminUser) => {
    return {
      planName: (u as any).current_plan || "Free Plan",
      balance: (u as any).wallet_balance || 0,
      leadLimit: (u as any).lead_limit || 50,
      leadUsed: (u as any).lead_used || 0,
      minuteLimit: (u as any).minute_limit || 10,
      minuteUsed: (u as any).minute_used || 0
    };
  };

  const baseAmount = Number(walletAmount) || 0;
  const gstAmount = baseAmount * 0.18;
  const totalAmount = baseAmount + gstAmount;

  if (isAdmin) {
    const filteredUsers = adminUsers.filter(u => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN");

    return (
      <div className="animate-in fade-in duration-300">
        {/* Global Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-5 flex flex-col justify-between shadow-sm border border-gray-100 bg-white rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Wallets Value</p>
            <div className="flex items-baseline gap-1 mt-2">
              <Coins className="h-6 w-6 text-indigo-500" />
              <span className="text-2xl font-bold text-gray-900">
                ₹{filteredUsers.reduce((sum, u) => sum + getUserPlanBilling(u).balance, 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Combined credits across all users</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between shadow-sm border border-gray-100 bg-white rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Paid Subscriptions</p>
            <div className="flex items-baseline gap-1 mt-2">
              <UserCheck className="h-6 w-6 text-emerald-500" />
              <span className="text-2xl font-bold text-gray-900">
                {filteredUsers.filter(u => getUserPlanBilling(u).planName !== "Free Plan").length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Users on Starter, Growth, or Pro plans</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between shadow-sm border border-gray-100 bg-white rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Leads Quota</p>
            <div className="flex items-baseline gap-1 mt-2">
              <FileText className="h-6 w-6 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">
                {filteredUsers.reduce((sum, u) => sum + getUserPlanBilling(u).leadLimit, 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total active quota allocated</p>
          </Card>

          <Card className="p-5 flex flex-col justify-between shadow-sm border border-gray-100 bg-white rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total AI Call Minutes</p>
            <div className="flex items-baseline gap-1 mt-2">
              <Clock className="h-6 w-6 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">
                {filteredUsers.reduce((sum, u) => sum + getUserPlanBilling(u).minuteLimit, 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total call minutes allocated</p>
          </Card>
        </div>

        {/* Admin Billing Directory Table */}
        <Card className="p-6 shadow-sm border border-gray-200/85 rounded-2xl bg-white">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-500" /> Global Accounts Billing Directory
          </h2>
          {adminLoading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold uppercase text-gray-400">
                    <th className="pb-3 font-semibold">User Email / Account</th>
                    <th className="pb-3 font-semibold">Wallet Balance</th>
                    <th className="pb-3 font-semibold">Current Plan</th>
                    <th className="pb-3 font-semibold text-center">Lead Qualification Quota</th>
                    <th className="pb-3 font-semibold text-center">AI Voice Calling Minutes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredUsers.map((u) => {
                    const billing = getUserPlanBilling(u);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
                        <td className="py-3.5">
                          <p className="font-semibold text-gray-900">{u.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Role: {u.role} · ID: {u.id.substring(0, 8)}...</p>
                        </td>
                        <td className="py-3.5 font-semibold text-gray-900">
                          ₹{billing.balance.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            billing.planName === "Pro Plan" ? "bg-blue-100 text-blue-800" :
                            billing.planName === "Growth Plan" ? "bg-purple-100 text-purple-800" :
                            billing.planName === "Starter Plan" ? "bg-emerald-100 text-emerald-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {billing.planName}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="max-w-[140px] mx-auto text-center">
                            <span className="text-xs font-bold text-gray-700">{billing.leadUsed} / {billing.leadLimit}</span>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (billing.leadUsed / billing.leadLimit) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="max-w-[140px] mx-auto text-center">
                            <span className="text-xs font-bold text-gray-700">{billing.minuteUsed} / {billing.minuteLimit} mins</span>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className="bg-purple-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (billing.minuteUsed / billing.minuteLimit) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => { setActiveTab("overview"); setError(null); setSuccess(null); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => { setActiveTab("payment"); setError(null); setSuccess(null); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === "payment"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Payment Method
        </button>
        <button
          onClick={() => { setActiveTab("history"); setError(null); setSuccess(null); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Billing History
        </button>
        <button
          onClick={() => { setActiveTab("preferences"); setError(null); setSuccess(null); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === "preferences"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Preferences
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6 max-w-4xl">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Balance</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <Wallet className="h-6 w-6 text-emerald-600" /> ₹{walletBalance.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-500 mt-2">Available calling & lead credits</p>
              </div>
              <div className="mt-4 border-t pt-3">
                <button onClick={() => setActiveTab("payment")} className="text-xs text-indigo-600 hover:underline font-medium">
                  + Add Credits
                </button>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Plan</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {currentPlanName}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {hasActivePlan ? "Qualified leads & 24/7 AI qualifications" : "Basic setup, no active integrations"}
                </p>
              </div>
              <div className="mt-6 border-t pt-4">
                <span className="text-lg font-bold text-indigo-600">
                  {currentPlanName === "Starter Plan" && "$49"}
                  {currentPlanName === "Growth Plan" && "$149"}
                  {currentPlanName === "Pro Plan" && "$399"}
                  {currentPlanName === "Free Plan" && "$0"}
                </span>
                <span className="text-xs text-gray-500"> / month</span>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lead Qualification Quota</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {currentPlanName === "Starter Plan" && "0 / 1,000"}
                {currentPlanName === "Growth Plan" && "1,420 / 5,000"}
                {currentPlanName === "Pro Plan" && "0 / 15,000"}
                {currentPlanName === "Free Plan" && "0 / 50"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Leads processed this month</p>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: currentPlanName === "Growth Plan" ? "28%" : "0%"
                  }} 
                />
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Voice Calling Minutes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {currentPlanName === "Starter Plan" && "0 / 200"}
                {currentPlanName === "Growth Plan" && "450 / 1,000"}
                {currentPlanName === "Pro Plan" && "0 / 3,500"}
                {currentPlanName === "Free Plan" && "0 / 10"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Minutes connected</p>
              <div className="w-full bg-gray-200 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: currentPlanName === "Growth Plan" ? "45%" : "0%"
                  }} 
                />
              </div>
            </Card>
          </div>

          <Card className="p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Subscription Summary
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {hasActivePlan ? (
                <>Your next billing period begins on <strong>September 10, 2026</strong>. Additional minutes or lead packages will be charged on your regular monthly card invoice.</>
              ) : (
                <>Unlock full power: qualify thousands of leads, enable outbound voice bots, sync custom TWILIO numbers, and view complete transaction history.</>
              )}
            </p>
            <div className="flex gap-3">
              {hasActivePlan && (
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleCancelPlan}>
                  Cancel Subscription
                </Button>
              )}
              <Button onClick={() => setShowPlansModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Upgrade Plan
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Method Tab */}
      {activeTab === "payment" && (
        <div className="max-w-xl space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Add Wallet Credits</h2>
            
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4 text-sm font-medium">
              You will be redirected to a secure payment gateway to complete your transaction
            </div>

            <div className="space-y-4">
              <Input
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="Enter amount in ₹ (+18% GST would be applicable)"
                className="w-full border-gray-300 rounded-lg py-3 px-4 focus:ring-black focus:border-black"
              />

              <button
                onClick={handleOpenGateway}
                className="w-full bg-black hover:bg-black/90 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center text-sm shadow-md"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing History Tab */}
      {activeTab === "history" && (
        <div className="max-w-4xl space-y-4">
          {invoices.length > 0 ? (
            <Card className="border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 border-b uppercase">
                      <th className="px-6 py-4">Invoice ID</th>
                      <th className="px-6 py-4">Billing Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-mono text-xs">{inv.id}</td>
                        <td className="px-6 py-4">{inv.date}</td>
                        <td className="px-6 py-4">{inv.desc}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{inv.amount}</td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => downloadPdf(inv.id, inv.date, inv.amount, inv.desc)}
                            className="text-indigo-600 hover:underline flex items-center gap-1 ml-auto text-xs active:scale-95 transition-transform"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <Receipt className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No Billing History</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
                Your transaction history is currently empty. Upgrade your subscription plan or add credits to generate invoices.
              </p>
              <Button onClick={() => setShowPlansModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                View Subscription Plans
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="max-w-2xl">
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <Card className="p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <PrefIcon className="h-5 w-5 text-gray-500" /> Invoice Preferences
              </h3>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Billing Email ID</label>
                <Input
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  type="email"
                  placeholder="billing@acme.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Primary Business Address</label>
                <textarea
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="123 Corporate Blvd, Suite 400, San Francisco, CA 94107"
                  className="w-full min-h-[100px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Business Tax ID / VAT</label>
                <Input
                  value={billingTaxId}
                  onChange={(e) => setBillingTaxId(e.target.value)}
                  placeholder="US-123456789"
                />
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6">
                {loading ? "Saving Changes..." : "Save Preferences"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-50 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" /> Select a Subscription Plan
                </h3>
                <p className="text-xs text-gray-500 mt-1">Upgrade your CallZenza instance to scale qualify actions and calls.</p>
              </div>
              <button 
                onClick={() => setShowPlansModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Plans List Grid */}
            <div className="p-8 grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const isSelected = currentPlanName === plan.name;
                return (
                  <Card 
                    key={plan.name}
                    className={`p-6 bg-white relative flex flex-col justify-between transition-all duration-300 ${
                      plan.popular 
                        ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50" 
                        : "border border-gray-200 shadow-sm hover:border-indigo-400"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.desc}</p>
                      </div>

                      <div className="flex items-baseline">
                        <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                        <span className="text-sm text-gray-500 ml-1">/month</span>
                      </div>

                      <ul className="space-y-2 border-t pt-4 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                          <span><strong>{plan.leads}</strong> Qualified Leads / mo</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                          <span><strong>{plan.minutes}</strong> Outbound Voice Mins</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                          <span>24/7 Qualifications</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                          <span>Automated PDF Invoices</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Button
                        onClick={() => handleSelectPlan(plan.name, plan.price)}
                        className={`w-full font-bold ${
                          isSelected
                            ? "bg-emerald-600 text-white cursor-default"
                            : plan.popular 
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white" 
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                        }`}
                        disabled={isSelected}
                      >
                        {isSelected ? "Current Plan" : plan.name === "Growth Plan" ? "Select Growth" : `Select ${plan.name.split(" ")[0]}`}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* High-Fidelity Mock Payment Gateway Checkout Modal */}
      {showGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">CallZenza Pay</h3>
                <p className="text-xs text-slate-400">Order ID: pay_sim_{Math.floor(Math.random() * 1000000)}</p>
              </div>
              <button 
                onClick={() => setShowGateway(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 space-y-4">
              {/* Order breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Payable Amount</p>
                  <p className="text-xs text-gray-400 mt-1">₹{baseAmount.toFixed(2)} + 18% GST (₹{gstAmount.toFixed(2)})</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {gatewayStep === "options" && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Choose Payment Method</p>
                  <button 
                    onClick={() => { setPaymentMethod("card"); setGatewayStep("card"); }}
                    className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all"
                  >
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Pay using Card</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => { setPaymentMethod("upi"); setGatewayStep("upi"); }}
                    className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 text-left transition-all"
                  >
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">UPI / QR Code</p>
                      <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>
                </div>
              )}

              {gatewayStep === "card" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Enter Card Information</p>
                  <div className="space-y-3">
                    <Input placeholder="Card Number (e.g. 4242 4242 4242 4242)" className="rounded-lg" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="MM/YY" className="rounded-lg" />
                      <Input placeholder="CVV" type="password" maxLength={3} className="rounded-lg" />
                    </div>
                    <Input placeholder="Cardholder Name" className="rounded-lg" />
                  </div>
                  <Button 
                    onClick={handleSimulatePayment} 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3"
                  >
                    Pay ₹{totalAmount.toFixed(2)}
                  </Button>
                </div>
              )}

              {gatewayStep === "upi" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Enter UPI Address</p>
                  <div className="space-y-3">
                    <Input placeholder="example@upi" className="rounded-lg text-center font-medium" />
                  </div>
                  <Button 
                    onClick={handleSimulatePayment} 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3"
                  >
                    Verify & Pay ₹{totalAmount.toFixed(2)}
                  </Button>
                </div>
              )}

              {gatewayStep === "processing" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-gray-900">Processing Transaction...</p>
                  <p className="text-xs text-gray-500">Do not refresh or close this checkout popup</p>
                </div>
              )}

              {gatewayStep === "success" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">Payment Successful</p>
                  <p className="text-xs text-gray-500">₹{totalAmount.toFixed(2)} credited to your CallZenza wallet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
