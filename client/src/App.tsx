import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SecurityGuard } from "@/components/security-guard";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Mentorship from "@/pages/mentorship";
import Community from "@/pages/community";
import FocusBatchPage from "@/pages/focus-batch-page";
import AboutPage from "@/pages/about-page";
import JoinUsPage from "@/pages/join-us-page";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";

import ApprenticeshipPage from "@/pages/apprenticeship-page";

function Router() {
  return (
    <>
      <ScrollToTop />
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
        {/* Fallback to 404 */}
        <Route component={NotFound} />
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
