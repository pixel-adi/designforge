import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('exam_candidates').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Error loading candidates", description: error.message, variant: "destructive" });
    } else {
      setCandidates(data || []);
    }
    setLoading(false);
  };

  const startEdit = (candidate: any) => {
    setEditingId(candidate.id);
    setEditForm({ ...candidate });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editForm.name) return toast({ title: "Error", description: "Name is required.", variant: "destructive" });
    
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_candidates').update({
        name: editForm.name,
        phone: editForm.phone || null,
        education_level: editForm.education_level
      }).eq('id', editingId);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Candidate updated successfully." });
      setEditingId(null);
      fetchCandidates();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-[#262626]">User Portal (Candidates)</h1>
        <p className="text-sm text-[#262626]/50 mt-1">Manage portal users, view their details, and assign target programs (B.Des / M.Des).</p>
      </div>

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Contact</th>
              <th className="p-4 font-semibold">Target Program</th>
              <th className="p-4 font-semibold">Joined At</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {candidates.map(candidate => {
              const isEditing = editingId === candidate.id;
              
              return (
                <tr key={candidate.id} className="hover:bg-black/5 transition-colors">
                  <td className="p-4">
                    {isEditing ? (
                      <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm" />
                    ) : (
                      <div className="flex items-center gap-3">
                        {candidate.avatar_url ? (
                          <img src={candidate.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-black/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {candidate.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="font-semibold text-sm">{candidate.name}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground/70 space-y-1">
                    <div>{candidate.email}</div>
                    {isEditing ? (
                      <Input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" className="h-8 text-sm w-32" />
                    ) : (
                      <div className="text-xs">{candidate.phone || 'No phone'}</div>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <select 
                        className="h-8 px-2 rounded border border-black/10 bg-white text-sm"
                        value={editForm.education_level}
                        onChange={e => setEditForm({ ...editForm, education_level: e.target.value })}
                      >
                        <option value="bachelors">Bachelors (B.Des/UCEED)</option>
                        <option value="masters">Masters (M.Des/CEED)</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        candidate.education_level === 'masters' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {candidate.education_level === 'masters' ? 'Masters (M.Des/CEED)' : 'Bachelors (B.Des/UCEED)'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground/50">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving} className="h-8 w-8 p-0 text-foreground/50 hover:bg-black/10">
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={saveEdit} disabled={saving} className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(candidate)} className="h-8 w-8 p-0 text-primary hover:bg-primary/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {candidates.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-foreground/50 text-sm">
                  No candidates have registered on the portal yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
