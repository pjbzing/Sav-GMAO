# Savills Audit - Sistema de Seguimiento Técnico-Legal

Aplicación web progresiva (PWA) para la gestión de mantenimientos técnico-legales de Centros Comerciales.

## 🚀 Características

### Funcionalidades Principales

- **Autenticación**: Login con dominio @savills.es, dos roles (ADMIN/GESTOR)
- **Auto-inicialización**: Base de datos pre-cargada automáticamente
- **Gestión de Centros**: CRUD completo de centros comerciales
- **84 Equipos Genéricos**: Plantilla completa según normativa española
- **Seguimiento Técnico-Legal**: Gestión de equipos y actuaciones con estados (FAVORABLE, DESFAVORABLE, CONDICIONADO)
- **Dashboard**: Métricas en tiempo real, grado de cumplimiento, alertas críticas
- **Gráficos Interactivos**: Visualización con Recharts (Fase 2)
- **PWA**: Instalable en dispositivos móviles (Fase 1)
- **Calendario**: Vista mensual de mantenimientos programados
- **Informes**: Exportación de informes en PDF y CSV
- **Notificaciones**: Sistema de alertas con prioridades
- **Configuración**: Gestión de usuarios, roles y parámetros de preavisos (solo ADMIN)

## ✨ Novedades v2.0

- ✅ **Auto-inicialización**: Ya NO es necesario inicializar la base de datos manualmente
- ✅ **Logo Savills**: Integrado en la pantalla de login
- ✅ **PWA Manifest**: Aplicación instalable en móviles
- ✅ **Recharts**: Gráficos interactivos preparados
- ✅ **Login Simplificado**: Interfaz limpia con credenciales prellenadas
- ✅ **Mejoras Fase 1 y 2**: Implementadas según roadmap

## 🎯 Inicio Rápido

### 1. Configurar Supabase

