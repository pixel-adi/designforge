import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { LayoutDashboard, Trophy, Calendar, BookOpen, Users, Mail, LogOut, Loader2, Menu, X } from "lucide-react";
import logoImg from "@/assets/DF_BLACK_RED_1773094379878.png";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <img src={logoImg} alt="Designforge Logo" className="h-6 md:h-8 object-contain" />
            <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase ml-1">Admin Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); setLocation(item.href); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/60 hover:bg-black/5 hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/5">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-black/5 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <img src={logoImg} alt="Designforge" className="h-6 object-contain" />
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full relative">
          {children}
        </main>
      </div>
    </div>
  );
}
