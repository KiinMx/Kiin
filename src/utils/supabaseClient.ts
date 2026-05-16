import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Flag para determinar si estamos en modo desarrollo sin credenciales
export const isDevMode = !supabaseUrl || !supabaseAnonKey;

// Mostrar mensaje en consola si estamos en modo desarrollo
if (isDevMode && typeof window === 'undefined') {
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  MODO DESARROLLO SIN CREDENCIALES');
  console.log('='.repeat(80));
  console.log('');
  console.log('  ℹ️  El proyecto se está ejecutando sin credenciales de Supabase');
  console.log('');
  console.log('  ✅ Todas las funcionalidades principales están disponibles:');
  console.log('     - Generación de horarios');
  console.log('     - Filtros y selección de materias');
  console.log('     - Visualización de calendarios');
  console.log('');
  console.log('  ⚠️  Funcionalidad limitada:');
  console.log('     - Exportación a Google Calendar (requiere credenciales)');
  console.log('');
  console.log('  📝 Para contribuidores:');
  console.log('     - Puedes trabajar normalmente sin configurar el .env');
  console.log('     - Revisa CONTRIBUTING.md para más información');
  console.log('     - Contacta al equipo si necesitas credenciales de desarrollo');
  console.log('');
  console.log('='.repeat(80) + '\n');
}

// Si no hay credenciales, crear un cliente dummy para evitar errores
const supabase = isDevMode
  ? createClient('https://placeholder.supabase.co', 'placeholder-key')
  : createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
