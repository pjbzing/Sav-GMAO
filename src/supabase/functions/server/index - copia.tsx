import { Hono } from 'npm:hono@4.6.14';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { EQUIPOS_GENERICOS, periodicidadADias } from './equipos-genericos.tsx';

const app = new Hono();

// ==== FIX CORS PARA SUPABASE EDGE FUNCTIONS ====

app.options('*', async (c) => {
  return c.text('ok', 204, {
    "Access-Control-Allow-Origin": "https://sav-gmao-j6f9.vercel.app",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Max-Age": "86400",
  });
});

// Middleware general para TODAS las rutas
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "https://sav-gmao-j6f9.vercel.app");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");
});

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Auto-initialize database on first request
let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  
  try {
    // Check if data exists
    const users = await kv.getByPrefix('user:');
    
    if (users.length === 0) {
      console.log('🔄 Auto-initializing database...');
      await initializeDatabase();
      isInitialized = true;
      console.log('✅ Database auto-initialized successfully');
    } else {
      isInitialized = true;
      console.log('✅ Database already initialized');
    }
  } catch (error) {
    console.error('❌ Auto-initialization error:', error);
  }
}

async function initializeDatabase() {
  // 1. Create admin user
  const adminEmail = 'admin@savills.es';
  const adminPassword = 'Admin123!';
  
  const { data: adminAuth } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    user_metadata: { name: 'Administrador' },
    email_confirm: true,
  });

  if (adminAuth.user) {
    const adminUser = {
      userId: adminAuth.user.id,
      email: adminEmail,
      name: 'Administrador',
      role: 'ADMIN',
      assignedCenters: [],
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:${adminAuth.user.id}`, adminUser);
  }

  // 2. Create gestor user
  const gestorEmail = 'gestor@savills.es';
  const gestorPassword = 'Gestor123!';
  
  const { data: gestorAuth } = await supabase.auth.admin.createUser({
    email: gestorEmail,
    password: gestorPassword,
    user_metadata: { name: 'Gestor Principal' },
    email_confirm: true,
  });

  let gestorUserId = '';
  if (gestorAuth.user) {
    gestorUserId = gestorAuth.user.id;
    const gestorUser = {
      userId: gestorAuth.user.id,
      email: gestorEmail,
      name: 'Gestor Principal',
      role: 'GESTOR',
      assignedCenters: [],
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:${gestorAuth.user.id}`, gestorUser);
  }

  // 3. Create sample center
  const centerId = generateId('CTR');
  const centro = {
    centerId,
    name: 'Centro Comercial Gran Plaza',
    location: 'Madrid',
    cumplimiento: 0,
    totalEquipments: 0,
    createdAt: new Date().toISOString(),
  };
  await kv.set(`centro:${centerId}`, centro);

  // Assign center to gestor
  if (gestorUserId) {
    const gestorUser = await kv.get(`user:${gestorUserId}`);
    if (gestorUser) {
      gestorUser.assignedCenters = [centerId];
      await kv.set(`user:${gestorUserId}`, gestorUser);
    }
  }

  // 4. Create 84 generic equipments
  const equipmentsBySection = new Map<string, any[]>();
  
  for (const equipoGen of EQUIPOS_GENERICOS) {
    const key = `${equipoGen.seccion}_${equipoGen.subseccion}_${equipoGen.instalacion}`;
    if (!equipmentsBySection.has(key)) {
      equipmentsBySection.set(key, []);
    }
    equipmentsBySection.get(key)!.push(equipoGen);
  }
  
  for (const [key, equipos] of equipmentsBySection) {
    const firstEquipo = equipos[0];
    const equipmentId = generateId('EQ');
    
    const equipment = {
      equipmentId,
      centerId,
      name: firstEquipo.nombre,
      type: firstEquipo.instalacion,
      seccion: firstEquipo.seccion,
      subseccion: firstEquipo.subseccion,
      actions: equipos.map(eq => ({
        actionId: generateId('AC'),
        type: eq.tipo,
        periodicityDays: periodicidadADias(eq.periodicidad),
        periodicidadOriginal: eq.periodicidad,
        lastDate: null,
        nextDate: null,
        status: 'PENDIENTE',
        docs: [],
      })),
    };
    
    await kv.set(`equipment:${centerId}:${equipmentId}`, equipment);
  }

  // 5. Create default preavisos
  const periodicities = [1, 30, 90, 180, 365, 730, 1095, 1460, 1825, 3650, 5475];
  for (const days of periodicities) {
    await kv.set(`preaviso:${days}`, {
      periodicityDays: days,
      preaviso30: true,
      preaviso15: true,
      preaviso7: true,
      preaviso1: true,
    });
  }

  // 6. Create welcome notification
  const notifId = generateId('NOT');
  await kv.set(`notification:${notifId}`, {
    notificationId: notifId,
    title: '¡Bienvenido a Savills Audit!',
    message: 'Sistema de gestión técnico-legal inicializado correctamente.',
    type: 'INFO',
    priority: 'LOW',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Update centro with equipment count
  const allEquipments = await kv.getByPrefix(`equipment:${centerId}:`);
  centro.totalEquipments = allEquipments.length;
  await kv.set(`centro:${centerId}`, centro);
}

// Middleware to ensure initialization
app.use('/make-server-718703c6/*', async (c, next) => {
  await ensureInitialized();
  await next();
});

// Helper: Generate UUID
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

// Helper: Verify user auth
async function verifyUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get user data from KV
  const userData = await kv.get(`user:${user.id}`);
  if (!userData) return null;

  return { ...userData, id: user.id, accessToken: token };
}

