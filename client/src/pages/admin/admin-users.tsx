import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Edit, Save, X, Trash2, ChevronLeft, ChevronRight, Shield, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 50;

const ACCESS_LEVELS = [
  { value: 'all', label: 'All Users' },
  { value: 'generic', label: 'Generic' },
  { value: 'materials_only', label: 'Materials Only' },
  { value: 'focus_batch', label: 'Focus Batch' },
];

const ACCESS_BADGE_STYLES: Record<string, string> = {
  focus_batch: 'bg-green-100 text-green-800',
  materials_only: 'bg-blue-100 text-blue-800',
  generic: 'bg-gray-100 text-gray-600',
};

const ACCESS_LABELS: Record<string, string> = {
  focus_batch: 'Focus Batch',
  materials_only: 'Materials Only',
  generic: 'Generic',
};

/** Compute rolling expiry: April 30 of the next applicable year */
function getDefaultExpiry(): string {
  const now = new Date();
  const expiryYear = now.getMonth() >= 4 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(expiryYear, 3, 30).toISOString().split('T')[0]; // YYYY-MM-DD
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState("all");
  
  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-candidates', page, search, accessFilter],
    queryFn: async () => {
      let query = supabase
        .from('exam_candidates')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (accessFilter !== 'all') {
        query = query.eq('access_level', accessFilter);
      }

      const { data, error, count } = await query;
      if (error) {
        toast({ title: "Error loading candidates", description: error.message, variant: "destructive" });
        throw error;
      }
      return { candidates: data || [], total: count || 0 };
    },
    placeholderData: (prev) => prev,
  });

  // Stats query (separate so filters don't affect counts)
  const { data: stats } = useQuery({
    queryKey: ['admin-candidates-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_candidates')
        .select('access_level');
      if (error) throw error;
      const all = data || [];
      return {
        total: all.length,
        focus_batch: all.filter(c => c.access_level === 'focus_batch').length,
        materials_only: all.filter(c => c.access_level === 'materials_only').length,
        generic: all.filter(c => !c.access_level || c.access_level === 'generic').length,
      };
    },
  });

  const candidates = data?.candidates || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);
  

  const startEdit = (candidate: any) => {
    setEditingId(candidate.id);
    setEditForm({ 
      ...candidate,
      access_expires_at_date: candidate.access_expires_at 
        ? new Date(candidate.access_expires_at).toISOString().split('T')[0]
        : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editForm.name) return toast({ title: "Error", description: "Name is required.", variant: "destructive" });
    
    setSaving(true);
    try {
      // 1. Update basic profile fields via direct DB (safe — no access columns)
      const profileData: any = {
        name: editForm.name,
        phone: editForm.phone || null,
        education_level: editForm.education_level,
      };

      const { error: profileError } = await supabase.from('exam_candidates').update(profileData).eq('id', editingId);
      if (profileError) throw profileError;

      // 2. Update access level via secure edge function (admin-verified server-side)
      const accessLevel = editForm.access_level || 'generic';
      let accessExpiresAt: string | null = null;

      if (accessLevel !== 'generic') {
        accessExpiresAt = editForm.access_expires_at_date
          ? new Date(editForm.access_expires_at_date + 'T23:59:59Z').toISOString()
          : new Date(getDefaultExpiry() + 'T23:59:59Z').toISOString();
      }

      const { data: accessResult, error: accessError } = await supabase.functions.invoke('update-access-level', {
        body: {
          candidate_id: editingId,
          access_level: accessLevel,
          access_expires_at: accessExpiresAt,
        },
      });

      if (accessError) throw accessError;
      if (accessResult?.error) throw new Error(accessResult.error);
      
      toast({ title: "Success", description: "Candidate updated successfully." });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-candidates-stats'] });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently revoke access for ${name}? This will delete their profile and all test attempts.`)) return;
    
    try {
      const { error } = await supabase.from('exam_candidates').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Access Revoked", description: "Candidate has been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-candidates-stats'] });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#262626]">User Portal (Candidates)</h1>
          <p className="text-sm text-[#262626]/50 mt-1">Manage portal users, access levels, and subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="h-9 w-64 text-sm"
          />
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-black/10 p-4 text-center">
            <p className="text-2xl font-bold text-[#262626]">{stats.total}</p>
            <p className="text-xs text-foreground/50 font-medium mt-1">Total Users</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.focus_batch}</p>
            <p className="text-xs text-green-600 font-medium mt-1">Focus Batch</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.materials_only}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Materials Only</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.generic}</p>
            <p className="text-xs text-foreground/50 font-medium mt-1">Generic</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {ACCESS_LEVELS.map(level => (
          <button
            key={level.value}
            onClick={() => { setAccessFilter(level.value); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              accessFilter === level.value
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-white text-foreground/60 border border-black/10 hover:bg-black/5'
            }`}
          >
            {level.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-foreground/50">{data?.total ?? 0} candidates</span>
      </div>

      <div className="bg-white rounded-xl border border-black/10 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-black/5 border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50">
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Contact</th>
              <th className="p-4 font-semibold">Target Program</th>
              <th className="p-4 font-semibold">Access Level</th>
              <th className="p-4 font-semibold">Access Expiry</th>
              <th className="p-4 font-semibold">Joined At</th>
              <th className="p-4 font-semibold text-right sticky right-0 bg-[#f5f5f5]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {candidates.map(candidate => {
              const isEditing = editingId === candidate.id;
              const accessLevel = candidate.access_level || 'generic';
              
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
                        <div className="flex flex-col">
                          <div className="font-semibold text-sm">{candidate.name}</div>
                          <div className="text-[10px] uppercase font-bold tracking-widest text-foreground/40 mt-0.5">{candidate.unique_id}</div>
                        </div>
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
                  <td className="p-4">
                    {isEditing ? (
                      <select 
                        className="h-8 px-2 rounded border border-black/10 bg-white text-sm"
                        value={editForm.access_level || 'generic'}
                        onChange={e => {
                          const newLevel = e.target.value;
                          setEditForm({ 
                            ...editForm, 
                            access_level: newLevel,
                            access_expires_at_date: newLevel !== 'generic' && !editForm.access_expires_at_date
                              ? getDefaultExpiry()
                              : newLevel === 'generic' ? '' : editForm.access_expires_at_date,
                          });
                        }}
                      >
                        <option value="generic">Generic</option>
                        <option value="materials_only">Materials Only</option>
                        <option value="focus_batch">Focus Batch</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ACCESS_BADGE_STYLES[accessLevel] || ACCESS_BADGE_STYLES.generic}`}>
                        {accessLevel === 'focus_batch' && <Shield className="w-3 h-3" />}
                        {ACCESS_LABELS[accessLevel] || 'Generic'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground/50">
                    {isEditing ? (
                      editForm.access_level && editForm.access_level !== 'generic' ? (
                        <Input 
                          type="date" 
                          value={editForm.access_expires_at_date || ''} 
                          onChange={e => setEditForm({ ...editForm, access_expires_at_date: e.target.value })}
                          className="h-8 text-sm w-36"
                        />
                      ) : (
                        <span className="text-xs text-foreground/30">—</span>
                      )
                    ) : (
                      candidate.access_expires_at ? (
                        <span className={new Date(candidate.access_expires_at) < new Date() ? 'text-red-500 font-semibold' : ''}>
                          {new Date(candidate.access_expires_at).toLocaleDateString()}
                          {new Date(candidate.access_expires_at) < new Date() && ' (Expired)'}
                        </span>
                      ) : (
                        <span className="text-foreground/30">—</span>
                      )
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground/50">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right sticky right-0 bg-white">
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
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(candidate)} className="h-8 w-8 p-0 text-primary hover:bg-primary/10" title="Edit User">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(candidate.id, candidate.name)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10" title="Revoke Access & Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {candidates.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-foreground/50 text-sm">
                  No candidates found{accessFilter !== 'all' ? ` with "${ACCESS_LABELS[accessFilter]}" access level` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-foreground/50">
            Page {page + 1} of {totalPages} &mdash; {data?.total} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
