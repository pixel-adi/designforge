import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Copy, Download, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    const { data } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
    setRegistrations(data || []);
    setLoading(false);
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

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Student Registrations</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Track payments and enrolled students</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 h-9 bg-[#262626] text-white rounded-lg text-sm font-medium hover:bg-[#262626]/90 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#262626]/5 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
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
                          {new Date(reg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
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
    </div>
  );
}
