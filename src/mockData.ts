// src/mockData.ts
import { Centro, Equipment } from './App'; 

export const MOCK_CENTROS: Centro[] = [
  {
    centerId: 'c1',
    name: 'Centro Comercial Gran Vía',
    managerName: 'Carlos Director',
    managerEmail: ['carlos@savills.com'],
    technicalDirector: 'Ana Técnica',
    createdAt: '2023-01-15',
    assignedManagers: ['test-id-123'],
    teamItems: 12,
    cumplimiento: 85 // 85%
  },
  {
    centerId: 'c2',
    name: 'Torre Norte Oficinas',
    managerName: 'Laura Gerente',
    managerEmail: ['laura@savills.com'],
    technicalDirector: 'Pedro Ingeniero',
    createdAt: '2022-11-20',
    assignedManagers: ['test-id-123'],
    teamItems: 45,
    cumplimiento: 40 // 40% (Para probar alertas rojas)
  },
  {
    centerId: 'c3',
    name: 'Parque Logístico Sur',
    managerName: 'Miguel Operaciones',
    managerEmail: ['miguel@savills.com'],
    technicalDirector: 'Sofia Mantenimiento',
    createdAt: '2023-05-10',
    assignedManagers: ['otro-gestor'],
    teamItems: 8,
    cumplimiento: 100
  }
];

// Datos para la pantalla de Seguimiento (Equipos del Centro 1)
export const MOCK_EQUIPOS_C1: Equipment[] = [
  {
    equipmentId: 'eq1',
    centerId: 'c1',
    name: 'Ascensor Principal A',
    type: 'Transporte Vertical',
    actions: [
      {
        actionId: 'act1',
        type: 'REVISION',
        periodicityDays: 30,
        lastDate: '2023-10-01',
        nextDate: '2023-11-01',
        status: 'FAVORABLE',
        docs: [],
        condicionDuration: 0
      },
      {
        actionId: 'act2',
        type: 'OCA',
        periodicityDays: 1460, // 4 años
        lastDate: '2020-01-15',
        nextDate: '2024-01-15',
        status: 'PENDIENTE',
        docs: [],
      }
    ]
  },
  {
    equipmentId: 'eq2',
    centerId: 'c1',
    name: 'Caldera Baja Temperatura',
    type: 'Climatización',
    actions: [
      {
        actionId: 'act3',
        type: 'ANALITICA',
        periodicityDays: 365,
        lastDate: '2023-05-20',
        nextDate: '2024-05-20',
        status: 'DESFAVORABLE', // Para probar colores de error
        docs: [],
      }
    ]
  }
];