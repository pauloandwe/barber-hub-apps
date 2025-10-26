import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Scissors } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const user = await authAPI.login({ email, password });

      // Store user in localStorage
      authAPI.setStoredUser(user);

      toast.success("Login realizado com sucesso!");

      // Redirecionar baseado no role
      switch (user.role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "BARBEARIA":
          navigate("/barbearia");
          break;
        case "CLIENTE":
        default:
          navigate("/cliente");
          break;
      }
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl">Barber Hub</CardTitle>
            <CardDescription className="mt-2">
              Gerencie sua barbearia de forma profissional
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link to="/register" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
