import Category from '@/domain/entities/Category';
import { Professor } from '@/domain/entities/Professor';
import { Subject } from '@/domain/entities/Subject';
import SubjectCategory from '@/domain/entities/SubjectCategory';
import { ProfessorsCsvDataSource } from '@/infrastructure/datasource/ProfessorsCsvDataSource';
import { useEffect, useState } from 'react';
import Pivot from '../../domain/entities/Pivot';
import FilterSelector from '../components/FilterSelector';
import SideBar from '../components/SideBar';

interface SubjctsViewProps {
    toggleSideBar: () => void;
    isSideBarOpen: boolean;
    currentCategories: Category[];
    handleClickFilter: (category: Category[]) => void;
    setPivots: (ids: Pivot[]) => void,
    pivots: Pivot[];
    pinnedSubjects: number[],
    setPinnedSubjects: (pinnedSubjects: number[]) => void;
    onRemoveSubject: (categoryIndex: number, subjectId: number) => void;
}



function SubjectsView({
    toggleSideBar,
    isSideBarOpen,
    currentCategories,
    handleClickFilter,
    pivots,
    setPivots,
    pinnedSubjects,
    setPinnedSubjects,
    onRemoveSubject

}: SubjctsViewProps) {



    const [professorsData, setProfessorsData] = useState<Professor[]>([])

    const getProfessors = async () => {
        const professorsDataSource = new ProfessorsCsvDataSource()
        const professorsData = await professorsDataSource.getAll();
        setProfessorsData(professorsData)
    }

    useEffect(() => {
        getProfessors()
    }, [])



    useEffect(() => {
        console.log(pinnedSubjects)
    }, [pinnedSubjects])

    return (
        <div className='h-full flex flex-col relative '>
            <div className='flex flex-row gap-5 justify-center absolute self-center mt-2.5 backdrop-blur-sm  w-[93%]'>
                <button
                    onClick={toggleSideBar}
                    className=" bg-purple-500 text-gray-100 flex flex-row gap-2 rounded-md items-center p-2"
                    type="button"
                >
                    Selecciona tus Materias
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        className="size-6 stroke-white transition-colors duration-300"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                </button>
            </div>
            <div className=' flex-1 overflow-auto flex flex-col gap-2 p-4 pb-24 pt-16'>

                <span className='text-gray-500'>Los horarios se generan automáticamente al seleccionar materias, profesores o fijar opciones</span>

                {currentCategories?.filter(c => c instanceof SubjectCategory).map(
                    (sb, categoryIndex) => (
                        (
                            sb.selectedValues?.map(
                                (sbv) => (
                                    <SubjectCard
                                        setPinnedSubjects={setPinnedSubjects}
                                        pinnedSubjects={pinnedSubjects}
                                        category={sb}
                                        pivots={pivots}
                                        setPivots={setPivots}
                                        key={sbv.id}
                                        subject={sbv}
                                        allProfessors={professorsData}
                                        onRemoveSubject={(subjectId) => onRemoveSubject(categoryIndex + 1, subjectId)}
                                    />
                                )
                            )
                        )
                    )
                )}

            </div>

            <SideBar toggleSideBar={toggleSideBar} isOpen={isSideBarOpen}>
                <FilterSelector
                    categories={currentCategories}
                    onClick={handleClickFilter}

                />
            </SideBar>



        </div>
    );

}

interface SubjectCardProps {
    subject: Subject;
    allProfessors: Professor[]
    setPivots: (ids: Pivot[]) => void,
    pivots: Pivot[];
    category: Category;
    pinnedSubjects: number[],
    setPinnedSubjects: (pinnedSubjects: number[]) => void;
    onRemoveSubject: (subjectId: number) => void;
}

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



