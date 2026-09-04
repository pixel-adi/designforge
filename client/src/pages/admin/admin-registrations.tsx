import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Copy, Download, UserCircle2, Sparkles, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

  useEffect(() => { fetchRegistrations(); fetchCohortLeads(); }, []);

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
    try {
      const { data, error } = await supabase.from("cohort_leads").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("fetchCohortLeads error:", error);
        // Fallback: try the "leads" table
        const { data: fallbackData } = await supabase.from("leads").select("*").eq("program", "AI-Native UX").order("created_at", { ascending: false });
        setCohortLeads(fallbackData || []);
      } else {
        setCohortLeads(data || []);
      }
    } catch (err) {
      console.error("fetchCohortLeads unexpected error:", err);
    } finally {
      setLoadingLeads(false);
    }
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
      + "Name,Email,Phone,Interest,Program,Source,Date\n"
      + filteredLeads.map(l => `"${l.name || ''}","${l.email || ''}","${l.phone || ''}","${l.interest || ''}","${l.program || ''}","${l.source || ''}","${l.created_at ? new Date(l.created_at).toISOString() : ''}"`).join("\n");

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

  if (isLoading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Registrations</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Track student registrations and AI-Native UX course leads</p>
        </div>
        <button
          onClick={activeTab === "students" ? exportCSV : exportLeadsCSV}
          className="flex items-center gap-2 px-4 h-9 bg-[#262626] text-white rounded-lg text-sm font-medium hover:bg-[#262626]/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
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
        <div className="bg-white rounded-xl border border-[#262626]/5 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
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
                  <th className="p-4">Source</th>
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
                          <div className="font-medium text-[#262626] whitespace-nowrap">{lead.name}</div>
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
                      <div className="text-[#262626]/60 text-xs font-mono">
                        {lead.source || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-[#262626]/40">No AI-Native UX leads found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
