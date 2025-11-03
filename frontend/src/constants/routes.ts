export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  ADMIN: "/admin",
  BUSINESS: "/business",
  BARBERSHOP_REMINDERS: "/business/reminders",
  CLIENT: "/client",
  NOT_FOUND: "*",
} as const;

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER];

export const PROTECTED_ROUTES = [
  ROUTES.PROFILE,
  ROUTES.ADMIN,
  ROUTES.BUSINESS,
  ROUTES.CLIENT,
];
