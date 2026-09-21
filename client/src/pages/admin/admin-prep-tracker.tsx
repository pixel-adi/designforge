import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from './admin-layout';
import { prepApi } from '@/prep-tracker/api';
import { DayRecord, TaskRecord } from '@/prep-tracker/types';
import ugPlanData from '../../../../prep-tracker-kit/content/plan.ug.json';
import pgPlanData from '../../../../prep-tracker-kit/content/plan.pg.json';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Settings,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  Copy,
} from 'lucide-react';

const BLOCK_OPTIONS = [
  { value: 'drill', label: 'Daily Drill' },
  { value: 'build', label: 'Build Block' },
  { value: 'critique', label: 'Critique Session' },
  { value: 'simulation', label: 'Full Simulation' },
  { value: 'review', label: 'Sunday Review' },
  { value: 'challenge', label: 'Rapid Challenge' },
  { value: 'milestone', label: 'Curriculum Milestone' },
];

const CAPTURE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'diaryEntry', label: 'Design Diary Entry' },
  { value: 'simulationLog', label: 'Simulation & Errors' },
  { value: 'reviewSubmission', label: 'Critique Submission' },
  { value: 'sundayReview', label: 'Sunday Reflection' },
  { value: 'explanationCard', label: 'Explanation Card' },
  { value: 'awarenessCard', label: 'Awareness Card' },
  { value: 'pitch', label: '60s Recorded Pitch' },
];

