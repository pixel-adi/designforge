import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Star, StarOff, Eye, EyeOff, X } from "lucide-react";

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  location: string;
  status: string;
  is_featured: boolean;
  display_order: number;
  is_visible: boolean;
}

const emptyWorkshop: Omit<Workshop, "id"> = {
  title: "", description: "", date: "", duration: "", location: "Online",
  status: "upcoming", is_featured: false, display_order: 0, is_visible: true,
};

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchWorkshops(); }, []);

  const fetchWorkshops = async () => {
    const { data } = await supabase.from("workshops").select("*").order("display_order");
    setWorkshops(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing({ id: crypto.randomUUID(), ...emptyWorkshop, display_order: workshops.length + 1 });
  };

  const saveWorkshop = async () => {
    if (!editing) return;
    setSaving(true);
    const { id, ...data } = editing;
    await supabase.from("workshops").upsert({ id, ...data });
    await fetchWorkshops();
    setEditing(null);
    setSaving(false);
  };

  const deleteWorkshop = async (id: string) => {
    await supabase.from("workshops").delete().eq("id", id);
    setWorkshops(workshops.filter((w) => w.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Workshops</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage workshop schedules and sessions</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2 bg-[#262626] hover:bg-[#262626]/90">
          <Plus className="w-4 h-4" /> Add Workshop
        </Button>
      </div>

      {/* Workshop Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workshops.map((ws) => (
          <div key={ws.id} className="bg-white rounded-xl border border-[#262626]/5 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-[#262626]">{ws.title || "Untitled"}</h3>
                <p className="text-xs text-[#262626]/40 mt-1">{ws.description || "No description"}</p>
              </div>
              <div className="flex gap-1">
                {ws.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                {!ws.is_visible && <EyeOff className="w-4 h-4 text-[#262626]/20" />}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-[#262626]/5 text-[#262626]/60">
                {ws.date ? new Date(ws.date).toLocaleDateString() : "No date"}
              </span>
              <span className="px-2 py-1 rounded-full bg-[#262626]/5 text-[#262626]/60">{ws.duration || "—"}</span>
              <span className="px-2 py-1 rounded-full bg-[#262626]/5 text-[#262626]/60">{ws.location}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                ws.status === "upcoming" ? "bg-blue-50 text-blue-600" :
                ws.status === "ongoing" ? "bg-green-50 text-green-600" :
                "bg-gray-100 text-gray-500"
              }`}>{ws.status}</span>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#262626]/5">
              <Button variant="outline" size="sm" onClick={() => setEditing(ws)} className="text-xs">Edit</Button>
              <Button variant="outline" size="sm" onClick={() => deleteWorkshop(ws.id)} className="text-xs text-red-500 hover:text-red-600">
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
        {workshops.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-dashed border-[#262626]/10 p-12 text-center text-[#262626]/30 text-sm">
            No workshops yet
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#262626]">
                {workshops.find((w) => w.id === editing.id) ? "Edit Workshop" : "New Workshop"}
              </h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-[#262626]/40" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#262626]/60">Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="h-10" />
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
                  <Label className="text-xs text-[#262626]/60">Date</Label>
                  <Input type="datetime-local" value={editing.date ? editing.date.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="h-10" />
                </div>
                <div>
                  <Label className="text-xs text-[#262626]/60">Duration</Label>
                  <Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="e.g. 2 hours" className="h-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#262626]/60">Location</Label>
                  <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="h-10" />
                </div>
                <div>
                  <Label className="text-xs text-[#262626]/60">Status</Label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input text-sm bg-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-[#262626]/70 cursor-pointer">
                  <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="rounded" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-[#262626]/70 cursor-pointer">
                  <input type="checkbox" checked={editing.is_visible} onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })} className="rounded" />
                  Visible
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveWorkshop} disabled={saving} className="flex-1 bg-[#262626] hover:bg-[#262626]/90 gap-2">
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
