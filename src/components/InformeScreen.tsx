import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Loader2, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import type { User, Centro } from '../App';
import { projectId } from '../utils/supabase/info';

interface InformeScreenProps {
  user: User;
  onBack: () => void;
}

export function InformeScreen({ user, onBack }: InformeScreenProps) {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [selectedCentro, setSelectedCentro] = useState<string>('all');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCentros();
  }, []);

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

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/reports/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            centroId: selectedCentro === 'all' ? null : selectedCentro,
            format,
          }),
        }
      );

      if (!response.ok) throw new Error('Error al generar informe');

      const data = await response.json();

      // Download the file
      if (data.url) {
        window.open(data.url, '_blank');
      } else if (data.content) {
        // For CSV, create a download link
        const blob = new Blob([data.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe_${selectedCentro}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el informe');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipient || !emailRecipient.includes('@')) {
      alert('Por favor ingrese un email válido');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/reports/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            centroId: selectedCentro === 'all' ? null : selectedCentro,
            format,
            recipient: emailRecipient,
          }),
        }
      );

      if (!response.ok) throw new Error('Error al enviar informe');

      alert('Informe enviado correctamente');
      setEmailRecipient('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar el informe por email');
    } finally {
      setSending(false);
    }
  };

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
              <h1 className="text-xl">Informes y Comparativas</h1>
              <p className="text-sm text-white/80">Exportar informes en PDF y CSV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
          </div>
        ) : (
          <>
            {/* Configuration Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div>
                <Label htmlFor="centro">Centro Comercial</Label>
                <Select value={selectedCentro} onValueChange={setSelectedCentro}>
                  <SelectTrigger id="centro" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los centros</SelectItem>
                    {centros.map((centro) => (
                      <SelectItem key={centro.centerId} value={centro.centerId}>
                        {centro.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format">Formato</Label>
                <Select value={format} onValueChange={(v: 'pdf' | 'csv') => setFormat(v)}>
                  <SelectTrigger id="format" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleDownload}
                disabled={generating}
                className="w-full bg-[#002A54] hover:bg-[#003366] text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando informe...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Informe
                  </>
                )}
              </Button>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div>
                <h3 className="text-gray-900 mb-2">Enviar por Email</h3>
                <p className="text-sm text-gray-600 mb-4">
                  El informe se enviará automáticamente al destinatario
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email destinatario</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="destinatario@savills.es"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={sending || !emailRecipient}
                variant="outline"
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por Email
                  </>
                )}
              </Button>
            </div>

            {/* Information Card */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm text-blue-900 mb-1">Contenido del informe</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Metadatos del centro y fecha de generación</li>
                    <li>• Estado de todos los equipos y actuaciones</li>
                    <li>• Grado de cumplimiento calculado</li>
                    <li>• Lista de puntos críticos y recomendaciones</li>
                    <li>• Enlaces a documentos adjuntos (PDF)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Template Info */}
            {user.role === 'ADMIN' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-gray-900 mb-2">Informes automáticos</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Se generan automáticamente informes semestrales los días:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Primer semestre:</span>
                    <span className="text-[#002A54]">1 de Mayo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Segundo semestre:</span>
                    <span className="text-[#002A54]">1 de Noviembre</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
