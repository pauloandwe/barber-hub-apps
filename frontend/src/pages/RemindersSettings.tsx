import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { remindersAPI, ReminderType, ReminderSettings, ReminderTemplate, ReminderLog, ReminderAnalytics } from "@/api/reminders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bell,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  MessageSquare,
  Check,
  AlertCircle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReminderSettingsDialog } from "@/components/reminders/ReminderSettingsDialog";
import { ReminderTemplateDialog } from "@/components/reminders/ReminderTemplateDialog";
import { ReminderLogsTable } from "@/components/reminders/ReminderLogsTable";
import { ReminderAnalyticsChart } from "@/components/reminders/ReminderAnalyticsChart";

export function RemindersSettings() {
  const navigate = useNavigate();
  const { businessId, isLoading: roleLoading } = useUserRole();

  // State Management
  const [settings, setSettings] = useState<ReminderSettings[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [analytics, setAnalytics] = useState<ReminderAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog States
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<ReminderSettings | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);

  // Pagination
  const [logsPage, setLogsPage] = useState(0);
  const [logsPerPage] = useState(20);

  // Effects
  useEffect(() => {
    if (roleLoading) return;

    if (!businessId) {
      toast.error("Não foi possível encontrar uma business vinculada ao seu usuário");
      setIsLoading(false);
      return;
    }

    fetchAllData(businessId);
  }, [businessId, roleLoading]);

  // Data Fetching
  const fetchAllData = async (id: string | number) => {
    try {
      setIsLoading(true);
      const businessId = typeof id === "string" ? parseInt(id, 10) : id;

      const [settingsData, templatesData, logsData, analyticsData] = await Promise.all([
        remindersAPI.getSettings(businessId),
        remindersAPI.getTemplates(businessId),
        remindersAPI.getLogs(businessId, 0, logsPerPage),
        remindersAPI.getAnalytics(businessId),
      ]);

      setSettings(settingsData);
      setTemplates(templatesData);
      setLogs(logsData.data);
      setAnalytics(analyticsData);
    } catch (error: any) {
      toast.error("Erro ao carregar dados de lembretes");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!businessId) return;
    try {
      setIsRefreshing(true);
      const businessId = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
      await fetchAllData(businessId);
      toast.success("Dados atualizados com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Settings Operations
  const handleSaveSettings = async (data: any) => {
    try {
      if (selectedSetting) {
        const updated = await remindersAPI.updateSettings(selectedSetting.id, data);
        setSettings(settings.map(s => s.id === updated.id ? updated : s));
        toast.success("Configuração atualizada com sucesso");
      } else {
        if (!businessId) return;
        const businessId = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
        const created = await remindersAPI.createSettings(businessId, data);
        setSettings([...settings, created]);
        toast.success("Configuração criada com sucesso");
      }
      setIsSettingsDialogOpen(false);
      setSelectedSetting(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar configuração");
    }
  };

  const handleDeleteSettings = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta configuração?")) return;

    try {
      await remindersAPI.deleteSettings(id);
      setSettings(settings.filter(s => s.id !== id));
      toast.success("Configuração deletada com sucesso");
    } catch (error) {
      toast.error("Erro ao deletar configuração");
    }
  };

  const handleToggleSetting = async (id: number, enabled: boolean) => {
    try {
      const updated = await remindersAPI.toggleSettings(id, !enabled);
      setSettings(settings.map(s => s.id === updated.id ? updated : s));
      toast.success(`Configuração ${!enabled ? "ativada" : "desativada"}`);
    } catch (error) {
      toast.error("Erro ao atualizar configuração");
    }
  };

  // Template Operations
  const handleSaveTemplate = async (data: any) => {
    try {
      if (selectedTemplate) {
        const updated = await remindersAPI.updateTemplate(selectedTemplate.id, data);
        setTemplates(templates.map(t => t.id === updated.id ? updated : t));
        toast.success("Template atualizado com sucesso");
      } else {
        if (!businessId) return;
        const businessId = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
        const created = await remindersAPI.createTemplate(businessId, data);
        setTemplates([...templates, created]);
        toast.success("Template criado com sucesso");
      }
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar template");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este template?")) return;

    try {
      await remindersAPI.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success("Template deletado com sucesso");
    } catch (error) {
      toast.error("Erro ao deletar template");
    }
  };

  const handleResetTemplate = async (id: number) => {
    if (!confirm("Tem certeza que deseja resetar este template para o padrão?")) return;

    try {
      const updated = await remindersAPI.resetTemplate(id);
      setTemplates(templates.map(t => t.id === updated.id ? updated : t));
      toast.success("Template resetado para o padrão");
    } catch (error) {
      toast.error("Erro ao resetar template");
    }
  };

  const openSettingsDialog = (setting?: ReminderSettings) => {
    setSelectedSetting(setting || null);
    setIsSettingsDialogOpen(true);
  };

  const openTemplateDialog = (template?: ReminderTemplate) => {
    setSelectedTemplate(template || null);
    setIsTemplateDialogOpen(true);
  };

  if (roleLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!businessId) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-12 w-12" />}
        title="Erro ao carregar"
        description="Não foi possível encontrar uma business vinculada ao seu usuário"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/business")}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Configuração de Lembretes
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="gap-2">
              <Bell className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Check className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configurações de Lembretes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage reminder settings for different reminder types
                </p>
              </div>
              <Button onClick={() => openSettingsDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Configuração
              </Button>
            </div>

            {settings.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-12 w-12" />}
                title="Nenhuma configuração"
                description="Crie uma configuração de lembrete para começar"
                action={
                  <Button onClick={() => openSettingsDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Configuração
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {settings.map((setting) => (
                  <Card key={setting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {setting.type}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Timezone: {setting.timezone}
                          </CardDescription>
                        </div>
                        <button
                          onClick={() => handleToggleSetting(setting.id, setting.enabled)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {setting.enabled ? (
                            <ToggleRight className="h-6 w-6 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Horas Antes do Agendamento
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {setting.hoursBeforeAppointment.map((hour) => (
                            <span
                              key={hour}
                              className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                            >
                              {hour}h
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSettingsDialog(setting)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSettings(setting.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Templates de Mensagem
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Customize os templates de mensagens para seus lembretes
                </p>
              </div>
              <Button onClick={() => openTemplateDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Template
              </Button>
            </div>

            {templates.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-12 w-12" />}
                title="Nenhum template"
                description="Crie um template para começar a personalizar suas mensagens"
                action={
                  <Button onClick={() => openTemplateDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Template
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {template.type}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.active ? (
                              <span className="text-green-600 font-medium">● Ativo</span>
                            ) : (
                              <span className="text-gray-500 font-medium">● Inativo</span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 italic">
                          {template.message}
                        </p>
                      </div>
                      {template.variables && template.variables.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                            Variáveis Disponíveis
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {template.variables.map((variable) => (
                              <span
                                key={variable}
                                className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 font-mono"
                              >
                                {"{"}
                                {variable}
                                {"}"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTemplateDialog(template)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetTemplate(template.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Histórico de Lembretes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Veja o histórico de envios de lembretes
              </p>
            </div>

            {logs.length === 0 ? (
              <EmptyState
                icon={<Check className="h-12 w-12" />}
                title="Nenhum histórico"
                description="Nenhum lembrete foi enviado ainda"
              />
            ) : (
              <ReminderLogsTable
                logs={logs}
                onResendSuccess={() => {
                  // Refetch logs after successful resend
                  if (businessId) {
                    const businessId = typeof businessId === "string" ? parseInt(businessId, 10) : businessId;
                    remindersAPI.getLogs(businessId, logsPage, logsPerPage)
                      .then((data) => setLogs(data.data))
                      .catch(() => toast.error("Erro ao atualizar histórico"));
                  }
                }}
              />
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Análises de Lembretes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Métricas e estatísticas de desempenho
              </p>
            </div>

            {analytics ? (
              <ReminderAnalyticsChart analytics={analytics} />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-12 w-12" />}
                title="Sem dados"
                description="Nenhuma métrica disponível"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ReminderSettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        initialData={selectedSetting}
        onSave={handleSaveSettings}
      />

      <ReminderTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        initialData={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
