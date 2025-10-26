import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Calendar, Users, Scissors, Building2 } from "lucide-react";

const AppPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const user = authAPI.getStoredUser();
    if (user) {
      setProfile(user);
    }
  };

  const handleLogout = async () => {
    authAPI.logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const getRoleTitle = () => {
    switch (profile?.role) {
      case "ADMIN":
        return "Administrador";
      case "BARBEARIA":
        return "Gestor de Barbearia";
      default:
        return "Cliente";
    }
  };

  const getRoleIcon = () => {
    switch (profile?.role) {
      case "ADMIN":
        return <Building2 className="h-8 w-8" />;
      case "BARBEARIA":
        return <Scissors className="h-8 w-8" />;
      default:
        return <Users className="h-8 w-8" />;
    }
  };

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
              Sair
            </Button>
          </div>
        </header>

        <main className="container mx-auto p-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Bem-vindo, {profile?.nome}!</h2>
            <p className="text-muted-foreground mt-2">Você está logado como {getRoleTitle()}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Perfil</CardTitle>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    {getRoleIcon()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="space-y-2">
                  <p><strong>Email:</strong> {profile?.email || "Não informado"}</p>
                  <p><strong>Telefone:</strong> {profile?.telefone || "Não informado"}</p>
                  <p><strong>Tipo:</strong> {getRoleTitle()}</p>
                </CardDescription>
              </CardContent>
            </Card>

            {profile?.role === "CLIENTE" && (
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Agendar Serviço</CardTitle>
                    <div className="rounded-full bg-accent/10 p-3 text-accent">
                      <Calendar className="h-8 w-8" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Agende um horário em uma de nossas barbearias parceiras
                  </CardDescription>
                  <Button className="mt-4 w-full" disabled>
                    Em breve
                  </Button>
                </CardContent>
              </Card>
            )}

            {profile?.role !== "CLIENTE" && (
              <>
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Agendamentos</CardTitle>
                      <div className="rounded-full bg-accent/10 p-3 text-accent">
                        <Calendar className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Gerencie os agendamentos da sua barbearia
                    </CardDescription>
                    <Button className="mt-4 w-full" disabled>
                      Em breve
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Barbeiros</CardTitle>
                      <div className="rounded-full bg-secondary/10 p-3 text-secondary">
                        <Users className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Cadastre e gerencie seus barbeiros
                    </CardDescription>
                    <Button className="mt-4 w-full" disabled>
                      Em breve
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
};

export default AppPage;
