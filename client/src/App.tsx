import { Suspense, lazy } from "react";
import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SecurityGuard } from "@/components/security-guard";
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy-loaded pages — each becomes its own chunk
const Home = lazy(() => import("@/pages/home"));
const Mentorship = lazy(() => import("@/pages/mentorship"));
const Community = lazy(() => import("@/pages/community"));
const FocusBatchPage = lazy(() => import("@/pages/focus-batch-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const JoinUsPage = lazy(() => import("@/pages/join-us-page"));
const ApprenticeshipPage = lazy(() => import("@/pages/apprenticeship-page"));
const AINativeUX = lazy(() => import("@/pages/ai-native-ux"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Admin pages
const AdminLogin = lazy(() => import("@/pages/admin/admin-login"));
const AdminLayout = lazy(() => import("@/pages/admin/admin-layout"));
const AdminDashboard = lazy(() => import("@/pages/admin/admin-dashboard"));
const AdminRanks = lazy(() => import("@/pages/admin/admin-ranks"));
const AdminWorkshops = lazy(() => import("@/pages/admin/admin-workshops"));
const AdminPrograms = lazy(() => import("@/pages/admin/admin-programs"));
const AdminRegistrations = lazy(() => import("@/pages/admin/admin-registrations"));
const AdminSubscribers = lazy(() => import("@/pages/admin/admin-subscribers"));
const AdminExamQuestions = lazy(() => import("@/pages/admin/admin-exam-questions"));
const AdminExamTests = lazy(() => import("@/pages/admin/admin-exam-tests"));
const AdminPartBEvaluations = lazy(() => import("@/pages/admin/admin-part-b-evaluations"));
const AdminUsers = lazy(() => import("@/pages/admin/admin-users"));
const AdminStudyMaterials = lazy(() => import("@/pages/admin/admin-study-materials"));
const AdminAssignments = lazy(() => import("@/pages/admin/admin-assignments"));
const AdminClassNotes = lazy(() => import("@/pages/admin/admin-class-notes"));
const AdminStaff = lazy(() => import("@/pages/admin/admin-staff"));
const AdminMentorPlaceholder = lazy(() => import("@/pages/admin/admin-mentor-placeholder"));

// Candidate Portal
const PortalLogin = lazy(() => import("@/pages/portal/login"));
const PortalDashboard = lazy(() => import("@/pages/portal/dashboard"));
const PortalTestEngine = lazy(() => import("@/pages/portal/test-engine"));

// Per-route wrapper — each page gets its own ErrorBoundary so one crash
// doesn't bring down the entire app, just that single page.
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Public Routes */}
        <Route path="/">{() => <PageWrapper><Home /></PageWrapper>}</Route>
        <Route path="/mentorship">{() => <PageWrapper><Mentorship /></PageWrapper>}</Route>
        <Route path="/community">{() => <PageWrapper><Community /></PageWrapper>}</Route>
        <Route path="/focus-batch">{() => <PageWrapper><FocusBatchPage /></PageWrapper>}</Route>
        <Route path="/about">{() => <PageWrapper><AboutPage /></PageWrapper>}</Route>
        <Route path="/join-us">{() => <PageWrapper><JoinUsPage /></PageWrapper>}</Route>
        <Route path="/apprenticeship">{() => <PageWrapper><ApprenticeshipPage /></PageWrapper>}</Route>
        <Route path="/courses/ai-native-ux">{() => <PageWrapper><AINativeUX /></PageWrapper>}</Route>
        <Route path="/privacy-policy">{() => <PageWrapper><PrivacyPolicy /></PageWrapper>}</Route>
        <Route path="/terms-of-service">{() => <PageWrapper><TermsOfService /></PageWrapper>}</Route>

        {/* Candidate Portal */}
        <Route path="/portal/login">{() => <PageWrapper><PortalLogin /></PageWrapper>}</Route>
        <Route path="/portal/dashboard">{() => <PageWrapper><PortalDashboard /></PageWrapper>}</Route>
        <Route path="/portal/test/:id">{() => <PageWrapper><PortalTestEngine /></PageWrapper>}</Route>

        {/* Admin Routes */}
        <Route path="/admin">{() => <PageWrapper><AdminLogin /></PageWrapper>}</Route>
        <Route path="/admin/dashboard">
          {() => <PageWrapper><AdminLayout><AdminDashboard /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/ranks">
          {() => <PageWrapper><AdminLayout><AdminRanks /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/workshops">
          {() => <PageWrapper><AdminLayout><AdminWorkshops /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/programs">
          {() => <PageWrapper><AdminLayout><AdminPrograms /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/registrations">
          {() => <PageWrapper><AdminLayout><AdminRegistrations /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/subscribers">
          {() => <PageWrapper><AdminLayout><AdminSubscribers /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/exam-questions">
          {() => <PageWrapper><AdminLayout><AdminExamQuestions /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/exam-tests">
          {() => <PageWrapper><AdminLayout><AdminExamTests /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/part-b-evaluations">
          {() => <PageWrapper><AdminLayout><AdminPartBEvaluations /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/users">
          {() => <PageWrapper><AdminLayout><AdminUsers /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/study-materials">
          {() => <PageWrapper><AdminLayout><AdminStudyMaterials /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/assignments">
          {() => <PageWrapper><AdminLayout><AdminAssignments /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/class-notes">
          {() => <PageWrapper><AdminLayout><AdminClassNotes /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/staff">
          {() => <PageWrapper><AdminLayout><AdminStaff /></AdminLayout></PageWrapper>}
        </Route>
        <Route path="/admin/mentors-placeholder">
          {() => <PageWrapper><AdminLayout><AdminMentorPlaceholder /></AdminLayout></PageWrapper>}
        </Route>

        {/* Fallback to 404 */}
        <Route>{() => <PageWrapper><NotFound /></PageWrapper>}</Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecurityGuard />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
