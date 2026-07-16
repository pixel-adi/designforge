import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Shield, UserCheck, Key, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface StaffUser {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: "admin" | "sme" | "mentor";
  created_at: string;
}

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-100",
  sme: "bg-indigo-50 text-indigo-700 border-indigo-100",
  mentor: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  sme: "Subject Matter Expert",
  mentor: "Mentor / Evaluator",
};

export default function AdminStaff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "sme" | "mentor">("sme");
  
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch staff users
  const { data: staffList = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Error loading staff", description: error.message, variant: "destructive" });
        throw error;
      }
      return data || [];
    },
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session expired. Please log in again.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-staff-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error || `Request failed with status ${response.status}`);
      }

      toast({ title: "Success", description: `Account created for ${name} (${ROLE_LABELS[role]}) successfully.` });
      
      // Reset form & close modal
      setName("");
      setEmail("");
      setPassword("");
      setRole("sme");
      setIsOpen(false);
      
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    } catch (err: any) {
      console.error("Create staff error:", err);
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${staffName}'s account? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session expired.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-staff-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error || `Request failed with status ${response.status}`);
      }

      toast({ title: "Account Deleted", description: `${staffName}'s account was deleted successfully.` });
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    } catch (err: any) {
      console.error("Delete staff error:", err);
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Staff Management</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage and provision access credentials for Subject Matter Experts (SMEs), Mentors, and Administrators.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl px-4 flex items-center gap-2 font-bold shadow-md">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Create Staff Account
              </DialogTitle>
              <DialogDescription>
                Register a new staff member. An authentication profile will be generated automatically and they will log in using their credentials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-foreground/60 ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-11 pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-foreground/60 ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 pl-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-foreground/60 ml-1">Temporary Password</Label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-11 pl-10 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-foreground/60 ml-1">System Role</Label>
                <Select value={role} onValueChange={(val: any) => setRole(val)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select staff role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="sme" className="rounded-lg">Subject Matter Expert (SME)</SelectItem>
                    <SelectItem value="mentor" className="rounded-lg">Mentor / Evaluator</SelectItem>
                    <SelectItem value="admin" className="rounded-lg">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-11 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="h-11 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md min-w-[120px]">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <UserCheck className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#262626]">No Staff Members Registered</h3>
            <p className="text-sm text-foreground/50 mt-1 max-w-sm mx-auto">Create Subject Matter Expert or Administrator accounts to delegate content creation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
                  <th className="p-4 font-semibold">Staff Member</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Added On</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((user) => (
                  <tr key={user.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#262626]">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#262626]/70 font-mono text-sm">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGES[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-foreground/45">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg hover:text-red-600 transition-colors"
                        disabled={deletingId === user.id}
                        onClick={() => handleDeleteStaff(user.id, user.name)}
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
