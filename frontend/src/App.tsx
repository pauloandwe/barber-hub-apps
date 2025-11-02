import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import BarbershopDashboard from "./pages/BarbershopDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Profile from "./pages/Profile";
import { RemindersSettings } from "./pages/RemindersSettings";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/AuthGuard";
import { ROUTES } from "@/constants/routes";
import { UserRole } from "@/constants/roles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route
            path={ROUTES.ADMIN}
            element={
              <AuthGuard requiredRole={UserRole.ADMIN}>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route
            path={ROUTES.BARBERSHOP}
            element={
              <AuthGuard requiredRole={UserRole.BARBERSHOP_MANAGER}>
                <BarbershopDashboard />
              </AuthGuard>
            }
          />
          <Route
            path={ROUTES.BARBERSHOP_REMINDERS}
            element={
              <AuthGuard requiredRole={UserRole.BARBERSHOP_MANAGER}>
                <RemindersSettings />
              </AuthGuard>
            }
          />
          <Route
            path={ROUTES.CLIENT}
            element={
              <AuthGuard requiredRole={UserRole.CLIENT}>
                <ClientDashboard />
              </AuthGuard>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
