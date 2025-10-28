import { UserRole, getRoleLabel } from "@/constants/roles";
import { WithClassName } from "@/types/shared.types";

interface RoleBadgeProps extends WithClassName {
  role: UserRole;
  variant?: "default" | "outline";
}

const roleColors = {
  [UserRole.ADMIN]: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  [UserRole.BARBERSHOP_MANAGER]: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  [UserRole.CLIENT]: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
};

export function RoleBadge({
  role,
  variant = "default",
  className,
}: RoleBadgeProps) {
  const colors = roleColors[role];

  if (variant === "outline") {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
      >
        {getRoleLabel(role)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      {getRoleLabel(role)}
    </span>
  );
}
