import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Eye, EyeOff, LayoutDashboard, X } from "lucide-react";

interface Program {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  start_date: string;
  is_active: boolean;
  display_order: number;
}

const emptyProgram: Omit<Program, "id"> = {
  name: "", description: "", price: 0, duration: "", start_date: "",
  is_active: true, display_order: 0,
};

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    const { data } = await supabase.from("programs").select("*").order("display_order");
    setPrograms(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing({ id: crypto.randomUUID(), ...emptyProgram, display_order: programs.length + 1 });
  };

  const openTemplate = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: "Focus Batch 2026-27",
      description: "A 40-week mentored program for serious design aspirants preparing for NID, UCEED, and CEED — covering Prelims, Mains, Portfolios, and Interviews in one structured journey.",
      price: 20000,
      duration: "40 Weeks",
      start_date: new Date().toISOString(),
      is_active: true,
      display_order: programs.length + 1
    });
  };

  const saveProgram = async () => {
    if (!editing) return;
    setSaving(true);
    const { id, ...data } = editing;
    const { error } = await supabase.from("programs").upsert({ id, ...data });
    
    if (error) {
      console.error("Supabase Save Error:", error);
      alert("Failed to save program: " + error.message + "\n\nMake sure you've run the SQL script in your Supabase dashboard to create this table and enable access!");
      setSaving(false);
      return;
    }
    
    await fetchPrograms();
    setEditing(null);
    setSaving(false);
  };

  const deleteProgram = async (id: string) => {
    await supabase.from("programs").delete().eq("id", id);
    setPrograms(programs.filter((p) => p.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-foreground/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Programs</h1>
          <p className="text-sm text-foreground/50 mt-1">Manage paid courses and mentorship programs</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all">
          <Plus className="w-4 h-4" /> Add Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.length > 0 ? programs.map((prog) => (
          <div key={prog.id} className="bg-white rounded-2xl border border-black/5 p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-xl text-foreground flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  {prog.name || "Untitled Program"}
                </h3>
                <p className="text-sm text-foreground/60 mt-2 leading-relaxed line-clamp-2">{prog.description || "No description provided."}</p>
              </div>
              {!prog.is_active && <span title="Hidden from website"><EyeOff className="w-5 h-5 text-foreground/20 shrink-0 ml-4" /></span>}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-bold tracking-wide border border-green-100">
                ₹{prog.price.toLocaleString("en-IN")}
              </span>
              {prog.duration && (
                <span className="px-3 py-1.5 rounded-lg bg-background border border-black/5 text-foreground/70 font-medium">
                  {prog.duration}
                </span>
              )}
              {prog.start_date && (
                <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-medium border border-orange-100">
                  Starts: {new Date(prog.start_date).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-black/5 mt-auto">
              <Button variant="outline" size="sm" onClick={() => setEditing(prog)} className="text-xs flex-1 rounded-xl">Edit Details</Button>
              <Button variant="outline" size="sm" onClick={() => deleteProgram(prog.id)} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 rounded-xl px-3">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )) : (
          <div className="col-span-full space-y-6">
            <div className="bg-white rounded-2xl border border-dashed border-black/15 p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-heading text-foreground mb-2">No programs created yet</h3>
              <p className="text-foreground/50 text-sm max-w-md mx-auto mb-6">
                Start adding your paid programs, mentorship batches, or masterclasses. They will automatically appear on the website's enrollment sections.
              </p>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-semibold text-foreground/40 uppercase tracking-widest mb-4 ml-1">Example Template</h4>
              <div className="bg-white/50 relative overflow-hidden rounded-2xl border border-primary/20 p-6 space-y-4 shadow-sm opacity-80 hover:opacity-100 transition-opacity before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] before:bg-[length:250px_250px] before:animate-[shimmer_3s_infinite]">
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">SAMPLE PREVIEW</div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <h3 className="font-heading text-xl text-foreground flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      Focus Batch 2026-27
                    </h3>
                    <p className="text-sm text-foreground/60 mt-2 leading-relaxed">A 40-week mentored program for serious design aspirants preparing for NID, UCEED, and CEED — covering Prelims, Mains, Portfolios, and Interviews...</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs relative z-10">
                  <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-bold tracking-wide border border-green-100">₹20,000</span>
                  <span className="px-3 py-1.5 rounded-lg bg-background border border-black/5 text-foreground/70 font-medium">40 Weeks</span>
                  <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-medium border border-orange-100">Starts: Oct 15, 2025</span>
                </div>

                <div className="pt-4 border-t border-black/5 mt-auto relative z-10">
                  <Button onClick={openTemplate} variant="outline" className="w-full text-sm border-primary/30 text-primary hover:bg-primary/5 rounded-xl">
                    Use This Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h3 className="text-xl font-heading text-foreground">
                {programs.find((p) => p.id === editing.id) ? "Edit Program Details" : "Create New Program"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-5 h-5 text-foreground/40" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Program Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-12 mt-1 bg-background" placeholder="e.g. Portfolio Mastery" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Description</Label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="What will students learn?"
                  className="w-full mt-1 rounded-xl border border-input px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Price (₹)</Label>
                  <Input type="number" value={editing.price === 0 ? '' : editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className="h-12 mt-1 bg-background" placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Duration</Label>
                  <Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="e.g. 40 weeks" className="h-12 mt-1 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Start Date</Label>
                  <Input type="datetime-local" value={editing.start_date ? editing.start_date.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} className="h-12 mt-1 bg-background" />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer group">
                    <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-5 h-5 rounded border-black/20 text-primary focus:ring-primary/20" />
                    <span className="group-hover:text-primary transition-colors">Visible on Website</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-black/5">
              <Button onClick={saveProgram} disabled={saving} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] text-base font-bold transition-all">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Program"}
              </Button>
              <Button variant="outline" className="h-12 px-6 rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
