import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { User } from '../App';
import { projectId } from '../utils/supabase/info';

interface NotificacionesScreenProps {
  user: User;
  onBack: () => void;
}

interface Notification {
  notifId: string;
  type: 'PREAVISO' | 'VENCIDO' | 'DESFAVORABLE' | 'SEMESTRAL' | 'INFO';
  title: string;
  message: string;
  centroName?: string;
  equipmentName?: string;
  actionType?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  read: boolean;
  createdAt: string;
}

export function NotificacionesScreen({ user, onBack }: NotificacionesScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/notifications`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar notificaciones');

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/notifications/${notifId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      setNotifications(notifications.map(n =>
        n.notifId === notifId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VENCIDO':
      case 'DESFAVORABLE':
        return AlertCircle;
      case 'PREAVISO':
        return Clock;
      case 'SEMESTRAL':
      case 'INFO':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Hace un momento' : `Hace ${minutes} minutos`;
      }
      return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
    }
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' || !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#002A54] text-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl">Notificaciones</h1>
              <p className="text-sm text-white/80">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-white hover:bg-white/10 text-xs"
              >
                Marcar todo
              </Button>
            )}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-white text-[#002A54]' : 'text-white hover:bg-white/10'}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={filter === 'unread' ? 'bg-white text-[#002A54]' : 'text-white hover:bg-white/10'}
            >
              Sin leer ({unreadCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type);
            const priorityColor = getPriorityColor(notification.priority);

            return (
              <div
                key={notification.notifId}
                onClick={() => !notification.read && markAsRead(notification.notifId)}
                className={`
                  bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all
                  ${!notification.read ? 'border-l-4 border-[#FFCC00]' : ''}
                  hover:shadow-md
                `}
              >
                <div className="flex gap-3">
                  <div className={`${priorityColor} rounded-lg p-2 h-fit`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-[#FFCC00] flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    {notification.centroName && (
                      <div className="text-xs text-gray-500 mb-1">
                        {notification.centroName}
                        {notification.equipmentName && ` - ${notification.equipmentName}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
