import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
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
  Trophy,
  Flame,
  X,
  Eye,
  Undo2,
  Filter,
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'csv' | 'students'>('calendar');

  // Exam Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('nid-ug-2027');
  const [currentPlan, setCurrentPlan] = useState<any | null>(null);

  // Calendar State & Cadence Filter
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(8); // Sep (0-indexed: 8)
  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'drill' | 'build' | 'critique' | 'simulation' | 'review'>('all');

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

  // CSV Import & Draft Preview State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [stagedDays, setStagedDays] = useState<DayRecord[] | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Students Roster State
  const [enrolments, setEnrolments] = useState<any[]>([]);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  // Load plans & initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPlans, fetchedEnrolments] = await Promise.all([
        prepApi.getExamPlans(),
        prepApi.getAllEnrolments(),
      ]);

      const defaultPlans = [
        // Undergraduate (UG)
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
          id: 'nift-ug-2027',
          exam_code: 'NIFT',
          title: 'NIFT 2027: Bachelor of Design (B.Des)',
          track: 'ug',
          academic_year: '2027',
          start_date: '2026-10-05',
          end_date: '2027-02-06',
          exam_date: '2027-02-07',
          days: [],
        },
        // Postgraduate (PG)
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
          id: 'ceed-2027',
          exam_code: 'CEED',
          title: 'CEED 2027: Master of Design (IITs)',
          track: 'pg',
          academic_year: '2027',
          start_date: '2026-09-28',
          end_date: '2027-01-16',
          exam_date: '2027-01-17',
          days: [],
        },
        {
          id: 'nift-pg-2027',
          exam_code: 'NIFT',
          title: 'NIFT 2027: Master of Design (M.Des)',
          track: 'pg',
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
        // Map legacy nift-2027 to nift-ug-2027 if present
        const targetId = p.id === 'nift-2027' ? 'nift-ug-2027' : p.id;
        const idx = mergedPlans.findIndex(m => m.id === targetId);
        if (idx >= 0) {
          const daysToUse = Array.isArray(p.days) && p.days.length > 0 ? p.days : mergedPlans[idx].days;
          mergedPlans[idx] = { ...mergedPlans[idx], ...p, id: targetId, days: daysToUse };
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

  // When activePlanId changes, update currentPlan and reset draft preview
  useEffect(() => {
    const p = plans.find(item => item.id === activePlanId);
    if (p) {
      setCurrentPlan(p);
      setIsPreviewMode(false);
      setStagedDays(null);
      setCsvPreview([]);
      setCsvText('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (p.start_date) {
        const d = new Date(p.start_date);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [activePlanId, plans]);

  // Separate UG and PG plans
  const ugPlans = useMemo(() => plans.filter(p => p.track === 'ug'), [plans]);
  const pgPlans = useMemo(() => plans.filter(p => p.track === 'pg'), [plans]);

  // Active days: staged draft days if in preview mode, otherwise currentPlan.days
  const activeDaysList: DayRecord[] = useMemo(() => {
    if (isPreviewMode && stagedDays) return stagedDays;
    return (currentPlan?.days as DayRecord[]) || [];
  }, [isPreviewMode, stagedDays, currentPlan]);

  // Map of days by date for quick lookup
  const planDaysByDate = useMemo(() => {
    const map = new Map<string, DayRecord>();
    for (const d of activeDaysList) {
      if (d.date) {
        map.set(d.date, d);
      }
    }
    return map;
  }, [activeDaysList]);

  // Days until official exam date
  const daysUntilExam = useMemo(() => {
    if (!currentPlan?.exam_date) return null;
    const examTime = new Date(currentPlan.exam_date).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((examTime - today) / (1000 * 60 * 60 * 24));
    return diff;
  }, [currentPlan]);

  // Total curriculum statistics for current plan
  const planSummary = useMemo(() => {
    let totalTasks = 0;
    let totalMinutes = 0;
    for (const d of activeDaysList) {
      if (Array.isArray(d.tasks)) {
        totalTasks += d.tasks.length;
        for (const t of d.tasks) {
          const mins = typeof t.minutes === 'number' ? t.minutes : (t.minutes?.intensive || t.minutes?.light || 45);
          totalMinutes += mins;
        }
      }
    }
    return {
      daysCount: activeDaysList.length,
      tasksCount: totalTasks,
      hoursCount: Math.round(totalMinutes / 60),
    };
  }, [activeDaysList]);

  // Calendar month grid generator (42 cells: 6 full weeks)
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
      isExamDate: boolean;
    }> = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isExam = dateStr === currentPlan?.exam_date;

      cells.push({
        dateStr,
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === viewMonth,
        dayRecord: planDaysByDate.get(dateStr),
        isExamDate: isExam,
      });
    }

    return cells;
  }, [viewYear, viewMonth, planDaysByDate, currentPlan]);

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

  // Quick Apply Rhythm Template
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
      // Saturday Full Simulation Template
      setEditingDayRecord({
        ...editingDayRecord,
        title: `Saturday Full Simulation & 45m Audit (Week ${editingDayRecord.week})`,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            block: 'simulation',
            module: 'Simulation',
            kind: 'simulation',
            title: 'Full Pen-and-Paper Practice Simulation (3 Hours)',
            detail: 'Timed studio exam under strict non-distraction protocol.',
            minutes: { light: 180, intensive: 180 },
            capture: ['simulationLog'],
            source: ['OS Template'],
          },
          {
            id: `task-${Date.now()}-2`,
            block: 'review',
            module: 'Simulation',
            kind: 'task',
            title: 'Same-Day 45-Min Mistake Classification & Audit',
            detail: 'Log every mistake into Concept, Time, Clarity, or Care bucket and write rewritten answers.',
            minutes: { light: 45, intensive: 45 },
            capture: ['errorLedger'],
            source: ['OS Template'],
          },
        ],
      });
    } else if (weekday.includes('thu')) {
      // Thursday Critique Session
      setEditingDayRecord({
        ...editingDayRecord,
        title: `Thursday Weekly Critique & Peer Audit (Week ${editingDayRecord.week})`,
        tasks: [
          {
            id: `task-${Date.now()}-1`,
            block: 'drill',
            module: 'Drill',
            kind: 'task',
            title: '45-Min Daily Speed Drill',
            detail: 'Observation and visual thinking exercise.',
            minutes: { light: 45, intensive: 45 },
            capture: ['diaryEntry'],
            source: ['OS Template'],
          },
          {
            id: `task-${Date.now()}-2`,
            block: 'critique',
            module: 'Critique',
            kind: 'task',
            title: '60-Min Mentor/Peer Critique & Rubric Audit',
            detail: 'Upload work and record critical feedback against admissions criteria.',
            minutes: { light: 60, intensive: 60 },
            capture: ['reviewSubmission'],
            source: ['OS Template'],
          },
        ],
      });
    } else {
      // Standard Mon / Wed / Fri: Daily Drill + Build Block
      setEditingDayRecord({
        ...editingDayRecord,
        title: `Daily Operating Rhythm (Day ${editingDayRecord.day})`,
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

  // CSV Template Exporter (Blank structure)
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

  // Export LIVE populated plan as CSV
  const handleDownloadLiveCsv = () => {
    if (!currentPlan || !Array.isArray(currentPlan.days) || currentPlan.days.length === 0) {
      toast({
        title: 'No days to export',
        description: 'This plan does not have configured days yet.',
        variant: 'destructive',
      });
      return;
    }

    const headers = 'day,week,phase,date,block,kind,title,detail,minutes_light,minutes_intensive,capture\n';
    const rows: string[] = [];

    for (const d of currentPlan.days) {
      if (!d.tasks || d.tasks.length === 0) {
        const cleanTitle = (d.title || '').replace(/"/g, '""');
        rows.push(`${d.day},${d.week},${d.phaseId || 'p1'},${d.date},drill,task,"${cleanTitle}","",45,45,none`);
      } else {
        for (const t of d.tasks) {
          const cleanTitle = (t.title || '').replace(/"/g, '""');
          const cleanDetail = (t.detail || '').replace(/"/g, '""');
          const minLight = typeof t.minutes === 'number' ? t.minutes : (t.minutes?.light || 45);
          const minIntensive = typeof t.minutes === 'number' ? t.minutes : (t.minutes?.intensive || 45);
          const cap = t.capture && t.capture.length > 0 ? t.capture[0] : 'none';
          rows.push(`${d.day},${d.week},${d.phaseId || 'p1'},${d.date},${t.block || 'drill'},${t.kind || 'task'},"${cleanTitle}","${cleanDetail}",${minLight},${minIntensive},${cap}`);
        }
      }
    }

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlan.id}-live-curriculum.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Curriculum Exported',
      description: `Exported ${currentPlan.days.length} days (${rows.length} tasks) to CSV.`,
    });
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
      setStagedDays(parsedDays);

      toast({
        title: 'CSV Parsed Successfully',
        description: `Found ${parsedDays.length} days with ${rows.length} tasks. You can now Preview on Calendar or Publish.`,
      });
    };
    reader.readAsText(file);
  };

  // Cancel CSV Upload & Clear Staged
  const handleCancelCsvUpload = () => {
    setCsvText('');
    setCsvPreview([]);
    setStagedDays(null);
    setIsPreviewMode(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({
      title: 'Upload Cancelled',
      description: 'Staged CSV has been cleared.',
    });
  };

  // Preview Staged CSV on Calendar View
  const handlePreviewOnCalendar = () => {
    if (csvPreview.length === 0) return;
    setStagedDays(csvPreview);
    setIsPreviewMode(true);
    setActiveTab('calendar');
    toast({
      title: 'Previewing on Calendar',
      description: 'Staged changes are now displayed on the calendar. Inspect days, then click Publish or Discard.',
    });
  };

  // Discard Draft Preview
  const handleDiscardStaged = () => {
    setIsPreviewMode(false);
    setStagedDays(null);
    setCsvPreview([]);
    setCsvText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({
      title: 'Draft Discarded',
      description: 'Reverted to live published curriculum.',
    });
  };

  // Commit Staged / CSV to Database
  const handleCommitStagedToPlan = async () => {
    const daysToSave = stagedDays || csvPreview;
    if (daysToSave.length === 0 || !currentPlan) return;
    setSaving(true);
    try {
      const updatedPlan = {
        ...currentPlan,
        days: daysToSave,
      };

      await prepApi.saveExamPlan(updatedPlan);
      setCurrentPlan(updatedPlan);
      setPlans(prev => prev.map(p => (p.id === updatedPlan.id ? updatedPlan : p)));

      toast({
        title: 'Curriculum Published!',
        description: `Successfully published ${daysToSave.length} days into ${currentPlan.title}.`,
      });

      setIsPreviewMode(false);
      setStagedDays(null);
      setCsvPreview([]);
      setCsvText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('calendar');
    } catch (e: any) {
      toast({
        title: 'Publish failed',
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary/10 text-primary uppercase tracking-wider">
                Admin Control Center
              </span>
              <span className="text-xs text-foreground/50 font-semibold">Universal Curriculum OS</span>
            </div>
            <h1 className="text-2xl font-black text-[#1e293b] tracking-tight mt-1">
              Prep Tracker Control Center
            </h1>
            <p className="text-xs text-foreground/60 mt-0.5">
              Manage 92-day curricula for NID, UCEED, CEED, and NIFT. Tap any date to edit tasks or import via CSV.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLiveCsv}
              className="h-9 gap-1.5 text-xs font-bold bg-white border-black/10 text-[#1e293b]"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export Live CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsvTemplate}
              className="h-9 gap-1.5 text-xs font-bold bg-white border-black/10 text-[#1e293b]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-foreground/60" />
              <span>Blank Template</span>
            </Button>
          </div>
        </div>

        {/* 1. Clear Exam Level Segregation & Dropdown Selector */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 w-full md:w-auto">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-foreground/60 block">
                Select Exam Curriculum Track
              </Label>
              <Select value={activePlanId} onValueChange={setActivePlanId}>
                <SelectTrigger className="w-full sm:w-[380px] bg-[#f8fafc] border-black/15 shadow-2xs font-bold text-xs h-10">
                  <SelectValue placeholder="Select Exam Track..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-black/10 shadow-lg">
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-black uppercase text-blue-700 bg-blue-50/70 py-1.5 px-3 tracking-wider flex items-center justify-between">
                      <span>Undergraduate (UG) Entrance Exams</span>
                      <span className="text-[10px] font-bold text-blue-600">Bachelors</span>
                    </SelectLabel>
                    {ugPlans.map(p => (
                      <SelectItem key={p.id} value={p.id} className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                            UG
                          </span>
                          <span className="font-extrabold text-xs text-[#1e293b]">{p.exam_code}</span>
                          <span className="text-xs text-foreground/70 truncate">
                            · {p.title.split(':')[1] || p.title}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-black uppercase text-purple-700 bg-purple-50/70 py-1.5 px-3 tracking-wider flex items-center justify-between mt-1">
                      <span>Postgraduate (PG) Entrance Exams</span>
                      <span className="text-[10px] font-bold text-purple-600">Masters</span>
                    </SelectLabel>
                    {pgPlans.map(p => (
                      <SelectItem key={p.id} value={p.id} className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800">
                            PG
                          </span>
                          <span className="font-extrabold text-xs text-[#1e293b]">{p.exam_code}</span>
                          <span className="text-xs text-foreground/70 truncate">
                            · {p.title.split(':')[1] || p.title}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Current Exam Highlight Banner */}
            {currentPlan && (
              <div className="flex flex-wrap items-center gap-3 bg-[#f8fafc] border border-black/5 p-3 rounded-xl self-stretch md:self-auto">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide uppercase ${
                      currentPlan.track === 'ug'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}
                  >
                    {currentPlan.track === 'ug' ? 'UG: Bachelors' : 'PG: Masters'}
                  </span>
                  <div className="text-xs font-extrabold text-[#1e293b]">
                    {currentPlan.title}
                  </div>
                </div>

                {/* Official Exam Date Badge */}
                {currentPlan.exam_date && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Exam Day: {currentPlan.exam_date}</span>
                    {daysUntilExam !== null && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-[10px] font-black text-amber-900 ml-1">
                        {daysUntilExam > 0 ? `${daysUntilExam}d to go` : 'Passed'}
                      </span>
                    )}
                  </div>
                )}

                {/* Curriculum Metrics */}
                <div className="text-[11px] text-foreground/60 font-semibold pl-1">
                  {planSummary.daysCount} Days Configured · {planSummary.tasksCount} Tasks · ~{planSummary.hoursCount}h Total
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Admin Section View Switcher */}
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <div className="flex items-center gap-2">
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
              <span>CSV Bulk Importer</span>
              {csvPreview.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                  {csvPreview.length}
                </span>
              )}
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

          {/* Draft Preview Indicator if active */}
          {isPreviewMode && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Draft Preview Active
            </span>
          )}
        </div>

        {/* 3. TAB CONTENT: Interactive Calendar Editor */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Draft Preview Banner (Visible when admin is previewing CSV before publishing) */}
            {isPreviewMode && (
              <div className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                        Draft Preview Mode
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                        {stagedDays?.length} Days Staged from CSV
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      You are previewing this curriculum on the calendar. Changes are <strong>not yet published</strong> to students.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardStaged}
                    className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold gap-1 bg-white"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Discard Draft</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCommitStagedToPlan}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Publish to Live Students</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Calendar Controls & Cadence Filter */}
            <div className="p-4 rounded-2xl border border-black/10 bg-white shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-base font-black text-[#1e293b]">{monthLabel}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Cadence Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-foreground/50 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {[
                  { id: 'all', label: 'All Tasks' },
                  { id: 'drill', label: 'Drills' },
                  { id: 'build', label: 'Builds' },
                  { id: 'critique', label: 'Critiques' },
                  { id: 'simulation', label: 'Simulations' },
                  { id: 'review', label: 'Sunday Reviews' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCadenceFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      cadenceFilter === f.id
                        ? 'bg-[#1e293b] text-white shadow-2xs'
                        : 'bg-black/5 hover:bg-black/10 text-foreground/70'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Grid (42 Cells) */}
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

              {/* 42 Days Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-black/5">
                {monthGridDays.map(cell => {
                  const dayTasks = cell.dayRecord && Array.isArray(cell.dayRecord.tasks) ? cell.dayRecord.tasks : [];
                  const filteredTasks = cadenceFilter === 'all'
                    ? dayTasks
                    : dayTasks.filter(t => t.block === cadenceFilter || t.kind === cadenceFilter);

                  const hasTasks = filteredTasks.length > 0;
                  const taskCount = filteredTasks.length;
                  const totalMinutes = filteredTasks.reduce(
                    (sum, t) => sum + (typeof t.minutes === 'number' ? t.minutes : (t.minutes?.light || 0)),
                    0
                  );

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => handleSelectDate(cell.dateStr)}
                      className={`min-h-[110px] p-2.5 transition-all cursor-pointer flex flex-col justify-between group hover:bg-sky-50/50 relative ${
                        cell.isExamDate
                          ? 'bg-amber-50/40 ring-2 ring-amber-400 ring-inset'
                          : cell.isCurrentMonth
                          ? 'bg-white'
                          : 'bg-slate-50/40 text-foreground/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            cell.isExamDate
                              ? 'text-amber-900 font-black'
                              : cell.isCurrentMonth
                              ? 'text-[#1e293b]'
                              : 'text-foreground/40'
                          }`}
                        >
                          {cell.dayOfMonth}
                        </span>

                        <div className="flex items-center gap-1">
                          {isPreviewMode && cell.dayRecord && (
                            <span className="text-[9px] font-black bg-amber-200 text-amber-800 px-1 rounded">
                              Draft
                            </span>
                          )}

                          {cell.dayRecord && (
                            <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/5">
                              Day {cell.dayRecord.day}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Official Exam Day Visual Indicator */}
                      {cell.isExamDate && (
                        <div className="my-1 p-1 rounded-md bg-linear-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black flex items-center justify-center gap-1 shadow-2xs">
                          <Trophy className="w-3 h-3 shrink-0" />
                          <span className="truncate">OFFICIAL EXAM DAY</span>
                        </div>
                      )}

                      <div className="space-y-1 my-1">
                        {hasTasks ? (
                          <div
                            className={`p-1 rounded-md text-[10px] font-semibold leading-tight ${
                              filteredTasks.some(t => t.block === 'simulation' || t.kind === 'simulation')
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : filteredTasks.some(t => t.block === 'critique')
                                ? 'bg-purple-50 border border-purple-200 text-purple-800'
                                : filteredTasks.some(t => t.block === 'review')
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : 'bg-blue-50 border border-blue-200 text-blue-800'
                            }`}
                          >
                            {taskCount} task{taskCount > 1 ? 's' : ''} · {totalMinutes}m
                          </div>
                        ) : !cell.isExamDate ? (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-foreground/40 text-center py-1 border border-dashed border-black/10 rounded">
                            + Add Tasks
                          </div>
                        ) : null}
                      </div>

                      <div className="text-[9px] text-foreground/40 truncate font-medium">
                        {cell.dayRecord?.title || (cell.isExamDate ? 'National Entrance Examination' : '')}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#1e293b]">Bulk Import Curriculum via CSV</h3>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Upload a 60–92 day curriculum file for <strong>{currentPlan?.title}</strong>. Preview it on the calendar grid before saving.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsvTemplate}
                    className="h-8 text-xs font-bold gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Blank Template</span>
                  </Button>
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              <div className="border-2 border-dashed border-black/15 rounded-2xl p-8 text-center space-y-3 bg-[#f8fafc]">
                <FileSpreadsheet className="w-10 h-10 text-primary/60 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1e293b]">Choose a CSV file or drag and drop here</p>
                  <p className="text-[11px] text-foreground/50">
                    Required columns: <code>day, week, phase, date, block, kind, title, detail, minutes_light, minutes_intensive, capture</code>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleParseCsv}
                  className="text-xs text-foreground/70 file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              {/* Parsed Preview Card with Action Buttons: Cancel, Preview on Calendar, Publish */}
              {csvPreview.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-black/10">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        CSV Parsed: {csvPreview.length} Days Ready
                      </span>
                      <p className="text-[11px] text-emerald-800/80 mt-0.5">
                        You can cancel this upload, inspect it on the interactive calendar, or publish directly to students.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Cancel Upload Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelCsvUpload}
                        className="bg-white border-black/10 text-foreground/70 hover:text-red-700 hover:bg-red-50 text-xs font-bold gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel Upload</span>
                      </Button>

                      {/* Preview on Calendar View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewOnCalendar}
                        className="bg-white border-primary/30 text-primary hover:bg-primary/5 text-xs font-bold gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview on Calendar Grid</span>
                      </Button>

                      {/* Direct Publish Button */}
                      <Button
                        size="sm"
                        onClick={handleCommitStagedToPlan}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Publish to {currentPlan?.exam_code} Plan</span>
                      </Button>
                    </div>
                  </div>

                  {/* Sample rows preview */}
                  <div className="max-h-60 overflow-y-auto border border-black/10 rounded-xl divide-y text-xs bg-white">
                    {csvPreview.slice(0, 15).map((d: any) => (
                      <div key={d.day} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-[#1e293b]">Day {d.day} (Week {d.week}):</span> {d.title}
                          <span className="text-[11px] text-foreground/40 block">{d.date}</span>
                        </div>
                        <span className="text-foreground/50 font-semibold px-2 py-0.5 rounded bg-black/5">
                          {d.tasks?.length || 0} tasks
                        </span>
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
                      <tr key={enr.id || enr.candidate_id} className="hover:bg-black/[0.01]">
                        <td className="p-3 font-mono text-[11px] font-bold text-[#1e293b]">
                          {enr.candidate_id}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(enr.active_exam_ids || [enr.track === 'pg' ? 'nid-pg-2027' : 'nid-ug-2027']).map((eid: string) => (
                              <span
                                key={eid}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary"
                              >
                                {eid}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 uppercase font-bold text-foreground/70">{enr.track}</td>
                        <td className="p-3 capitalize text-foreground/70">{enr.tier}</td>
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
              {/* If this is the Official Exam Day */}
              {editingDate === currentPlan?.exam_date && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-black text-xs">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span>Official Examination Day for {currentPlan?.title}</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80">
                    This is the designated date for the test. Ensure reporting time, stationary kit, and admit card reminder tasks are included.
                  </p>
                </div>
              )}

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
                  {editingDayRecord.tasks.map((t) => (
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
                          Light: {typeof t.minutes === 'number' ? t.minutes : (t.minutes?.light || 0)}m · Intensive: {typeof t.minutes === 'number' ? t.minutes : (t.minutes?.intensive || 0)}m
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
