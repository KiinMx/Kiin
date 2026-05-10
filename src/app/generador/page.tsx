"use client";

import SchedulesView from "../widgets/SchedulesView";
import SubjectsView from "../widgets/SubjectsView";


import Category from '@/domain/entities/Category';
import { Degree } from '@/domain/entities/Degree';
import DegreeCategory from '@/domain/entities/DegreeCategory';
import { Schedule } from '@/domain/entities/Schedule';
import { ScheduleGenerator } from '@/domain/entities/ScheduleGenerator';
import { Subject } from '@/domain/entities/Subject';
import SubjectCategory from '@/domain/entities/SubjectCategory';
import { CoursesCsvDatasource } from '@/infrastructure/datasource/CoursesCsvDatasource';
import { DegreesCsvDataSource } from '@/infrastructure/datasource/DegreesCsvDataSource';
import { FilterImpl } from '@/infrastructure/datasource/FilterImpl';
import { SubjectsCsvDataSource } from '@/infrastructure/datasource/SubjectsCSvDataSource';
import React, { useCallback, useEffect, useState } from 'react';
import { Pivot } from "../../domain/entities/Pivot";
import CurrentSchedule from "../widgets/CurrentSchedule";



const GeneratorPage = () => {
  const [indexSelected, setIndexSelected] = useState(0);

  const [currentCategories, setCurrentCategories] = React.useState<Category[]>([]);
  const [generatedSchedules, setGeneratedSchedules] = React.useState<Schedule[]>([]);
  const [schedulesToShow, setSchedulesToShow] = useState<Schedule[]>([])
  const [page, setPage] = useState(0);
  const [isFilterCoursesEmpty, setIsFilterCoursesEmpty] = useState(false);

  const [selectedSubjectsCount, setSelectedSubjectsCount] = useState<number | number[]>(0);
  const [maxSubjectsCount, setMaxSubjectsCount] = useState<number>(0);
  const [defaultSubjectsCount, setDefaultSubjectsCount] = useState<number>(0);



  const [pivots, setPivots] = useState<Pivot[]>([]);
  const [pinnedSubjects, setPinnedSubjects] = useState<number[]>([])
  const [generationMessage, setGenerationMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [showConflicts, setShowConflicts] = useState<boolean>(false);

  const handleSliderChange = (value: number | number[]) => {
    setSelectedSubjectsCount(value);
  };

  useEffect(
    () => {
      if (typeof selectedSubjectsCount === "number" && selectedSubjectsCount > 0) {
        const filtered = generatedSchedules.filter(gs => gs.courses.length === selectedSubjectsCount);
        setSchedulesToShow(filtered);

        // Mostrar mensaje de filtrado
        if (generatedSchedules.length > 0) {
          setGenerationMessage(`${filtered.length} Horarios con ${selectedSubjectsCount} materias`);
          setShowMessage(true);
          setTimeout(() => {
            setShowMessage(false);
          }, 2000);
        }
      } else {
        setSchedulesToShow(generatedSchedules);
      }
      setPage(0)
    }, [generatedSchedules, selectedSubjectsCount]
  )

  const mapCategories = async () => {

    const degrees: Degree[] = await (new DegreesCsvDataSource()).getAll();
    const degreesCategory: Category = new DegreeCategory("Carrera", degrees);
    const subjects: Subject[] = await (new SubjectsCsvDataSource()).getAll();
    const semesters: SubjectCategory[] = Array(9).fill(0).map((_, index) => new SubjectCategory(index + 1, subjects))

    setCurrentCategories([degreesCategory,
      ...semesters
    ]);
  };

  const filterCourses = useCallback(async (categories: Category[]) => {
    setPage(0)
    setGenerationMessage("Generando horarios...");
    setShowMessage(true);

    const data = new CoursesCsvDatasource();
    const filter = new FilterImpl(categories.map((category) => category.toCourseFilter()));
    const courses = await data.getCoursesByFilter(filter)

    if (courses.length === 0) {
      setGeneratedSchedules([]);
      setIsFilterCoursesEmpty(true);
      setShowMessage(false);
      return;
    }

    const generator = new ScheduleGenerator();
    const schedules = generator.generateSchedules(courses)

    const withPivots = schedules.filter(schedule => withPinnedSubjects(schedule, pinnedSubjects)).filter(s => scheduleHasPivots(s, pivots))

    console.log(withPivots)
    const sorted = withPivots.sort((a, b) => a.courses.length - b.courses.length);

    // Calcular el número de materias del horario con más materias
    const maxCoursesInSchedules = sorted.length > 0 ? Math.max(...sorted.map(s => s.courses.length)) : 0;
    setDefaultSubjectsCount(maxCoursesInSchedules);

    setGeneratedSchedules(sorted);
    setGenerationMessage(`${sorted.length} Horarios Generados!`);

    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  }, [pinnedSubjects, pivots]);

  const withPinnedSubjects = (schedule: Schedule, pinnedSubjects: number[]) => {
    return (
      pinnedSubjects.every(pinnedS => (
        schedule.courses.some(
          course => (course.subject.id === pinnedS)
        )
      ))
    )
  }

  const scheduleHasPivots = (schedule: Schedule, pivots: Pivot[]) => {
    // Agrupar pivotes por materia
    const pivotsBySubject = pivots.reduce((acc, pivot) => {
      if (!acc[pivot.idSubject]) {
        acc[pivot.idSubject] = [];
      }
      acc[pivot.idSubject].push(pivot.idProfessor);
      return acc;
    }, {} as { [subjectId: number]: number[] });

    // Verificar que para cada materia que tenga pivotes, el profesor del curso esté en la lista de profesores válidos
    return Object.entries(pivotsBySubject).every(([subjectId, professorIds]) => {
      const subjectIdNum = parseInt(subjectId);
      const courseForSubject = schedule.courses.find((course) => course.subject.id === subjectIdNum);

      if (courseForSubject) {
        // Si el horario tiene esta materia, verificar que el profesor esté en los pivotes
        return professorIds.includes(courseForSubject.professor.id);
      } else {
        // Si no tiene la materia, no hay restricción
        return true;
      }
    });
  }

  const onChangeSchedulePage = (page: number) => {
    setPage(page);
  };

  const handleClickFilter = (categories: Category[]) => {
    setCurrentCategories(categories);

    const semestersWithSubjectsSelected = categories.filter(c => c instanceof SubjectCategory)
    const selectedSubjects = semestersWithSubjectsSelected.flatMap(s => s.selectedValues.flatMap(sv => sv.id))
    setPinnedSubjects(pinnedSubjects.filter(pn => selectedSubjects.includes(pn)))
    setPivots(pivots.filter(p => selectedSubjects.includes(p.idSubject)))

    let selectedSubjectsCount = 0;
    semestersWithSubjectsSelected.forEach(c => { selectedSubjectsCount = c.selectedValues.length + selectedSubjectsCount })

    // const testL = category.find(c => c instanceof SubjectCategory)?.selectedValues.length ?? 0;

    setMaxSubjectsCount(selectedSubjectsCount);
  }

  const handleRemoveSubject = (categoryIndex: number, subjectId: number) => {
    const newCategories = [...currentCategories];
    const category = newCategories[categoryIndex];
    category.onClick(subjectId);
    newCategories[categoryIndex] = category;
    currentCategories.forEach((cat) => cat.filterWithCategories(newCategories));
    handleClickFilter(newCategories);
  }

  // Generar horarios automáticamente cuando cambien las categorías, pivots o pinnedSubjects
  useEffect(() => {
    // Verificar que hay al menos una materia seleccionada
    const hasSelectedSubjects = currentCategories
      .filter(c => c instanceof SubjectCategory)
      .some(c => c.selectedValues && c.selectedValues.length > 0);

    if (currentCategories.length > 0 && hasSelectedSubjects) {
      filterCourses(currentCategories);
    }
  }, [currentCategories, pivots, pinnedSubjects, filterCourses]);

  useEffect(() => {
    if (isFilterCoursesEmpty) {
      alert('No hay cursos disponibles con los filtros seleccionados')
      setIsFilterCoursesEmpty(false)
    }
  }, [isFilterCoursesEmpty])


  useEffect(() => {
    mapCategories();
  }, []);

  const [isSideBarOpen, setIsSideBarOpen] = React.useState(false);
  const toggleSideBar = () => {
    console.log(!isSideBarOpen)
    setIsSideBarOpen(!isSideBarOpen);
  }

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

  const handleSwitchView = (index: number) => {
    console.log(index);
    setIndexSelected(index);
  }

  const subjectsView = () => {
    return <SubjectsView
      pivots={pivots}
      setPivots={setPivots}
      key={0}
      toggleSideBar={toggleSideBar}
      isSideBarOpen={isSideBarOpen}
      currentCategories={currentCategories}
      handleClickFilter={handleClickFilter}
      pinnedSubjects={pinnedSubjects}
      setPinnedSubjects={setPinnedSubjects}
      onRemoveSubject={handleRemoveSubject}
    />
  }

  const schedulesView = () => {
    return <SchedulesView

      key={1}
      schedulesToShow={schedulesToShow}
      dayFormat={dayFormat}
      onChangeSchedulePage={onChangeSchedulePage}
      page={page}
      maxSubjectsCount={maxSubjectsCount}
      defaultSubjectsCount={defaultSubjectsCount}
      handleSliderChange={handleSliderChange}
      showConflicts={showConflicts} />
  }



  return <div className="flex flex-1 flex-col  overflow-auto  ">
    {showMessage && (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
        {generationMessage}
      </div>
    )}
    <div className="flex flex-col flex-1 overflow-auto   relative">

      {dayFormat == "long" ?
        <div className="flex flex-row  h-full">

          <div className="w-[25%] md:dark:bg-gray-950 md:bg-gray-100 md:border-r md:border-gray-300 dark:border-none">
            {subjectsView()}
          </div>
          <div className="w-[50%] ">
            {schedulesView()}
          </div>
          <div className="w-[25%] ">
            <CurrentSchedule
              schedule={schedulesToShow[page]}
              pinnedSubjects={pinnedSubjects}
              pivots={pivots}
              label={`Horario ${page + 1}/${schedulesToShow.length}`}
              showConflicts={showConflicts}
              setShowConflicts={setShowConflicts}
            />
          </div>

        </div>
        : (
          <>
            <div className="flex-1" style={{ display: indexSelected === 0 ? 'block' : 'none' }}>
              {subjectsView()}
            </div>

            <div style={{ display: indexSelected === 0 ? 'none' : 'block' }}>
              {schedulesView()}
              <CurrentSchedule
                schedule={schedulesToShow[page]}
                pinnedSubjects={pinnedSubjects}
                pivots={pivots}
                label={`Horario ${page + 1}/${schedulesToShow.length}`}
                showConflicts={showConflicts}
                setShowConflicts={setShowConflicts}
              />
            </div>

          </>
        )}


    </div>
    <div style={{ boxShadow: "0px 6px 10px black" }} className="  p-2 gap-3 flex flex-row justify-center z-20 dark:bg-gray-900 bg-white fixed bottom-0 self-center w-full md:hidden">

      <ButtonSwitchView index={0} isSelected={0 == indexSelected} label={"Materias"} onClick={handleSwitchView} />
      <ButtonSwitchView index={1} isSelected={1 == indexSelected} label={"Horarios"} onClick={handleSwitchView} />
    </div>
  </div>
};
export default GeneratorPage;



interface ButtonSwitchViewProps {
  label: string;
  isSelected: boolean;
  onClick: (index: number) => void;
  index: number;
}

const ButtonSwitchView = ({ isSelected, label, onClick, index }: ButtonSwitchViewProps) => {

  return (
    <button
      onClick={() => {
        onClick(index)
      }}
      className={`rounded-lg p-2  ${isSelected ? "bg-gray-700 text-white" : ""}`}>
      {label}
    </button>
  )
}
