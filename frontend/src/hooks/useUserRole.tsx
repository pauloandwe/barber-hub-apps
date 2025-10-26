import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "ADMIN" | "BARBEARIA" | "CLIENTE" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Buscar role da tabela user_roles
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleError) {
          console.error("Erro ao buscar role:", roleError);
          setRole(null);
          setLoading(false);
          return;
        }

        setRole(roleData.role as AppRole);

        // Se for BARBEARIA, buscar o ID da barbearia vinculada
        if (roleData.role === "BARBEARIA") {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("barbearia_id")
            .eq("id", user.id)
            .single();

          setBarbeariaId(profileData?.barbearia_id || null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setRole(null);
        setLoading(false);
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, loading, barbeariaId };
};
