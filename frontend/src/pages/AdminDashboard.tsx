import { useEffect, useState } from 'react';
import { businessAPI } from '@/api/business';
import { usersAPI } from '@/api/users';
import { authAPI } from '@/api/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Scissors,
  Plus,
  Building2,
  LogOut,
  Users,
  UserCog,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserRole } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';

interface Barbershop {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  barbershopId: number | null;
  role: string;
  barbershopName?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchBarbershops();
    fetchUsers();
  }, []);

  const fetchBarbershops = async () => {
    try {
      const businesses = await businessAPI.getAll();
      setBarbershops(
        businesses.map((b: any) => ({
          id: b.id,
          name: b.name,
          phone: b.phone,
          email: b.email,
          address: b.address,
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching barbershops:', error);
      }
      toast.error('Error loading barbershops');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBarbershop = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await businessAPI.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });

      toast.success('Barbershop created successfully!');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      fetchBarbershops();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating barbershop:', error);
      }
      toast.error('Error creating barbershop');
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await usersAPI.getAll();
      setUsers(
        allUsers.map((user: any) => ({
          id: user.id,
          name: user.name || user.nome,
          email: user.email,
          phone: user.phone || user.telefone,
          barbershopId: user.barbearia_id || user.barbershopId,
          role: user.role,
          barbershopName: undefined,
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users:', error);
      }
      toast.error('Error loading users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedBarbershopId(user.barbershopId ? user.barbershopId.toString() : '');
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await usersAPI.update(selectedUser.id, {
        role: selectedRole as 'ADMIN' | 'BARBERSHOP' | 'CLIENT',
        barbearia_id:
          selectedRole === 'BARBERSHOP' ? parseInt(selectedBarbershopId) || undefined : undefined,
      });

      toast.success('User updated successfully!');
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating user:', error);
      }
      toast.error('Error updating user');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate(ROUTES.LOGIN);
  };

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <Tabs defaultValue="barbershops" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="barbershops">
              <Building2 className="mr-2 h-4 w-4" />
              Barbershops
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="barbershops" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Barbershops</h2>
                <p className="text-muted-foreground">Manage all barbershops in the system</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Barbershop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Barbershop</DialogTitle>
                    <DialogDescription>Fill in the barbershop details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBarbershop} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Barbershop
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {barbershops.map((barbershop) => (
                <Card key={barbershop.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>{barbershop.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {barbershop.email && (
                      <p className="text-muted-foreground">📧 {barbershop.email}</p>
                    )}
                    {barbershop.phone && (
                      <p className="text-muted-foreground">📱 {barbershop.phone}</p>
                    )}
                    {barbershop.address && (
                      <p className="text-muted-foreground">📍 {barbershop.address}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {barbershops.length === 0 && (
              <EmptyState
                title="No barbershops registered"
                description="Start by creating your first barbershop"
                icon="🏪"
              />
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Users</h2>
              <p className="text-muted-foreground">Manage users and their permissions</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <UserCog className="h-8 w-8 text-primary" />
                      <RoleBadge role={user.role as UserRole} />
                    </div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {user.phone && <p className="text-muted-foreground">📱 {user.phone}</p>}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit Permissions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {users.length === 0 && (
              <EmptyState
                title="No users registered"
                description="Users will appear here once they sign up"
                icon="👥"
              />
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Change the role and link a barbershop to the user</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Input value={selectedUser?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="BARBERSHOP">Barbershop Manager</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedRole === 'BARBERSHOP' && (
                <div className="space-y-2">
                  <Label htmlFor="barbershop">Barbershop</Label>
                  <Select value={selectedBarbershopId} onValueChange={setSelectedBarbershopId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a barbershop" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbershops.map((barbershop) => (
                        <SelectItem key={barbershop.id} value={barbershop.id.toString()}>
                          {barbershop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleUpdateUser} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default AdminDashboard;
