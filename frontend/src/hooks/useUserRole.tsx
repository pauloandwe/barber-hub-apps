import { useEffect, useState } from "react";
import { authAPI } from "@/api/auth";

type AppRole = "ADMIN" | "BARBEARIA" | "CLIENTE" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = () => {
      try {
        const user = authAPI.getStoredUser();

        if (!user) {
          setRole(null);
          setBarbeariaId(null);
          setLoading(false);
          return;
        }

        setRole(user.role as AppRole);

        // Se for BARBEARIA, usar o ID da barbearia vinculada
        if (user.role === "BARBEARIA") {
          setBarbeariaId(user.barbearia_id?.toString() || null);
        } else {
          setBarbeariaId(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setRole(null);
        setBarbeariaId(null);
        setLoading(false);
      }
    };

    loadUserRole();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      loadUserRole();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return { role, loading, barbeariaId };
};
