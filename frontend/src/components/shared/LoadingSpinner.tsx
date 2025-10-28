import { WithClassName } from "@/types/shared.types";

interface LoadingSpinnerProps extends WithClassName {
  size?: "small" | "medium" | "large";
  fullPage?: boolean;
}

const sizeClasses = {
  small: "w-6 h-6",
  medium: "w-10 h-10",
  large: "w-16 h-16",
};

export function LoadingSpinner({
  size = "medium",
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex justify-center items-center`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin ${className}`}
      />
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
