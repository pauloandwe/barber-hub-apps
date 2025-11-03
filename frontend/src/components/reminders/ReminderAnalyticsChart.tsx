import { ReminderAnalytics } from "@/api/reminders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  DollarSign,
  Activity,
} from "lucide-react";

interface ReminderAnalyticsChartProps {
  analytics: ReminderAnalytics;
}

const COLORS = {
  sent: "#3b82f6",
  delivered: "#10b981",
  read: "#a855f7",
  failed: "#ef4444",
  pending: "#f59e0b",
};

export function ReminderAnalyticsChart({
  analytics,
}: ReminderAnalyticsChartProps) {
  const statusData = [
    { name: "Enviados", value: analytics.sentReminders, fill: COLORS.sent },
    {
      name: "Entregues",
      value: analytics.deliveredReminders,
      fill: COLORS.delivered,
    },
    { name: "Lidos", value: analytics.readReminders, fill: COLORS.read },
    { name: "Falhados", value: analytics.failedReminders, fill: COLORS.failed },
  ];

  const typeData = Object.entries(analytics.byType).map(([type, count]) => ({
    type: type.replace(/_/g, " "),
    count,
  }));

  const last7DaysData = analytics.last7Days.map((day) => ({
    date: new Date(day.date).toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
    }),
    total: day.count,
    enviados: day.sent,
    entregues: day.delivered,
  }));

  const kpis = [
    {
      icon: MessageSquare,
      label: "Total de Lembretes",
      value: analytics.totalReminders,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "Taxa de Envio",
      value: `${analytics.sendRate.toFixed(1)}%`,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Activity,
      label: "Taxa de Entrega",
      value: `${analytics.deliveryRate.toFixed(1)}%`,
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: Users,
      label: "Taxa de Leitura",
      value: `${analytics.readRate.toFixed(1)}%`,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {}
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {kpi.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {}
      <div className="grid gap-6 md:grid-cols-2">
        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.filter((d) => d.value > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} lembretes`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lembretes por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} lembretes`} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Tendência dos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {last7DaysData.length > 0 &&
          last7DaysData.some((d) => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} lembretes`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total"
                  dot={{ fill: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="enviados"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Enviados"
                  dot={{ fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="entregues"
                  stroke="#a855f7"
                  strokeWidth={2}
                  name="Entregues"
                  dot={{ fill: "#a855f7" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: "Enviados",
                  value: analytics.sentReminders,
                  color: "bg-blue-100 text-blue-700",
                },
                {
                  label: "Entregues",
                  value: analytics.deliveredReminders,
                  color: "bg-green-100 text-green-700",
                },
                {
                  label: "Lidos",
                  value: analytics.readReminders,
                  color: "bg-purple-100 text-purple-700",
                },
                {
                  label: "Falhados",
                  value: analytics.failedReminders,
                  color: "bg-red-100 text-red-700",
                },
                {
                  label: "Pendentes",
                  value: analytics.totalReminders - analytics.sentReminders,
                  color: "bg-yellow-100 text-yellow-700",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Taxa de Envio", value: analytics.sendRate },
                { label: "Taxa de Entrega", value: analytics.deliveryRate },
                { label: "Taxa de Leitura", value: analytics.readRate },
              ].map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {metric.label}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {metric.value.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
