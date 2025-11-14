import { 
  Building2, 
  ClipboardCheck, 
  Calendar, 
  FileText, 
  Bell, 
  Settings, 
  LogOut, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { User } from '../App';
import logoSavills from 'figma:asset/f3db017007851c6d0487982fbce88c2ae225c294.png';

interface HomeScreenProps {
  user: User;
  onNavigate: (screen: 'centros' | 'seguimiento' | 'calendario' | 'informe' | 'notificaciones' | 'configuracion' | 'dashboard') => void;
  onLogout: () => void;
}

export function HomeScreen({ user, onNavigate, onLogout }: HomeScreenProps) {
  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Vista general y métricas',
      icon: BarChart3,
      color: 'bg-blue-500',
      screen: 'dashboard' as const,
    },
    {
      id: 'centros',
      title: 'Centros Comerciales',
      description: 'Gestionar centros y equipos',
      icon: Building2,
      color: 'bg-purple-500',
      screen: 'centros' as const,
    },
    {
      id: 'calendario',
      title: 'Calendario',
      description: 'Mantenimientos programados',
      icon: Calendar,
      color: 'bg-green-500',
      screen: 'calendario' as const,
    },
    {
      id: 'informe',
      title: 'Informes y Comparativas',
      description: 'Exportar PDF y CSV',
      icon: FileText,
      color: 'bg-orange-500',
      screen: 'informe' as const,
    },
    {
      id: 'notificaciones',
      title: 'Notificaciones',
      description: 'Alertas y recordatorios',
      icon: Bell,
      color: 'bg-red-500',
      screen: 'notificaciones' as const,
    },
  ];

  // Add configuration only for ADMIN
  if (user.role === 'ADMIN') {
    menuItems.push({
      id: 'configuracion',
      title: 'Configuración',
      description: 'Usuarios y parámetros',
      icon: Settings,
      color: 'bg-gray-500',
      screen: 'configuracion' as const,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#002A54] text-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl">Savills Audit</h1>
              <p className="text-sm text-white/80">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <Badge className="bg-[#FFCC00] text-[#002A54] hover:bg-[#FFCC00]">
            {user.role === 'ADMIN' ? 'Administrador' : 'Gestor'}
          </Badge>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="p-4 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.screen)}
            className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4 text-left"
          >
            <div className={`${item.color} rounded-lg p-3 text-white`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm text-gray-600 mb-3">Resumen rápido</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl text-[#002A54]">
                {user.role === 'ADMIN' ? '--' : user.assignedCenters.length}
              </p>
              <p className="text-xs text-gray-600">Centros asignados</p>
            </div>
            <div>
              <p className="text-2xl text-[#FFCC00]">--</p>
              <p className="text-xs text-gray-600">Pendientes hoy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}