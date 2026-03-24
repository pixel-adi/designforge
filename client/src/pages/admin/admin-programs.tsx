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

  const saveProgram = async () => {
    if (!editing) return;
    setSaving(true);
    const { id, ...data } = editing;
    await supabase.from("programs").upsert({ id, ...data });
    await fetchPrograms();
    setEditing(null);
    setSaving(false);
  };

  const deleteProgram = async (id: string) => {
    await supabase.from("programs").delete().eq("id", id);
    setPrograms(programs.filter((p) => p.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Programs</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage paid courses and mentorship programs</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2 bg-[#262626] hover:bg-[#262626]/90">
          <Plus className="w-4 h-4" /> Add Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((prog) => (
          <div key={prog.id} className="bg-white rounded-xl border border-[#262626]/5 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-[#262626] flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  {prog.name || "Untitled"}
                </h3>
                <p className="text-xs text-[#262626]/40 mt-1">{prog.description || "No description"}</p>
              </div>
              {!prog.is_active && <EyeOff className="w-4 h-4 text-[#262626]/20 shrink-0" />}
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium tracking-wide">
                ₹{prog.price.toLocaleString("en-IN")}
              </span>
              <span className="px-2 py-1 rounded-full bg-[#262626]/5 text-[#262626]/60">
                {prog.duration || "—"}
              </span>
              <span className="px-2 py-1 rounded-full bg-[#262626]/5 text-[#262626]/60">
                Starts: {prog.start_date ? new Date(prog.start_date).toLocaleDateString() : "TBA"}
              </span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#262626]/5">
              <Button variant="outline" size="sm" onClick={() => setEditing(prog)} className="text-xs">Edit</Button>
              <Button variant="outline" size="sm" onClick={() => deleteProgram(prog.id)} className="text-xs text-red-500 hover:text-red-600">
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
        {programs.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-dashed border-[#262626]/10 p-12 text-center text-[#262626]/30 text-sm">
            No programs yet
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#262626]">
                {programs.find((p) => p.id === editing.id) ? "Edit Program" : "New Program"}
              </h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-[#262626]/40" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#262626]/60">Program Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs text-[#262626]/60">Description</Label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#262626]/60">Price (₹)</Label>
                  <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className="h-10" />
                </div>
                <div>
                  <Label className="text-xs text-[#262626]/60">Duration</Label>
                  <Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="e.g. 40 weeks" className="h-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#262626]/60">Start Date</Label>
                  <Input type="datetime-local" value={editing.start_date ? editing.start_date.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} className="h-10" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-[#262626]/70 cursor-pointer">
                    <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="rounded" />
                    Active / Publicly Visible
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveProgram} disabled={saving} className="flex-1 bg-[#262626] hover:bg-[#262626]/90 gap-2">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
