import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function NotFound() {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md px-4">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
        <p className="mb-2 text-2xl font-semibold text-gray-800">
          Page Not Found
        </p>
        <p className="mb-8 text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href={ROUTES.HOME}>
          <Button className="w-full">Return to Home</Button>
        </a>
      </div>
    </div>
  );
}

export default NotFound;