export default function AdminPrepTracker() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'csv' | 'settings' | 'students'>('calendar');

  // Exam Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('nid-ug-2027');
  const [currentPlan, setCurrentPlan] = useState<any | null>(null);

  // Calendar State
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(8); // Sep (0-indexed: 8)

  // Day Editor Drawer / Modal
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingDayRecord, setEditingDayRecord] = useState<DayRecord | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState<Partial<TaskRecord>>({
    block: 'drill',
    kind: 'task',
    title: '',
    detail: '',
    minutes: { light: 45, intensive: 45 },
    capture: [],
  });

  // Students Roster State
  const [enrolments, setEnrolments] = useState<any[]>([]);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  // Load plans & initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPlans, fetchedEnrolments] = await Promise.all([
        prepApi.getExamPlans(),
        prepApi.getAllEnrolments(),
      ]);

      const defaultPlans = [
        {
          id: 'nid-ug-2027',
          exam_code: 'NID',
          title: 'NID DAT 2027: B.Des & Integrated M.Des',
          track: 'ug',
          academic_year: '2027',
          start_date: '2026-09-19',
          end_date: '2026-12-19',
          exam_date: '2026-12-20',
          days: (ugPlanData.days as any[]) || [],
        },
        {
          id: 'nid-pg-2027',
          exam_code: 'NID',
          title: 'NID DAT 2027: M.Des Disciplines',
          track: 'pg',
          academic_year: '2027',
          start_date: '2026-09-19',
          end_date: '2026-12-19',
          exam_date: '2026-12-20',
          days: (pgPlanData.days as any[]) || [],
        },
        {
          id: 'uceed-2027',
          exam_code: 'UCEED',
          title: 'UCEED 2027: B.Des (IIT Bombay)',
          track: 'ug',
          academic_year: '2027',
          start_date: '2026-09-28',
          end_date: '2027-01-16',
          exam_date: '2027-01-17',
          days: [],
        },
        {
          id: 'ceed-2027',
          exam_code: 'CEED',
          title: 'CEED 2027: M.Des (IITs)',
          track: 'pg',
          academic_year: '2027',
          start_date: '2026-09-28',
          end_date: '2027-01-16',
          exam_date: '2027-01-17',
          days: [],
        },
        {
          id: 'nift-2027',
          exam_code: 'NIFT',
          title: 'NIFT 2027: Fashion & Design (CAT+GAT)',
          track: 'ug',
          academic_year: '2027',
          start_date: '2026-10-05',
          end_date: '2027-02-06',
          exam_date: '2027-02-07',
          days: [],
        },
      ];

      // Merge fetched plans with default catalogue
      const mergedPlans = [...defaultPlans];
      for (const p of fetchedPlans || []) {
        const idx = mergedPlans.findIndex(m => m.id === p.id);
        if (idx >= 0) {
          // If the fetched plan has days, use them. If it has empty days ([]), preserve the rich default days!
          const daysToUse = Array.isArray(p.days) && p.days.length > 0 ? p.days : mergedPlans[idx].days;
          mergedPlans[idx] = { ...mergedPlans[idx], ...p, days: daysToUse };
        } else {
          mergedPlans.push(p);
        }
      }

      setPlans(mergedPlans);
      setEnrolments(fetchedEnrolments || []);

      const active = mergedPlans.find(p => p.id === activePlanId) || mergedPlans[0];
      setCurrentPlan(active);
    } catch (e) {
      console.error('Failed to load prep tracker data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When activePlanId changes, update currentPlan
  useEffect(() => {
    const p = plans.find(item => item.id === activePlanId);
    if (p) {
      setCurrentPlan(p);
      if (p.start_date) {
        const d = new Date(p.start_date);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [activePlanId, plans]);

  // Map of days by date for quick lookup
  const planDaysByDate = useMemo(() => {
    const map = new Map<string, DayRecord>();
    if (currentPlan && Array.isArray(currentPlan.days)) {
      for (const d of currentPlan.days) {
        map.set(d.date, d);
      }
    }
    return map;
  }, [currentPlan]);

  // Calendar month grid generator (35 cells)
  const monthGridDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay(); // 0 is Sun

    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - startOffset);

    const cells: Array<{
      dateStr: string;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      dayRecord?: DayRecord;
    }> = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      cells.push({
        dateStr,
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === viewMonth,
        dayRecord: planDaysByDate.get(dateStr),
      });
    }

    return cells;
  }, [viewYear, viewMonth, planDaysByDate]);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Handle clicking a date to edit its itinerary
  const handleSelectDate = (dateStr: string) => {
    setEditingDate(dateStr);
    const existing = planDaysByDate.get(dateStr);
    if (existing) {
      setEditingDayRecord(JSON.parse(JSON.stringify(existing)));
    } else {
      // Calculate day number based on plan start date
      let dayNum = 1;
      if (currentPlan?.start_date) {
        const start = new Date(currentPlan.start_date).getTime();
        const cur = new Date(dateStr).getTime();
        dayNum = Math.max(1, Math.round((cur - start) / (1000 * 60 * 60 * 24)) + 1);
      }

      setEditingDayRecord({
        day: dayNum,
        date: dateStr,
        weekday: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        week: Math.floor((dayNum - 1) / 7),
        phaseId: 'p1',
        title: `Day ${dayNum} Operating Routine`,
        tasks: [],
      });
    }
    setShowTaskForm(false);
  };

  // Add task to current editing day record
  const handleAddTask = () => {
    if (!taskFormData.title?.trim()) {
      toast({ title: 'Task title required', variant: 'destructive' });
      return;
    }

    const newTask: TaskRecord = {
      id: `task-${Date.now()}`,
      block: taskFormData.block || 'drill',
      module: 'Foundation',
      kind: (taskFormData.block === 'simulation' ? 'simulation' : taskFormData.block === 'review' ? 'review' : 'task'),
      title: taskFormData.title.trim(),
      detail: taskFormData.detail?.trim() || '',
      minutes: {
        light: Number(taskFormData.minutes?.light) || 45,
        intensive: Number(taskFormData.minutes?.intensive) || 60,
      },
      capture: taskFormData.capture && taskFormData.capture.length > 0 ? taskFormData.capture : [],
      source: ['Admin Portal'],
    };

    if (editingDayRecord) {
      setEditingDayRecord({
        ...editingDayRecord,
        tasks: [...editingDayRecord.tasks, newTask],
      });
    }

    setTaskFormData({
      block: 'drill',
      kind: 'task',
      title: '',
      detail: '',
      minutes: { light: 45, intensive: 45 },
      capture: [],
    });
    setShowTaskForm(false);
  };

  // Delete task from editing day
  const handleDeleteTask = (taskId: string) => {
    if (!editingDayRecord) return;
    setEditingDayRecord({
      ...editingDayRecord,
      tasks: editingDayRecord.tasks.filter(t => t.id !== taskId),
    });
  };

  // Save Day Record into Current Plan & Supabase
  const handleSaveDayRecord = async () => {
    if (!editingDayRecord || !editingDate || !currentPlan) return;
    setSaving(true);

    try {
      const existingDays: DayRecord[] = Array.isArray(currentPlan.days) ? [...currentPlan.days] : [];
      const idx = existingDays.findIndex(d => d.date === editingDate);

      if (idx >= 0) {
        existingDays[idx] = editingDayRecord;
      } else {
        existingDays.push(editingDayRecord);
      }

      // Sort by day number
      existingDays.sort((a, b) => a.day - b.day);

      const updatedPlan = {
        ...currentPlan,
        days: existingDays,
      };

      await prepApi.saveExamPlan(updatedPlan);

      // Update local state
      setCurrentPlan(updatedPlan);
      setPlans(prev => prev.map(p => (p.id === updatedPlan.id ? updatedPlan : p)));

      toast({
        title: 'Day Updated!',
        description: `Itinerary for ${editingDate} saved to ${currentPlan.title}.`,
      });

      setEditingDate(null);
      setEditingDayRecord(null);
    } catch (e: any) {
      toast({
        title: 'Failed to save day',
        description: e.message || 'Please check database permissions.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Quick Apply Rhythm Template (Drill + Build on weekdays, Mock on Sat, Review on Sun)
  const handleApplyRhythm = () => {
    if (!editingDayRecord) return;
    const weekday = editingDayRecord.weekday.toLowerCase();

    if (weekday.includes('sun')) {
      // Sunday Review Template
      setEditingDayRecord({
        ...editingDayRecord,
        title: `Sunday Rest & Written Review (Week ${editingDayRecord.week})`,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            block: 'review',
            module: 'Weekly OS',
            kind: 'review',
            title: 'Weekly Written Reflection & Audit',
            detail: 'Complete 3 reflections: what worked, pacing errors, and priorities for next week.',
            minutes: { light: 30, intensive: 45 },
            capture: ['sundayReview'],
            source: ['OS Template'],
          },
        ],
      });
    } else if (weekday.includes('sat')) {
      // Saturday Simulation Template
      setEditingDayRecord({
        ...editingDayRecord,
        title: `Full Exam Simulation & Critique`,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            block: 'simulation',
            module: 'Simulation',
            kind: 'simulation',
            title: 'Full Length 3-Hour Timed Mock Paper',
            detail: 'Simulate strict exam conditions. Log paper score and errors into the 4 buckets.',
            minutes: { light: 180, intensive: 180 },
            capture: ['simulationLog'],
            source: ['OS Template'],
          },
        ],
      });
    } else {
      // Mon - Fri Standard Rhythm
      setEditingDayRecord({
        ...editingDayRecord,
        title: `Daily Drill & Studio Challenge`,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            block: 'drill',
            module: 'Drill',
            kind: 'task',
            title: '45-Min Daily Speed & Observation Drill',
            detail: 'Draw 3 perspectives or 10 rapid ideas without lifting your pen.',
            minutes: { light: 45, intensive: 45 },
            capture: ['diaryEntry'],
            source: ['OS Template'],
          },
          {
            id: `task-${Date.now()}-2`,
            block: 'build',
            module: 'Build',
            kind: 'task',
            title: '90-Min Material Build or Concept Sheet',
            detail: 'Execute given problem brief with high visual clarity and clear user context.',
            minutes: { light: 60, intensive: 90 },
            capture: ['diaryEntry'],
            source: ['OS Template'],
          },
        ],
      });
    }

    toast({
      title: 'Template Applied',
      description: `Loaded standard ${weekday.toUpperCase()} rhythm. Tap Save to apply.`,
    });
  };

  // CSV Template Exporter
  const handleDownloadCsvTemplate = () => {
    const headers = 'day,week,phase,date,block,kind,title,detail,minutes_light,minutes_intensive,capture\n';
    const sampleRows = [
      '1,0,p1,2026-09-19,drill,task,"Orientation & Diagnostic","Complete baseline self-calibration",45,45,none',
      '2,0,p1,2026-09-20,review,review,"Sunday Orientation Review","Audit materials and setup diary",30,30,sundayReview',
      '3,1,p1,2026-09-21,drill,task,"Observation Line Drill","5 quick objects in context",45,45,diaryEntry',
    ].join('\n');

    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlan?.id || 'exam-plan'}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse Uploaded CSV
  const handleParseCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = String(evt.target?.result || '');
      setCsvText(text);

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        toast({ title: 'Empty CSV file', variant: 'destructive' });
        return;
      }

      // Group rows by day
      const dayMap: Record<number, any> = {};
      const rows = lines.slice(1);

      for (const row of rows) {
        // Simple CSV splitter handling quotes
        const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 7) continue;

        const [dayStr, weekStr, phaseStr, dateStr, blockStr, kindStr, titleStr, detailStr, minLight, minIntensive, captureStr] = cols;
        const dayNum = parseInt(dayStr) || 1;

        if (!dayMap[dayNum]) {
          dayMap[dayNum] = {
            day: dayNum,
            date: dateStr || '',
            week: parseInt(weekStr) || 0,
            phaseId: phaseStr || 'p1',
            title: `Day ${dayNum} Tasks`,
            tasks: [],
          };
        }

        dayMap[dayNum].tasks.push({
          id: `task-${dayNum}-${dayMap[dayNum].tasks.length + 1}`,
          block: blockStr || 'drill',
          module: phaseStr || 'Module',
          kind: kindStr || 'task',
          title: titleStr || 'Daily Task',
          detail: detailStr || '',
          minutes: {
            light: parseInt(minLight) || 45,
            intensive: parseInt(minIntensive) || 45,
          },
          capture: captureStr && captureStr !== 'none' ? [captureStr] : [],
          source: ['CSV Import'],
        });
      }

      const parsedDays = Object.values(dayMap).sort((a, b) => a.day - b.day);
      setCsvPreview(parsedDays);
      toast({
        title: 'CSV Parsed Successfully',
        description: `Found ${parsedDays.length} days with ${rows.length} total tasks.`,
      });
    };
    reader.readAsText(file);
  };

  // Commit CSV to Database
  const handleCommitCsvToPlan = async () => {
    if (csvPreview.length === 0 || !currentPlan) return;
    setSaving(true);
    try {
      const updatedPlan = {
        ...currentPlan,
        days: csvPreview,
      };

      await prepApi.saveExamPlan(updatedPlan);
      setCurrentPlan(updatedPlan);
      setPlans(prev => prev.map(p => (p.id === updatedPlan.id ? updatedPlan : p)));

      toast({
        title: 'Curriculum Imported!',
        description: `Successfully loaded ${csvPreview.length} days into ${currentPlan.title}.`,
      });

      setCsvPreview([]);
      setCsvText('');
      setActiveTab('calendar');
    } catch (e: any) {
      toast({
        title: 'Import failed',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground/60">Loading Prep Tracker Control Center...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary/10 text-primary uppercase tracking-wider">
                Admin Control
              </span>
              <span className="text-xs text-foreground/50 font-semibold">Universal Curriculum OS</span>
            </div>
            <h1 className="text-2xl font-black text-[#1e293b] tracking-tight mt-1">
              Prep Tracker Control Center
            </h1>
            <p className="text-xs text-foreground/60 mt-0.5">
              Manage curricula for NID, UCEED, CEED, and NIFT. Tap any date on the calendar to edit tasks or import via CSV.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsvTemplate}
              className="h-9 gap-1.5 text-xs font-bold bg-white border-black/10 text-[#1e293b]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Template</span>
            </Button>
          </div>
        </div>

        {/* 1. Exam Selector Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#f8fafc] border border-black/10">
          {plans.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePlanId(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activePlanId === p.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-black/5'
              }`}
            >
              {p.exam_code}: {p.title.split(':')[0]}
            </button>
          ))}
        </div>

        {/* 2. Admin Section View Switcher */}
        <div className="flex items-center gap-2 border-b border-black/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Interactive Calendar Day Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'csv'
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV / File Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-[#1e293b] text-white shadow-xs'
                : 'bg-black/5 hover:bg-black/10 text-foreground/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Roster ({enrolments.length})</span>
          </button>
        </div>

        {/* 3. TAB CONTENT: Interactive Calendar Editor */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Calendar Controls */}
            <div className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-base font-extrabold text-[#1e293b]">{monthLabel}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-foreground/60 font-medium">
                Tap any day to view or add drills, builds & critique tasks.
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-xs">
              {/* Day names */}
              <div className="grid grid-cols-7 border-b border-black/10 bg-[#f8fafc] text-center py-2 text-[11px] font-bold uppercase text-foreground/50">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* 35 Days Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-black/5">
                {monthGridDays.map(cell => {
                  const hasTasks = Boolean(cell.dayRecord && Array.isArray(cell.dayRecord.tasks) && cell.dayRecord.tasks.length > 0);
                  const taskCount = cell.dayRecord && Array.isArray(cell.dayRecord.tasks) ? cell.dayRecord.tasks.length : 0;
                  const totalMinutes = cell.dayRecord && Array.isArray(cell.dayRecord.tasks)
                    ? cell.dayRecord.tasks.reduce((sum, t) => sum + (typeof t.minutes === 'number' ? t.minutes : (t.minutes?.light || 0)), 0)
                    : 0;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => handleSelectDate(cell.dateStr)}
                      className={`min-h-[100px] p-2.5 transition-all cursor-pointer flex flex-col justify-between group hover:bg-sky-50/50 ${
                        cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-foreground/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            cell.isCurrentMonth ? 'text-[#1e293b]' : 'text-foreground/40'
                          }`}
                        >
                          {cell.dayOfMonth}
                        </span>

                        {cell.dayRecord && (
                          <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/5">
                            Day {cell.dayRecord.day}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 my-1">
                        {hasTasks ? (
                          <div className="p-1 rounded-md bg-emerald-50 border border-emerald-200/60 text-[10px] text-emerald-800 font-semibold leading-tight">
                            {taskCount} task{taskCount > 1 ? 's' : ''} · {totalMinutes}m
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-foreground/40 text-center py-1 border border-dashed border-black/10 rounded">
                            + Add Tasks
                          </div>
                        )}
                      </div>

                      <div className="text-[9px] text-foreground/40 truncate">
                        {cell.dayRecord?.title || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB CONTENT: CSV / File Bulk Import */}
        {activeTab === 'csv' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl border border-black/10 bg-white shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#1e293b]">Bulk Import Curriculum via CSV</h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Upload a 60–92 day curriculum file for {currentPlan?.title}. The system validates day numbers, task kinds, and minutes.
                </p>
              </div>

              <div className="border-2 border-dashed border-black/15 rounded-2xl p-8 text-center space-y-3 bg-[#f8fafc]">
                <FileSpreadsheet className="w-10 h-10 text-primary/60 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1e293b]">Choose a CSV file or drag and drop here</p>
                  <p className="text-[11px] text-foreground/50">Required columns: day, week, phase, date, block, kind, title, detail, minutes_light, minutes_intensive, capture</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleParseCsv}
                  className="text-xs text-foreground/70 file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-black/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Preview Ready ({csvPreview.length} days parsed)
                    </span>
                    <Button
                      size="sm"
                      onClick={handleCommitCsvToPlan}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save into {currentPlan?.exam_code} Plan</span>
                    </Button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-black/10 rounded-xl divide-y text-xs">
                    {csvPreview.slice(0, 10).map((d: any) => (
                      <div key={d.day} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold">Day {d.day} (Week {d.week}):</span> {d.title}
                        </div>
                        <span className="text-foreground/50 font-medium">{d.tasks?.length || 0} tasks</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. TAB CONTENT: Student Roster & Overrides */}
        {activeTab === 'students' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-xs">
              <div className="p-4 border-b border-black/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1e293b]">Enrolled Candidates</h3>
                  <p className="text-xs text-foreground/50">Manage active exams, tracks, and diagnostic bands per student.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-foreground/60 border-b border-black/10 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Candidate ID</th>
                      <th className="p-3">Active Exams</th>
                      <th className="p-3">Track</th>
                      <th className="p-3">Tier</th>
                      <th className="p-3">Notes Pass</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {enrolments.map(enr => (
                      <tr key={enr.id || enr.candidate_id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-[#1e293b]">{enr.candidate_id}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(enr.active_exam_ids || [enr.track === 'pg' ? 'nid-pg-2027' : 'nid-ug-2027']).map((id: string) => (
                              <span key={id} className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                {id}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 uppercase font-bold">{enr.track || 'UG'}</td>
                        <td className="p-3 capitalize">{enr.tier || 'intensive'}</td>
                        <td className="p-3">
                          {enr.has_notes_access ? (
                            <span className="text-emerald-600 font-bold">Unlocked</span>
                          ) : (
                            <span className="text-foreground/40">Locked</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingStudent(enr);
                            }}
                            className="h-7 text-xs font-bold"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Edit Day Itinerary Sheet */}
      <Dialog open={Boolean(editingDate)} onOpenChange={open => !open && setEditingDate(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                Day {editingDayRecord?.day} · {editingDayRecord?.weekday}
              </span>
              <span className="text-xs text-foreground/50 font-medium">{editingDate}</span>
            </div>
            <DialogTitle className="text-lg">Edit Itinerary: {editingDayRecord?.title}</DialogTitle>
            <DialogDescription>
              Configure tasks, drills, and challenges assigned to students on this day for {currentPlan?.title}.
            </DialogDescription>
          </DialogHeader>

          {editingDayRecord && (
            <div className="space-y-5 py-2">
              {/* Day Meta fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Day Title</Label>
                  <Input
                    value={editingDayRecord.title}
                    onChange={e => setEditingDayRecord({ ...editingDayRecord, title: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Week Number</Label>
                  <Input
                    type="number"
                    value={editingDayRecord.week}
                    onChange={e => setEditingDayRecord({ ...editingDayRecord, week: parseInt(e.target.value) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Quick Template button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-black/5">
                <div>
                  <span className="text-xs font-bold text-[#1e293b] block">Apply Standard Rhythm</span>
                  <span className="text-[11px] text-foreground/50">Auto-fill based on day of week</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyRhythm}
                  className="h-8 text-xs font-bold gap-1 bg-white"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-fill</span>
                </Button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground/60">
                    Tasks & Challenges ({editingDayRecord.tasks.length})
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setShowTaskForm(!showTaskForm)}
                    className="h-7 text-xs font-bold bg-primary text-white gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Task</span>
                  </Button>
                </div>

                {/* Task Form */}
                {showTaskForm && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Task Title</Label>
                      <Input
                        placeholder="e.g. 45-Min Perspective Speed Drill"
                        value={taskFormData.title}
                        onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Block Type</Label>
                        <select
                          value={taskFormData.block}
                          onChange={e => setTaskFormData({ ...taskFormData, block: e.target.value })}
                          className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                        >
                          {BLOCK_OPTIONS.map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Artifact Capture</Label>
                        <select
                          value={taskFormData.capture?.[0] || 'none'}
                          onChange={e => setTaskFormData({ ...taskFormData, capture: e.target.value === 'none' ? [] : [e.target.value] })}
                          className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                        >
                          {CAPTURE_OPTIONS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Light Minutes</Label>
                        <Input
                          type="number"
                          value={taskFormData.minutes?.light || 45}
                          onChange={e => setTaskFormData({ ...taskFormData, minutes: { ...taskFormData.minutes, light: parseInt(e.target.value) || 45 } })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Intensive Minutes</Label>
                        <Input
                          type="number"
                          value={taskFormData.minutes?.intensive || 45}
                          onChange={e => setTaskFormData({ ...taskFormData, minutes: { ...taskFormData.minutes, intensive: parseInt(e.target.value) || 45 } })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Task Prompt / Brief</Label>
                      <Textarea
                        placeholder="Detailed instructions for the student..."
                        value={taskFormData.detail}
                        onChange={e => setTaskFormData({ ...taskFormData, detail: e.target.value })}
                        className="text-xs min-h-[60px]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setShowTaskForm(false)} className="h-7 text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddTask} className="h-7 text-xs bg-primary text-white">
                        Confirm Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* List of Tasks */}
                <div className="space-y-2">
                  {editingDayRecord.tasks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-black/5 bg-white shadow-2xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                            {t.block}
                          </span>
                          <span className="font-bold text-xs text-[#1e293b]">{t.title}</span>
                        </div>
                        <p className="text-[11px] text-foreground/50 line-clamp-1">{t.detail}</p>
                        <div className="text-[10px] text-foreground/40 font-medium">
                          Light: {t.minutes.light || 0}m · Intensive: {t.minutes.intensive || 0}m
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1.5 text-foreground/40 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {editingDayRecord.tasks.length === 0 && !showTaskForm && (
                    <div className="py-6 text-center text-xs text-foreground/40 border border-dashed border-black/10 rounded-xl">
                      No tasks assigned yet. Click "Add Task" or "Auto-fill" above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-black/10">
            <Button variant="outline" size="sm" onClick={() => setEditingDate(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveDayRecord}
              disabled={saving}
              className="bg-primary text-white text-xs font-bold gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
