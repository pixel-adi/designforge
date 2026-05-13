import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SecurityGuard } from "@/components/security-guard";

// Lazy-loaded pages — each becomes its own chunk
const Home = lazy(() => import("@/pages/home"));
const Mentorship = lazy(() => import("@/pages/mentorship"));
const Community = lazy(() => import("@/pages/community"));
const FocusBatchPage = lazy(() => import("@/pages/focus-batch-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const JoinUsPage = lazy(() => import("@/pages/join-us-page"));
const ApprenticeshipPage = lazy(() => import("@/pages/apprenticeship-page"));
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

// Candidate Portal
const PortalLogin = lazy(() => import("@/pages/portal/login"));
const PortalDashboard = lazy(() => import("@/pages/portal/dashboard"));
const PortalTestEngine = lazy(() => import("@/pages/portal/test-engine"));

function Router() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={AboutPage} />
          <Route path="/apprenticeship" component={ApprenticeshipPage} />
          <Route path="/join-us" component={JoinUsPage} />
          <Route path="/mentorship" component={Mentorship} />
          <Route path="/community" component={Community} />
          <Route path="/focus-batch" component={FocusBatchPage} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          
          {/* Candidate Portal */}
          <Route path="/portal/login" component={PortalLogin} />
          <Route path="/portal/dashboard" component={PortalDashboard} />
          <Route path="/portal/test/:id" component={PortalTestEngine} />
          
          {/* Admin Routes */}
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard">
            {() => <AdminLayout><AdminDashboard /></AdminLayout>}
          </Route>
          <Route path="/admin/ranks">
            {() => <AdminLayout><AdminRanks /></AdminLayout>}
          </Route>
          <Route path="/admin/workshops">
            {() => <AdminLayout><AdminWorkshops /></AdminLayout>}
          </Route>
          <Route path="/admin/programs">
            {() => <AdminLayout><AdminPrograms /></AdminLayout>}
          </Route>
          <Route path="/admin/registrations">
            {() => <AdminLayout><AdminRegistrations /></AdminLayout>}
          </Route>
          <Route path="/admin/subscribers">
            {() => <AdminLayout><AdminSubscribers /></AdminLayout>}
          </Route>
          <Route path="/admin/exam-questions">
            {() => <AdminLayout><AdminExamQuestions /></AdminLayout>}
          </Route>
          <Route path="/admin/exam-tests">
            {() => <AdminLayout><AdminExamTests /></AdminLayout>}
          </Route>
          <Route path="/admin/part-b-evaluations">
            {() => <AdminLayout><AdminPartBEvaluations /></AdminLayout>}
          </Route>
          <Route path="/admin/users">
            {() => <AdminLayout><AdminUsers /></AdminLayout>}
          </Route>

          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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
