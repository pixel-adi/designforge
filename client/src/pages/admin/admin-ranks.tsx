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
  
  // State for the "Add New Rank" form fixed at the top
  const [newRank, setNewRank] = useState<Omit<Rank, "id">>(emptyRank);
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => { fetchRanks(); }, []);

  const fetchRanks = async () => {
    const { data } = await supabase.from("ranks").select("*").order("display_order");
    setRanks(data || []);
    setLoading(false);
  };

  const handleAddRank = async () => {
    setSavingNew(true);
    // Ensure it always starts with AIR
    let finalLabel = newRank.rank_label;
    if (!finalLabel.startsWith("AIR ")) {
      finalLabel = `AIR ${finalLabel.replace(/\D/g, '')}`; 
    }
    
    await supabase.from("ranks").insert({
      id: crypto.randomUUID(),
      ...newRank,
      rank_label: finalLabel,
      display_order: ranks.length + 1
    });
    setNewRank(emptyRank);
    await fetchRanks();
    setSavingNew(false);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#262626]">Achiever Ranks</h1>
        <p className="text-sm text-[#262626]/50 mt-1">Manage the hall of fame marquee on the homepage</p>
      </div>

      {/* FIXED TOP SECTION: ADD NEW RANK */}
      <div className="bg-white rounded-xl border border-primary/20 shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-medium text-[#262626] flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" /> Add New Rank
        </h2>
        
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
            <Button onClick={handleAddRank} disabled={savingNew || newRank.rank_label === "AIR "} className="w-full h-10 bg-[#262626] hover:bg-[#262626]/90 gap-2">
              {savingNew ? "Saving..." : <><Save className="w-4 h-4" /> Save Rank</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#262626]/10 pt-8" />

      {/* BOTTOM SECTION: EXISTING RANKS LIST */}
      <div>
        <h3 className="text-lg font-medium text-[#262626] mb-4">Existing Ranks List</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {ranks.map((rank) => (
            <div key={rank.id} className="bg-white rounded-xl border border-[#262626]/5 p-5 relative group overflow-hidden">
              <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 blur-xl ${rank.color}`} />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-heading text-[#262626] flex items-center gap-2">
                    {rank.rank_label}
                  </h3>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs font-semibold tracking-wider text-[#262626]/60 uppercase">{rank.exam}</span>
                    {rank.student_name && <span className="text-sm font-medium text-[#262626] truncate">{rank.student_name}</span>}
                    {rank.stream && <span className="text-xs text-[#262626]/50 truncate">{rank.stream}</span>}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${rank.color} shrink-0`} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => deleteRank(rank.id)} className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ))}
          {ranks.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-dashed border-[#262626]/10 p-12 text-center text-[#262626]/30 text-sm">
              No ranks added yet
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
