import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Landing from "@/pages/Landing"; // <--- Landing è tornata!
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Se NON sei autenticato */}
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />     {/* Home = Landing Page */}
          <Route path="/auth" component={AuthPage} /> {/* Login = Pagina dedicata */}
        </>
      ) : (
        /* Se SEI autenticato */
        <>
          <Route path="/" component={Dashboard} />   {/* Home = Dashboard */}
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      {/* Per tutte le altre pagine non trovate */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;