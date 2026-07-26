import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { LayoutDashboard, Trophy, Calendar, BookOpen, Users, Mail, LogOut, Loader2, Menu, X, FileQuestion, ClipboardList, PenTool, Lightbulb, ClipboardCheck, FileText, Shield } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";

const allNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Ranks", href: "/admin/ranks", icon: Trophy },
  { label: "Workshops", href: "/admin/workshops", icon: Calendar },
  { label: "Programs", href: "/admin/programs", icon: BookOpen },
  { label: "Exam Questions", href: "/admin/exam-questions", icon: FileQuestion },
  { label: "Exam Tests", href: "/admin/exam-tests", icon: ClipboardList },
  { label: "Part B Evaluations", href: "/admin/part-b-evaluations", icon: PenTool },
  { label: "Study Materials", href: "/admin/study-materials", icon: Lightbulb },
  { label: "Assignments", href: "/admin/assignments", icon: ClipboardCheck },
  { label: "Class Notes", href: "/admin/class-notes", icon: FileText },
  { label: "User Portal", href: "/admin/users", icon: Users },
  { label: "Staff Management", href: "/admin/staff", icon: Shield },
  { label: "Registrations", href: "/admin/registrations", icon: Users },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
  { label: "Evaluations", href: "/admin/mentors-placeholder", icon: ClipboardList },
];

const roleNavPermissions: Record<string, string[]> = {
  admin: [
    "/admin/dashboard",
    "/admin/ranks",
    "/admin/workshops",
    "/admin/programs",
    "/admin/exam-questions",
    "/admin/exam-tests",
    "/admin/part-b-evaluations",
    "/admin/study-materials",
    "/admin/assignments",
    "/admin/class-notes",
    "/admin/users",
    "/admin/staff",
    "/admin/registrations",
    "/admin/subscribers",
  ],
  sme: [
    "/admin/exam-questions",
    "/admin/exam-tests",
    "/admin/study-materials",
    "/admin/assignments",
    "/admin/class-notes",
  ],
  mentor: [
    "/admin/mentors-placeholder",
    "/admin/part-b-evaluations",
  ],
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSessionAndRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLocation("/admin");
          return;
        }

        const email = session.user?.email || "";
        const lowerEmail = email.toLowerCase();

        // 1. Root admin domain fallback
        if (lowerEmail.endsWith("@designforge.co.in")) {
          if (active) {
            setRole("admin");
            setLoading(false);
          }
          return;
        }

        // 2. Lookup in staff_users table
        const { data: staff, error } = await supabase
          .from("staff_users")
          .select("role")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!staff) {
          // If they aren't registered, log them out and redirect
          await supabase.auth.signOut();
          setLocation("/admin");
          return;
        }

        if (active) {
          setRole(staff.role);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setLocation("/admin");
      }
    }

    checkSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setLocation("/admin");
      } else if (event === "SIGNED_IN") {
        checkSessionAndRole();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setLocation]);

  // Route shielding
  useEffect(() => {
    if (loading || !role) return;

    const allowedRoutes = roleNavPermissions[role] || [];
    const isAllowed = allowedRoutes.includes(location);

    if (!isAllowed) {
      if (role === "admin") {
        setLocation("/admin/dashboard");
      } else if (role === "sme") {
        setLocation("/admin/exam-questions");
      } else if (role === "mentor") {
        setLocation("/admin/mentors-placeholder");
      } else {
        setLocation("/admin");
      }
    }
  }, [location, role, loading, setLocation]);

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

  // Filter navigation items based on role permissions
  const allowedRoutes = roleNavPermissions[role || ""] || [];
  const visibleNavItems = allNavItems.filter((item) => allowedRoutes.includes(item.href));

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
            <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase ml-1">
              {role === "sme" ? "Content Portal" : role === "mentor" ? "Mentors Portal" : "Admin Panel"}
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
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
