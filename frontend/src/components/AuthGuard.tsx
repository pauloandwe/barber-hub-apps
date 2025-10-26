import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";

interface UserProfile {
  id: number;
  email: string;
  nome: string;
  role: "ADMIN" | "BARBEARIA" | "CLIENTE";
  telefone?: string;
  barbearia_id?: number;
  access_token: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "BARBEARIA" | "CLIENTE";
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = () => {
      const storedUser = authAPI.getStoredUser();

      if (!storedUser) {
        navigate("/login");
        setLoading(false);
        return;
      }

      setUser(storedUser as UserProfile);

      if (!requiredRole) {
        setLoading(false);
        return;
      }

      // Verificar se o usuário tem o role necessário
      if (storedUser.role !== requiredRole) {
        // Redirecionar para a página correta baseado no role
        switch (storedUser.role) {
          case "ADMIN":
            navigate("/admin");
            break;
          case "BARBEARIA":
            navigate("/barbearia");
            break;
          case "CLIENTE":
            navigate("/cliente");
            break;
          default:
            navigate("/login");
        }
      }
      setLoading(false);
    };

    checkAuthAndRole();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuthAndRole();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate, requiredRole]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