// ============ AUTH ROUTES ============

app.post('/make-server-718703c6/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validate @savills.es domain
    if (!email.toLowerCase().endsWith('@savills.es')) {
      return c.json({ error: 'Solo usuarios @savills.es pueden acceder' }, 403);
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth error:', error);
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    if (!data.user || !data.session) {
      return c.json({ error: 'Error de autenticación' }, 401);
    }

    // Get or create user in KV
    let userData = await kv.get(`user:${data.user.id}`);
    
    if (!userData) {
      // First time login - create user record
      userData = {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        role: 'GESTOR',
        assignedCenters: [],
      };
      await kv.set(`user:${data.user.id}`, userData);
    }

    return c.json({
      user: {
        id: data.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        assignedCenters: userData.assignedCenters,
        accessToken: data.session.access_token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Error al iniciar sesión' }, 500);
  }
});

// ============ CENTROS ROUTES ============

app.get('/make-server-718703c6/centros', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    // Get all centros
    const allCentros = await kv.getByPrefix('centro:');
    
    // Filter by assigned centers for GESTOR role
    let centros = allCentros;
    if (user.role === 'GESTOR') {
      centros = allCentros.filter((centro: any) => 
        user.assignedCenters.includes(centro.centerId)
      );
    }

    // Calculate cumplimiento for each centro
    for (const centro of centros) {
      const equipments = await kv.getByPrefix(`equipment:${centro.centerId}:`);
      let totalActions = 0;
      let favorableCount = 0;

      for (const equipment of equipments) {
        totalActions += equipment.actions.length;
        favorableCount += equipment.actions.filter((a: any) => a.status === 'FAVORABLE').length;
      }

      centro.cumplimiento = totalActions > 0 ? (favorableCount / totalActions) * 100 : 0;
      centro.teamItems = equipments.length;
    }

    return c.json({ centros });
  } catch (error) {
    console.error('Error fetching centros:', error);
    return c.json({ error: 'Error al cargar centros' }, 500);
  }
});

app.post('/make-server-718703c6/centros', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user || user.role !== 'ADMIN') {
      return c.json({ error: 'No autorizado' }, 403);
    }

    const { name, managerName, managerEmail, technicalDirector } = await c.req.json();

    const centro = {
      centerId: generateId('C'),
      name,
      managerName,
      managerEmail: Array.isArray(managerEmail) ? managerEmail : [managerEmail],
      technicalDirector: technicalDirector || '',
      createdAt: new Date().toISOString(),
      assignedManagers: [],
      teamItems: 0,
    };

    await kv.set(`centro:${centro.centerId}`, centro);

    return c.json({ centro });
  } catch (error) {
    console.error('Error creating centro:', error);
    return c.json({ error: 'Error al crear centro' }, 500);
  }
});

