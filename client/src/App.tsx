import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Mentorship from "@/pages/mentorship";
import Results from "@/pages/results";
import Community from "@/pages/community";
import Events from "@/pages/events";
import FocusBatchPage from "@/pages/focus-batch-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/mentorship" component={Mentorship}/>
      <Route path="/results" component={Results}/>
      <Route path="/community" component={Community}/>
      <Route path="/events" component={Events}/>
      <Route path="/focus-batch" component={FocusBatchPage}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
