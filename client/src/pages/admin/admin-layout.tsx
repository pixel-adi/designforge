import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { LayoutDashboard, Trophy, Calendar, BookOpen, Users, Mail, LogOut, Loader2, Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Ranks", href: "/admin/ranks", icon: Trophy },
  { label: "Workshops", href: "/admin/workshops", icon: Calendar },
  { label: "Programs", href: "/admin/programs", icon: BookOpen },
  { label: "Registrations", href: "/admin/registrations", icon: Users },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLocation("/admin");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setLocation("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#262626]/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#262626]/5 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#262626]/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#262626]">Designforge</h2>
              <p className="text-xs text-[#262626]/40 mt-0.5">Admin Panel</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5 text-[#262626]/40" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); setLocation(item.href); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#262626] text-white"
                    : "text-[#262626]/60 hover:bg-[#262626]/5 hover:text-[#262626]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#262626]/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-[#262626]/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu className="w-5 h-5 text-[#262626]" />
          </button>
          <h2 className="text-sm font-medium text-[#262626]">Designforge Admin</h2>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