// ============ EQUIPMENTS ROUTES ============

app.get('/make-server-718703c6/equipments', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const centerId = c.req.query('centerId');
    if (!centerId) {
      return c.json({ error: 'centerId requerido' }, 400);
    }

    // Check access
    if (user.role === 'GESTOR' && !user.assignedCenters.includes(centerId)) {
      return c.json({ error: 'No autorizado para este centro' }, 403);
    }

    const equipments = await kv.getByPrefix(`equipment:${centerId}:`);

    return c.json({ equipments });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return c.json({ error: 'Error al cargar equipos' }, 500);
  }
});

app.post('/make-server-718703c6/equipments/update-status', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const formData = await c.req.formData();
    const centerId = formData.get('centerId') as string;
    const equipmentId = formData.get('equipmentId') as string;
    const actionId = formData.get('actionId') as string;
    const status = formData.get('status') as string;
    const comentario = formData.get('comentario') as string;
    const condicionDuration = formData.get('condicionDuration') as string;

    // Check access
    if (user.role === 'GESTOR' && !user.assignedCenters.includes(centerId)) {
      return c.json({ error: 'No autorizado para este centro' }, 403);
    }

    // Get equipment
    const equipment = await kv.get(`equipment:${centerId}:${equipmentId}`);
    if (!equipment) {
      return c.json({ error: 'Equipo no encontrado' }, 404);
    }

    // Find action
    const action = equipment.actions.find((a: any) => a.actionId === actionId);
    if (!action) {
      return c.json({ error: 'Actuación no encontrada' }, 404);
    }

    // Update status based on business rules
    const today = new Date().toISOString().split('T')[0];
    action.lastDate = today;
    action.status = status;

    if (status === 'FAVORABLE') {
      // Calculate next date based on periodicity
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + action.periodicityDays);
      action.nextDate = nextDate.toISOString().split('T')[0];
    } else if (status === 'DESFAVORABLE') {
      // Don't update nextDate for DESFAVORABLE
      // Keep it as is (pending)
    } else if (status === 'CONDICIONADO') {
      // Calculate next date based on condicion duration
      const duration = parseInt(condicionDuration) || 90;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + duration);
      action.nextDate = nextDate.toISOString().split('T')[0];
      action.condicionDuration = duration;
    }

    // Handle document upload
    const document = formData.get('document') as File;
    if (document) {
      // Upload to Supabase Storage
      const fileName = `${centerId}/${equipmentId}/${actionId}/${Date.now()}_${document.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('make-718703c6-documents')
        .upload(fileName, document);

      if (!uploadError && uploadData) {
        action.docs = action.docs || [];
        action.docs.push({
          storagePath: uploadData.path,
          uploadedBy: user.id,
          uploadedAt: new Date().toISOString(),
          fileName: document.name,
        });
      }
    }

    // Save equipment
    await kv.set(`equipment:${centerId}:${equipmentId}`, equipment);

    // Create audit log
    const audit = {
      auditId: generateId('AUD'),
      userId: user.id,
      userName: user.name,
      centerId,
      equipmentId,
      actionId,
      timestamp: new Date().toISOString(),
      changes: {
        status,
        lastDate: action.lastDate,
        nextDate: action.nextDate,
        comentario,
      },
    };
    await kv.set(`audit:${audit.auditId}`, audit);

    // Create notification if DESFAVORABLE
    if (status === 'DESFAVORABLE') {
      const notification = {
        notifId: generateId('NOTIF'),
        userId: user.id,
        type: 'DESFAVORABLE',
        title: 'Equipo No Apto',
        message: `${equipment.name} - ${action.type} marcado como DESFAVORABLE`,
        centroName: centerId,
        equipmentName: equipment.name,
        actionType: action.type,
        priority: 'HIGH',
        read: false,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`notification:${notification.notifId}`, notification);
    }

    return c.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating status:', error);
    return c.json({ error: 'Error al actualizar estado' }, 500);
  }
});

// ============ DASHBOARD ROUTE ============

app.get('/make-server-718703c6/dashboard', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const allCentros = await kv.getByPrefix('centro:');
    const centros = user.role === 'ADMIN' ? allCentros : allCentros.filter((c: any) => 
      user.assignedCenters.includes(c.centerId)
    );

    let totalEquipments = 0;
    let totalActions = 0;
    let favorableCount = 0;
    let desfavorableCount = 0;
    let condicionadoCount = 0;
    let pendienteCount = 0;
    let overdueCount = 0;
    const proximosVencimientos: any[] = [];

    const today = new Date();

    for (const centro of centros) {
      const equipments = await kv.getByPrefix(`equipment:${centro.centerId}:`);
      totalEquipments += equipments.length;

      for (const equipment of equipments) {
        totalActions += equipment.actions.length;

        for (const action of equipment.actions) {
          if (action.status === 'FAVORABLE') favorableCount++;
          else if (action.status === 'DESFAVORABLE') desfavorableCount++;
          else if (action.status === 'CONDICIONADO') condicionadoCount++;
          else pendienteCount++;

          // Check if overdue
          if (action.nextDate) {
            const nextDate = new Date(action.nextDate);
            if (nextDate < today) {
              overdueCount++;
            }

            // Add to upcoming if within 30 days
            const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntil >= 0 && daysUntil <= 30) {
              proximosVencimientos.push({
                centroName: centro.name,
                equipmentName: equipment.name,
                actionType: action.type,
                nextDate: action.nextDate,
                daysUntil,
              });
            }
          }
        }
      }
    }

    // Sort upcoming by date
    proximosVencimientos.sort((a, b) => a.daysUntil - b.daysUntil);

    // Calculate centros por estado
    const centrosConCumplimiento = centros.map((centro: any) => {
      let centroTotal = 0;
      let centroFavorable = 0;

      const equipments = kv.getByPrefix(`equipment:${centro.centerId}:`);
      Promise.all([equipments]).then(([eqs]) => {
        for (const eq of eqs) {
          centroTotal += eq.actions.length;
          centroFavorable += eq.actions.filter((a: any) => a.status === 'FAVORABLE').length;
        }
      });

      const cumplimiento = centroTotal > 0 ? (centroFavorable / centroTotal) * 100 : 0;
      return cumplimiento;
    });

    const aptos = centrosConCumplimiento.filter((c: number) => c >= 80).length;
    const condicionados = centrosConCumplimiento.filter((c: number) => c >= 60 && c < 80).length;
    const noAptos = centrosConCumplimiento.filter((c: number) => c < 60).length;

    const cumplimientoPromedio = totalActions > 0 ? (favorableCount / totalActions) * 100 : 0;

    return c.json({
      totalCentros: centros.length,
      totalEquipments,
      totalActions,
      favorableCount,
      desfavorableCount,
      condicionadoCount,
      pendienteCount,
      overdueCount,
      cumplimientoPromedio,
      centrosPorEstado: {
        aptos,
        condicionados,
        noAptos,
      },
      proximosVencimientos: proximosVencimientos.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return c.json({ error: 'Error al cargar dashboard' }, 500);
  }
});

// ============ CALENDAR ROUTE ============

app.get('/make-server-718703c6/calendar', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());

    const allCentros = await kv.getByPrefix('centro:');
    const centros = user.role === 'ADMIN' ? allCentros : allCentros.filter((c: any) => 
      user.assignedCenters.includes(c.centerId)
    );

    const events: Record<string, any[]> = {};

    for (const centro of centros) {
      const equipments = await kv.getByPrefix(`equipment:${centro.centerId}:`);

      for (const equipment of equipments) {
        for (const action of equipment.actions) {
          if (action.nextDate) {
            const nextDate = new Date(action.nextDate);
            if (nextDate.getFullYear() === year && nextDate.getMonth() + 1 === month) {
              const dateKey = action.nextDate;
              if (!events[dateKey]) {
                events[dateKey] = [];
              }
              events[dateKey].push({
                centroName: centro.name,
                equipmentName: equipment.name,
                actionType: action.type,
                nextDate: action.nextDate,
                status: action.status,
              });
            }
          }
        }
      }
    }

    return c.json({ events });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return c.json({ error: 'Error al cargar calendario' }, 500);
  }
});

// ============ REPORTS ROUTES ============

app.post('/make-server-718703c6/reports/generate', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const { centroId, format } = await c.req.json();

    // Get centro data
    let centros: any[] = [];
    if (centroId) {
      const centro = await kv.get(`centro:${centroId}`);
      if (centro) centros = [centro];
    } else {
      const allCentros = await kv.getByPrefix('centro:');
      centros = user.role === 'ADMIN' ? allCentros : allCentros.filter((c: any) => 
        user.assignedCenters.includes(c.centerId)
      );
    }

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Centro,Equipo,Tipo Equipo,Actuación,Periodicidad,Estado,Última Revisión,Próxima Revisión\n';

      for (const centro of centros) {
        const equipments = await kv.getByPrefix(`equipment:${centro.centerId}:`);
        for (const equipment of equipments) {
          for (const action of equipment.actions) {
            csv += `"${centro.name}","${equipment.name}","${equipment.type}","${action.type}",${action.periodicityDays},"${action.status}","${action.lastDate || ''}","${action.nextDate || '"}"\n`;
          }
        }
      }

      return c.json({ content: csv });
    } else {
      // For PDF, we would typically generate with a library
      // For now, return a message
      return c.json({ 
        message: 'PDF generation requires additional setup',
        url: null 
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return c.json({ error: 'Error al generar informe' }, 500);
  }
});

