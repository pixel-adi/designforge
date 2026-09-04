import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Copy,
  Download,
  UserCircle2,
  Sparkles,
  Users,
  Trash2,
  AlertCircle,
  RefreshCw,
  Check,
  Code2,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SQL_MIGRATION_SCRIPT = `-- =========================================================================
-- Designforge: AI-Native UX Cohort Leads Table Migration
-- Run this in the Supabase Dashboard -> SQL Editor (Click 'New query' -> 'Run')
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.cohort_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT DEFAULT 'Founding Cohort',
  program TEXT DEFAULT 'AI-Native UX',
  source TEXT DEFAULT '/courses/ai-native-ux',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cohort_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow public insert cohort_leads" 
ON public.cohort_leads FOR INSERT TO anon 
WITH CHECK (
  length(trim(name)) > 0 AND 
  length(trim(email)) > 0 AND 
  length(trim(phone)) > 0
);

DROP POLICY IF EXISTS "Allow authenticated insert cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated insert cohort_leads" 
ON public.cohort_leads FOR INSERT TO authenticated 
WITH CHECK (
  length(trim(name)) > 0 AND 
  length(trim(email)) > 0 AND 
  length(trim(phone)) > 0
);

DROP POLICY IF EXISTS "Allow authenticated select cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated select cohort_leads" 
ON public.cohort_leads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete cohort_leads" ON public.cohort_leads;
CREATE POLICY "Allow authenticated delete cohort_leads" 
ON public.cohort_leads FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_cohort_leads_created_at ON public.cohort_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_leads_email ON public.cohort_leads (email);`;