function SubjectCard({ subject, allProfessors, pivots, setPivots, pinnedSubjects, setPinnedSubjects, onRemoveSubject }: SubjectCardProps) {

    const [showProfessors, setShowProfessors] = useState(true);

    useEffect(() => {
        const hasPivots = pivots.some(p => p.idSubject === subject.id);
        if (!hasPivots && allProfessors.length > 0) {
            const newPivots = allProfessors
                .filter(prof => subject.professors.includes(prof.id))
                .map(prof => Pivot.create(subject.id, prof.id));

            if (newPivots.length > 0) {
                setPivots([...pivots, ...newPivots]);
            }
        }
    }, [subject.id, subject.professors, allProfessors, pivots, setPivots]);

    const isSelected = pinnedSubjects.find(subj => subj === subject.id) !== undefined

    return <div className='border-2 border-gray-600 rounded-large p-2 px-2'>

        <div className='flex flex-row '>

            <div className=' flex-1'>
                {subject.name}

            </div>
            <button
                onClick={() => {
                    if (!isSelected) {
                        setPinnedSubjects([...pinnedSubjects, subject.id])
                    } else {
                        setPinnedSubjects(pinnedSubjects.filter(ps => (ps !== subject.id)))
                    }
                }}

                className={`border-2 border-purple-900 ${isSelected ? "bg-purple-900 text-white" : ""}  rounded-large h-max p-1 flex flex-row mr-2`}>

                {isSelected ? <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M680-840v80h-40v327l-80-80v-247H400v87l-87-87-33-33v-47h400ZM480-40l-40-40v-240H240v-80l80-80v-46L56-792l56-56 736 736-58 56-264-264h-6v240l-40 40ZM354-400h92l-44-44-2-2-46 46Zm126-193Zm-78 149Z" /></svg>
                    : <svg className='fill-black dark:fill-white' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z" /></svg>
                }


                {isSelected ? "Fijado" : "Fijar"}



            </button>
            <button
                className='border-2 border-red-600 rounded-large h-max p-1 flex flex-row items-center justify-center md:hover:bg-red-600 md:hover:text-white transition'
                onClick={() => onRemoveSubject(subject.id)}
                title="Eliminar materia"
            >
                <svg className='fill-red-600 md:hover:fill-white transition' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
            </button>
        </div>
        <div className='h-1 rounded-large  mb-1 mt-1 w-full' style={{ backgroundColor: colors[subject.id % colors.length] }}></div>

        <div className='flex flex-row items-center gap-2 dark:text-gray-400 text-gray-600 '>
            {subject.type}
            {/* <div className='h-2 w-2 rounded-large dark:bg-gray-400 bg-gray-400 inline-block'></div>
            8 Créditos */}
            <div className='h-2 w-2 bg-dark dark:bg-white rounded-full '></div>
            {subject.credits} Créditos
        </div>
        <div className='dark:text-gray-400 text-gray-600 mb-1'>
            Semestre {(Array.from((new Set(subject.semestre)))).join(", ")}
        </div>
        <div className='flex justify-between flex-row items-center mb-2 dark:text-gray-400 text-gray-600 m'>
            <div className='flex flex-row items-center gap-1'>
                <svg className='mr-2 dark:fill-white fill-black' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z" /></svg>
                {subject.degreeResume.split("-").join(", ")}
            </div>


            <div className='flex flex-row justify-end'>
                <button
                    onClick={
                        () => setShowProfessors(!showProfessors)
                    }
                    className={`text-white flex flex-row items-center border border-gray-500 rounded-lg w-max p-2 text-sm ${showProfessors ? "bg-gray-700" : "bg-gray-800"}`}>
                    {showProfessors ?
                        <svg className='inline mr-1' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" /></svg>
                        : <svg className='inline mr-1' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
                    }
                    <span className='' style={{ lineHeight: 0 }}>
                        Profesores
                    </span>
                </button>
            </div>
        </div>



        <div className={`flex flex-col gap-1 ${showProfessors ? "static" : "hidden"}`}>
            {allProfessors.filter(professor => subject.professors.includes(professor.id)).map(e => (
                <ProfessorRow setPivots={setPivots} pivots={pivots} key={e.id} professor={e} idSubject={subject.id}></ProfessorRow>
            ))}
        </div>
    </div>
}

export default SubjectsView


function ProfessorRow({ professor, setPivots: setSelectedProfessors, pivots: selectedPivots, idSubject }
    : {
        professor: Professor,
        setPivots: (ids: Pivot[]) => void,
        pivots: Pivot[];
        idSubject: number
    }) {

    const currentSubjectPivots = selectedPivots.filter(pivot => pivot.idSubject === idSubject);

    const isSelected = selectedPivots.some(
        selectedPivot => (
            selectedPivot.idProfessor === professor.id && selectedPivot.idSubject == idSubject
        )
    );

    const isLastActive = isSelected && currentSubjectPivots.length === 1;

    return (
        <div key={professor.id} className=' flex flex-row'>
            <button
                disabled={isLastActive}
                title={isLastActive ? "Para desfijar todos los profesores, debes eliminar la materia seleccionada" : undefined}
                style={{ cursor: isLastActive ? "not-allowed" : "pointer" }}
                onClick={() => {
                    if (isLastActive) return;
                    if (isSelected) {
                        setSelectedProfessors(selectedPivots.filter(pivot => pivot.idProfessor != professor.id));
                    } else {
                        setSelectedProfessors([...selectedPivots, Pivot.create(idSubject, professor.id)]);
                    }
                }}
                className={`border-2 border-purple-600 ${isSelected ? "bg-purple-600 text-white" : ""}  rounded-large h-max p-1 flex flex-row mr-2 ${isLastActive ? "opacity-50" : ""}`}>
                {/* Omitted rendering logic text/svg */}
                {isSelected ? "Fijado" : "Fijar"}
            </button>
            <span className='mt-2 border-red-500'>
                {professor.fullName}
            </span>
        </div>
    )

}