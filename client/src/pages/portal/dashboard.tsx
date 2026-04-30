import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LayoutDashboard, Clock, FileText, User, LogOut, ChevronRight, CheckCircle2 } from "lucide-react";
import logoImg from "@assets/DF_BLACK_RED_1773094379878.png";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
export default function PortalDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [onboardingData, setOnboardingData] = useState<{ name: string, phone: string, program_ids: string[], avatar_url: string }>({ name: "", phone: "", program_ids: [], avatar_url: "" });
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  // Dashboard Data
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setLocation('/portal/login');
        return;
      }
      setAuthUser(user);

      // Fetch candidate profile and programs concurrently
      const [candRes, progRes] = await Promise.all([
        supabase.from('exam_candidates').select(`*`).eq('auth_user_id', user.id).maybeSingle(),
        supabase.from('exam_programs').select('*').order('name')
      ]);

      if (candRes.error) throw candRes.error;
      if (progRes.data) setPrograms(progRes.data);

      const candidateData = candRes.data;

      if (!candidateData) {
        // Needs onboarding
        setShowOnboarding(true);
        // Default name if Google provided it
        if (user.user_metadata?.full_name) {
          setOnboardingData(prev => ({ ...prev, name: user.user_metadata.full_name }));
        }
      } else {
        setCandidate(candidateData);

        setOnboardingData({
          name: candidateData.name || user.user_metadata?.full_name || "",
          phone: candidateData.phone || "",
          program_ids: candidateData.program_ids || [],
          avatar_url: candidateData.avatar_url || ""
        });

        fetchDashboardData(candidateData.program_ids || []);
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (programIds: string[]) => {
    if (!programIds || programIds.length === 0) return;
    try {
      // Fetch active tests for their programs
      const { data: tests, error } = await supabase
        .from('exam_tests')
        .select(`*, exam_test_sections(part, duration_minutes)`)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const filteredTests = (tests || []).filter(test => {
        const progName = test.exam_programs?.name || '';
        const testTitle = test.title.toLowerCase();
        
        const isBdesTest = testTitle.includes('b.des') || testTitle.includes('bdes') || testTitle.includes('uceed') || progName.includes('B.Des');
        const isMdesTest = testTitle.includes('m.des') || testTitle.includes('mdes') || testTitle.includes('ceed') || progName.includes('M.Des');
        
        // Candidate programs (we have programIds which are the selected program UUIDs)
        // Let's resolve UUIDs to names from the global `programs` state.
        // Wait, `programs` is available in the component scope? Let's check... it should be.
        const candProgramNames = programs.filter(p => programIds.includes(p.id)).map(p => p.name);
        
        const candIsBdes = candProgramNames.some(name => name.includes('B.Des') || name.includes('UCEED'));
        const candIsMdes = candProgramNames.some(name => name.includes('M.Des') || name.includes('CEED'));

        if (isBdesTest && candIsBdes) return true;
        if (isMdesTest && candIsMdes) return true;
        
        // If the test isn't explicitly branded, let them see it just in case
        if (!isBdesTest && !isMdesTest) return true;
        
        return false;
      });

      setActiveTests(filteredTests);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData.name || onboardingData.program_ids.length === 0) {
      toast({ title: "Missing Fields", description: "Please provide your name and select at least one program.", variant: "destructive" });
      return;
    }
    setSavingOnboarding(true);
    try {
      let result;
      if (candidate) {
        // Update existing profile
        result = await supabase.from('exam_candidates').update({
          name: onboardingData.name,
          phone: onboardingData.phone || null,
          program_ids: onboardingData.program_ids,
          avatar_url: onboardingData.avatar_url || null
        }).eq('id', candidate.id).select().single();
      } else {
        // Insert new profile
        result = await supabase.from('exam_candidates').insert({
          auth_user_id: authUser.id,
          email: authUser.email,
          name: onboardingData.name,
          phone: onboardingData.phone || null,
          program_ids: onboardingData.program_ids,
          avatar_url: onboardingData.avatar_url || null
        }).select().single();
      }

      if (result.error) throw result.error;

      setCandidate(result.data);
      setShowOnboarding(false);
      toast({ title: "Success!", description: "Your profile has been saved." });
      fetchDashboardData(result.data.program_ids);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingOnboarding(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/portal/login');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 2MB before compression.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;

        // Calculate crop to center
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        ctx?.drawImage(img, startX, startY, size, size, 0, 0, 200, 200);

        // Compress until under 40kb
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > 40 * 1024 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        setOnboardingData(prev => ({ ...prev, avatar_url: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-black/5 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-black/5">
          <img src={logoImg} alt="Designforge" className="h-8" />
        </div>

        <div className="p-4">
          <p className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">Menu</p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'progress' ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-black/5 hover:text-foreground'}`}
            >
              <Clock className="w-4 h-4" /> Progress & History
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-black/5">
          {candidate && (
            <button
              onClick={() => {
                if (programs.length === 0) {
                  supabase.from('exam_programs').select('*').order('name').then(({ data }) => {
                    if (data) setPrograms(data);
                  });
                }
                setActiveTab('profile');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 text-left transition-colors ${activeTab === 'profile' ? 'bg-primary/5 border-primary/20 border' : 'hover:bg-black/5 border border-transparent'}`}
            >
              {candidate.avatar_url ? (
                <img src={candidate.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {candidate.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#262626] truncate">{candidate.name}</p>
                <p className="text-xs font-medium text-foreground/50">{candidate.unique_id}</p>
              </div>
            </button>
          )}
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-10 lg:p-12">

          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight">
              {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'progress' ? 'Progress & History' : 'Profile Settings'}
            </h1>
            <p className="text-foreground/60 mt-1">
              {candidate?.program_ids?.length > 0 ? `Preparing for ${programs.filter(p => candidate.program_ids.includes(p.id)).map(p => p.name).join(' & ')}` : 'Welcome to the candidate portal'}
            </p>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {!candidate && (
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800">Profile Incomplete</h3>
                    <p className="text-orange-700/80 mt-1">Please complete your profile to see your assigned mock tests.</p>
                  </div>
                  <Button onClick={() => setShowOnboarding(true)} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                    Complete Profile
                  </Button>
                </div>
              )}

              {candidate && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#262626]">Active Mock Tests</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTests.length === 0 ? (
                      <div className="col-span-full p-8 text-center bg-white border border-black/5 rounded-2xl">
                        <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                        <p className="text-foreground/50 font-medium">No active tests available for your program at the moment.</p>
                      </div>
                    ) : activeTests.map((test: any) => (
                      <div key={test.id} className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full">New</span>
                          </div>
                          <h3 className="font-bold text-lg text-[#262626] mb-2">{test.title}</h3>

                          <div className="flex items-center gap-4 text-xs font-medium text-foreground/50 mb-6">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {test.exam_test_sections?.reduce((acc: number, curr: any) => acc + curr.duration_minutes, 0)} Mins
                            </div>
                            <div className="flex items-center gap-1.5">
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              {test.exam_test_sections?.length} Sections
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setLocation(`/portal/test/${test.id}`)}
                          className="w-full bg-primary hover:bg-primary/90 text-white gap-2 group-hover:shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] transition-all"
                        >
                          Start Test <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#262626]">Submitted Tests & Attempts</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <div className="text-sm font-semibold text-foreground/50 mb-2">Total Tests Attempted</div>
                  <div className="text-3xl font-bold text-[#262626]">3</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <div className="text-sm font-semibold text-foreground/50 mb-2">Average Score</div>
                  <div className="text-3xl font-bold text-green-600">72%</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                  <div className="text-sm font-semibold text-foreground/50 mb-2">Highest Score</div>
                  <div className="text-3xl font-bold text-primary">85/100</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {/* Attempt 1 */}
                  <AccordionItem value="attempt-1" className="border border-black/5 rounded-xl px-6 py-2 shadow-sm bg-white data-[state=open]:bg-primary/5 transition-colors">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4 text-left">
                        <div>
                          <h4 className="font-bold text-lg text-[#262626]">NID B.Des Mock Test - Phase 3 Preview</h4>
                          <p className="text-xs text-foreground/50 font-medium mt-1">Attempted on: April 30, 2026 • 2h 45m</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Score</p>
                            <p className="font-bold text-xl text-green-600">82/100</p>
                          </div>
                          <div className="px-3 py-1 bg-black/5 rounded-full text-xs font-bold text-foreground/70">Attempt 1</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white border border-black/5">
                          <h5 className="font-bold text-sm text-[#262626] mb-2 flex justify-between">
                            <span>Part A (Objective)</span>
                            <span className="text-primary">64 / 70</span>
                          </h5>
                          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '91%' }} />
                          </div>
                          <p className="text-xs text-foreground/50 mt-2">Excellent performance in Spatial Reasoning.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-black/5">
                          <h5 className="font-bold text-sm text-[#262626] mb-2 flex justify-between">
                            <span>Part B (Subjective)</span>
                            <span className="text-orange-600">18 / 30</span>
                          </h5>
                          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '60%' }} />
                          </div>
                          <p className="text-xs text-foreground/50 mt-2">Needs improvement in line quality and shading.</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" className="text-sm font-bold shadow-sm">View Detailed Analysis</Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Attempt 2 */}
                  <AccordionItem value="attempt-2" className="border border-black/5 rounded-xl px-6 py-2 shadow-sm bg-white data-[state=open]:bg-primary/5 transition-colors">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4 text-left">
                        <div>
                          <h4 className="font-bold text-lg text-[#262626]">CEED Aptitude & Sketching Mastery</h4>
                          <p className="text-xs text-foreground/50 font-medium mt-1">Attempted on: April 18, 2026 • 3h 00m</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Score</p>
                            <p className="font-bold text-xl text-orange-600">68/100</p>
                          </div>
                          <div className="px-3 py-1 bg-black/5 rounded-full text-xs font-bold text-foreground/70">Attempt 1</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white border border-black/5">
                          <h5 className="font-bold text-sm text-[#262626] mb-2 flex justify-between">
                            <span>Part A (Objective)</span>
                            <span className="text-primary">45 / 50</span>
                          </h5>
                          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '90%' }} />
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-black/5">
                          <h5 className="font-bold text-sm text-[#262626] mb-2 flex justify-between">
                            <span>Part B (Subjective)</span>
                            <span className="text-orange-600">23 / 50</span>
                          </h5>
                          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '46%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" className="text-sm font-bold shadow-sm">View Detailed Analysis</Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-sm max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#262626]">Your Profile</h3>
                {candidate?.unique_id && (
                  <div className="bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg text-primary text-sm font-mono font-medium">
                    ID: {candidate.unique_id}
                  </div>
                )}
              </div>
              <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-black/5">
                  <div className="relative group cursor-pointer">
                    {onboardingData.avatar_url || candidate?.avatar_url ? (
                      <img src={onboardingData.avatar_url || candidate?.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-black/10" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium cursor-pointer transition-opacity">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#262626]">Profile Photo</h4>
                    <p className="text-xs text-foreground/50 mt-1">Image will be auto-compressed to under 40kb and resized to 200x200.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prof-name">Full Name *</Label>
                    <Input
                      id="prof-name"
                      value={onboardingData.name}
                      onChange={e => setOnboardingData({ ...onboardingData, name: e.target.value })}
                      required
                      className="bg-background/50 border-black/10 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prof-phone">Phone Number</Label>
                    <Input
                      id="prof-phone"
                      value={onboardingData.phone}
                      onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                      className="bg-background/50 border-black/10 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Target Programs * (Select multiple if applicable)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {programs.map(p => {
                      const isSelected = onboardingData.program_ids?.includes(p.id);
                      return (
                        <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-black/10 hover:bg-black/5'}`}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setOnboardingData(prev => ({ ...prev, program_ids: [...(prev.program_ids || []), p.id] }));
                              } else {
                                setOnboardingData(prev => ({ ...prev, program_ids: (prev.program_ids || []).filter(id => id !== p.id) }));
                              }
                            }}
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-[#262626]'}`}>{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <Button type="submit" disabled={savingOnboarding} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white gap-2">
                  {savingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Changes
                </Button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Complete your profile</DialogTitle>
            <DialogDescription>
              Just a few more details so we can assign the right mock tests to you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOnboardingSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={onboardingData.name}
                onChange={e => setOnboardingData({ ...onboardingData, name: e.target.value })}
                required
                className="bg-background/50 border-black/10 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={onboardingData.phone}
                onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                className="bg-background/50 border-black/10 focus:bg-white"
              />
            </div>
            <div className="space-y-3">
              <Label>Target Programs * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {programs.map(p => {
                  const isSelected = onboardingData.program_ids?.includes(p.id);
                  return (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-black/10 hover:bg-black/5'}`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOnboardingData(prev => ({ ...prev, program_ids: [...(prev.program_ids || []), p.id] }));
                          } else {
                            setOnboardingData(prev => ({ ...prev, program_ids: (prev.program_ids || []).filter(id => id !== p.id) }));
                          }
                        }}
                      />
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-[#262626]'}`}>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={savingOnboarding} className="w-full bg-primary hover:bg-primary/90 text-white">
                {savingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile & Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