app.post('/make-server-718703c6/reports/send-email', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const { centroId, format, recipient } = await c.req.json();

    // In production, this would send an email via SendGrid or similar
    console.log(`Would send ${format} report for centro ${centroId} to ${recipient}`);

    return c.json({ success: true, message: 'Informe enviado' });
  } catch (error) {
    console.error('Error sending email:', error);
    return c.json({ error: 'Error al enviar email' }, 500);
  }
});

// ============ NOTIFICATIONS ROUTES ============

app.get('/make-server-718703c6/notifications', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const allNotifications = await kv.getByPrefix('notification:');
    
    // Filter by user
    const notifications = allNotifications.filter((n: any) => n.userId === user.id);

    // Sort by date descending
    notifications.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Error al cargar notificaciones' }, 500);
  }
});

app.put('/make-server-718703c6/notifications/:id/read', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const notifId = c.req.param('id');
    const notification = await kv.get(`notification:${notifId}`);

    if (!notification || notification.userId !== user.id) {
      return c.json({ error: 'Notificación no encontrada' }, 404);
    }

    notification.read = true;
    await kv.set(`notification:${notifId}`, notification);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return c.json({ error: 'Error al actualizar notificación' }, 500);
  }
});

app.put('/make-server-718703c6/notifications/read-all', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) return c.json({ error: 'No autorizado' }, 401);

    const allNotifications = await kv.getByPrefix('notification:');
    const userNotifications = allNotifications.filter((n: any) => n.userId === user.id);

    for (const notification of userNotifications) {
      notification.read = true;
      await kv.set(`notification:${notification.notifId}`, notification);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return c.json({ error: 'Error al actualizar notificaciones' }, 500);
  }
});

