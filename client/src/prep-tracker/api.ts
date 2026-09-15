import { supabase } from '@/lib/supabaseClient';
import { DiagnosticScores, Track, Tier, Band } from './types';

export interface EnrolmentData {
  id?: string;
  candidate_id: string;
  track: Track;
  tier: Tier;
  disciplines: string[];
  primary_group?: string;
  application_submitted_at?: string | null;
  has_notes_access?: boolean;
}

export const prepApi = {
  async getEnrolment(candidateId: string) {
    if (candidateId.startsWith('preview-')) {
      const local = localStorage.getItem(`df_prep_enrolment_${candidateId}`);
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
      const defaultEnrolment = {
        id: 'preview-enrolment',
        candidate_id: candidateId,
        track: 'ug' as Track,
        tier: 'standard' as Tier,
        disciplines: [],
        primary_group: null,
        application_submitted_at: null,
        has_notes_access: false,
      };
      localStorage.setItem(`df_prep_enrolment_${candidateId}`, JSON.stringify(defaultEnrolment));
      return defaultEnrolment;
    }

    try {
      const { data, error } = await supabase
        .from('prep_enrolments')
        .select('*')
        .eq('candidate_id', candidateId)
        .maybeSingle();
      if (error) console.error('Error fetching enrolment:', error);
      return data;
    } catch (e) {
      console.warn('Falling back to local enrolment:', e);
      const local = localStorage.getItem(`df_prep_enrolment_${candidateId}`);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveEnrolment(enrolment: EnrolmentData) {
    if (enrolment.candidate_id.startsWith('preview-')) {
      const saved = {
        ...enrolment,
        id: enrolment.id || 'preview-enrolment',
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(`df_prep_enrolment_${enrolment.candidate_id}`, JSON.stringify(saved));
      return saved;
    }

    try {
      const { data, error } = await supabase
        .from('prep_enrolments')
        .upsert(
          {
            candidate_id: enrolment.candidate_id,
            track: enrolment.track,
            tier: enrolment.tier,
            disciplines: enrolment.disciplines || [],
            primary_group: enrolment.primary_group || null,
            application_submitted_at: enrolment.application_submitted_at || null,
            has_notes_access: enrolment.has_notes_access ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'candidate_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      localStorage.setItem(`df_prep_enrolment_${enrolment.candidate_id}`, JSON.stringify(enrolment));
      return enrolment;
    }
  },

  async getCompletions(candidateId: string) {
    if (candidateId.startsWith('preview-')) {
      const stored = localStorage.getItem(`df_prep_comp_${candidateId}`);
      return stored ? JSON.parse(stored) : {};
    }

    try {
      const { data, error } = await supabase
        .from('prep_task_completions')
        .select('task_id, completed_at, minutes_logged, note')
        .eq('candidate_id', candidateId);
      if (error) throw error;
      const map: Record<string, { completedAt: string; minutesLogged: number; note?: string }> = {};
      for (const c of data || []) {
        map[c.task_id] = {
          completedAt: c.completed_at,
          minutesLogged: c.minutes_logged,
          note: c.note,
        };
      }
      return map;
    } catch (err) {
      const stored = localStorage.getItem(`df_prep_comp_${candidateId}`);
      return stored ? JSON.parse(stored) : {};
    }
  },

  async toggleTaskCompletion(
    candidateId: string,
    taskId: string,
    completed: boolean,
    minutesLogged: number = 0
  ) {
    if (candidateId.startsWith('preview-')) {
      const stored = localStorage.getItem(`df_prep_comp_${candidateId}`);
      const map = stored ? JSON.parse(stored) : {};
      if (completed) {
        map[taskId] = {
          completedAt: new Date().toISOString(),
          minutesLogged,
        };
      } else {
        delete map[taskId];
      }
      localStorage.setItem(`df_prep_comp_${candidateId}`, JSON.stringify(map));
      return;
    }

    try {
      if (completed) {
        const { error } = await supabase.from('prep_task_completions').upsert(
          {
            candidate_id: candidateId,
            task_id: taskId,
            completed_at: new Date().toISOString(),
            minutes_logged: minutesLogged,
          },
          { onConflict: 'candidate_id,task_id' }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prep_task_completions')
          .delete()
          .eq('candidate_id', candidateId)
          .eq('task_id', taskId);
        if (error) throw error;
      }
    } catch (e) {
      console.warn('Task toggle failed on remote, saving locally:', e);
      const stored = localStorage.getItem(`df_prep_comp_${candidateId}`);
      const map = stored ? JSON.parse(stored) : {};
      if (completed) {
        map[taskId] = { completedAt: new Date().toISOString(), minutesLogged };
      } else {
        delete map[taskId];
      }
      localStorage.setItem(`df_prep_comp_${candidateId}`, JSON.stringify(map));
    }
  },

  async getDiagnostics(candidateId: string) {
    if (candidateId.startsWith('preview-')) {
      const stored = localStorage.getItem(`df_prep_diag_${candidateId}`);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const defaultDiag = [
        {
          id: 'preview-diag-1',
          candidate_id: candidateId,
          week: 0,
          observation: 3,
          drawing: 3,
          ideation: 4,
          form_material: 3,
          articulation: 3,
          awareness: 3,
          total: 19,
          band: 'standard',
          taken_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`df_prep_diag_${candidateId}`, JSON.stringify(defaultDiag));
      return defaultDiag;
    }

    try {
      const { data, error } = await supabase
        .from('prep_diagnostic_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('week', { ascending: true })
        .order('taken_at', { ascending: false });
      if (error) console.error('Error fetching diagnostics:', error);
      return data || [];
    } catch (e) {
      const stored = localStorage.getItem(`df_prep_diag_${candidateId}`);
      return stored ? JSON.parse(stored) : [];
    }
  },

  async saveDiagnostic(score: {
    candidate_id: string;
    week: number;
    scores: DiagnosticScores;
    total: number;
    band: Band;
  }) {
    const item = {
      id: `diag-${Date.now()}`,
      candidate_id: score.candidate_id,
      week: score.week,
      observation: score.scores.observation,
      drawing: score.scores.drawing,
      ideation: score.scores.ideation,
      form_material: score.scores.form_material,
      articulation: score.scores.articulation,
      awareness: score.scores.awareness,
      total: score.total,
      band: score.band,
      taken_at: new Date().toISOString(),
    };

    if (score.candidate_id.startsWith('preview-')) {
      const stored = localStorage.getItem(`df_prep_diag_${score.candidate_id}`);
      const list = stored ? JSON.parse(stored) : [];
      list.push(item);
      localStorage.setItem(`df_prep_diag_${score.candidate_id}`, JSON.stringify(list));
      return item;
    }

    try {
      const { data, error } = await supabase
        .from('prep_diagnostic_scores')
        .insert({
          candidate_id: score.candidate_id,
          week: score.week,
          observation: score.scores.observation,
          drawing: score.scores.drawing,
          ideation: score.scores.ideation,
          form_material: score.scores.form_material,
          articulation: score.scores.articulation,
          awareness: score.scores.awareness,
          total: score.total,
          band: score.band,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      const stored = localStorage.getItem(`df_prep_diag_${score.candidate_id}`);
      const list = stored ? JSON.parse(stored) : [];
      list.push(item);
      localStorage.setItem(`df_prep_diag_${score.candidate_id}`, JSON.stringify(list));
      return item;
    }
  },

  async getSimulationLogs(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_simulation_logs')
      .select('*, prep_error_ledger_entries(*)')
      .eq('candidate_id', candidateId)
      .order('date', { ascending: false });
    if (error) console.error('Error fetching simulations:', error);
    return data || [];
  },

  async saveSimulationLog(log: {
    candidate_id: string;
    task_id: string;
    date: string;
    paper_or_brief: string;
    time_taken_minutes: number;
    finished: boolean;
    dominant_bucket: 'concept' | 'time' | 'clarity' | 'care';
    answer_rewritten: boolean;
    self_score?: number | null;
    mentor_score?: number | null;
  }) {
    const { data, error } = await supabase
      .from('prep_simulation_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getErrorLedgers(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_error_ledger_entries')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('date', { ascending: false });
    if (error) console.error('Error fetching error ledgers:', error);
    return data || [];
  },

  async saveErrorLedger(entry: {
    candidate_id: string;
    simulation_log_id?: string | null;
    date: string;
    what_went_wrong: string;
    bucket: 'concept' | 'time' | 'clarity' | 'care';
    root_cause: string;
    fixing_drill: string;
  }) {
    const { data, error } = await supabase
      .from('prep_error_ledger_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getCritiques(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_critique_submissions')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('submitted_at', { ascending: false });
    if (error) console.error('Error fetching critiques:', error);
    return data || [];
  },

  async saveCritique(critique: {
    candidate_id: string;
    task_id: string;
    attachments: string[];
    note: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('prep_critique_submissions')
      .insert({
        candidate_id: critique.candidate_id,
        task_id: critique.task_id,
        attachments: critique.attachments || [],
        note: critique.note,
        status: critique.status || 'Submitted',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCritiqueStatus(id: string, status: string, feedbackBy?: string) {
    const { data, error } = await supabase
      .from('prep_critique_submissions')
      .update({
        status,
        feedback_at: new Date().toISOString(),
        feedback_by: feedbackBy || 'Mentor',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSundayReviews(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_sunday_reviews')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('week', { ascending: true });
    if (error) console.error('Error fetching Sunday reviews:', error);
    return data || [];
  },

  async saveSundayReview(review: {
    candidate_id: string;
    week: number;
    improved_with_evidence: string;
    did_not_move_and_why: string;
    one_change: string;
    completion_check: boolean[];
  }) {
    const { data, error } = await supabase
      .from('prep_sunday_reviews')
      .upsert(
        {
          candidate_id: review.candidate_id,
          week: review.week,
          improved_with_evidence: review.improved_with_evidence,
          did_not_move_and_why: review.did_not_move_and_why,
          one_change: review.one_change,
          completion_check: review.completion_check,
        },
        { onConflict: 'candidate_id,week' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDiaryEntries(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_diary_entries')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('date', { ascending: false });
    if (error) console.error('Error fetching diary entries:', error);
    return data || [];
  },

  async saveDiaryEntry(entry: {
    candidate_id: string;
    date: string;
    place: string;
    theme: string;
    what_i_saw: string;
    how_it_works: string;
    where_it_fails: string;
    what_id_change: string;
    photo_url?: string | null;
  }) {
    const { data, error } = await supabase
      .from('prep_diary_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getExplanationCards(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_explanation_cards')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching explanation cards:', error);
    return data || [];
  },

  async saveExplanationCard(card: {
    candidate_id: string;
    task_id?: string | null;
    who: string;
    what_breaks: string;
    the_move: string;
    why_this: string;
    what_it_costs: string;
  }) {
    const { data, error } = await supabase
      .from('prep_explanation_cards')
      .insert(card)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAwarenessCards(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_awareness_cards')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching awareness cards:', error);
    return data || [];
  },

  async saveAwarenessCard(card: {
    candidate_id: string;
    topic: string;
    what_it_is: string;
    why_it_mattered: string;
    example_seen: string;
    opinion: string;
  }) {
    const { data, error } = await supabase
      .from('prep_awareness_cards')
      .insert(card)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getBuildRecords(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_build_records')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching build records:', error);
    return data || [];
  },

  async saveBuildRecord(record: {
    candidate_id: string;
    task_id?: string | null;
    drill_number?: number | null;
    photos: string[];
    caption?: string;
  }) {
    const { data, error } = await supabase
      .from('prep_build_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getArticulationLogs(candidateId: string) {
    const { data, error } = await supabase
      .from('prep_articulation_logs')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching articulation logs:', error);
    return data || [];
  },

  async saveArticulationLog(log: {
    candidate_id: string;
    task_id?: string | null;
    type: 'pitch' | 'mockConversation';
    topic: string;
    recording_url?: string | null;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('prep_articulation_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Class Notes Integration
  async getClassNotes(examFilter?: string) {
    try {
      let query = supabase
        .from('class_notes')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (examFilter && examFilter !== 'all') {
        query = query.or(`target_exam.eq.all,target_exam.ilike.%${examFilter}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Falling back to default class notes:', e);
    }

    // Default rich notes preview for localhost and offline testing
    return [
      {
        id: 'cn-1',
        title: 'NID DAT Visual Grammar & Orthographic Perspective',
        description: 'Comprehensive guide to 1-point, 2-point, and 3-point worm/bird eye perspective construction with proportion grids.',
        category: 'Drawing & Perspective',
        target_exam: 'NID',
        pages_count: 18,
        file_url: 'https://example.com/notes/perspective-guide.pdf',
        is_free_preview: true,
      },
      {
        id: 'cn-2',
        title: 'Material Manipulation, Textures & 3D Form Sensitivity',
        description: 'Deep dive into rendering paper folds, terracotta, bamboo, metallic finishes, and cross-sectional transformation.',
        category: 'Form & Material',
        target_exam: 'NID',
        pages_count: 24,
        file_url: 'https://example.com/notes/material-sensitivity.pdf',
        is_free_preview: false,
      },
      {
        id: 'cn-3',
        title: 'Sequential Storyboarding & Frame-by-Frame Ideation Rubric',
        description: 'Step-by-step masterclass on establishing shots, emotional escalation, character consistency, and concluding twists.',
        category: 'Visual Narrative',
        target_exam: 'NID',
        pages_count: 16,
        file_url: 'https://example.com/notes/storyboarding-masterclass.pdf',
        is_free_preview: false,
      },
    ];
  },

  // Mock Test Integration (Link to Latest Published Exam)
  async getLatestPublishedMockExam(track: Track) {
    try {
      const examName = track === 'ug' ? 'NID BDES' : 'NID MDES';
      const { data: programTests, error: pErr } = await supabase
        .from('exam_tests')
        .select('id, title, status, created_at, exam_programs(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!pErr && programTests && programTests.length > 0) {
        const matching = programTests.find(
          t => (t as any).exam_programs?.name?.toUpperCase()?.includes(examName)
        );
        if (matching) return matching;
        const nidFallback = programTests.find(
          t => (t as any).exam_programs?.name?.toUpperCase()?.includes('NID')
        );
        if (nidFallback) return nidFallback;
        return programTests[0];
      }
    } catch (e) {
      console.warn('Could not query exam_tests for mock link:', e);
    }
    return {
      id: 'nid-dat-2027-sim-1',
      title: 'NID DAT 2027 Prelims Full Practice Simulation Paper 01',
    };
  },

  // Activate ₹500 Notes Pass
  async unlockNotesPass(candidateId: string) {
    if (candidateId.startsWith('preview-')) {
      const stored = localStorage.getItem(`df_prep_enrolment_${candidateId}`);
      const enrolment = stored ? JSON.parse(stored) : { candidate_id: candidateId };
      enrolment.has_notes_access = true;
      localStorage.setItem(`df_prep_enrolment_${candidateId}`, JSON.stringify(enrolment));
      return enrolment;
    }

    try {
      const { data, error } = await supabase
        .from('prep_enrolments')
        .update({ has_notes_access: true, updated_at: new Date().toISOString() })
        .eq('candidate_id', candidateId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      const stored = localStorage.getItem(`df_prep_enrolment_${candidateId}`);
      const enrolment = stored ? JSON.parse(stored) : { candidate_id: candidateId };
      enrolment.has_notes_access = true;
      localStorage.setItem(`df_prep_enrolment_${candidateId}`, JSON.stringify(enrolment));
      return enrolment;
    }
  },
};
