import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Scissors, Plus, Building2, LogOut, Users, UserCog, User } from "lucide-react";
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

interface Barbearia {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
}

interface Usuario {
  id: string;
  nome: string;
  telefone: string | null;
  barbearia_id: string | null;
  role: string;
  barbearia_nome?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [barbearias, setBarbearias] = useState<Barbearia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedBarbeariaId, setSelectedBarbeariaId] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  useEffect(() => {
    fetchBarbearias();
    fetchUsuarios();
  }, []);

  const fetchBarbearias = async () => {
    try {
      const { data, error } = await supabase
        .from("barbearias")
        .select("*")
        .order("nome");

      if (error) throw error;
      setBarbearias(data || []);
    } catch (error) {
      console.error("Erro ao buscar barbearias:", error);
      toast.error("Erro ao carregar barbearias");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBarbearia = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("barbearias")
        .insert([formData]);

      if (error) throw error;

      toast.success("Barbearia criada com sucesso!");
      setOpen(false);
      setFormData({ nome: "", email: "", telefone: "", endereco: "" });
      fetchBarbearias();
    } catch (error) {
      console.error("Erro ao criar barbearia:", error);
      toast.error("Erro ao criar barbearia");
    }
  };

  const fetchUsuarios = async () => {
    try {
      // Buscar todos os perfis com suas barbearias
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          nome,
          telefone,
          barbearia_id,
          barbearias (nome)
        `)
        .order("nome");

      if (profilesError) {
        console.error("Erro ao buscar profiles:", profilesError);
        throw profilesError;
      }

      // Buscar todos os roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Erro ao buscar roles:", rolesError);
        throw rolesError;
      }

      // Combinar dados de profiles e roles
      const usuariosComRoles = profilesData?.map((profile: any) => {
        const userRole = rolesData?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          nome: profile.nome,
          telefone: profile.telefone,
          barbearia_id: profile.barbearia_id,
          role: userRole?.role || "CLIENTE",
          barbearia_nome: profile.barbearias?.nome,
        };
      }) || [];

      console.log(`Total de usuários carregados: ${usuariosComRoles.length}`);
      setUsuarios(usuariosComRoles);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedBarbeariaId(user.barbearia_id || "");
    setUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Atualizar role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: selectedRole as "ADMIN" | "BARBEARIA" | "CLIENTE" })
        .eq("user_id", selectedUser.id);

      if (roleError) throw roleError;

      // Atualizar barbearia_id no profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          barbearia_id: selectedRole === "BARBEARIA" ? selectedBarbeariaId || null : null 
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      toast.success("Usuário atualizado com sucesso!");
      setUserDialogOpen(false);
      setSelectedUser(null);
      fetchUsuarios();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Painel Admin</h1>
          </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/perfil")}>
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
        <Tabs defaultValue="barbearias" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="barbearias">
              <Building2 className="mr-2 h-4 w-4" />
              Barbearias
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="barbearias" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Barbearias</h2>
                <p className="text-muted-foreground">Gerencie todas as barbearias do sistema</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
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
                      Preencha os dados da nova barbearia
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBarbearia} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">Criar Barbearia</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {barbearias.map((barbearia) => (
                <Card key={barbearia.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Building2 className="h-8 w-8 text-primary" />
                      <span className={`text-xs px-2 py-1 rounded ${barbearia.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {barbearia.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <CardTitle>{barbearia.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {barbearia.email && (
                      <p className="text-muted-foreground">📧 {barbearia.email}</p>
                    )}
                    {barbearia.telefone && (
                      <p className="text-muted-foreground">📱 {barbearia.telefone}</p>
                    )}
                    {barbearia.endereco && (
                      <p className="text-muted-foreground">📍 {barbearia.endereco}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {barbearias.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma barbearia cadastrada ainda</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Usuários</h2>
              <p className="text-muted-foreground">Gerencie usuários e suas permissões</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {usuarios.map((usuario) => (
                <Card key={usuario.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <UserCog className="h-8 w-8 text-primary" />
                      <span className={`text-xs px-2 py-1 rounded ${
                        usuario.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        usuario.role === 'BARBEARIA' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {usuario.role}
                      </span>
                    </div>
                    <CardTitle>{usuario.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {usuario.telefone && (
                      <p className="text-muted-foreground">📱 {usuario.telefone}</p>
                    )}
                    {usuario.barbearia_nome && (
                      <p className="text-muted-foreground">🏪 {usuario.barbearia_nome}</p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => handleEditUser(usuario)}
                    >
                      Editar Permissões
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {usuarios.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum usuário cadastrado ainda</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Altere o role e vincule uma barbearia ao usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Input value={selectedUser?.nome || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="BARBEARIA">BARBEARIA</SelectItem>
                    <SelectItem value="CLIENTE">CLIENTE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedRole === "BARBEARIA" && (
                <div className="space-y-2">
                  <Label htmlFor="barbearia">Barbearia</Label>
                  <Select value={selectedBarbeariaId} onValueChange={setSelectedBarbeariaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma barbearia" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbearias.map((barbearia) => (
                        <SelectItem key={barbearia.id} value={barbearia.id}>
                          {barbearia.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleUpdateUser} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
