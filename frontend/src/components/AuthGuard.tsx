import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";

interface UserProfile {
  id: number;
  email: string;
  nome: string;
  role: "ADMIN" | "BARBERSHOP" | "CLIENT";
  telefone?: string;
  barbearia_id?: number;
  access_token: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "BARBERSHOP" | "CLIENT";
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = () => {
      const storedUser = authAPI.getStoredUser();

      if (!storedUser) {
        setUser(null);
        setLoading(false);
        navigate("/login");
        return;
      }

      if (requiredRole && storedUser.role !== requiredRole) {
        console.log("storedUser", storedUser.role);
        setUser(null);
        setLoading(false);

        // Redirecionar para a página correta baseado no role cadastrado
        switch (storedUser.role) {
          case "ADMIN":
            navigate("/admin");
            break;
          case "BARBERSHOP":
            navigate("/barbearia");
            break;
          case "CLIENT":
            navigate("/cliente");
            break;
          default:
            navigate("/login");
        }
        return;
      }

      setUser(storedUser as UserProfile);
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
