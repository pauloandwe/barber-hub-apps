export enum UserRole {
  ADMIN = "ADMIN",
  BARBERSHOP_MANAGER = "BARBERSHOP",
  CLIENT = "CLIENT",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.BARBERSHOP_MANAGER]: "Gestor de Barbearia",
  [UserRole.CLIENT]: "Cliente",
};

export const ROLE_TRANSLATIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.BARBERSHOP_MANAGER]: "Gestor de Barbearia",
  [UserRole.CLIENT]: "Cliente",
};

export function isValidRole(role: unknown): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || "Unknown";
}

export function getRoleTranslation(role: UserRole): string {
  return ROLE_TRANSLATIONS[role] || "Desconhecido";
}
