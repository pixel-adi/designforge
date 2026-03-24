import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, CreditCard, Mail, TrendingUp } from "lucide-react";

interface Stats {
  totalRegistrations: number;
  paidRegistrations: number;
  totalSubscribers: number;
  pendingPayments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalRegistrations: 0, paidRegistrations: 0, totalSubscribers: 0, pendingPayments: 0 });
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [regsRes, subsRes] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("subscribers").select("*", { count: "exact", head: true }),
    ]);

    const regs = regsRes.data || [];
    setStats({
      totalRegistrations: regs.length,
      paidRegistrations: regs.filter((r) => r.payment_status === "paid").length,
      pendingPayments: regs.filter((r) => r.payment_status === "pending").length,
      totalSubscribers: subsRes.count || 0,
    });
    setRecentRegistrations(regs.slice(0, 8));
    setLoading(false);
  };

  const statCards = [
    { label: "Total Registrations", value: stats.totalRegistrations, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Paid", value: stats.paidRegistrations, icon: CreditCard, color: "bg-green-50 text-green-600" },
    { label: "Pending Payments", value: stats.pendingPayments, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
    { label: "Email Subscribers", value: stats.totalSubscribers, icon: Mail, color: "bg-purple-50 text-purple-600" },
  ];

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#262626]">Dashboard</h1>
        <p className="text-sm text-[#262626]/50 mt-1">Overview of your site activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-[#262626]/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#262626]/50 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-[#262626]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Registrations */}
      <div className="bg-white rounded-xl border border-[#262626]/5">
        <div className="p-5 border-b border-[#262626]/5">
          <h3 className="text-sm font-medium text-[#262626]">Recent Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#262626]/5">
                <th className="text-left p-4 text-[#262626]/50 font-medium">Name</th>
                <th className="text-left p-4 text-[#262626]/50 font-medium">Email</th>
                <th className="text-left p-4 text-[#262626]/50 font-medium">Program</th>
                <th className="text-left p-4 text-[#262626]/50 font-medium">Payment</th>
                <th className="text-left p-4 text-[#262626]/50 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((reg) => (
                <tr key={reg.id} className="border-b border-[#262626]/5 last:border-0">
                  <td className="p-4 text-[#262626]">{reg.name}</td>
                  <td className="p-4 text-[#262626]/60">{reg.email}</td>
                  <td className="p-4 text-[#262626]/60">{reg.program}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      reg.payment_status === "paid" ? "bg-green-50 text-green-700" :
                      reg.payment_status === "failed" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {reg.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-[#262626]/40 text-xs">{new Date(reg.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-[#262626]/30">No registrations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
