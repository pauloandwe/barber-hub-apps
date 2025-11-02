export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  ADMIN: "/admin",
  BARBERSHOP: "/barbershop",
  BARBERSHOP_REMINDERS: "/barbershop/reminders",
  CLIENT: "/client",
  NOT_FOUND: "*",
} as const;

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER];

export const PROTECTED_ROUTES = [
  ROUTES.PROFILE,
  ROUTES.ADMIN,
  ROUTES.BARBERSHOP,
  ROUTES.CLIENT,
];
