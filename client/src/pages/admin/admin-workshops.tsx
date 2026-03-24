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

  const openTemplate = () => {
    setEditing({
      id: crypto.randomUUID(),
      title: "Design Thinking Masterclass",
      description: "A 2-hour intensive session breaking down the exact thought process examiners look for in NID DAT Mains.",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: "2 Hours",
      location: "Live on Zoom",
      status: "upcoming",
      is_featured: true,
      display_order: workshops.length + 1,
      is_visible: true,
    });
  };

  const saveWorkshop = async () => {
    if (!editing) return;
    setSaving(true);
    const { id, ...data } = editing;
    const { error } = await supabase.from("workshops").upsert({ id, ...data });
    
    if (error) {
      console.error("Supabase Save Error:", error);
      alert("Failed to save workshop: " + error.message + "\n\nMake sure you've run the SQL script in your Supabase dashboard to create this table and enable access!");
      setSaving(false);
      return;
    }
    
    await fetchWorkshops();
    setEditing(null);
    setSaving(false);
  };

  const deleteWorkshop = async (id: string) => {
    await supabase.from("workshops").delete().eq("id", id);
    setWorkshops(workshops.filter((w) => w.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-foreground/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Workshops</h1>
          <p className="text-sm text-foreground/50 mt-1">Manage single-session workshops and masterclasses</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all">
          <Plus className="w-4 h-4" /> Add Workshop
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workshops.length > 0 ? workshops.map((ws) => (
          <div key={ws.id} className="bg-white rounded-2xl border border-black/5 p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-xl text-foreground flex items-center gap-2">
                  {ws.title || "Untitled Workshop"}
                </h3>
                <p className="text-sm text-foreground/60 mt-2 leading-relaxed line-clamp-2">{ws.description || "No description provided."}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                {ws.is_featured && <span title="Featured"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /></span>}
                {!ws.is_visible && <span title="Hidden from website"><EyeOff className="w-5 h-5 text-foreground/20" /></span>}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              {ws.date && (
                <span className="px-3 py-1.5 rounded-lg bg-background border border-black/5 text-foreground/70 font-medium">
                  {new Date(ws.date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {ws.duration && (
                <span className="px-3 py-1.5 rounded-lg bg-background border border-black/5 text-foreground/70 font-medium">
                  {ws.duration}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 font-medium border border-slate-100">
                {ws.location}
              </span>
              <span className={`px-3 py-1.5 rounded-lg font-bold tracking-wide border ${
                ws.status === "upcoming" ? "bg-blue-50 text-blue-700 border-blue-100" :
                ws.status === "ongoing" ? "bg-green-50 text-green-700 border-green-100" :
                "bg-gray-50 text-gray-500 border-gray-200"
              }`}>
                {ws.status.toUpperCase()}
              </span>
            </div>

            <div className="flex gap-3 pt-4 border-t border-black/5 mt-auto">
              <Button variant="outline" size="sm" onClick={() => setEditing(ws)} className="text-xs flex-1 rounded-xl">Edit Details</Button>
              <Button variant="outline" size="sm" onClick={() => deleteWorkshop(ws.id)} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 rounded-xl px-3">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )) : (
          <div className="col-span-full space-y-6">
            <div className="bg-white rounded-2xl border border-dashed border-black/15 p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-heading text-foreground mb-2">No workshops created yet</h3>
              <p className="text-foreground/50 text-sm max-w-md mx-auto mb-6">
                Start adding your masterclasses, portfolio reviews, and webinars. They will show up on the Apprenticeship and Focus Batch pages.
              </p>
            </div>
            
            <div className="mt-8">
               <h4 className="text-sm font-semibold text-foreground/40 uppercase tracking-widest mb-4 ml-1">Example Template</h4>
               <div className="bg-white/50 relative overflow-hidden rounded-2xl border border-primary/20 p-6 space-y-4 shadow-sm opacity-80 hover:opacity-100 transition-opacity before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] before:bg-[length:250px_250px] before:animate-[shimmer_3s_infinite]">
                 <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">SAMPLE PREVIEW</div>
                 <div className="flex items-start justify-between relative z-10">
                   <div>
                     <h3 className="font-heading text-xl text-foreground flex items-center gap-2">
                       Design Thinking Masterclass
                     </h3>
                     <p className="text-sm text-foreground/60 mt-2 leading-relaxed">A 2-hour intensive session breaking down the exact thought process examiners look for in NID DAT Mains...</p>
                   </div>
                   <div className="shrink-0 ml-4"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /></div>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 text-xs relative z-10">
                   <span className="px-3 py-1.5 rounded-lg bg-background border border-black/5 text-foreground/70 font-medium">Sat, 2:00 PM</span>
                   <span className="px-3 py-1.5 rounded-lg bg-background border border-black/5 text-foreground/70 font-medium">2 Hours</span>
                   <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 font-medium border border-slate-100">Live on Zoom</span>
                   <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold tracking-wide border border-blue-100">UPCOMING</span>
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
                {workshops.find((w) => w.id === editing.id) ? "Edit Workshop Details" : "Create New Workshop"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-5 h-5 text-foreground/40" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Workshop Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="h-12 mt-1 bg-background" placeholder="e.g. Portfolio Review Day" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Description</Label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="What will attendees gain?"
                  className="w-full mt-1 rounded-xl border border-input px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Date & Time</Label>
                  <Input type="datetime-local" value={editing.date ? editing.date.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="h-12 mt-1 bg-background" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Duration</Label>
                  <Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="e.g. 2 hours" className="h-12 mt-1 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Location</Label>
                  <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="h-12 mt-1 bg-background" placeholder="e.g. Zoom, Google Meet" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Status</Label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full h-12 mt-1 px-4 rounded-xl border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-6 pt-4 border-t border-black/5 mt-4">
                <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer group">
                  <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="w-5 h-5 rounded border-black/20 text-primary focus:ring-primary/20" />
                  <span className="group-hover:text-primary transition-colors">Featured Workshop</span>
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer group">
                  <input type="checkbox" checked={editing.is_visible} onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })} className="w-5 h-5 rounded border-black/20 text-primary focus:ring-primary/20" />
                  <span className="group-hover:text-primary transition-colors">Visible on Website</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-black/5">
              <Button onClick={saveWorkshop} disabled={saving} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] text-base font-bold transition-all">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Workshop"}
              </Button>
              <Button variant="outline" className="h-12 px-6 rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
