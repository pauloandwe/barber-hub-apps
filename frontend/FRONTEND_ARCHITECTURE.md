# Frontend Architecture Summary - Barber Hub

## Overview
The Barber Hub frontend is a React TypeScript application built with Vite, featuring role-based access control, responsive design with Tailwind CSS, and a modular component structure using shadcn/ui components.

---

## 1. FOLDER STRUCTURE

```
src/
├── api/                    # API client and service modules
│   ├── index.ts           # Central exports
│   ├── client.ts          # Axios HTTP client with interceptors
│   ├── auth.ts            # Authentication API
│   ├── appointments.ts    # Appointment management
│   ├── barbers.ts         # Barber management
│   ├── business.ts        # Business/Barbershop management
│   ├── services.ts        # Service management
│   ├── users.ts           # User management
│   └── hairhub-tools.ts   # AI/Tool integrations
├── components/            # React components
│   ├── ui/               # shadcn/ui components (70+ pre-built)
│   ├── appointments/     # Appointment-specific components
│   │   └── timeline/    # Timeline view components
│   ├── shared/          # Reusable shared components
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── RoleBadge.tsx
│   │   └── StatusBadge.tsx
│   ├── AuthGuard.tsx
│   ├── BarberDialog.tsx
│   ├── ServiceDialog.tsx
│   └── AppointmentDialog.tsx
├── pages/               # Page components (main routes)
│   ├── App.tsx         # Main router configuration
│   ├── AdminDashboard.tsx
│   ├── BarbershopDashboard.tsx
│   ├── ClientDashboard.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   └── NotFound.tsx
├── hooks/              # Custom React hooks
│   ├── useUserRole.tsx
│   ├── useTimelineData.ts
│   ├── useTimeSlots.ts
│   ├── useDragAndDrop.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── constants/          # Static constants and enums
│   ├── roles.ts
│   ├── routes.ts
│   └── business-hours.ts
├── types/              # TypeScript type definitions
│   └── shared.types.ts
├── utils/              # Utility functions
│   └── navigation.utils.ts
├── lib/               # Library utilities
│   └── utils.ts       # cn() - Tailwind class merger
├── integrations/      # Third-party integrations
├── App.tsx           # Root component with providers
├── App.css           # Global styles
├── index.css         # Tailwind imports and CSS variables
└── main.tsx          # Entry point
```

---

## 2. EXISTING PAGE COMPONENTS & PATTERNS

### Page Structure Pattern
All pages follow a consistent structure:

```typescript
// Import statements (hooks, APIs, components, icons)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_FUNCTION } from "@/api/...";
import { UI_COMPONENTS } from "@/components/ui/...";
import { toast } from "sonner";
import { Icons } from "lucide-react";

export function PageName() {
  const navigate = useNavigate();
  const { role, barbershopId } = useUserRole();
  
  // State management
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Data fetching
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await API_FUNCTION();
      setData(result);
    } catch (error) {
      toast.error("Error message");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers
  const handleAction = async () => { /* ... */ };
  
  // Render
  if (isLoading) return <LoadingSpinner fullPage />;
  return (
    <AuthGuard requiredRole={UserRole.ROLE_NAME}>
      {/* Page content */}
    </AuthGuard>
  );
}
```

### Key Pages:
- **AdminDashboard.tsx**: Manages barbershops and users (Admin only)
- **BarbershopDashboard.tsx**: Manages services, barbers, schedules (Barbershop Manager)
- **ClientDashboard.tsx**: Browse and book appointments (Clients)
- **Profile.tsx**: User profile management (All roles)
- **Login.tsx**: Authentication entry point
- **Register.tsx**: User registration

---

## 3. ROUTING & PAGE ORGANIZATION

### Routing Configuration
**File**: `src/App.tsx`

