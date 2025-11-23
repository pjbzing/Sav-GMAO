# 🚀 Inicio Rápido - Savills Audit

## Paso 1: Inicializar la Base de Datos

Al abrir la aplicación por primera vez, verás la pantalla de login:

1. **Haz clic en "Inicializar Base de Datos"**
   - Esto creará automáticamente:
     - 2 usuarios de prueba (admin y gestor)
     - 1 centro comercial de ejemplo
     - **84 equipos genéricos** con actuaciones según normativa española
     - Configuración de preavisos
     - Notificación de bienvenida

2. **Espera a que aparezca el mensaje de éxito** ✓
   - Las credenciales se prellenarán automáticamente
   - Este proceso puede tardar unos segundos debido a la creación de los 84 equipos

## Paso 2: Iniciar Sesión

### Como Administrador
```
Email: admin@savills.es
Password: Admin123!
```

**Permisos:** Acceso completo, gestión de usuarios, configuración del sistema

### Como Gestor
```
Email: gestor@savills.es
Password: Gestor123!
```

**Permisos:** Solo centros asignados, no puede crear usuarios ni cambiar configuración

## Paso 3: Explorar la Aplicación

### Menú Principal (6 opciones)

1. **📊 Dashboard**
   - Vista general de métricas
   - Grado de cumplimiento promedio
   - Alertas críticas
   - Próximos vencimientos

2. **🏢 Centros Comerciales**
   - Lista de centros con grado de cumplimiento
   - Crear nuevos centros (solo ADMIN)
   - Ver equipos por centro

3. **📅 Calendario**
   - Vista mensual de mantenimientos
   - Navegación por meses
   - Detalles por día

4. **📄 Informes y Comparativas**
   - Exportar PDF o CSV
   - Enviar por email
   - Filtrar por centro

5. **🔔 Notificaciones**
   - Alertas priorizadas
   - Marcar como leídas
   - Filtrar por estado

6. **⚙️ Configuración** (solo ADMIN)
   - Gestionar usuarios
   - Configurar preavisos
   - Asignar centros a gestores

## Paso 4: Gestionar Equipos y Actuaciones

### Desde Centros Comerciales

1. **Selecciona un centro** de la lista
2. Verás todos los equipos con sus actuaciones
3. **Haz clic en cualquier actuación** para actualizar su estado

### Actualizar Estado de Actuación

1. **Selecciona el estado:**
   - ✅ **FAVORABLE**: Aprobado → calcula automáticamente próxima fecha
   - ❌ **DESFAVORABLE**: No apto → la próxima fecha NO se actualiza
   - ⚠️ **CONDICIONADO**: Aprobado temporalmente → especifica duración

2. **Adjunta documento** (opcional pero recomendado)
   - Formatos: PDF, JPG, PNG
   - Máximo: 10MB

3. **Agrega comentario** (opcional)

4. **Guarda** → El sistema:
   - Actualiza fechas según reglas de negocio
   - Calcula grado de cumplimiento
   - Crea log de auditoría
   - Genera notificaciones si aplica

## Paso 5: Administración (ADMIN)

### Crear Nuevo Usuario

1. Ir a **Configuración** → pestaña **Usuarios**
2. Clic en botón flotante **+**
3. Completar:
   - Nombre completo
   - Email (@savills.es)
   - Contraseña
   - Rol (ADMIN o GESTOR)
   - Centros asignados (si es GESTOR)
4. **Crear Usuario**

### Crear Nuevo Centro

1. Ir a **Centros Comerciales**
2. Clic en botón flotante **+**
3. Completar:
   - Nombre del centro
   - Nombre del gestor
   - Email del gestor
   - Director técnico
4. **Crear Centro**

### Configurar Preavisos

1. Ir a **Configuración** → pestaña **Preavisos**
2. Para cada periodicidad (30, 90, 120, 180, 365 días):
   - ☑️ Aviso 30 días antes
   - ☑️ Aviso 15 días antes
   - ☑️ Aviso 7 días antes
3. Los cambios se guardan automáticamente

## Funcionalidades Avanzadas

### Grado de Cumplimiento

Se calcula automáticamente:
```
Grado = (Nº FAVORABLE / Nº Total) × 100

80-100% = APTO (Verde)
60-79%  = APTO CONDICIONADO (Naranja)
0-59%   = NO APTO (Rojo)
```

### Exportar Informes

**PDF:**
- Metadatos del centro
- Estado de todos los equipos
- Grado de cumplimiento
- Puntos críticos
- Recomendaciones

**CSV:**
- Tabla con todas las actuaciones
- Importable en Excel
- Útil para análisis de datos

### Calendario de Mantenimientos

- 📅 Vista mensual con mantenimientos programados
- 🔴 Días festivos/fin de semana marcados
- 🟡 Días con mantenimiento marcados
- 📋 Clic en día → ver detalles

### Sistema de Notificaciones

**Tipos:**
- 🔔 **PREAVISO**: X días antes del vencimiento
- ⏰ **VENCIDO**: Actuación vencida
- ⚠️ **DESFAVORABLE**: Equipo no apto
- 📧 **SEMESTRAL**: Informes automáticos
- ℹ️ **INFO**: Generales

**Prioridades:**
- 🔴 **HIGH**: Requiere atención inmediata
- 🟠 **MEDIUM**: Atención pronto
- 🔵 **LOW**: Informativa

## Consejos y Mejores Prácticas

### ✅ Recomendaciones

1. **Adjuntar documentos** al marcar actuaciones como FAVORABLE
2. **Revisar Dashboard** regularmente para detectar alertas
3. **Exportar informes** mensualmente para auditoría
4. **Configurar preavisos** según necesidades de cada periodicidad
5. **Marcar notificaciones** como leídas para mantener orden

### ⚠️ Importante

- Solo usuarios **@savills.es** pueden acceder
- **GESTOR** solo ve centros asignados
- **DESFAVORABLE** no actualiza fecha → requiere nueva revisión
- Los **documentos** se guardan en almacenamiento privado
- Todos los cambios quedan registrados en **auditoría**

### 🔒 Seguridad

- Las sesiones persisten entre visitas
- Los datos están protegidos por Row Level Security
- Solo el creador o ADMIN pueden modificar registros
- Los documentos requieren autenticación para acceder

## Soporte

### Problemas Comunes

**"Error de autenticación"**
→ Verifica que el email termine en @savills.es

**"No autorizado para este centro"**
→ GESTOR: solo puedes acceder a centros asignados

**"No se suben documentos"**
→ Verifica tamaño (máx 10MB) y formato (PDF/JPG/PNG)

**"No aparecen datos"**
→ Asegúrate de haber ejecutado "Inicializar Base de Datos"

### Logs del Sistema

Abre la **Consola del Navegador** (F12) para ver logs detallados de errores.

---

## 🎯 Próximos Pasos

1. ✅ Inicializa la base de datos
2. ✅ Inicia sesión como admin
3. ✅ Explora el Dashboard
4. ✅ Revisa el centro de ejemplo
5. ✅ Actualiza una actuación
6. ✅ Crea un nuevo usuario gestor
7. ✅ Exporta un informe

**¡Listo para gestionar tus mantenimientos técnico-legales!** 🚀

---

**© 2025 Savills. Sistema de Seguimiento Técnico-Legal**