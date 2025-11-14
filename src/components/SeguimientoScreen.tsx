import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Upload, FileText, Loader2, Calendar, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import type { User, Centro, Equipment, Action } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SeguimientoScreenProps {
  user: User;
  centro: Centro;
  onBack: () => void;
}

export function SeguimientoScreen({ user, centro, onBack }: SeguimientoScreenProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<{
    equipment: Equipment;
    action: Action;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'FAVORABLE' | 'DESFAVORABLE' | 'CONDICIONADO'>('FAVORABLE');
  const [condicionDuration, setCondicionDuration] = useState('90');
  const [comentario, setComentario] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEquipments();
  }, [centro.centerId]);

  const fetchEquipments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/equipments?centerId=${centro.centerId}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar equipos');

      const data = await response.json();
      setEquipments(data.equipments || []);
    } catch (error) {
      console.error('Error fetching equipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (equipment: Equipment, action: Action) => {
    setSelectedAction({ equipment, action });
    setNewStatus('FAVORABLE');
    setCondicionDuration('90');
    setComentario('');
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAction) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('centerId', centro.centerId);
      formData.append('equipmentId', selectedAction.equipment.equipmentId);
      formData.append('actionId', selectedAction.action.actionId);
      formData.append('status', newStatus);
      formData.append('comentario', comentario);
      
      if (newStatus === 'CONDICIONADO') {
        formData.append('condicionDuration', condicionDuration);
      }
      
      if (selectedFile) {
        formData.append('document', selectedFile);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/equipments/update-status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Error al actualizar estado');

      await fetchEquipments();
      setDialogOpen(false);
      setSelectedAction(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FAVORABLE':
        return 'bg-green-500';
      case 'DESFAVORABLE':
        return 'bg-red-500';
      case 'CONDICIONADO':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FAVORABLE':
        return CheckCircle;
      case 'DESFAVORABLE':
        return XCircle;
      case 'CONDICIONADO':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REVISION: 'Revisión',
      ANALITICA: 'Analítica',
      CERT_LD: 'Cert. L+D',
      TERMOGRAFICO: 'Termográfico',
      OCA: 'OCA',
      RETIMBRADO: 'Retimbrado',
      ACTA_INICIAL: 'Acta Inicial',
      CERT_FAVORABLE: 'Cert. Favorable',
      RENOVACION: 'Renovación',
      ACTUACION: 'Actuación',
    };
    return labels[type] || type;
  };

  const isOverdue = (nextDate: string | null) => {
    if (!nextDate) return false;
    return new Date(nextDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const totalActions = equipments.reduce((sum, eq) => sum + eq.actions.length, 0);
  const favorableCount = equipments.reduce(
    (sum, eq) => sum + eq.actions.filter(a => a.status === 'FAVORABLE').length,
    0
  );
  const cumplimiento = totalActions > 0 ? (favorableCount / totalActions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#002A54] text-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl truncate">{centro.name}</h1>
              <p className="text-sm text-white/80">Seguimiento Técnico-Legal</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-xs text-white/80">Total</p>
              <p className="text-lg">{totalActions}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-xs text-white/80">Favorables</p>
              <p className="text-lg">{favorableCount}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-xs text-white/80">Cumplimiento</p>
              <p className="text-lg">{cumplimiento.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay equipos registrados</p>
            <p className="text-sm text-gray-500 mt-2">
              Los equipos pueden ser importados desde un CSV
            </p>
          </div>
        ) : (
          equipments.map((equipment) => (
            <div key={equipment.equipmentId} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-gray-900">{equipment.name}</h3>
                <p className="text-sm text-gray-600">{equipment.type}</p>
              </div>
              <div className="divide-y">
                {equipment.actions.map((action) => {
                  const StatusIcon = getStatusIcon(action.status);
                  const overdue = isOverdue(action.nextDate);

                  return (
                    <div
                      key={action.actionId}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOpenDialog(equipment, action)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${getStatusColor(action.status)} rounded-full p-1.5 text-white`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900">
                              {getActionTypeLabel(action.type)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {action.periodicityDays}d
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-500">Última:</span> {formatDate(action.lastDate)}
                            </div>
                            <div className={overdue ? 'text-red-600' : ''}>
                              <span className="text-gray-500">Próxima:</span> {formatDate(action.nextDate)}
                            </div>
                          </div>
                          {action.docs.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                              <FileText className="h-3 w-3" />
                              {action.docs.length} documento(s)
                            </div>
                          )}
                        </div>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Status Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Estado</DialogTitle>
            <DialogDescription>
              {selectedAction && (
                <>
                  {selectedAction.equipment.name} - {getActionTypeLabel(selectedAction.action.type)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="status">Nuevo Estado *</Label>
                <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAVORABLE">✓ Favorable</SelectItem>
                    <SelectItem value="DESFAVORABLE">✗ Desfavorable</SelectItem>
                    <SelectItem value="CONDICIONADO">⚠ Condicionado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === 'CONDICIONADO' && (
                <div>
                  <Label htmlFor="duration">Duración condición (días)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={condicionDuration}
                    onChange={(e) => setCondicionDuration(e.target.value)}
                    placeholder="90"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="comentario">Comentario</Label>
                <Textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="document">Documento (opcional)</Label>
                <div className="mt-1">
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG o PNG. Máximo 10MB.
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateStatus}
              className="flex-1 bg-[#002A54] hover:bg-[#003366] text-white"
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Actualizar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}