import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Trash2, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => { fetchSubscribers(); }, []);

  const fetchSubscribers = async () => {
    const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
    setSubscribers(data || []);
    setLoading(false);
  };

  const deleteSub = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    await supabase.from("subscribers").delete().eq("id", id);
    setSubscribers(subscribers.filter((s) => s.id !== id));
  };

  const copyEmails = () => {
    const emails = filteredSubs.map(s => s.email).join(", ");
    navigator.clipboard.writeText(emails);
    toast({ title: "Copied!", description: `${filteredSubs.length} emails copied to clipboard.` });
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Email,Subscribed On\n"
      + filteredSubs.map(s => `${s.email},${new Date(s.created_at).toISOString()}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `designforge-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubs = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Waitlist & Subscribers</h1>
          <p className="text-sm text-[#262626]/50 mt-1">{subscribers.length} total subscribers collected from the footer.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyEmails} className="flex items-center gap-2 px-4 h-9 bg-white border border-[#262626]/10 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Copy className="w-4 h-4" /> Copy All
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 h-9 bg-[#262626] text-white rounded-lg text-sm font-medium hover:bg-[#262626]/90 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#262626]/5 overflow-hidden">
        <div className="p-4 border-b border-[#262626]/5 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#262626]/40" />
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-[#262626]/40"
          />
        </div>
        
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm text-left relative">
            <thead className="text-[#262626]/50 font-medium bg-gray-50/50 sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="p-4 border-b border-[#262626]/5">Email Address</th>
                <th className="p-4 border-b border-[#262626]/5">Subscribed Date (IST)</th>
                <th className="p-4 border-b border-[#262626]/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => (
                <tr key={sub.id} className="border-b border-[#262626]/5 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-[#262626] font-medium">{sub.email}</td>
                  <td className="p-4 text-[#262626]/60">
                    {new Date(sub.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteSub(sub.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSubs.length === 0 && (
                <tr><td colSpan={3} className="p-12 text-center text-[#262626]/40">No subscribers found matching "{search}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
