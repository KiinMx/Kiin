// app/calendar/horario/HorarioClient.tsx
'use client';

import Calendar from '@/app/components/Calendar';
import CurrentSchedule from '@/app/widgets/CurrentSchedule';
import { Course } from '@/domain/entities/Course';
import { Schedule } from '@/domain/entities/Schedule';
import { LocalAcademicOfferRepository } from '@/infrastructure/repositories/LocalAcademicOfferRepository';
import { RemoteAcademicOfferRepository } from '@/infrastructure/repositories/RemoteAcademicOfferRepository';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function HorarioClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams?.get('ids'); // "1,23,64,98"
  const ids = React.useMemo(() => idsParam ? idsParam.split(',').map(Number) : [], [idsParam]);

  const [courses, setCourses] = React.useState<Course[]>([]);

  const [dayFormat, setDayFormat] = useState<"short" | "long">("long");
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 640) {
        setDayFormat("long")
      } else {
        setDayFormat("short")
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);

  }, []);

  React.useEffect(() => {
    const repo = new LocalAcademicOfferRepository(
      new RemoteAcademicOfferRepository("fmat"),
      "fmat"
    );
    repo.getCourses().then(courses => {
      const filteredCourses = courses.filter(course => ids.includes(course.id));
      setCourses(filteredCourses);
    }).catch(error => {
      console.error("Error al obtener los cursos:", error);
    });
  }, [ids]);

  const schedule = new Schedule(99);
  courses?.forEach(course => schedule.addCourse(course));

  return (
    <div className="flex flex-col md:flex-row  md:p-4 md:gap-6  h-full overflow-auto">
      
      <div className="w-full md:w-[70%] md:px-2  md:overflow-auto md:h-full h-screen md:mt-0 mt-5">
        <Calendar courses={courses} dayFormat={dayFormat} />
      </div>
      <div className="w-full md:w-[30%] mt-6 md:mt-0 md:h-full">
        <CurrentSchedule schedule={schedule} label={'Horario'} />
      </div>
    </div>
  );
}
