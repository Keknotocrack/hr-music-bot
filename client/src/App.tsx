import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import BotSetup from "@/pages/bot-setup";
import SavedConfigs from "@/pages/saved-configs";
import RoomManagement from "@/pages/room-management";
import QueueManager from "@/pages/queue-manager";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bot-setup" component={BotSetup} />
      <Route path="/saved-configs" component={SavedConfigs} />
      <Route path="/rooms" component={RoomManagement} />
      <Route path="/queue" component={QueueManager} />
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
