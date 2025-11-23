import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { User } from '../App';
import { projectId } from '../utils/supabase/info';

interface DashboardScreenProps {
  user: User;
  onBack: () => void;
}

interface DashboardData {
  totalCentros: number;
  totalEquipments: number;
  totalActions: number;
  favorableCount: number;
  desfavorableCount: number;
  condicionadoCount: number;
  pendienteCount: number;
  overdueCount: number;
  cumplimientoPromedio: number;
  centrosPorEstado: {
    aptos: number;
    condicionados: number;
    noAptos: number;
  };
  proximosVencimientos: Array<{
    centroName: string;
    equipmentName: string;
    actionType: string;
    nextDate: string;
  }>;
}

export function DashboardScreen({ user, onBack }: DashboardScreenProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar dashboard');

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Error al cargar datos</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#002A54] text-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl">Dashboard</h1>
              <p className="text-sm text-white/80">Vista general y métricas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Main Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen General</CardTitle>
            <CardDescription>Indicadores principales del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl text-[#002A54]">{data.totalCentros}</p>
                <p className="text-sm text-gray-600">Centros Comerciales</p>
              </div>
              <div>
                <p className="text-3xl text-[#002A54]">{data.totalEquipments}</p>
                <p className="text-sm text-gray-600">Equipos Totales</p>
              </div>
              <div>
                <p className="text-3xl text-[#002A54]">{data.totalActions}</p>
                <p className="text-sm text-gray-600">Actuaciones</p>
              </div>
              <div>
                <p className="text-3xl text-green-600">{data.cumplimientoPromedio.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Cumplimiento Medio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Actuaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Favorable</span>
                </div>
                <span className="text-sm">{data.favorableCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Condicionado</span>
                </div>
                <span className="text-sm">{data.condicionadoCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Desfavorable</span>
                </div>
                <span className="text-sm">{data.desfavorableCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm">Pendiente</span>
                </div>
                <span className="text-sm">{data.pendienteCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Centers by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Centros por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">APTO (≥80%)</span>
                </div>
                <span className="text-sm">{data.centrosPorEstado.aptos}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">APTO CONDICIONADO (60-79%)</span>
                </div>
                <span className="text-sm">{data.centrosPorEstado.condicionados}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">NO APTO (&lt;60%)</span>
                </div>
                <span className="text-sm">{data.centrosPorEstado.noAptos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {data.overdueCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Alertas Críticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                {data.overdueCount} actuación(es) vencida(s) requieren atención inmediata
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        {data.proximosVencimientos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos Vencimientos
              </CardTitle>
              <CardDescription>Actuaciones que vencen próximamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.proximosVencimientos.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-start justify-between border-b pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.centroName}</p>
                      <p className="text-xs text-gray-600 truncate">
                        {item.equipmentName} - {item.actionType}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">
                      {formatDate(item.nextDate)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}