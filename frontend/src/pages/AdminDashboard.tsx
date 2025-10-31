import { useEffect, useState } from "react";
import { businessAPI } from "@/api/business";
import { usersAPI } from "@/api/users";
import { authAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Scissors,
  Plus,
  Building2,
  LogOut,
  Users,
  UserCog,
  User,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

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
  phone?: string;
  businessId?: number;
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
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isEditBarbershopDialogOpen, setIsEditBarbershopDialogOpen] =
    useState(false);
  const [barbershopToEdit, setBarbershopToEdit] = useState<Barbershop | null>(
    null
  );
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isUpdatingBarbershop, setIsUpdatingBarbershop] = useState(false);

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
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching barbershops:", error);
      }
      toast.error("Erro ao carregar barbearias");
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

      toast.success("Barbearia criada com sucesso!");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", address: "" });
      fetchBarbershops();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating barbershop:", error);
      }
      toast.error("Erro ao criar barbearia");
    }
  };

  const openEditBarbershopDialog = (barbershop: Barbershop) => {
    setBarbershopToEdit(barbershop);
    setEditFormData({
      name: barbershop.name || "",
      email: barbershop.email || "",
      phone: barbershop.phone || "",
      address: barbershop.address || "",
    });
    setIsEditBarbershopDialogOpen(true);
  };

  const resetEditBarbershopState = () => {
    setBarbershopToEdit(null);
    setEditFormData({ name: "", email: "", phone: "", address: "" });
    setIsUpdatingBarbershop(false);
  };

  const handleUpdateBarbershop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbershopToEdit) return;

    setIsUpdatingBarbershop(true);
    try {
      await businessAPI.update(barbershopToEdit.id, {
        name: editFormData.name,
        email: editFormData.email || undefined,
        phone: editFormData.phone || undefined,
        address: editFormData.address || undefined,
      });

      toast.success("Barbearia atualizada com sucesso!");
      setIsEditBarbershopDialogOpen(false);
      resetEditBarbershopState();
      fetchBarbershops();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating barbershop:", error);
      }
      toast.error("Erro ao atualizar barbearia");
    } finally {
      setIsUpdatingBarbershop(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await usersAPI.getAll();
      setUsers(
        allUsers.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          businessId: user.businessId,
          role: user.role,
          barbershopName: undefined,
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching users:", error);
      }
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedBarbershopId(user.businessId ? user.businessId.toString() : "");
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await usersAPI.update(selectedUser.id, {
        role: selectedRole as "ADMIN" | "BARBERSHOP" | "CLIENT",
        businessId:
          selectedRole === "BARBERSHOP"
            ? parseInt(selectedBarbershopId) || undefined
            : undefined,
      });

      toast.success("Usuário atualizado com sucesso!");
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating user:", error);
      }
      toast.error("Erro ao atualizar usuário");
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
            <h1 className="text-xl font-bold">Painel de Administrador</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <Tabs defaultValue="barbershops" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="barbershops">
              <Building2 className="mr-2 h-4 w-4" />
              Barbearias
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="barbershops" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Barbearias</h2>
                <p className="text-muted-foreground">
                  Gerenciar todas as barbearias do sistema
                </p>
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Barbearia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Barbearia</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes da barbearia
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBarbershop} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Criar Barbearia
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {barbershops.map((barbershop) => (
                <Card key={barbershop.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <Building2 className="h-8 w-8 text-primary" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditBarbershopDialog(barbershop)}
                      >
                        Editar
                      </Button>
                    </div>
                    <CardTitle>{barbershop.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {barbershop.email && (
                      <p className="text-muted-foreground">
                        📧 {barbershop.email}
                      </p>
                    )}
                    {barbershop.phone && (
                      <p className="text-muted-foreground">
                        📱 {barbershop.phone}
                      </p>
                    )}
                    {barbershop.address && (
                      <p className="text-muted-foreground">
                        📍 {barbershop.address}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {barbershops.length === 0 && (
              <EmptyState
                title="Nenhuma barbearia registrada"
                description="Comece criando sua primeira barbearia"
                icon="🏪"
              />
            )}

            <Dialog
              open={isEditBarbershopDialogOpen}
              onOpenChange={(open) => {
                setIsEditBarbershopDialogOpen(open);
                if (!open) {
                  resetEditBarbershopState();
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Barbearia</DialogTitle>
                  <DialogDescription>
                    Atualize as informações da barbearia abaixo
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdateBarbershop} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome *</Label>
                    <Input
                      id="edit-name"
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">E-mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telefone *</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Endereço</Label>
                    <Input
                      id="edit-address"
                      type="text"
                      value={editFormData.address}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUpdatingBarbershop}
                  >
                    {isUpdatingBarbershop ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Salvando...
                      </>
                    ) : (
                      "Salvar mudanças"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Usuários</h2>
              <p className="text-muted-foreground">
                Gerenciar usuários e suas permissões
              </p>
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
                    {user.phone && (
                      <p className="text-muted-foreground">📱 {user.phone}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleEditUser(user)}
                    >
                      Editar Permissões
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {users.length === 0 && (
              <EmptyState
                title="Nenhum usuário registrado"
                description="Os usuários aparecerão aqui quando se cadastrem"
                icon="👥"
              />
            )}
          </TabsContent>
        </Tabs>

        <Dialog
          open={isEditUserDialogOpen}
          onOpenChange={setIsEditUserDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Altere a função e vincule uma barbearia ao usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Input value={selectedUser?.name || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="BARBERSHOP">
                      Gerente de Barbearia
                    </SelectItem>
                    <SelectItem value="CLIENT">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedRole === "BARBERSHOP" && (
                <div className="space-y-2">
                  <Label htmlFor="barbershop">Barbearia</Label>
                  <Select
                    value={selectedBarbershopId}
                    onValueChange={setSelectedBarbershopId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar uma barbearia" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbershops.map((barbershop) => (
                        <SelectItem
                          key={barbershop.id}
                          value={barbershop.id.toString()}
                        >
                          {barbershop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleUpdateUser} className="w-full">
                Salvar Mudanças
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default AdminDashboard;
