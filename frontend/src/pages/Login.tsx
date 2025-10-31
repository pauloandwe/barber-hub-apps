import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Scissors } from "lucide-react";
import {
  getDashboardRoute,
  hasRouteAccess,
  getRequiredRoleForRoute,
} from "@/utils/navigation.utils";
import { isValidRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

interface LoginFormData {
  email: string;
  password: string;
}

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      toast.error("Por favor, preencha todos os campos");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Por favor, digite um e-mail válido");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (!isValidRole(user.role)) {
        throw new Error("Invalid user role");
      }

      authAPI.setStoredUser(user);

      toast.success("Login realizado com sucesso!");

      const dashboardRoute = getDashboardRoute(user.role);
      navigate(dashboardRoute);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Falha no login";
      toast.error(`Erro de login: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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
              Gerenciar sua barbearia profissionalmente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Fazendo login..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link
              to={ROUTES.REGISTER}
              className="font-medium text-primary hover:underline"
            >
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
