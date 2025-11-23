import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { User } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import logoSavills from 'figma:asset/f3db017007851c6d0487982fbce88c2ae225c294.png';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('admin@savills.es');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      if (data.user) {
        onLogin(data.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión. Por favor, verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002A54] to-[#004080] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoSavills} alt="Savills" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl text-white">Savills Audit</h1>
          <p className="text-white/80 mt-2">Sistema de Gestión Técnico-Legal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl text-[#002A54] mb-6">Iniciar Sesión</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@savills.es"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002A54] hover:bg-[#003666] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-700">
              <strong>Credenciales de prueba:</strong>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Admin:</strong> admin@savills.es / Admin123!
            </p>
            <p className="text-sm text-gray-600">
              <strong>Gestor:</strong> gestor@savills.es / Gestor123!
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          © 2025 Savills. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}