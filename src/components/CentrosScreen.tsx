import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Plus, Search, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { User, Centro } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CentrosScreenProps {
  user: User;
  onBack: () => void;
  onSelectCentro: (centro: Centro) => void;
}

export function CentrosScreen({ user, onBack, onSelectCentro }: CentrosScreenProps) {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [filteredCentros, setFilteredCentros] = useState<Centro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCentro, setNewCentro] = useState({
    name: '',
    managerName: '',
    managerEmail: '',
    technicalDirector: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCentros();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = centros.filter(centro =>
        centro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        centro.managerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCentros(filtered);
    } else {
      setFilteredCentros(centros);
    }
  }, [searchQuery, centros]);

  const fetchCentros = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/centros`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar centros');

      const data = await response.json();
      setCentros(data.centros || []);
    } catch (error) {
      console.error('Error fetching centros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCentro = async () => {
    if (!newCentro.name || !newCentro.managerName || !newCentro.managerEmail) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/centros`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            name: newCentro.name,
            managerName: newCentro.managerName,
            managerEmail: [newCentro.managerEmail],
            technicalDirector: newCentro.technicalDirector,
          }),
        }
      );

      if (!response.ok) throw new Error('Error al crear centro');

      await fetchCentros();
      setIsDialogOpen(false);
      setNewCentro({ name: '', managerName: '', managerEmail: '', technicalDirector: '' });
    } catch (error) {
      console.error('Error creating centro:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCumplimientoColor = (cumplimiento?: number) => {
    if (!cumplimiento && cumplimiento !== 0) return 'text-gray-400';
    if (cumplimiento >= 80) return 'text-green-500';
    if (cumplimiento >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCumplimientoIcon = (cumplimiento?: number) => {
    if (!cumplimiento && cumplimiento !== 0) return AlertCircle;
    if (cumplimiento >= 80) return CheckCircle;
    if (cumplimiento >= 60) return AlertTriangle;
    return AlertCircle;
  };

  const getCumplimientoLabel = (cumplimiento?: number) => {
    if (!cumplimiento && cumplimiento !== 0) return 'Sin datos';
    if (cumplimiento >= 80) return 'APTO';
    if (cumplimiento >= 60) return 'APTO CONDICIONADO';
    return 'NO APTO';
  };

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
              <h1 className="text-xl">Centros Comerciales</h1>
              <p className="text-sm text-white/80">
                {filteredCentros.length} {filteredCentros.length === 1 ? 'centro' : 'centros'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar centros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
          </div>
        ) : filteredCentros.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery ? 'No se encontraron centros' : 'No hay centros registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCentros.map((centro) => {
              const CumplimientoIcon = getCumplimientoIcon(centro.cumplimiento);
              
              return (
                <button
                  key={centro.centerId}
                  onClick={() => onSelectCentro(centro)}
                  className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-[#002A54] rounded-lg p-2 text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 truncate">{centro.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{centro.managerName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {centro.teamItems || 0} equipos
                        </Badge>
                        {centro.cumplimiento !== undefined && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getCumplimientoColor(centro.cumplimiento)}`}
                          >
                            <CumplimientoIcon className="h-3 w-3 mr-1" />
                            {getCumplimientoLabel(centro.cumplimiento)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {centro.cumplimiento !== undefined && (
                      <div className="text-right">
                        <div className={`text-2xl ${getCumplimientoColor(centro.cumplimiento)}`}>
                          {centro.cumplimiento.toFixed(0)}%
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3" />
                          Cumplimiento
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {user.role === 'ADMIN' && (
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Centro Comercial</DialogTitle>
                <DialogDescription>
                  Crear un nuevo centro para gestionar sus equipos y mantenimientos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nombre del centro *</Label>
                  <Input
                    id="name"
                    value={newCentro.name}
                    onChange={(e) => setNewCentro({ ...newCentro, name: e.target.value })}
                    placeholder="Centro Gran Plaza"
                  />
                </div>
                <div>
                  <Label htmlFor="managerName">Nombre del gestor *</Label>
                  <Input
                    id="managerName"
                    value={newCentro.managerName}
                    onChange={(e) => setNewCentro({ ...newCentro, managerName: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="managerEmail">Email del gestor *</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={newCentro.managerEmail}
                    onChange={(e) => setNewCentro({ ...newCentro, managerEmail: e.target.value })}
                    placeholder="gestor@savills.es"
                  />
                </div>
                <div>
                  <Label htmlFor="technicalDirector">Director técnico</Label>
                  <Input
                    id="technicalDirector"
                    value={newCentro.technicalDirector}
                    onChange={(e) => setNewCentro({ ...newCentro, technicalDirector: e.target.value })}
                    placeholder="María García"
                  />
                </div>
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
                  onClick={handleCreateCentro}
                  className="flex-1 bg-[#002A54] hover:bg-[#003366] text-white"
                  disabled={saving || !newCentro.name || !newCentro.managerName || !newCentro.managerEmail}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Centro'
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
