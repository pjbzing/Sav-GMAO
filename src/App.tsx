import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { CentrosScreen } from './components/CentrosScreen';
import { SeguimientoScreen } from './components/SeguimientoScreen';
import { CalendarioScreen } from './components/CalendarioScreen';
import { InformeScreen } from './components/InformeScreen';
import { NotificacionesScreen } from './components/NotificacionesScreen';
import { ConfiguracionScreen } from './components/ConfiguracionScreen';
import { DashboardScreen } from './components/DashboardScreen';

type Screen = 
  | 'login' 
  | 'home' 
  | 'centros' 
  | 'seguimiento' 
  | 'calendario' 
  | 'informe' 
  | 'notificaciones' 
  | 'configuracion'
  | 'dashboard';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'GESTOR';
  assignedCenters: string[];
  accessToken: string;
}

export interface Centro {
  centerId: string;
  name: string;
  managerName: string;
  managerEmail: string[];
  technicalDirector: string;
  createdAt: string;
  assignedManagers: string[];
  teamItems: number;
  cumplimiento?: number;
}

export interface Action {
  actionId: string;
  type: 'REVISION' | 'ANALITICA' | 'CERT_LD' | 'TERMOGRAFICO' | 'OCA';
  periodicityDays: number;
  lastDate: string | null;
  nextDate: string | null;
  status: 'FAVORABLE' | 'DESFAVORABLE' | 'CONDICIONADO' | 'PENDIENTE';
  docs: {
    storagePath: string;
    uploadedBy: string;
    uploadedAt: string;
    fileName: string;
  }[];
  condicionDuration?: number;
}

export interface Equipment {
  equipmentId: string;
  centerId: string;
  name: string;
  type: string;
  actions: Action[];
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedCentro, setSelectedCentro] = useState<Centro | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('savills_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setCurrentScreen('home');
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('savills_user', JSON.stringify(loggedInUser));
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('savills_user');
    setCurrentScreen('login');
    setSelectedCentro(null);
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleSelectCentro = (centro: Centro) => {
    setSelectedCentro(centro);
    setCurrentScreen('seguimiento');
  };

  const handleBack = () => {
    if (currentScreen === 'seguimiento' || currentScreen === 'dashboard') {
      setCurrentScreen('home');
      setSelectedCentro(null);
    } else {
      setCurrentScreen('home');
    }
  };

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      {currentScreen === 'home' && (
        <HomeScreen 
          user={user} 
          onNavigate={navigateTo}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'centros' && (
        <CentrosScreen 
          user={user}
          onBack={handleBack}
          onSelectCentro={handleSelectCentro}
        />
      )}
      {currentScreen === 'seguimiento' && selectedCentro && (
        <SeguimientoScreen
          user={user}
          centro={selectedCentro}
          onBack={handleBack}
        />
      )}
      {currentScreen === 'calendario' && (
        <CalendarioScreen
          user={user}
          onBack={handleBack}
        />
      )}
      {currentScreen === 'informe' && (
        <InformeScreen
          user={user}
          onBack={handleBack}
        />
      )}
      {currentScreen === 'notificaciones' && (
        <NotificacionesScreen
          user={user}
          onBack={handleBack}
        />
      )}
      {currentScreen === 'configuracion' && (
        <ConfiguracionScreen
          user={user}
          onBack={handleBack}
        />
      )}
      {currentScreen === 'dashboard' && (
        <DashboardScreen
          user={user}
          onBack={handleBack}
        />
      )}
    </>
  );
}
