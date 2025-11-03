import { UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return ROUTES.ADMIN;
    case UserRole.BARBERSHOP_MANAGER:
      return ROUTES.BUSINESS;
    case UserRole.CLIENT:
      return ROUTES.CLIENT;
    default:
      return ROUTES.HOME;
  }
}

export function getAllDashboardRoutes(): string[] {
  return [ROUTES.ADMIN, ROUTES.BUSINESS, ROUTES.CLIENT];
}

export function isDashboardRoute(route: string): boolean {
  return getAllDashboardRoutes().includes(route);
}

export function getRequiredRoleForRoute(route: string): UserRole | null {
  switch (route) {
    case ROUTES.ADMIN:
      return UserRole.ADMIN;
    case ROUTES.BUSINESS:
      return UserRole.BARBERSHOP_MANAGER;
    case ROUTES.CLIENT:
      return UserRole.CLIENT;
    case ROUTES.PROFILE:
      return null;
    default:
      return null;
  }
}

export function hasRouteAccess(
  userRole: UserRole | null,
  requiredRole: UserRole | null
): boolean {
  if (!userRole) return false;
  if (!requiredRole) return true;
  return userRole === requiredRole;
}
