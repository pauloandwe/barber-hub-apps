import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getDashboardRoute, hasRouteAccess } from "@/utils/navigation.utils";
import { isValidRole, UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { WithChildren } from "@/types/shared.types";

interface AuthGuardProps extends WithChildren {
  requiredRole?: UserRole;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = () => {
      const storedUser = authAPI.getStoredUser();

      if (!storedUser) {
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate(ROUTES.LOGIN);
        return;
      }
      if (!isValidRole(storedUser.role)) {
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate(ROUTES.LOGIN);
        return;
      }

      if (!hasRouteAccess(storedUser.role, requiredRole)) {
        setIsAuthenticated(false);
        setIsLoading(false);

        const correctRoute = getDashboardRoute(storedUser.role);
        navigate(correctRoute);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuthAndRole();

    const handleStorageChange = () => {
      checkAuthAndRole();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate, requiredRole]);

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return isAuthenticated ? <>{children}</> : null;
}

export default AuthGuard;
