import { isDevMode } from '@/utils/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';
import Image from 'next/image';
import { useState } from 'react';
import Swal from 'sweetalert2';
import type { Schedule } from '../../domain/entities/Schedule';
import { Pivot } from '@/domain/entities/Pivot';
import { useGoogleAuth } from '@/app/hooks/useGoogleAuth';

interface GoogleCalendarButtonProps {
  schedule: Schedule;
  recurrenceStart: Date;
  recurrenceEnd: Date;
  pivots?: Pivot[];
  pinnedSubjects?: number[];
}

export default function GoogleCalendarButton({ schedule, recurrenceStart, recurrenceEnd, pivots, pinnedSubjects }: GoogleCalendarButtonProps) {
  const session = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const { signInWithGoogle } = useGoogleAuth();

  function getNextDateOfDay(startDate: Date, dayOfWeek: string): Date {
    const daysMap: Record<string, number> = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };
    const result = new Date(startDate);
    const day = daysMap[dayOfWeek];
    const diff = (day + 7 - result.getDay()) % 7;
    result.setDate(result.getDate() + diff);
    return result;
  }

  async function handleClick() {
    if (isExporting) return; // Prevenir múltiples clics

    // Verificar si estamos en modo desarrollo sin credenciales
    if (isDevMode) {
      await Swal.fire({
        icon: 'warning',
        title: 'Funcionalidad no disponible',
        html: `
          <div class="text-left">
            <p>Esta funcionalidad requiere credenciales de Supabase que no están configuradas.</p>
            <p class="mt-2"><strong>Para contribuidores:</strong></p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>Esta es una limitación solo en modo desarrollo</li>
              <li>El resto de la aplicación funciona completamente</li>
              <li>Contacta al equipo si necesitas acceso a estas credenciales</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1e40af'
      });
      return;
    }

    // Mostrar disclaimer antes de proceder
    const disclaimerResult = await Swal.fire({
      icon: 'info',
      title: 'Exportar a Google Calendar',
      html: `
        <div class="text-left">
          <p><strong>⚠️ Importante:</strong></p>
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>El horario actual será exportado a Google Calendar</li>
            <li>Una vez exportado, cualquier cambio posterior deberá hacerse directamente en Google Calendar</li>
            <li>Esta aplicación no sincroniza cambios futuros con Google Calendar</li>
          </ul>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar con la exportación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#6b7280'
    });

    if (!disclaimerResult.isConfirmed) {
      return; // Usuario canceló la operación
    }

    setIsExporting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const providerToken = session?.provider_token || (session?.user && session.user.provider_token);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const accessToken = providerToken || (session?.user && session.user.identities && session.user.identities[0]?.access_token);

      if (!session || !accessToken) {
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'info',
          title: 'Acceso requerido',
          text: 'Debes iniciar sesión con Google para exportar tu horario.',
          confirmButtonText: 'Iniciar sesión'
        });
        await signInWithGoogle({
          ids: schedule.courses.map(c => c.id),
          pivots: pivots ?? [],
          pinnedSubjects: pinnedSubjects ?? [],
          selectedSubjectIds: [...new Set(schedule.courses.map(c => c.subject.id))]
        });
        return;
      }

      // Mostrar feedback de inicio de exportación
      Swal.fire({
        title: 'Exportando horario...',
        text: 'Por favor espera mientras creamos tus eventos en Google Calendar',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      let successCount = 0;
      let errorCount = 0;
      // Mapeo de días de español a inglés
      const diasMap: Record<string, string> = {
        'Lunes': 'Monday',
        'Martes': 'Tuesday',
        'Miércoles': 'Wednesday',
        'Miercoles': 'Wednesday',
        'Jueves': 'Thursday',
        'Viernes': 'Friday',
        'Sábado': 'Saturday',
        'Sabado': 'Saturday',
        'Domingo': 'Sunday',
      };

      for (const course of schedule.courses) {
        for (const session of course.sessions) {
          // Log de datos crudos de la sesión para depuración
          // Mapeo de día
          const dayEn = diasMap[session.day] || session.day;
          const firstDate = getNextDateOfDay(recurrenceStart, dayEn);
          // Extracción robusta de horas/minutos usando Moment
          let startHour = 0, startMinute = 0, endHour = 0, endMinute = 0;
          if (session.startHour && typeof session.startHour.hour === 'function' && typeof session.startHour.minute === 'function') {
            startHour = session.startHour.hour();
            startMinute = session.startHour.minute();
          } else if (typeof session.startHour === 'string') {
            const parts = (session.startHour as string).split(':');
            startHour = Number(parts[0]);
            startMinute = Number(parts[1]);
          }
          if (session.endHour && typeof session.endHour.hour === 'function' && typeof session.endHour.minute === 'function') {
            endHour = session.endHour.hour();
            endMinute = session.endHour.minute();
          } else if (typeof session.endHour === 'string') {
            const parts = (session.endHour as string).split(':');
            endHour = Number(parts[0]);
            endMinute = Number(parts[1]);
          }
          // Validaciones de datos
          if (
            isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute) ||
            !firstDate || isNaN(firstDate.getTime())
          ) {
            // Mejor manejo de errores: muestra alerta amigable
            Swal.fire({
              icon: 'error',
              title: 'Error en datos de horario',
              text: `No se pudo exportar la sesión de ${course.subject.name} (${session.day} ${session.startHour} - ${session.endHour}) por datos inválidos.`
            });
            errorCount++;
            continue;
          }
          const eventStart = new Date(firstDate);
          eventStart.setHours(startHour, startMinute, 0, 0);
          const eventEnd = new Date(firstDate);
          eventEnd.setHours(endHour, endMinute, 0, 0);
          if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
            console.error('Fecha de inicio o fin inválida para el evento:', { eventStart, eventEnd, session, course });
            errorCount++;
            continue;
          }
          const until = recurrenceEnd.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          const event = {
            summary: course.subject.name,
            description: `Profesor: ${course.professor.fullName}\nAula: ${session.room}`,
            start: {
              dateTime: eventStart.toISOString(),
              timeZone: 'America/Mexico_City',
            },
            end: {
              dateTime: eventEnd.toISOString(),
              timeZone: 'America/Mexico_City',
            },
            recurrence: [
              `RRULE:FREQ=WEEKLY;UNTIL=${until}`
            ],
          };
          try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            });
            if (!response.ok) {
              errorCount++;
              continue;
            }
            successCount++;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (err) {
            errorCount++;
          }
        }
      }

      // Cerrar el modal de carga
      Swal.close();

      Swal.fire({
        icon: errorCount === 0 ? 'success' : (successCount === 0 ? 'error' : 'warning'),
        title: errorCount === 0 ? '¡Éxito!' : (successCount === 0 ? 'Error' : 'Parcialmente exitoso'),
        text: `Eventos creados: ${successCount}. Errores: ${errorCount}`
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isExporting}
      className={`text-sm mb-1 p-1 ml-2 rounded-full items-center justify-center flex flex-row transition-all duration-200 ${isExporting
        ? 'bg-gray-400 cursor-not-allowed opacity-70'
        : 'bg-blue-700 hover:bg-blue-800'
        }`}
    >
      {/* <Image src={'/img/google_calendar_icon.svg'}  alt={''} width={30} height={30} className='mr-2' /> */}
      <PerfilUsuario />

      

      {isExporting ? (
        <div className="animate-spin">
          <svg className="" xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
              <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      ) : (
        <svg className='' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="34" height="34" viewBox="0 0 48 48">
          <rect width="22" height="22" x="13" y="13" fill="#fff"></rect><polygon fill="#1e88e5" points="25.68,20.92 26.688,22.36 28.272,21.208 28.272,29.56 30,29.56 30,18.616 28.56,18.616"></polygon><path fill="#1e88e5" d="M22.943,23.745c0.625-0.574,1.013-1.37,1.013-2.249c0-1.747-1.533-3.168-3.417-3.168 c-1.602,0-2.972,1.009-3.33,2.453l1.657,0.421c0.165-0.664,0.868-1.146,1.673-1.146c0.942,0,1.709,0.646,1.709,1.44 c0,0.794-0.767,1.44-1.709,1.44h-0.997v1.728h0.997c1.081,0,1.993,0.751,1.993,1.64c0,0.904-0.866,1.64-1.931,1.64 c-0.962,0-1.784-0.61-1.914-1.418L17,26.802c0.262,1.636,1.81,2.87,3.6,2.87c2.007,0,3.64-1.511,3.64-3.368 C24.24,25.281,23.736,24.363,22.943,23.745z"></path><polygon fill="#fbc02d" points="34,42 14,42 13,38 14,34 34,34 35,38"></polygon><polygon fill="#4caf50" points="38,35 42,34 42,14 38,13 34,14 34,34"></polygon><path fill="#1e88e5" d="M34,14l1-4l-1-4H9C7.343,6,6,7.343,6,9v25l4,1l4-1V14H34z"></path><polygon fill="#e53935" points="34,34 34,42 42,34"></polygon><path fill="#1565c0" d="M39,6h-5v8h8V9C42,7.343,40.657,6,39,6z"></path><path fill="#1565c0" d="M9,42h5v-8H6v5C6,40.657,7.343,42,9,42z"></path>
        </svg>
      )}

      Google Calendar
    </button>
  );
}


function PerfilUsuario() {
  const session = useSession();

  if (!session) return <p>Cargando...</p>;

  const avatarUrl = session.user.user_metadata.avatar_url;
  const nombre = session.user.user_metadata.full_name;

  return (
    <div className="flex items-center gap-4">
      <Image
        src={avatarUrl}
        alt={`Foto de perfil de ${nombre}`}
        width={32}
        height={32}
        className="rounded-full"
      />
    </div>
  );
}