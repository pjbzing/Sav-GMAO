import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Settings as SettingsIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import type { User, Centro } from '../App';
import { projectId } from '../utils/supabase/info';

interface ConfiguracionScreenProps {
  user: User;
  onBack: () => void;
}

interface SystemUser {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'GESTOR';
  assignedCenters: string[];
}

interface Preaviso {
  periodicityDays: number;
  preaviso30: boolean;
  preaviso15: boolean;
  preaviso7: boolean;
}

export function ConfiguracionScreen({ user, onBack }: ConfiguracionScreenProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [preavisos, setPreavisos] = useState<Preaviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'preavisos'>('users');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'GESTOR' as 'ADMIN' | 'GESTOR',
    assignedCenters: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user.role !== 'ADMIN') {
      onBack();
      return;
    }
    fetchData();
  }, [user.role]);

  const fetchData = async () => {
    try {
      const [usersRes, centrosRes, preaviosRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-718703c6/admin/users`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-718703c6/centros`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-718703c6/admin/preavisos`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }),
      ]);

      const [usersData, centrosData, preaviosData] = await Promise.all([
        usersRes.json(),
        centrosRes.json(),
        preaviosRes.json(),
      ]);

      setUsers(usersData.users || []);
      setCentros(centrosData.centros || []);
      setPreavisos(preaviosData.preavisos || []);
    } catch (error) {
      console.error('Error fetching config data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      return;
    }

    if (!newUser.email.toLowerCase().endsWith('@savills.es')) {
      alert('Solo se permiten usuarios con dominio @savills.es');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/admin/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify(newUser),
        }
      );

      if (!response.ok) throw new Error('Error al crear usuario');

      await fetchData();
      setIsDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'GESTOR',
        assignedCenters: [],
      });
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al eliminar usuario');

      await fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleUpdatePreavisos = async (periodicityDays: number, field: string, value: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/admin/preavisos`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            periodicityDays,
            [field]: value,
          }),
        }
      );

      if (!response.ok) throw new Error('Error al actualizar preavisos');

      await fetchData();
    } catch (error) {
      console.error('Error updating preavisos:', error);
    }
  };

  const toggleCentroAssignment = (centroId: string) => {
    const assigned = newUser.assignedCenters.includes(centroId);
    if (assigned) {
      setNewUser({
        ...newUser,
        assignedCenters: newUser.assignedCenters.filter(id => id !== centroId),
      });
    } else {
      setNewUser({
        ...newUser,
        assignedCenters: [...newUser.assignedCenters, centroId],
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
      </div>
    );
  }

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
            <div>
              <h1 className="text-xl">Configuración</h1>
              <p className="text-sm text-white/80">Gestión del sistema</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'users' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'bg-white text-[#002A54]' : 'text-white hover:bg-white/10'}
            >
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </Button>
            <Button
              variant={activeTab === 'preavisos' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('preavisos')}
              className={activeTab === 'preavisos' ? 'bg-white text-[#002A54]' : 'text-white hover:bg-white/10'}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Preavisos
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map((systemUser) => (
              <div key={systemUser.userId} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 truncate">{systemUser.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{systemUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={systemUser.role === 'ADMIN' ? 'default' : 'outline'}>
                      {systemUser.role}
                    </Badge>
                    {systemUser.userId !== user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(systemUser.userId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {systemUser.role === 'GESTOR' && (
                  <div className="text-xs text-gray-500">
                    {systemUser.assignedCenters.length} centro(s) asignado(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'preavisos' && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Configure los días de preaviso antes del vencimiento de cada tipo de mantenimiento.
              </p>
            </div>
            {preavisos.map((preaviso) => (
              <div key={preaviso.periodicityDays} className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-gray-900 mb-3">
                  Periodicidad: {preaviso.periodicityDays} días
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preaviso.preaviso30}
                      onChange={(e) => handleUpdatePreavisos(preaviso.periodicityDays, 'preaviso30', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Aviso 30 días antes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preaviso.preaviso15}
                      onChange={(e) => handleUpdatePreavisos(preaviso.periodicityDays, 'preaviso15', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Aviso 15 días antes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preaviso.preaviso7}
                      onChange={(e) => handleUpdatePreavisos(preaviso.periodicityDays, 'preaviso7', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Aviso 7 días antes</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (only for users tab) */}
      {activeTab === 'users' && (
        <div className="fixed bottom-6 right-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full h-14 w-14 bg-[#FFCC00] hover:bg-[#E6B800] text-[#002A54] shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crear un nuevo usuario del sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@savills.es"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rol *</Label>
                  <Select value={newUser.role} onValueChange={(v: 'ADMIN' | 'GESTOR') => setNewUser({ ...newUser, role: v })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GESTOR">Gestor</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role === 'GESTOR' && (
                  <div>
                    <Label>Centros asignados</Label>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3">
                      {centros.map((centro) => (
                        <label key={centro.centerId} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newUser.assignedCenters.includes(centro.centerId)}
                            onChange={() => toggleCentroAssignment(centro.centerId)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{centro.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateUser}
                  className="flex-1 bg-[#002A54] hover:bg-[#003366] text-white"
                  disabled={saving || !newUser.email || !newUser.password || !newUser.name}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
