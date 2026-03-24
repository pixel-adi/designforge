import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Trash2, PlusCircle, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Rank {
  id: string;
  rank_label: string;
  exam: string;
  color: string;
  display_order: number;
  student_name?: string;
  stream?: string;
}

const emptyRank: Omit<Rank, "id"> = {
  rank_label: "AIR ", exam: "NID MDes", color: "bg-pop-3", display_order: 0,
  student_name: "", stream: ""
};

const examOptions = ["CEED", "UCEED", "NID MDes", "NID BDes", "MIT", "Abroad Colleges"];
const colorOptions = [
  { value: "bg-primary", label: "Red (bg-primary)" },
  { value: "bg-pop-1", label: "Purple (bg-pop-1)" },
  { value: "bg-pop-2", label: "Orange (bg-pop-2)" },
  { value: "bg-pop-3", label: "Yellow (bg-pop-3)" },
];

export default function AdminRanks() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the "Add/Edit Rank" form fixed at the top
  const [newRank, setNewRank] = useState<Omit<Rank, "id">>(emptyRank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => { fetchRanks(); }, []);

  const fetchRanks = async () => {
    const { data } = await supabase.from("ranks").select("*").order("display_order");
    setRanks(data || []);
    setLoading(false);
  };

  const handleSaveRank = async () => {
    setSavingNew(true);
    // Ensure it always starts with AIR
    let finalLabel = newRank.rank_label;
    if (!finalLabel.startsWith("AIR ")) {
      finalLabel = `AIR ${finalLabel.replace(/\D/g, '')}`; 
    }
    
    if (editingId) {
      // Update existing
      await supabase.from("ranks").update({
        ...newRank,
        rank_label: finalLabel
      }).eq("id", editingId);
    } else {
      // Insert new
      await supabase.from("ranks").insert({
        id: crypto.randomUUID(),
        ...newRank,
        rank_label: finalLabel,
        display_order: ranks.length + 1
      });
    }
    
    setNewRank(emptyRank);
    setEditingId(null);
    await fetchRanks();
    setSavingNew(false);
  };

  const editRank = (rank: Rank) => {
    setEditingId(rank.id);
    setNewRank({
      rank_label: rank.rank_label,
      exam: rank.exam,
      color: rank.color,
      display_order: rank.display_order,
      student_name: rank.student_name || "",
      stream: rank.stream || ""
    });
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewRank(emptyRank);
  };

  const deleteRank = async (id: string) => {
    await supabase.from("ranks").delete().eq("id", id);
    setRanks(ranks.filter(r => r.id !== id));
  };

  const handleRankInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers after "AIR "
    const val = e.target.value;
    const numPart = val.replace(/[^0-9]/g, '');
    setNewRank({ ...newRank, rank_label: `AIR ${numPart}` });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-[#262626]">Achiever Ranks</h1>
        <p className="text-sm text-[#262626]/50 mt-1">Manage the hall of fame marquee on the homepage</p>
      </div>

      {/* FIXED TOP SECTION: ADD/EDIT RANK */}
      <div className={`bg-white rounded-xl border ${editingId ? 'border-orange-200 shadow-md ring-1 ring-orange-100' : 'border-primary/20 shadow-sm'} p-6 space-y-5 transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#262626] flex items-center gap-2">
            {editingId ? <Trophy className="w-5 h-5 text-orange-500" /> : <PlusCircle className="w-5 h-5 text-primary" />} 
            {editingId ? "Edit Rank Details" : "Add New Rank"}
          </h2>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-foreground/50 hover:text-foreground h-8 px-3">
              Cancel Edit
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-[#262626]/60">Rank (Numbers Only)</Label>
            <Input 
              value={newRank.rank_label} 
              onChange={handleRankInputChange}
              className="h-10 font-mono font-medium tracking-wider" 
            />
          </div>
          <div>
            <Label className="text-xs text-[#262626]/60">Exam</Label>
            <Select 
              value={newRank.exam} 
              onValueChange={(val) => setNewRank({...newRank, exam: val})}
            >
              <SelectTrigger className="h-10 bg-white">
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                {examOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#262626]/60">Color Theme</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-white">
              <select 
                className="bg-transparent border-none outline-none w-full text-sm"
                value={newRank.color}
                onChange={(e) => setNewRank({...newRank, color: e.target.value})}
              >
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className={`w-4 h-4 rounded-full ${newRank.color}`} />
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-[#262626]/60">Student Name (Optional)</Label>
            <Input 
              value={newRank.student_name || ""} 
              onChange={(e) => setNewRank({...newRank, student_name: e.target.value})}
              placeholder="e.g. Aditi Sharma"
              className="h-10" 
            />
          </div>
          <div>
            <Label className="text-xs text-[#262626]/60">Stream/College (Optional)</Label>
            <Input 
              value={newRank.stream || ""} 
              onChange={(e) => setNewRank({...newRank, stream: e.target.value})}
              placeholder="e.g. Interaction Design"
              className="h-10" 
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSaveRank} disabled={savingNew || newRank.rank_label === "AIR "} className={`w-full h-10 gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-[#262626] hover:bg-[#262626]/90'}`}>
              {savingNew ? (editingId ? "Updating..." : "Saving...") : <><Save className="w-4 h-4" /> {editingId ? "Update Rank" : "Save Rank"}</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#262626]/10 pt-8" />

      {/* BOTTOM SECTION: EXISTING RANKS LIST */}
      <div>
        <h3 className="text-lg font-medium text-[#262626] mb-4">Existing Ranks Database</h3>
        
        <div className="bg-white rounded-xl border border-black/5 overflow-hidden shadow-sm">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-black/5 p-4 bg-background/50 text-xs font-semibold text-foreground/50 uppercase tracking-widest hidden md:grid">
            <div className="col-span-1">Rank</div>
            <div className="col-span-2">Exam</div>
            <div className="col-span-3">Student Name</div>
            <div className="col-span-3">Stream / College</div>
            <div className="col-span-1 border-l border-black/5 pl-4">Theme</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-black/5">
            {ranks.map((rank) => (
              <div key={rank.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-background/30 transition-colors">
                
                {/* Mobile Label & Desktop Rank */}
                <div className="col-span-1 md:col-span-1 flex items-center gap-2">
                  <span className="md:hidden text-xs text-foreground/50 uppercase tracking-widest font-semibold w-24">Rank:</span>
                  <span className="font-heading text-lg text-foreground font-bold">{rank.rank_label}</span>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <span className="md:hidden text-xs text-foreground/50 uppercase tracking-widest font-semibold w-24">Exam:</span>
                  <span className="text-sm font-semibold tracking-wide text-foreground/70">{rank.exam}</span>
                </div>

                <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                  <span className="md:hidden text-xs text-foreground/50 uppercase tracking-widest font-semibold w-24">Name:</span>
                  <span className="text-sm font-medium text-foreground">{rank.student_name || <span className="text-foreground/30 italic">Not specified</span>}</span>
                </div>

                <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                  <span className="md:hidden text-xs text-foreground/50 uppercase tracking-widest font-semibold w-24">Stream:</span>
                  <span className="text-sm text-foreground/70">{rank.stream || <span className="text-foreground/30 italic">-</span>}</span>
                </div>

                <div className="col-span-1 md:col-span-1 md:border-l md:border-black/5 md:pl-4 flex items-center gap-2">
                  <span className="md:hidden text-xs text-foreground/50 uppercase tracking-widest font-semibold w-24">Theme:</span>
                  <div className={`w-6 h-6 rounded-full ${rank.color} shadow-inner shrink-0`} title={rank.color} />
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2 md:justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t border-black/5 md:border-t-0">
                  <Button variant="outline" size="sm" onClick={() => editRank(rank)} className="w-full md:w-auto text-xs hover:bg-black/5 border-black/10 transition-colors h-8">
                    Edit details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteRank(rank.id)} className="w-full md:w-auto text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 transition-colors h-8">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

              </div>
            ))}
            
            {ranks.length === 0 && (
              <div className="p-12 text-center text-[#262626]/30 text-sm">
                No ranks added yet. Use the form above to add one.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
