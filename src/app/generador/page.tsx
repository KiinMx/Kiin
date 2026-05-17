"use client";

import { useScheduleGenerator } from "@/app/hooks/useScheduleGenerator";
import { ScheduleState } from "@/app/hooks/useGoogleAuth";
import SubjectCategory from "@/domain/entities/SubjectCategory";
import SchedulesView from "../widgets/SchedulesView";
import SubjectsView from "../widgets/SubjectsView";
import CurrentSchedule from "../widgets/CurrentSchedule";
import { useState, useEffect, useRef } from "react";

const GeneratorPage = () => {
    const [indexSelected, setIndexSelected] = useState(0);
    const [isSideBarOpen, setIsSideBarOpen] = useState(false);
    const [dayFormat, setDayFormat] = useState<"short" | "long">("long");
    const [showConflicts, setShowConflicts] = useState(false);
    const [pendingRestore, setPendingRestore] = useState<ScheduleState | null>(null);
    const restoredPageRef = useRef<number | null>(null);

    const {
        schedulesToShow,
        currentCategories,
        setCurrentCategories,
        pivots,
        setPivots,
        pinnedSubjects,
        setPinnedSubjects,
        notification,
        handleCategoryClick,
        handleRemoveSubject,
        maxSubjectsCount,
        defaultSubjectsCount,
        setSelectedSubjectsCount,
        page,
        setPage,
        generateSchedules
    } = useScheduleGenerator();

    useEffect(() => {
        const handleResize = () => {
            setDayFormat(window.innerWidth > 640 ? "long" : "short");
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Leer localStorage al montar (post-OAuth redirect)
    useEffect(() => {
        const raw = localStorage.getItem('schedule_state_before_oauth');
        if (!raw) return;

        try {
            const state: ScheduleState = JSON.parse(raw);
            setPendingRestore(state);
            localStorage.removeItem('schedule_state_before_oauth');
        } catch (e) {
            console.error('Failed to parse schedule state', e);
        }
    }, []);

    // Restaurar categorías, pivots y pinned cuando currentCategories ya esté cargado
    useEffect(() => {
        if (!pendingRestore || currentCategories.length === 0) return;

        const state = pendingRestore;

        // Marcar materias seleccionadas en las categorías existentes
        const newCategories = currentCategories.map(cat => {
            if (cat instanceof SubjectCategory && state.selectedSubjectIds) {
                state.selectedSubjectIds.forEach(id => {
                    if (cat.values.some(v => v.id === id)) {
                        cat.onClick(id);
                    }
                });
            }
            return cat;
        });

        setCurrentCategories(newCategories);
        setPivots(state.pivots ?? []);
        setPinnedSubjects(state.pinnedSubjects ?? []);

        // Generar horarios con el estado restaurado
        generateSchedules(newCategories);

        // Guardar page para aplicar después de que los horarios se generen
        if (typeof state.page === 'number') {
            restoredPageRef.current = state.page;
        }

        setPendingRestore(null);
    }, [pendingRestore, currentCategories, setCurrentCategories, setPivots, setPinnedSubjects, generateSchedules]);

    // Aplicar page restaurado una vez que los horarios estén disponibles
    useEffect(() => {
        if (restoredPageRef.current === null) return;
        if (schedulesToShow.length === 0) return;

        const target = Math.min(restoredPageRef.current, schedulesToShow.length - 1);
        if (target >= 0) {
            setPage(target);
        }
        restoredPageRef.current = null;
    }, [schedulesToShow, setPage]);

    const toggleSideBar = () => setIsSideBarOpen(prev => !prev);
    const handleSwitchView = (index: number) => setIndexSelected(index);

    return (
        <div className="flex flex-1 flex-col overflow-auto">
            {notification.visible && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
                    {notification.message}
                </div>
            )}
            <div className="flex flex-col flex-1 overflow-auto relative">
                {dayFormat === "long" ? (
                    <div className="flex flex-row h-full">
                        <div className="w-[25%] md:dark:bg-gray-950 md:bg-gray-100 md:border-r md:border-gray-300 dark:border-none">
                            <SubjectsView
                                pivots={pivots}
                                setPivots={setPivots}
                                toggleSideBar={toggleSideBar}
                                isSideBarOpen={isSideBarOpen}
                                currentCategories={currentCategories}
                                handleClickFilter={handleCategoryClick}
                                pinnedSubjects={pinnedSubjects}
                                setPinnedSubjects={setPinnedSubjects}
                                onRemoveSubject={handleRemoveSubject}
                            />
                        </div>
                        <div className="w-[50%]">
                            <SchedulesView
                                schedulesToShow={schedulesToShow}
                                dayFormat={dayFormat}
                                onChangeSchedulePage={setPage}
                                page={page}
                                maxSubjectsCount={maxSubjectsCount}
                                defaultSubjectsCount={defaultSubjectsCount}
                                handleSliderChange={setSelectedSubjectsCount}
                                showConflicts={showConflicts}
                            />
                        </div>
                        <div className="w-[25%]">
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
                ) : (
                    <>
                        <div className="flex-1" style={{ display: indexSelected === 0 ? "block" : "none" }}>
                            <SubjectsView
                                pivots={pivots}
                                setPivots={setPivots}
                                toggleSideBar={toggleSideBar}
                                isSideBarOpen={isSideBarOpen}
                                currentCategories={currentCategories}
                                handleClickFilter={handleCategoryClick}
                                pinnedSubjects={pinnedSubjects}
                                setPinnedSubjects={setPinnedSubjects}
                                onRemoveSubject={handleRemoveSubject}
                            />
                        </div>
                        <div style={{ display: indexSelected === 0 ? "none" : "block" }}>
                            <SchedulesView
                                schedulesToShow={schedulesToShow}
                                dayFormat={dayFormat}
                                onChangeSchedulePage={setPage}
                                page={page}
                                maxSubjectsCount={maxSubjectsCount}
                                defaultSubjectsCount={defaultSubjectsCount}
                                handleSliderChange={setSelectedSubjectsCount}
                                showConflicts={showConflicts}
                            />
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
            <div className="p-2 gap-3 flex flex-row justify-center z-20 dark:bg-gray-900 bg-white fixed bottom-0 self-center w-full md:hidden"
                style={{ boxShadow: "0px 6px 10px black" }}>
                <ButtonSwitchView index={0} isSelected={indexSelected === 0} label="Materias" onClick={handleSwitchView} />
                <ButtonSwitchView index={1} isSelected={indexSelected === 1} label="Horarios" onClick={handleSwitchView} />
            </div>
        </div>
    );
};

export default GeneratorPage;

interface ButtonSwitchViewProps {
    label: string;
    isSelected: boolean;
    onClick: (index: number) => void;
    index: number;
}

function ButtonSwitchView({ isSelected, label, onClick, index }: ButtonSwitchViewProps) {
    return (
        <button
            onClick={() => onClick(index)}
            className={`rounded-lg p-2 ${isSelected ? "bg-gray-700 text-white" : ""}`}>
            {label}
        </button>
    );
}
