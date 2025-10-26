import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authAPI } from "@/api/auth";
import { usersAPI } from "@/api/users";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User } from "lucide-react";

const perfilSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido"),
  novaSenha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  confirmarSenha: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.novaSenha && data.novaSenha.length > 0) {
    return data.novaSenha === data.confirmarSenha;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type PerfilFormData = z.infer<typeof perfilSchema>;

const Perfil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = authAPI.getStoredUser();

      if (!storedUser) {
        navigate("/login");
        return;
      }

      setUserId(storedUser.id.toString());

      setValue("nome", storedUser.nome || "");
      setValue("telefone", storedUser.telefone || "");
      setValue("email", storedUser.email || "");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PerfilFormData) => {
    if (!userId) return;

    setSaving(true);

    try {
      const userId_num = parseInt(userId);

      // Atualizar perfil (nome e telefone)
      await usersAPI.update(userId_num, {
        nome: data.nome,
        telefone: data.telefone || undefined,
      });

      // TODO: Implementar mudança de password na API backend
      if (data.novaSenha && data.novaSenha.length > 0) {
        toast.warning("Mudança de senha ainda não implementada via API");
      }

      toast.success("Perfil atualizado com sucesso!");

      // Atualizar usuário armazenado
      const storedUser = authAPI.getStoredUser();
      if (storedUser) {
        storedUser.nome = data.nome;
        storedUser.telefone = data.telefone || "";
        authAPI.setStoredUser(storedUser);
      }

      // Limpar campos de senha
      setValue("novaSenha", "");
      setValue("confirmarSenha", "");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen gradient-subtle">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </header>

        <main className="container mx-auto max-w-2xl p-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Atualize seus dados cadastrais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    {...register("nome")}
                    placeholder="Seu nome completo"
                  />
                  {errors.nome && (
                    <p className="text-sm text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    {...register("telefone")}
                    placeholder="(00) 00000-0000"
                  />
                  {errors.telefone && (
                    <p className="text-sm text-destructive">{errors.telefone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deixe em branco se não quiser alterar a senha
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input
                        id="novaSenha"
                        type="password"
                        {...register("novaSenha")}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errors.novaSenha && (
                        <p className="text-sm text-destructive">{errors.novaSenha.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmarSenha"
                        type="password"
                        {...register("confirmarSenha")}
                        placeholder="Digite a senha novamente"
                      />
                      {errors.confirmarSenha && (
                        <p className="text-sm text-destructive">{errors.confirmarSenha.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Perfil;