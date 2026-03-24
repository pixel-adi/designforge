import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical } from "lucide-react";

interface Rank {
  id: string;
  rank_label: string;
  exam: string;
  color: string;
  display_order: number;
  is_visible: boolean;
}

const colorOptions = ["bg-primary", "bg-pop-1", "bg-pop-2", "bg-pop-3"];

export default function AdminRanks() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRanks(); }, []);

  const fetchRanks = async () => {
    const { data } = await supabase.from("ranks").select("*").order("display_order");
    setRanks(data || []);
    setLoading(false);
  };

  const addRank = () => {
    setRanks([...ranks, {
      id: crypto.randomUUID(),
      rank_label: "",
      exam: "",
      color: "bg-primary",
      display_order: ranks.length + 1,
      is_visible: true,
    }]);
  };

  const updateRank = (id: string, field: keyof Rank, value: any) => {
    setRanks(ranks.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRank = async (id: string) => {
    await supabase.from("ranks").delete().eq("id", id);
    setRanks(ranks.filter((r) => r.id !== id));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const rank of ranks) {
      const { id, ...data } = rank;
      await supabase.from("ranks").upsert({ id, ...data });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-[#262626]/40">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">Ranks</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage achiever ranks displayed on the website</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addRank} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Rank
          </Button>
          <Button onClick={saveAll} disabled={saving} size="sm" className="gap-2 bg-[#262626] hover:bg-[#262626]/90">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#262626]/5 divide-y divide-[#262626]/5">
        {ranks.map((rank, i) => (
          <div key={rank.id} className="flex items-center gap-4 p-4">
            <GripVertical className="w-4 h-4 text-[#262626]/20 shrink-0" />
            <span className="text-sm text-[#262626]/30 w-6">{i + 1}</span>

            <Input
              value={rank.rank_label}
              onChange={(e) => updateRank(rank.id, "rank_label", e.target.value)}
              placeholder="e.g. AIR 12"
              className="h-9 w-32"
            />
            <Input
              value={rank.exam}
              onChange={(e) => updateRank(rank.id, "exam", e.target.value)}
              placeholder="e.g. NID BDes"
              className="h-9 w-36"
            />

            <select
              value={rank.color}
              onChange={(e) => updateRank(rank.id, "color", e.target.value)}
              className="h-9 px-2 rounded-md border border-input text-sm bg-white"
            >
              {colorOptions.map((c) => (
                <option key={c} value={c}>{c.replace("bg-", "")}</option>
              ))}
            </select>

            <button
              onClick={() => updateRank(rank.id, "is_visible", !rank.is_visible)}
              className={`p-2 rounded-md transition-colors ${rank.is_visible ? "text-green-600 bg-green-50" : "text-[#262626]/30 bg-[#262626]/5"}`}
              title={rank.is_visible ? "Visible" : "Hidden"}
            >
              {rank.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => deleteRank(rank.id)}
              className="p-2 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {ranks.length === 0 && (
          <div className="p-8 text-center text-[#262626]/30 text-sm">No ranks yet. Click "Add Rank" to create one.</div>
        )}
      </div>
    </div>
  );
}