```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.ADMIN} 
            element={
              <AuthGuard requiredRole={UserRole.ADMIN}>
                <AdminDashboard />
              </AuthGuard>
            } 
          />
          {/* More routes... */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### Route Constants
**File**: `src/constants/routes.ts`

```typescript
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  ADMIN: "/admin",
  BARBERSHOP: "/barbershop",
  CLIENT: "/client",
  NOT_FOUND: "*",
} as const;
```

### Key Features:
- React Router v6 with BrowserRouter
- Role-based route protection via AuthGuard
- TanStack React Query for data management
- Tooltip provider for UI enhancements
- Toast notifications (Sonner)

---

## 4. STYLING APPROACH

### Styling Stack
1. **Tailwind CSS** - Primary utility-first framework
2. **CSS Variables** - Custom theme colors and gradients
3. **shadcn/ui** - Pre-built Radix-based components
4. **Class Variance Authority (CVA)** - Variant management for components
5. **Tailwind Merge** - Intelligent class conflict resolution

### Design System
**File**: `src/index.css`

CSS Variables defined for:
- Colors (primary, secondary, accent, destructive, muted)
- Spacing and radius (--radius: 0.75rem)
- Gradients (--gradient-primary, --gradient-accent, --gradient-subtle)
- Shadows (--shadow-sm through --shadow-xl)
- Sidebar variables

### Example Color Palette:
```css
--primary: 212 45% 19%;           /* Dark blue */
--secondary: 212 39% 30%;         /* Medium blue */
--accent: 217 91% 60%;            /* Light blue */
--destructive: 0 84% 60%;         /* Red */
--background: 225 33% 97%;        /* Off-white */
```

### Component Styling Pattern
```typescript
// Using CVA for variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8",
      },
    },
  }
);
```

---

## 5. STATE MANAGEMENT

### Approach
- **No Redux/Zustand** - Using React hooks + Context
- **TanStack React Query** - Server state management
- **React Hooks** - Local component state (useState, useReducer)
- **Local Storage** - Persistent auth data

### Key State Patterns

**Authentication State**:
```typescript
// In AuthGuard.tsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [isLoading, setIsLoading] = useState(true);

// Via authAPI
const user = authAPI.getStoredUser(); // From localStorage
```

**User Context Hook**:
```typescript
// useUserRole.tsx
function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  
  useEffect(() => {
    const user = authAPI.getStoredUser();
    setRole(user?.role);
    setBarbershopId(user?.businessId?.toString());
  }, []);
  
  return { role, isLoading, barbershopId, error };
}
```

**Local Data State**:
```typescript
// In BarbershopDashboard.tsx
const [services, setServices] = useState<Service[]>([]);
const [barbers, setBarbers] = useState<Barber[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetchData();
}, [barbershopId]);
```

---

## 6. COMPONENT LIBRARY & UI PATTERNS

### shadcn/ui Components (70+ available)
Pre-built, accessible, customizable components using Radix UI primitives:

**Form Components**:
- Button, Input, Label, Textarea
- Select, Checkbox, Radio Group, Switch
- Form (with react-hook-form integration)

**Layout Components**:
- Card (CardHeader, CardContent, CardDescription, CardTitle)
- Dialog, Drawer, Sheet
- Tabs, Accordion, Collapsible
- Pagination, Breadcrumb

**Data Display**:
- Table, Badge, Avatar
- Tooltip, Popover, HoverCard
- Progress, Slider, Carousel

**Navigation**:
- Dropdown Menu, Context Menu
- Navigation Menu, Menubar
- Sidebar

### Shared Component Patterns

**LoadingSpinner**:
```typescript
interface LoadingSpinnerProps extends WithClassName {
  size?: "small" | "medium" | "large";
  fullPage?: boolean;
}

