import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authAPI } from "@/api/auth";
import { usersAPI } from "@/api/users";
import { AuthGuard } from "@/components/AuthGuard";
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
import { ArrowLeft, Loader2, User } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ROUTES } from "@/constants/routes";

const profileSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome é muito longo"),
    phone: z.string().optional(),
    email: z.string().email("E-mail inválido"),
    newPassword: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

type ProfileFormData = z.infer<typeof profileSchema>;

export function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = authAPI.getStoredUser();

      if (!storedUser) {
        navigate(ROUTES.LOGIN);
        return;
      }

      setUserId(storedUser.id.toString());

      setValue("name", storedUser.name || "");
      setValue("phone", storedUser.phone || "");
      setValue("email", storedUser.email || "");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading profile data:", error);
      }
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) return;

    setIsSaving(true);

    try {
      const userIdNum = parseInt(userId, 10);

      await usersAPI.update(userIdNum, {
        name: data.name,
        phone: data.phone || undefined,
      });

      if (data.newPassword && data.newPassword.length > 0) {
        toast.warning("Alteração de senha ainda não implementada via API");
      }

      toast.success("Perfil atualizado com sucesso!");

      const storedUser = authAPI.getStoredUser();
      if (storedUser) {
        storedUser.name = data.name;
        storedUser.phone = data.phone || "";
        authAPI.setStoredUser(storedUser);
      }

      setValue("newPassword", "");
      setValue("confirmPassword", "");
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating profile:", error);
      }
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen gradient-subtle">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate(ROUTES.HOME)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </header>

        <main className="container mx-auto max-w-2xl p-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground mt-2">
              Gerenciar suas informações pessoais
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações de perfil
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deixe em branco se não quiser alterar sua senha
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...register("newPassword")}
                      />
                      {errors.newPassword && (
                        <p className="text-sm text-destructive">
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirme a Nova Senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        {...register("confirmPassword")}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Mudanças"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}

export default Profile;