export default function AdminRegistrations() {
  const [activeTab, setActiveTab] = useState<"students" | "ai-native">("students");

  // Student registrations state
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // AI-Native UX leads state
  const [cohortLeads, setCohortLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [tableMissing, setTableMissing] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
    fetchCohortLeads();

    const handleLeadAdded = () => {
      fetchCohortLeads();
    };

    window.addEventListener("df_lead_added", handleLeadAdded);
    window.addEventListener("storage", handleLeadAdded);

    return () => {
      window.removeEventListener("df_lead_added", handleLeadAdded);
      window.removeEventListener("storage", handleLeadAdded);
    };
  }, []);

  const fetchRegistrations = async () => {
    try {
      const { data } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
      setRegistrations(data || []);
    } catch (err) {
      console.error("fetchRegistrations unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCohortLeads = async () => {
    setLoadingLeads(true);
    let leadsFromDb: any[] = [];
    let isDbTableMissing = false;

    // 1. Fetch from cohort_leads table in Supabase
    try {
      const { data, error } = await supabase
        .from("cohort_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("not find the table") || error.message?.includes("schema cache")) {
          isDbTableMissing = true;
        }
        // Fallback: try "leads" table
        try {
          const { data: fallbackData } = await supabase
            .from("leads")
            .select("*")
            .eq("program", "AI-Native UX")
            .order("created_at", { ascending: false });
          if (fallbackData && fallbackData.length > 0) {
            leadsFromDb = fallbackData;
            isDbTableMissing = false;
          }
        } catch {
          // ignore
        }
      } else if (data) {
        leadsFromDb = data;
        isDbTableMissing = false;
      }
    } catch (err) {
      console.error("fetchCohortLeads unexpected error:", err);
      isDbTableMissing = true;
    }

    // 2. Also check registrations table for any AI-Native UX records
    try {
      const { data: regLeads } = await supabase
        .from("registrations")
        .select("*")
        .or("program.ilike.%ai%,program.ilike.%cohort%")
        .order("created_at", { ascending: false });

      if (regLeads && regLeads.length > 0) {
        const mapped = regLeads.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          interest: r.stage || "Registered",
          program: r.program || "AI-Native UX",
          source: "/courses/ai-native-ux",
          created_at: r.created_at,
          _from_registrations: true,
        }));
        leadsFromDb = [...leadsFromDb, ...mapped];
      }
    } catch {
      // ignore
    }

    // 3. Read locally captured leads from localStorage ("df_leads")
    let localLeads: any[] = [];
    try {
      const stored = localStorage.getItem("df_leads");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localLeads = parsed.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `local-${idx}-${new Date(item.created_at || Date.now()).getTime()}`,
            _is_local: true,
          }));
        }
      }
    } catch (e) {
      console.warn("Failed reading localStorage df_leads:", e);
    }

    setTableMissing(isDbTableMissing);

    // 4. Merge and deduplicate (cloud records take priority)
    const combined = [...leadsFromDb];
    for (const loc of localLeads) {
      const alreadyInDb = combined.some(
        c => (c.email && loc.email && c.email.toLowerCase().trim() === loc.email.toLowerCase().trim())
      );
      if (!alreadyInDb) {
        combined.push(loc);
      }
    }

    // Sort newest first
    combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    setCohortLeads(combined);
    setLoadingLeads(false);
  };

  const copySqlScript = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_SCRIPT);
    setCopiedSql(true);
    toast({
      title: "SQL Copied!",
      description: "Paste into your Supabase Dashboard SQL Editor to create the table.",
    });
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const syncLocalLeads = async () => {
    const localOnly = cohortLeads.filter(l => l._is_local);
    if (localOnly.length === 0) {
      toast({ title: "Nothing to sync", description: "All leads are already in Supabase." });
      return;
    }
    setIsSyncing(true);
    try {
      const payloads = localOnly.map(l => ({
        name: l.name,
        email: l.email,
        phone: l.phone,
        interest: l.interest || "Founding Cohort",
        program: l.program || "AI-Native UX",
        source: l.source || "/courses/ai-native-ux",
        created_at: l.created_at || new Date().toISOString(),
      }));

      const { error } = await supabase.from("cohort_leads").insert(payloads);
      if (error) throw error;

      // Mark synced in local storage
      try {
        localStorage.removeItem("df_leads");
      } catch (e) {
        // ignore
      }

      toast({
        title: "Sync successful!",
        description: `${payloads.length} local lead(s) uploaded to Supabase database.`,
      });
      await fetchCohortLeads();
    } catch (err: any) {
      console.error("Sync error:", err);
      toast({
        title: "Sync failed",
        description: err.message || "Ensure the cohort_leads table exists in Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteLead = async (lead: any) => {
    if (!confirm(`Are you sure you want to remove lead for ${lead.name || lead.email}?`)) return;

    if (lead._is_local) {
      try {
        const stored = JSON.parse(localStorage.getItem("df_leads") || "[]");
        const updated = stored.filter((s: any) => s.email !== lead.email || s.created_at !== lead.created_at);
        localStorage.setItem("df_leads", JSON.stringify(updated));
      } catch (e) {
        console.warn("Error deleting from localStorage:", e);
      }
    }

    if (!lead._is_local && lead.id && !lead._from_registrations) {
      try {
        await supabase.from("cohort_leads").delete().eq("id", lead.id);
      } catch (e) {
        console.warn("Error deleting from supabase:", e);
      }
    }

    setCohortLeads(prev => prev.filter(l => l.id !== lead.id));
    toast({ title: "Lead removed" });
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Phone,Program,Stage,Amount,Payment Status,Date\n"
      + filteredRegs.map(r => `"${r.name}","${r.email}","${r.phone}","${r.program}","${r.stage}",${r.order_amount},${r.payment_status},${new Date(r.created_at).toISOString()}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `designforge-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLeadsCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Name,Email,Phone,Interest,Program,Source,Storage,Date\n"
      + filteredLeads.map(l => `"${l.name || ''}","${l.email || ''}","${l.phone || ''}","${l.interest || ''}","${l.program || ''}","${l.source || ''}","${l._is_local ? 'Local Storage' : 'Supabase Cloud'}","${l.created_at ? new Date(l.created_at).toISOString() : ''}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ai-native-ux-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: "Email copied", duration: 2000 });
  };

  const filteredRegs = registrations.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) || 
                          r.email?.toLowerCase().includes(search.toLowerCase()) ||
                          r.phone?.includes(search);
    const matchesFilter = filter === "all" || r.payment_status === filter;
    return matchesSearch && matchesFilter;
  });

  const interestOptions = ["all", ...Array.from(new Set(cohortLeads.map(l => l.interest).filter(Boolean)))];

  const filteredLeads = cohortLeads.filter(l => {
    const matchesSearch = l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.email?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.phone?.includes(leadSearch);
    const matchesFilter = leadFilter === "all" || l.interest === leadFilter;
    return matchesSearch && matchesFilter;
  });

  const isLoading = activeTab === "students" ? loading : loadingLeads;

  if (isLoading && cohortLeads.length === 0 && registrations.length === 0) {
    return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Registrations</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Track student registrations and AI-Native UX course leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={activeTab === "students" ? fetchRegistrations : fetchCohortLeads}
            title="Refresh Data"
            className="flex items-center justify-center w-9 h-9 border border-[#262626]/10 hover:bg-gray-100 rounded-lg text-[#262626]/70 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLeads ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={activeTab === "students" ? exportCSV : exportLeadsCSV}
            className="flex items-center gap-2 px-4 h-9 bg-[#262626] text-white rounded-lg text-sm font-medium hover:bg-[#262626]/90 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-[#262626]/[0.03] rounded-xl border border-[#262626]/5 w-fit">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "students"
              ? "bg-white text-[#262626] shadow-sm border border-[#262626]/5"
              : "text-[#262626]/50 hover:text-[#262626]/70"
          }`}
        >
          <Users className="w-4 h-4" />
          Student Registrations
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === "students" ? "bg-[#262626] text-white" : "bg-[#262626]/10 text-[#262626]/50"
          }`}>
            {registrations.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("ai-native")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "ai-native"
              ? "bg-white text-[#262626] shadow-sm border border-[#262626]/5"
              : "text-[#262626]/50 hover:text-[#262626]/70"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI-Native UX Leads
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === "ai-native" ? "bg-primary text-white" : "bg-primary/10 text-primary/50"
          }`}>
            {cohortLeads.length}
          </span>
        </button>
      </div>

      {/* ─── TAB: Student Registrations ─── */}
      {activeTab === "students" && (
        <div className="bg-white rounded-xl border border-[#262626]/5 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
          {/* Filters Header */}
          <div className="p-4 border-b border-[#262626]/5 flex flex-wrap gap-4 items-center bg-gray-50/50">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white rounded-md border border-input px-3 h-9">
              <Search className="w-4 h-4 text-[#262626]/40" />
              <input
                type="text"
                placeholder="Search names, emails, phones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              {["all", "paid", "pending", "failed"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    filter === f 
                      ? "bg-[#262626] text-white" 
                      : "bg-white border border-[#262626]/10 text-[#262626]/60 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {/* Table Area */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-[#262626]/50 font-medium sticky top-0 bg-white shadow-sm ring-1 ring-[#262626]/5 z-10">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Program Details</th>
                  <th className="p-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/5">
                {filteredRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <UserCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-[#262626] whitespace-nowrap">{reg.name}</div>
                          <div className="text-xs text-[#262626]/40 mt-0.5">
                            {reg.created_at ? new Date(reg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-[#262626]/80 flex items-center gap-2 group/email">
                          <span className="truncate max-w-[150px]" title={reg.email}>{reg.email}</span>
                          <button onClick={() => copyEmail(reg.email)} className="opacity-0 group-hover/email:opacity-100 text-[#262626]/40 hover:text-[#262626] transition-opacity">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[#262626]/60 text-xs">{reg.phone}</div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-[#262626] font-medium">{reg.program}</div>
                        <div className="text-[#262626]/60 text-xs">Stage: {reg.stage}</div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            reg.payment_status === "paid" ? "bg-green-50 text-green-700" :
                            reg.payment_status === "failed" ? "bg-red-50 text-red-700" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {reg.payment_status}
                          </span>
                        </div>
                        {reg.order_amount && (
                          <div className="text-xs text-[#262626]/60 font-medium">
                            ₹{parseInt(reg.order_amount).toLocaleString('en-IN')}
                          </div>
                        )}
                        {reg.payment_id && reg.payment_status === 'paid' && (
                          <div className="text-[10px] text-[#262626]/30 font-mono truncate max-w-[120px]" title={reg.payment_id}>
                            TXN: {reg.payment_id}
                          </div>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
                {filteredRegs.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-[#262626]/40">No registrations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: AI-Native UX Leads ─── */}
      {activeTab === "ai-native" && (
        <div className="space-y-4">
          {/* Missing Supabase Table Helper Alert */}
          {tableMissing && (
            <div className="bg-amber-500/[0.08] border border-amber-500/25 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-amber-950 flex items-center gap-2">
                    Supabase <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-xs font-mono text-amber-900 border border-amber-200">cohort_leads</code> table not created yet
                  </div>
                  <p className="text-amber-900/70 text-xs mt-1 leading-relaxed max-w-xl">
                    Displaying <strong>{cohortLeads.length}</strong> lead(s) captured safely in your browser storage. To persist leads across all devices and team members in Supabase, run the SQL script in your Supabase SQL editor.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={copySqlScript}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? "SQL Copied!" : "Copy SQL Script"}
                </button>
                <button
                  onClick={() => setShowSql(!showSql)}
                  className="flex items-center justify-center gap-1 px-3.5 py-2 bg-white border border-amber-500/20 text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-medium transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5 text-amber-700" />
                  {showSql ? "Hide SQL" : "View SQL"}
                </button>
              </div>
            </div>
          )}

          {/* Expandable SQL Code Box */}
          {showSql && (
            <div className="bg-[#1e1e24] text-slate-100 rounded-2xl p-5 border border-slate-700 text-xs font-mono shadow-xl relative animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <Database className="w-4 h-4 text-primary" />
                  <span>Run this in Supabase Dashboard → SQL Editor</span>
                </div>
                <button
                  onClick={copySqlScript}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white rounded-md text-[11px] font-sans hover:bg-primary/90 transition-colors"
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSql ? "Copied" : "Copy SQL"}
                </button>
              </div>
              <pre className="text-[11px] leading-relaxed select-all overflow-x-auto text-slate-200">{SQL_MIGRATION_SCRIPT}</pre>
            </div>
          )}

          {/* Sync Local Leads Banner (if table is connected and local leads exist) */}
          {!tableMissing && cohortLeads.some(l => l._is_local) && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 text-blue-900 text-xs">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  You have <strong>{cohortLeads.filter(l => l._is_local).length}</strong> locally captured lead(s) on this browser ready to sync to the Supabase cloud database.
                </span>
              </div>
              <button
                onClick={syncLocalLeads}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync to Supabase"}
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#262626]/5 overflow-hidden flex flex-col h-[calc(100vh-320px)]">
            {/* Filters Header */}
            <div className="p-4 border-b border-[#262626]/5 flex flex-wrap gap-4 items-center bg-gray-50/50">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white rounded-md border border-input px-3 h-9">
                <Search className="w-4 h-4 text-[#262626]/40" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, phone..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {interestOptions.map(f => (
                  <button
                    key={f}
                    onClick={() => setLeadFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                      leadFilter === f
                        ? "bg-primary text-white"
                        : "bg-white border border-[#262626]/10 text-[#262626]/60 hover:bg-gray-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-[#262626]/50 font-medium sticky top-0 bg-white shadow-sm ring-1 ring-[#262626]/5 z-10">
                  <tr>
                    <th className="p-4">Lead</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Interest / Plan</th>
                    <th className="p-4">Storage Source</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/5">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-[#262626] whitespace-nowrap flex items-center gap-2">
                              {lead.name}
                            </div>
                            <div className="text-xs text-[#262626]/40 mt-0.5">
                              {lead.created_at ? new Date(lead.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="text-[#262626]/80 flex items-center gap-2 group/email">
                            <span className="truncate max-w-[180px]" title={lead.email}>{lead.email}</span>
                            <button onClick={() => copyEmail(lead.email)} className="opacity-0 group-hover/email:opacity-100 text-[#262626]/40 hover:text-[#262626] transition-opacity">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[#262626]/60 text-xs">{lead.phone}</div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            lead.interest === "Founding Cohort" ? "bg-primary/10 text-primary" :
                            lead.interest === "Early Bird" ? "bg-amber-50 text-amber-700" :
                            lead.interest === "Brochure Download" ? "bg-blue-50 text-blue-700" :
                            lead.interest === "Regular" ? "bg-gray-100 text-[#262626]/70" :
                            "bg-purple-50 text-purple-700"
                          }`}>
                            {lead.interest || "General Interest"}
                          </span>
                          {lead.program && (
                            <div className="text-[#262626]/50 text-xs">{lead.program}</div>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="text-[#262626]/60 text-xs font-mono">
                            {lead.source || '/courses/ai-native-ux'}
                          </div>
                          <div>
                            {lead._is_local ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                                Local Storage
                              </span>
                            ) : lead._from_registrations ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                Registrations DB
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                Supabase Cloud
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteLead(lead)}
                          title="Remove Lead"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[#262626]/40">
                        {leadSearch || leadFilter !== 'all' ? "No leads matching your filters" : "No AI-Native UX leads found yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
