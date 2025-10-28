import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Calendar, Users, Scissors, Building2 } from "lucide-react";
import { UserRole, getRoleLabel } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function Dashboard() {
  const navigate = useNavigate();
  const user = authAPI.getStoredUser();

  const roleIcon = useMemo(() => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return <Building2 className="h-8 w-8" />;
      case UserRole.BARBERSHOP_MANAGER:
        return <Scissors className="h-8 w-8" />;
      case UserRole.CLIENT:
      default:
        return <Users className="h-8 w-8" />;
    }
  }, [user?.role]);

  const handleLogout = () => {
    authAPI.logout();
    toast.success("Logout successful!");
    navigate(ROUTES.LOGIN);
  };

  if (!user) {
    return <LoadingSpinner fullPage />;
  }

  const isClient = user.role === UserRole.CLIENT;

  return (
    <AuthGuard>
      <div className="min-h-screen gradient-subtle">
        <header className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Scissors className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Barber Hub</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto p-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Welcome, {user.name}!
            </h2>
            <p className="text-muted-foreground mt-2">
              You are logged in as {getRoleLabel(user.role)}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile</CardTitle>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    {roleIcon}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="space-y-2">
                  <p>
                    <strong>Email:</strong> {user.email || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {user.phone || "Not provided"}
                  </p>
                  <p>
                    <strong>Type:</strong> {getRoleLabel(user.role)}
                  </p>
                </CardDescription>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => navigate(ROUTES.PROFILE)}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Client Cards */}
            {isClient && (
              <>
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Schedule Service</CardTitle>
                      <div className="rounded-full bg-accent/10 p-3 text-accent">
                        <Calendar className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Schedule a time at one of our partner barbershops
                    </CardDescription>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => navigate(ROUTES.CLIENT)}
                    >
                      Schedule Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>My Appointments</CardTitle>
                      <div className="rounded-full bg-secondary/10 p-3 text-secondary">
                        <Calendar className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      View and manage your scheduled appointments
                    </CardDescription>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => navigate(ROUTES.CLIENT)}
                    >
                      View Appointments
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {!isClient && (
              <>
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Appointments</CardTitle>
                      <div className="rounded-full bg-accent/10 p-3 text-accent">
                        <Calendar className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Manage your barbershop appointments
                    </CardDescription>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() =>
                        navigate(
                          user.role === UserRole.ADMIN
                            ? ROUTES.ADMIN
                            : ROUTES.BARBERSHOP
                        )
                      }
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Barbers</CardTitle>
                      <div className="rounded-full bg-secondary/10 p-3 text-secondary">
                        <Users className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Register and manage your barber team
                    </CardDescription>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() =>
                        navigate(
                          user.role === UserRole.ADMIN
                            ? ROUTES.ADMIN
                            : ROUTES.BARBERSHOP
                        )
                      }
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

export default Dashboard;
