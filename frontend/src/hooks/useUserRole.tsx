import { useEffect, useState } from "react";
import { authAPI } from "@/api/auth";
import { UserRole, isValidRole } from "@/constants/roles";

interface UseUserRoleReturn {
  role: UserRole | null;
  isLoading: boolean;
  barbershopId: string | null;
  error: string | null;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = () => {
      try {
        const user = authAPI.getStoredUser();

        if (!user) {
          setRole(null);
          setBarbershopId(null);
          setIsLoading(false);
          return;
        }

        if (!isValidRole(user.role)) {
          setError("Invalid user role");
          setRole(null);
          setBarbershopId(null);
          setIsLoading(false);
          return;
        }

        setRole(user.role);

        if (user.role === UserRole.BARBERSHOP_MANAGER) {
          setBarbershopId(
            user.barbearia_id?.toString() ||
              user.barbershop_id?.toString() ||
              null
          );
        } else {
          setBarbershopId(null);
        }

        setError(null);
        setIsLoading(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error loading user role";
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading user data:", err);
        }
        setError(message);
        setRole(null);
        setBarbershopId(null);
        setIsLoading(false);
      }
    };

    loadUserRole();

    const handleStorageChange = () => {
      loadUserRole();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return { role, isLoading, barbershopId, error };
}
