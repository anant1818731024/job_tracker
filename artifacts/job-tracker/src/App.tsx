import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import EmailVerifyBanner from "@/components/EmailVerifyBanner";
import VerifyEmailGate from "@/components/VerifyEmailGate";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import AdminSetupPage from "@/pages/AdminSetupPage";
import AdminPage from "@/pages/AdminPage";
import AdminPanelLoginPage from "@/pages/AdminPanelLoginPage";
import AdminPanelPage from "@/pages/AdminPanelPage";
import DashboardPage from "@/pages/DashboardPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import NewApplicationPage from "@/pages/NewApplicationPage";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import EditApplicationPage from "@/pages/EditApplicationPage";
import KanbanPage from "@/pages/KanbanPage";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (user.mustVerify) return <VerifyEmailGate />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (user.mustVerify) return <VerifyEmailGate />;
  if (!user.isAdmin) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {user && !user.emailVerifiedAt && (
        <EmailVerifyBanner />
      )}
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
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/admin/setup" component={AdminSetupPage} />
      <Route path="/admin/panel/login" component={AdminPanelLoginPage} />
      <Route path="/admin/panel" component={AdminPanelPage} />
      <Route path="/admin">
        {() => (
          <AdminRoute>
            <AppLayout><AdminPage /></AppLayout>
          </AdminRoute>
        )}
      </Route>
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