export function LoadingSpinner({ size = "medium", fullPage = false }) {
  const spinner = <div className={sizeClasses[size]} />;
  if (fullPage) {
    return <div className="flex justify-center items-center min-h-screen">{spinner}</div>;
  }
  return spinner;
}
```

**EmptyState**:
```typescript
interface EmptyStateProps extends WithClassName {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

**AuthGuard**:
```typescript
interface AuthGuardProps extends WithChildren {
  requiredRole?: UserRole;
}

export function AuthGuard({ children, requiredRole }) {
  // Validates authentication and role-based access
  // Returns LoadingSpinner while checking
  // Redirects to login if not authenticated
  // Redirects to correct dashboard if role mismatch
}
```

---

## 7. API INTEGRATION

### API Client Architecture
**File**: `src/api/client.ts`

```typescript
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
      headers: { "Content-Type": "application/json" },
    });

    // Request interceptor: Add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor: Handle 401/403
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.setToken(null);
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
  }

  get(url: string, config = {}) { return this.client.get(url, config); }
  post(url: string, data = {}, config = {}) { return this.client.post(url, data, config); }
  put(url: string, data = {}, config = {}) { return this.client.put(url, data, config); }
  patch(url: string, data = {}, config = {}) { return this.client.patch(url, data, config); }
  delete(url: string, config = {}) { return this.client.delete(url, config); }
}
```

### API Module Pattern
Each API module exports an object with methods:

```typescript
// src/api/services.ts
export interface Service {
  id: number;
  businessId: number;
  name: string;
  duration: number;
  price: number;
  active: boolean;
}

export const servicesAPI = {
  async getAll(businessId: number): Promise<Service[]> {
    const response = await apiClient.get(`/services?businessId=${businessId}`);
    return response?.data?.data?.data || response?.data?.data || [];
  },

  async getById(id: number): Promise<Service> {
    const response = await apiClient.get(`/services/${id}`);
    return response?.data?.data;
  },

  async create(data: CreateServiceRequest): Promise<Service> {
    const response = await apiClient.post("/services", data);
    return response?.data?.data;
  },

  async update(id: number, data: UpdateServiceRequest): Promise<Service> {
    const response = await apiClient.put(`/services/${id}`, data);
    return response?.data?.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  },
};
```

### API Usage Pattern in Components

```typescript
// In BarbershopDashboard.tsx
const fetchData = async (targetBarbershopId: string | number) => {
  try {
    setIsLoading(true);
    
    const business = await businessAPI.getById(barbershopIdNum);
    const services = await servicesAPI.getAll(barbershopIdNum);
    const barbers = await barbersAPI.getAll(barbershopIdNum);
    
    setBarbershopInfo(business);
    setServices(services);
    setBarbers(barbers);
  } catch (error) {
    toast.error("Erro ao carregar dados");
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  if (barbershopId) {
    fetchData(barbershopId);
  }
}, [barbershopId]);
```

### Data Response Handling
The API handles nested response structures:
```typescript
// Backend may return: { data: { data: { data: [...] } } }
// Or: { data: { data: [...] } }
// Handled by:
const extractResponseData = <T>(response: any): T => {
  const topLevel = response?.data;
  if (topLevel?.data?.data) return topLevel.data.data;
  if (topLevel?.data) return topLevel.data;
  return topLevel;
};
```

### API Modules Available
1. **authAPI** - Login, register, profile
2. **businessAPI** - Barbershop CRUD
3. **usersAPI** - User management
4. **appointmentsAPI** - Appointment CRUD + timeline
5. **barbersAPI** - Barber management
6. **servicesAPI** - Service CRUD
7. **hairhubTools** - AI integrations

---

## 8. KEY TYPES & INTERFACES

**File**: `src/types/shared.types.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  barbershopId?: string;
}

export interface WithChildren {
  children: React.ReactNode;
}

export interface WithClassName {
  className?: string;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
```

---

## 9. KEY DEPENDENCIES

```json
{
  "React": "^18.3.1",
  "React Router": "^6.30.1",
  "Vite": "^5.4.19",
  "TypeScript": "^5.8.3",
  "Tailwind CSS": "^3.4.17",
  "Shadcn/ui": "Latest (via @radix-ui packages)",
  "Axios": "^1.12.2",
  "TanStack React Query": "^5.83.0",
  "React Hook Form": "^7.61.1",
  "Zod": "^3.25.76 (validation)",
  "Sonner": "^1.7.4 (toast notifications)",
  "Lucide React": "^0.462.0 (icons)",
  "Class Variance Authority": "^0.7.1",
  "date-fns": "^3.6.0 (date utilities)",
  "Recharts": "^2.15.4 (charts)",
  "DnD Kit": "^6.1.0 (drag & drop)"
}
```

---

## 10. COMMON PATTERNS TO FOLLOW

### Dialog/Modal Pattern
```typescript
interface DialogProps extends WithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomDialogProps extends DialogProps {
  itemId: string;
  onSuccess: () => void;
  item?: Item | null;
}

export function CustomDialog({ open, onOpenChange, itemId, onSuccess, item }: CustomDialogProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(item);

  useEffect(() => {
    if (item) {
      setFormData(mapItemToForm(item));
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (isEditMode) {
        await API.update(item.id, formData);
        toast.success("Updated successfully");
      } else {
        await API.create(formData);
        toast.success("Created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Create"} Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Data Fetching Pattern
```typescript
const [data, setData] = useState<Item[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const result = await API.getAll(filters);
    setData(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [dependencies]);

if (isLoading) return <LoadingSpinner fullPage />;
if (error) return <EmptyState title="Error" description={error} />;
if (data.length === 0) return <EmptyState title="No data" />;
```

### Form Input Pattern
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

<Input
  name="fieldName"
  value={formData.fieldName}
  onChange={handleInputChange}
  placeholder="Enter value"
/>
```

---

## 11. ENVIRONMENT CONFIGURATION

**File**: `.env`
```
VITE_API_URL=http://localhost:3001
```

**File**: `vite.config.ts`
```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

---

## 12. ROLE-BASED ACCESS CONTROL (RBAC)

**File**: `src/constants/roles.ts`

```typescript
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

export function isValidRole(role: unknown): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || "Unknown";
}
```

**Usage in Routes**:
```typescript
<Route
  path={ROUTES.ADMIN}
  element={
    <AuthGuard requiredRole={UserRole.ADMIN}>
      <AdminDashboard />
    </AuthGuard>
  }
/>
```

---

## 13. RECOMMENDATIONS FOR REMINDER CONFIG PAGES

When creating reminder configuration pages, follow these patterns:

### 1. Create API Module
```typescript
// src/api/reminders.ts
export interface Reminder { /* ... */ }
export interface CreateReminderRequest { /* ... */ }

export const remindersAPI = {
  async getAll(businessId: number): Promise<Reminder[]> { /* ... */ },
  async create(data: CreateReminderRequest): Promise<Reminder> { /* ... */ },
  async update(id: number, data: UpdateRequest): Promise<Reminder> { /* ... */ },
  async delete(id: number): Promise<void> { /* ... */ },
};
```

### 2. Create Page Component
```typescript
// src/pages/ReminderConfigDashboard.tsx
export function ReminderConfigDashboard() {
  const { barbershopId } = useUserRole();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => { fetchReminders(); }, [barbershopId]);
  
  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        {/* Page content */}
      </div>
    </AuthGuard>
  );
}
```

### 3. Create Dialog Component
```typescript
// src/components/ReminderDialog.tsx
export function ReminderDialog({ open, onOpenChange, barbershopId, onSuccess }) {
  // Use the dialog pattern above
}
```

### 4. Add Route
```typescript
// src/App.tsx
<Route path="/reminders" element={<AuthGuard><ReminderConfigDashboard /></AuthGuard>} />
```

### 5. Use Consistent UI
- Import UI components from `@/components/ui/`
- Use Tailwind classes for styling
- Use `sonner` for notifications
- Use `lucide-react` for icons
- Follow LoadingSpinner and EmptyState patterns

---

## SUMMARY

**Tech Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
**Routing**: React Router v6 with AuthGuard protection
**State**: React Hooks + localStorage for auth + TanStack React Query ready
**Styling**: Utility-first Tailwind with CSS variables
**API**: Axios client with interceptors, modular API services
**Component Pattern**: Reusable, typed, with loading/error states
**RBAC**: Role-based route protection and UI rendering
**Notifications**: Sonner toast system
**Icons**: Lucide React

All reminder configuration pages should follow the existing patterns for consistency.
