// Seed script to initialize the database with sample data
// This creates an admin user and sample centro with equipments

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function seed() {
  console.log('🌱 Starting seed process...');

  // 1. Create admin user
  console.log('Creating admin user...');
  const adminEmail = 'admin@savills.es';
  const adminPassword = 'Admin123!';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    user_metadata: { name: 'Administrador' },
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating admin user:', authError);
    if (authError.message.includes('already registered')) {
      console.log('Admin user already exists, skipping...');
    } else {
      return;
    }
  } else if (authData.user) {
    const adminUser = {
      userId: authData.user.id,
      email: adminEmail,
      name: 'Administrador',
      role: 'ADMIN',
      assignedCenters: [],
    };
    await kv.set(`user:${authData.user.id}`, adminUser);
    console.log('✓ Admin user created:', adminEmail);
  }

  // 2. Create gestor user
  console.log('Creating gestor user...');
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
    console.log('Gestor user may already exist, continuing...');
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
    console.log('✓ Gestor user created:', gestorEmail);
  }

  // 3. Create sample centro
  console.log('Creating sample centro...');
  const centroId = 'C_' + crypto.randomUUID();
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
  console.log('✓ Centro created:', centro.name);

  // Update gestor's assigned centers
  if (gestorUserId) {
    const gestorUser = await kv.get(`user:${gestorUserId}`);
    if (gestorUser) {
      gestorUser.assignedCenters = [centroId];
      await kv.set(`user:${gestorUserId}`, gestorUser);
    }
  }

  // 4. Create sample equipments
  console.log('Creating sample equipments...');
  
  const sampleEquipments = [
    {
      name: 'Grupo Electrógeno Principal',
      type: 'GENERADOR',
      actions: [
        { type: 'REVISION', periodicityDays: 180 },
        { type: 'ANALITICA', periodicityDays: 365 },
      ],
    },
    {
      name: 'Sistema Contra Incendios',
      type: 'SEGURIDAD',
      actions: [
        { type: 'REVISION', periodicityDays: 90 },
        { type: 'CERT_LD', periodicityDays: 365 },
      ],
    },
    {
      name: 'Ascensor Principal Norte',
      type: 'ASCENSOR',
      actions: [
        { type: 'REVISION', periodicityDays: 120 },
        { type: 'OCA', periodicityDays: 365 },
      ],
    },
    {
      name: 'Sistema de Climatización HVAC-1',
      type: 'CLIMATIZACION',
      actions: [
        { type: 'REVISION', periodicityDays: 90 },
        { type: 'TERMOGRAFICO', periodicityDays: 180 },
      ],
    },
    {
      name: 'Transformador Eléctrico',
      type: 'ELECTRICO',
      actions: [
        { type: 'REVISION', periodicityDays: 180 },
        { type: 'TERMOGRAFICO', periodicityDays: 365 },
      ],
    },
  ];

  for (const eq of sampleEquipments) {
    const equipmentId = 'EQ_' + crypto.randomUUID();
    const equipment = {
      equipmentId,
      centerId,
      name: eq.name,
      type: eq.type,
      actions: eq.actions.map(a => ({
        actionId: 'AC_' + crypto.randomUUID(),
        type: a.type,
        periodicityDays: a.periodicityDays,
        lastDate: null,
        nextDate: null,
        status: 'PENDIENTE',
        docs: [],
      })),
    };
    await kv.set(`equipment:${centroId}:${equipmentId}`, equipment);
    console.log(`  ✓ Equipment created: ${equipment.name}`);
  }

  // 5. Create default preavisos
  console.log('Creating default preavisos...');
  const defaultPreavisos = [
    { periodicityDays: 30, preaviso30: false, preaviso15: true, preaviso7: true },
    { periodicityDays: 90, preaviso30: true, preaviso15: true, preaviso7: true },
    { periodicityDays: 120, preaviso30: true, preaviso15: true, preaviso7: true },
    { periodicityDays: 180, preaviso30: true, preaviso15: true, preaviso7: true },
    { periodicityDays: 365, preaviso30: true, preaviso15: true, preaviso7: true },
  ];

  for (const p of defaultPreavisos) {
    await kv.set(`preaviso:${p.periodicityDays}`, p);
    console.log(`  ✓ Preaviso created: ${p.periodicityDays} days`);
  }

  // 6. Create sample notification
  console.log('Creating sample notification...');
  const notification = {
    notifId: 'NOTIF_' + crypto.randomUUID(),
    userId: authData?.user?.id || '',
    type: 'INFO',
    title: 'Bienvenido a Savills Audit',
    message: 'El sistema está listo para gestionar tus mantenimientos técnico-legales',
    priority: 'LOW',
    read: false,
    createdAt: new Date().toISOString(),
  };
  await kv.set(`notification:${notification.notifId}`, notification);
  console.log('✓ Notification created');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('Admin:');
  console.log('  Email: admin@savills.es');
  console.log('  Password: Admin123!');
  console.log('\nGestor:');
  console.log('  Email: gestor@savills.es');
  console.log('  Password: Gestor123!');
}

// Run seed
seed().catch(console.error);