// ============ ADMIN ROUTES ============

app.get('/make-server-718703c6/admin/users', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user || user.role !== 'ADMIN') {
      return c.json({ error: 'No autorizado' }, 403);
    }

    const users = await kv.getByPrefix('user:');

    return c.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Error al cargar usuarios' }, 500);
  }
});

app.post('/make-server-718703c6/admin/users', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user || user.role !== 'ADMIN') {
      return c.json({ error: 'No autorizado' }, 403);
    }

    const { email, password, name, role, assignedCenters } = await c.req.json();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return c.json({ error: 'Error al crear usuario' }, 500);
    }

    // Create user in KV
    const userData = {
      userId: authData.user.id,
      email,
      name,
      role,
      assignedCenters: assignedCenters || [],
    };

    await kv.set(`user:${authData.user.id}`, userData);

    return c.json({ user: userData });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: 'Error al crear usuario' }, 500);
  }
});

app.delete('/make-server-718703c6/admin/users/:id', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user || user.role !== 'ADMIN') {
      return c.json({ error: 'No autorizado' }, 403);
    }

    const userId = c.req.param('id');

    // Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(userId);

    // Delete from KV
    await kv.del(`user:${userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Error al eliminar usuario' }, 500);
  }
});

app.get('/make-server-718703c6/admin/preavisos', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user || user.role !== 'ADMIN') {
      return c.json({ error: 'No autorizado' }, 403);
    }

    const preavisos = await kv.getByPrefix('preaviso:');

    // If no preavisos, create defaults
    if (preavisos.length === 0) {
      const defaults = [
        { periodicityDays: 30, preaviso30: false, preaviso15: true, preaviso7: true },
        { periodicityDays: 90, preaviso30: true, preaviso15: true, preaviso7: true },
        { periodicityDays: 180, preaviso30: true, preaviso15: true, preaviso7: true },
        { periodicityDays: 365, preaviso30: true, preaviso15: true, preaviso7: true },
      ];

      for (const p of defaults) {
        await kv.set(`preaviso:${p.periodicityDays}`, p);
      }

      return c.json({ preavisos: defaults });
    }

    return c.json({ preavisos });
  } catch (error) {
    console.error('Error fetching preavisos:', error);
    return c.json({ error: 'Error al cargar preavisos' }, 500);
  }
});

app.put('/make-server-718703c6/admin/preavisos', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user || user.role !== 'ADMIN') {
      return c.json({ error: 'No autorizado' }, 403);
    }

    const data = await c.req.json();
    const { periodicityDays, ...updates } = data;

    const preaviso = await kv.get(`preaviso:${periodicityDays}`) || { periodicityDays };
    
    Object.assign(preaviso, updates);
    await kv.set(`preaviso:${periodicityDays}`, preaviso);

    return c.json({ preaviso });
  } catch (error) {
    console.error('Error updating preaviso:', error);
    return c.json({ error: 'Error al actualizar preaviso' }, 500);
  }
});

// Initialize storage bucket on startup
(async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketName = 'make-718703c6-documents';
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, {
      public: false,
    });
    console.log(`Created storage bucket: ${bucketName}`);
  }
})();

// ============ SEED ROUTE (Development only) ============

app.post('/make-server-718703c6/seed', async (c) => {
  try {
    console.log('🌱 Starting seed process...');

    // 1. Create admin user
    const adminEmail = 'admin@savills.es';
    const adminPassword = 'Admin123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: { name: 'Administrador' },
      email_confirm: true,
    });

    let adminUserId = '';
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists');
        // Try to find existing user
        const existingUsers = await kv.getByPrefix('user:');
        const existingAdmin = existingUsers.find((u: any) => u.email === adminEmail);
        if (existingAdmin) {
          adminUserId = existingAdmin.userId;
        }
      } else {
        throw authError;
      }
    } else if (authData.user) {
      adminUserId = authData.user.id;
      const adminUser = {
        userId: authData.user.id,
        email: adminEmail,
        name: 'Administrador',
        role: 'ADMIN',
        assignedCenters: [],
      };
      await kv.set(`user:${authData.user.id}`, adminUser);
    }

    // 2. Create gestor user
    const gestorEmail = 'gestor@savills.es';
    const gestorPassword = 'Gestor123!';

    const { data: gestorAuthData, error: gestorAuthError } = await supabase.auth.admin.createUser({
      email: gestorEmail,
      password: gestorPassword,
      user_metadata: { name: 'Gestor Demo' },
      email_confirm: true,
    });

    let gestorUserId = '';
    if (gestorAuthError) {
      if (gestorAuthError.message.includes('already registered')) {
        console.log('Gestor user already exists');
        const existingUsers = await kv.getByPrefix('user:');
        const existingGestor = existingUsers.find((u: any) => u.email === gestorEmail);
        if (existingGestor) {
          gestorUserId = existingGestor.userId;
        }
      }
    } else if (gestorAuthData.user) {
      gestorUserId = gestorAuthData.user.id;
      const gestorUser = {
        userId: gestorAuthData.user.id,
        email: gestorEmail,
        name: 'Gestor Demo',
        role: 'GESTOR',
        assignedCenters: [],
      };
      await kv.set(`user:${gestorAuthData.user.id}`, gestorUser);
    }

    // 3. Create sample centro
    const centroId = generateId('C');
    const centro = {
      centerId: centroId,
      name: 'Centro Comercial Gran Plaza',
      managerName: 'Juan Pérez García',
      managerEmail: ['juan.perez@savills.es'],
      technicalDirector: 'María García López',
      createdAt: new Date().toISOString(),
      assignedManagers: gestorUserId ? [gestorUserId] : [],
      teamItems: 0,
    };
    await kv.set(`centro:${centroId}`, centro);

    // Update gestor's assigned centers
    if (gestorUserId) {
      const gestorUser = await kv.get(`user:${gestorUserId}`);
      if (gestorUser) {
        gestorUser.assignedCenters = [centroId];
        await kv.set(`user:${gestorUserId}`, gestorUser);
      }
    }

    // 4. Create sample equipments usando los 84 equipos genéricos
    console.log(`Creating ${EQUIPOS_GENERICOS.length} equipos genéricos...`);
    
    // Agrupar equipos por sección/instalación para crear menos equipments
    const equipmentsBySection = new Map<string, any[]>();
    
    for (const equipoGen of EQUIPOS_GENERICOS) {
      const key = `${equipoGen.seccion}_${equipoGen.subseccion}_${equipoGen.instalacion}`;
      if (!equipmentsBySection.has(key)) {
        equipmentsBySection.set(key, []);
      }
      equipmentsBySection.get(key)!.push(equipoGen);
    }
    
    let equipmentCount = 0;
    for (const [key, equipos] of equipmentsBySection) {
      const firstEquipo = equipos[0];
      const equipmentId = generateId('EQ');
      
      const equipment = {
        equipmentId,
        centerId,
        name: firstEquipo.nombre,
        type: firstEquipo.instalacion,
        seccion: firstEquipo.seccion,
        subseccion: firstEquipo.subseccion,
        actions: equipos.map(eq => ({
          actionId: generateId('AC'),
          type: eq.tipo,
          periodicityDays: periodicidadADias(eq.periodicidad),
          periodicidadOriginal: eq.periodicidad,
          lastDate: null,
          nextDate: null,
          status: 'PENDIENTE',
          docs: [],
        })),
      };
      
      await kv.set(`equipment:${centroId}:${equipmentId}`, equipment);
      equipmentCount++;
    }
    
    console.log(`✓ Created ${equipmentCount} equipment groups with ${EQUIPOS_GENERICOS.length} total actions`);

    // 5. Create default preavisos
    const defaultPreavisos = [
      { periodicityDays: 30, preaviso30: false, preaviso15: true, preaviso7: true },
      { periodicityDays: 90, preaviso30: true, preaviso15: true, preaviso7: true },
      { periodicityDays: 120, preaviso30: true, preaviso15: true, preaviso7: true },
      { periodicityDays: 180, preaviso30: true, preaviso15: true, preaviso7: true },
      { periodicityDays: 365, preaviso30: true, preaviso15: true, preaviso7: true },
    ];

    for (const p of defaultPreavisos) {
      await kv.set(`preaviso:${p.periodicityDays}`, p);
    }

    // 6. Create sample notification
    if (adminUserId) {
      const notification = {
        notifId: generateId('NOTIF'),
        userId: adminUserId,
        type: 'INFO',
        title: 'Bienvenido a Savills Audit',
        message: 'El sistema está listo para gestionar tus mantenimientos técnico-legales',
        priority: 'LOW',
        read: false,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`notification:${notification.notifId}`, notification);
    }

    return c.json({ 
      success: true,
      message: 'Seed completed successfully',
      credentials: {
        admin: { email: adminEmail, password: adminPassword },
        gestor: { email: gestorEmail, password: gestorPassword },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return c.json({ error: 'Error during seed', details: error.message }, 500);
  }
});

Deno.serve(app.fetch);