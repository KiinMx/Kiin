'use client'

import { Course } from '@/domain/entities/Course';
import { EventHoveringArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useMemo, useRef, useState } from 'react';
import './calendar.css';


interface CalendarProps {
    courses: Course[]
    dayFormat: 'long' | 'short';
    conflictCourses?: Course[]
}

function mapEvents(course: Course, isConflict: boolean = false) {
    const days = {
        "Lunes": "13",
        "Martes": "14",
        "Miercoles": "15",
        "Jueves": "16",
        "Viernes": "17",
        "Sabado": "18",
    };

    const colors = [
        "#AA6AFF",
        "#00B0FF",
        "#FF70E9",
        "#FFA647",
        "#6D8CFF",
        "#FF5C8A",
        "#4DFFB8",
        "#FFD94D",
        "#B570FF",
        "#4F6CFF",
    ]

    const color = colors[course.subject.id % colors.length];

    return course.sessions.map((sessionI) => {

        const day = days[sessionI.day as keyof typeof days];
        const dateI = `2025-01-${day}`;

        const startDateTimeString = `${dateI}T${sessionI.startHourFormatted}:00`;
        const endDateTimeString = `${dateI}T${sessionI.endHourFormatted}:00`;

        const start = new Date(startDateTimeString);
        const end = new Date(endDateTimeString);

        return {
            color: isConflict ? '#DC2626' : color,
            title: course.subject.name,
            start: start.toISOString(),
            end: end.toISOString(),
            borderColor: isConflict ? '#ff4f4f' : color,
            textColor: isConflict ? 'white' : 'black',
            extendedProps: {
                room: sessionI.room,
                professor: course.professor.fullName,
                isConflict: isConflict,
                group: course.group,
            },
        };
    });
}

const Calendar: React.FC<CalendarProps> = ({ courses, dayFormat, conflictCourses }) => {
    interface Tooltip {
        visible: boolean;
        x: number;
        y: number;
        eventArgs?: EventHoveringArg;
    }

    const [tooltip, setTooltip] = useState<Tooltip>({ visible: false, x: 0, y: 0, eventArgs: undefined });

    const events = useMemo(() => {
        const regularEvents = courses?.flatMap((course) => mapEvents(course, false)) ?? [];
        const conflictEvents = conflictCourses?.flatMap((course) => mapEvents(course, true)) ?? [];
        return [...regularEvents, ...conflictEvents];
    }, [courses, conflictCourses]);

    // Referencia para limpiar el event listener
    const mouseMoveHandlerRef = useRef<(e: MouseEvent) => void>();

    const handleMouseEnter = (e: EventHoveringArg) => {
        const handler = (ev: MouseEvent) => {
            setTooltip(prev => ({
                ...prev,
                x: ev.clientX,
                y: ev.clientY,
            }));
        };
        mouseMoveHandlerRef.current = handler;
        document.addEventListener("mousemove", handler);

        setTooltip({
            visible: true,
            x: e.jsEvent.clientX,
            y: e.jsEvent.clientY,
            eventArgs: e
        });
    };

    const handleMouseLeave = () => {
        if (mouseMoveHandlerRef.current) {
            document.removeEventListener("mousemove", mouseMoveHandlerRef.current);
        }
        setTooltip({ visible: false, x: 0, y: 0, eventArgs: undefined });
    };

    const minStartHour = useMemo(() => {
        // Encuentra la hora de inicio más temprana entre todos los eventos
        if (!events.length) return "18:00:00";
        const hours = events.map(e => new Date(e.start).getHours() * 60 + new Date(e.start).getMinutes());
        const minMinutes = Math.min(...hours) - 30; // media hora antes
        const minHour = Math.floor(Math.max(minMinutes, 0) / 60);
        const minMinute = Math.max(minMinutes, 0) % 60;
        // Devuelve en formato HH:MM:00
        return `${minHour.toString().padStart(2, '0')}:${minMinute.toString().padStart(2, '0')}:00`;
    }, [events]);

    const maxStartHour = useMemo(() => {
        // Encuentra la hora de finalización más tardía entre todos los eventos
        if (!events.length) return "18:00:00";
        const minutes = events.map(e => new Date(e.end).getHours() * 60 + new Date(e.end).getMinutes());
        const maxMinutes = Math.max(...minutes) + 30; // media hora después
        const maxHour = Math.floor(Math.min(maxMinutes, 24 * 60 - 1) / 60);
        const maxMinute = Math.min(maxMinutes, 24 * 60 - 1) % 60;
        // Devuelve en formato HH:MM:00
        return `${maxHour.toString().padStart(2, '0')}:${maxMinute.toString().padStart(2, '0')}:00`;
    }, [events]);

    return (
        <>
            <div className='h-full'>
                <FullCalendar
                
                    now={'2025-01-13'}
                    dayHeaderClassNames={
                        ['bg-gray-800', 'text-white', '!border-0']// Usar clases de Tailwind
                    }
                    slotLaneClassNames={
                        ['!border !border-1 dark:!border-gray-500']// Usar clases de Tailwind
                    }
                    viewClassNames={
                        ['!border-0']// Usar clases de Tailwind
                    }
                    slotLabelClassNames={
                        ['!border dark:!border-gray-500']// Usar clases de Tailwind
                    }
                    dayCellClassNames={
                        ['!border-0']// Usar clases de Tailwind
                    }
                    slotLabelFormat={
                        { hour: '2-digit', minute: '2-digit', hour12: false }
                    }
                    eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    height={"auto"}
                    headerToolbar={false}
                    dayHeaderFormat={{ weekday: "long" }}
                    locale={"es-MX"}
                    allDaySlot={false}
                    slotMinTime={minStartHour}
                    slotMaxTime={maxStartHour}
                    hiddenDays={[0, 7]}
                    plugins={[timeGridPlugin]}
                    initialView="timeGridWeek"
                    events={events}
                    eventTextColor='black'
                    eventClassNames={['text-sm', 'md:font-semibold md:p-1']}

                    dayHeaderContent={(args) =>
                        args.date.toLocaleDateString('es-MX', { weekday: dayFormat }).charAt(0).toUpperCase() +
                        args.date.toLocaleDateString('es-MX', { weekday: dayFormat }).slice(1)
                    }
                    eventMouseEnter={handleMouseEnter}
                    eventMouseLeave={handleMouseLeave}
                    eventClick={(e) => {
                        setTooltip({
                            visible: true,
                            x: e.jsEvent.clientX,
                            y: e.jsEvent.clientY,
                            eventArgs: e
                        });
                    }
                    }
                />
            </div>
            {tooltip.visible && (
                <div
                    className="fixed z-10 bg-black text-white text-sm px-3 py-1 rounded-md shadow-lg pointer-events-none"
                    style={{
                        top: tooltip.y + 10,
                        left: tooltip.x + 10,
                    }}
                >
                    {tooltip.eventArgs?.event.extendedProps.isConflict && (
                        <>
                            <strong className='text-red-500'>Conflicto</strong><br />
                        </>
                        
                    )}
                    
                     {tooltip.eventArgs?.event.title}
                    <br />
                    <strong>Profesor:</strong> {tooltip.eventArgs?.event.extendedProps.professor}
                    <br />
                    <strong>Grupo:</strong> {tooltip.eventArgs?.event.extendedProps.group}
                    <br />
                    <strong>Aula:</strong> {tooltip.eventArgs?.event.extendedProps.room}


                </div>
            )}
        </>
    );
}

export default Calendar;
