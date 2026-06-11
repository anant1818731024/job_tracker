import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import NewApplicationPage from "@/pages/NewApplicationPage";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import EditApplicationPage from "@/pages/EditApplicationPage";
import KanbanPage from "@/pages/KanbanPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/applications/new">
        {() => (
          <ProtectedRoute>
            <AppLayout><NewApplicationPage /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/applications/:id/edit">
        {(params) => (
          <ProtectedRoute>
            <AppLayout><EditApplicationPage id={params.id} /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/applications/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout><ApplicationDetailPage id={params.id} /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/applications">
        {() => (
          <ProtectedRoute>
            <AppLayout><ApplicationsPage /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/kanban">
        {() => (
          <ProtectedRoute>
            <AppLayout><KanbanPage /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
