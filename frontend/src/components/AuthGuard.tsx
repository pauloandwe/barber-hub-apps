import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "BARBEARIA" | "CLIENTE";
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = async (userId: string) => {
      if (!requiredRole) {
        setLoading(false);
        return;
      }

      // Verificar role do usuário
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleData?.role !== requiredRole) {
        // Redirecionar para a página correta baseado no role
        switch (roleData?.role) {
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

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/login");
        setLoading(false);
      } else {
        checkAuthAndRole(session.user.id);
      }
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/login");
        setLoading(false);
      } else {
        checkAuthAndRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
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