Crea un proyecto en [Supabase](https://supabase.com) y configura las variables de entorno:

```env
SUPABASE_URL=https://[tu-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]
SUPABASE_ANON_KEY=[tu-anon-key]
```

### 2. Abrir la Aplicación

La aplicación se auto-inicializará automáticamente al primer acceso.

### 3. Iniciar Sesión

Usa las credenciales de prueba prellenadas:

**Administrador**:
- Email: `admin@savills.es`
- Password: `Admin123!`

**Gestor**:
- Email: `gestor@savills.es`
- Password: `Gestor123!`

¡Eso es todo! La aplicación está lista para usar.

## 🏗️ Stack Tecnológico

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Server**: Hono (Edge Functions)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## 📋 Requisitos Previos

- Proyecto Supabase configurado
- Variables de entorno de Supabase conectadas

## 🔐 Credenciales de Acceso

### Usuario Administrador
```
Email: admin@savills.es
Password: Admin123!
```

### Usuario Gestor
```
Email: gestor@savills.es
Password: Gestor123!
```

## 🗄️ Modelo de Datos

### KV Store Keys

- `user:{userId}` - Datos de usuario (email, name, role, assignedCenters)
- `centro:{centerId}` - Datos de centro comercial
- `equipment:{centerId}:{equipmentId}` - Equipos y actuaciones
- `audit:{auditId}` - Logs de auditoría
- `notification:{notifId}` - Notificaciones
- `preaviso:{periodicityDays}` - Configuración de preavisos

### Estados de Actuaciones

- **PENDIENTE**: Sin revisión registrada
- **FAVORABLE**: Aprobado, nextDate actualizada automáticamente
- **DESFAVORABLE**: No apto, nextDate no se actualiza
- **CONDICIONADO**: Aprobado condicionalmente con duración personalizada

## 📊 Cálculo de Grado de Cumplimiento

```
Grado = (Nº Actuaciones FAVORABLE / Nº Total Actuaciones) × 100

Clasificación:
- 0-59%: NO APTO (Rojo)
- 60-79%: APTO CONDICIONADO (Naranja)
- 80-100%: APTO (Verde)
```

## 🔄 Lógica de Negocio

### Actualización de Estados

1. **FAVORABLE**:
   - lastDate = hoy
   - nextDate = hoy + periodicityDays
   - Documento opcional (recomendado)

2. **DESFAVORABLE**:
   - lastDate = hoy
   - nextDate NO se actualiza (queda pendiente)
   - Crea notificación de alta prioridad

3. **CONDICIONADO**:
   - lastDate = hoy
   - nextDate = hoy + condicionDuration (configurable)
   - Documento opcional

## 📱 Pantallas

1. **Login** - Autenticación con validación de dominio
2. **Home** - Menú principal con 6 opciones
3. **Centros Comerciales** - Lista de centros con grado de cumplimiento
4. **Seguimiento** - Gestión de equipos y actuaciones por centro
5. **Dashboard** - Métricas y vista general
6. **Calendario** - Vista mensual de mantenimientos
7. **Informes** - Exportación PDF/CSV y envío por email
8. **Notificaciones** - Alertas priorizadas
9. **Configuración** - Gestión de usuarios y preavisos (solo ADMIN)

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones

- **PREAVISO**: X días antes del vencimiento (configurable: 30/15/7 días)
- **VENCIDO**: Actuación vencida sin realizar
- **DESFAVORABLE**: Equipo marcado como no apto
- **SEMESTRAL**: Informes automáticos (1 mayo, 1 noviembre)
- **INFO**: Notificaciones generales del sistema

### Prioridades

- **HIGH**: Rojo - Requiere atención inmediata
- **MEDIUM**: Naranja - Atención pronto
- **LOW**: Azul - Informativa

## 📄 Exportación de Informes

### Formato PDF
- Metadatos del centro
- Tabla de equipos con estados
- Grado de cumplimiento
- Puntos críticos y recomendaciones

### Formato CSV
```csv
Centro,Equipo,Tipo Equipo,Actuación,Periodicidad,Estado,Última Revisión,Próxima Revisión
```

## 🔒 Seguridad

- **Validación de dominio**: Solo @savills.es
- **Row Level Security**: Gestores solo ven centros asignados
- **Storage privado**: Documentos con acceso controlado
- **Auditoría completa**: Logs inmutables de todos los cambios

## 🛠️ Administración

### Crear Nuevo Centro (ADMIN)
1. Ir a "Centros Comerciales"
2. Clic en botón flotante "+"
3. Completar nombre, gestor, email, director técnico
4. Importar equipos desde CSV (opcional)

### Crear Usuario (ADMIN)
1. Ir a "Configuración" → "Usuarios"
2. Clic en botón "+"
3. Email debe ser @savills.es
4. Asignar rol y centros (para GESTOR)

### Configurar Preavisos (ADMIN)
1. Ir a "Configuración" → "Preavisos"
2. Seleccionar periodicidad
3. Activar/desactivar avisos de 30/15/7 días

## 📥 Importación de Equipos (CSV)

### Formato del CSV
```csv
centerId,centerName,equipmentId,equipmentName,equipmentType,actionId,actionType,periodicityDays,lastDate,nextDate,initialStatus
```

### Ejemplo
```csv
C001,Centro Gran Plaza,EQ001,Grupo Electrógeno,GENERADOR,AC001,REVISION,180,2025-03-01,2025-08-28,FAVORABLE
```

## 🎨 Diseño UI/UX

### Colores Corporativos
- **Azul Savills**: #002A54 (primario)
- **Amarillo Savills**: #FFCC00 (secundario/acentos)
- **Blanco**: #FFFFFF (fondos)
- **Grises**: Para textos secundarios y bordes

### Iconografía
- Lucide React para consistencia
- Iconos contextuales y reconocibles
- Estados visuales con colores semáforo

## ⚠️ Nota Importante

**Figma Make no está diseñado para recopilar información personal identificable (PII) ni para asegurar datos sensibles de nivel empresarial.**

Para uso en producción con datos reales de Savills:
- Usar entorno de desarrollo completo
- Implementar medidas de seguridad corporativas
- Configurar backups y disaster recovery
- Cumplir con GDPR y normativas locales

## 🐛 Solución de Problemas

### Error de autenticación
- Verificar que el email termine en @savills.es
- Comprobar credenciales correctas
- Revisar logs del servidor

### No se sincronizan los datos
- Verificar conexión a internet
- Revisar consola del navegador
- Comprobar estado del servidor Supabase

### Documentos no se suben
- Verificar tamaño del archivo (máx. 10MB)
- Comprobar formato (PDF, JPG, PNG)
- Revisar permisos de Storage en Supabase

## 📞 Soporte

Para soporte técnico o consultas sobre la aplicación, contactar al administrador del sistema.

---

**© 2025 Savills. Todos los derechos reservados.**