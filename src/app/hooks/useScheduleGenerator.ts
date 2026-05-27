import Category from "@/application/filters/Category";
import { default as CourseFilter } from "@/application/filters/CourseFilter";
import { Pivot } from "@/application/filters/Pivot";
import SubjectCategory from "@/application/filters/SubjectCategory";
import { Degree } from "@/domain/entities/Degree";
import { School } from "@/domain/entities/School";
import { Schedule } from "@/domain/entities/Schedule";
import { Subject } from "@/domain/entities/Subject";
import { ScheduleUseCase } from "@/domain/use_cases/ScheduleUseCase";
import { AcademicOfferRepository } from "@/domain/repositories/AcademicOfferRepository";
import { LocalAcademicOfferRepository } from "@/infrastructure/repositories/LocalAcademicOfferRepository";
import { RemoteAcademicOfferRepository } from "@/infrastructure/repositories/RemoteAcademicOfferRepository";
import { container } from "@/infrastructure/container";
import { useCallback, useEffect, useMemo, useState } from "react";

interface NotificationState {
    message: string;
    visible: boolean;
}

interface UseScheduleGeneratorReturn {
    generatedSchedules: Schedule[];
    schedulesToShow: Schedule[];
    currentCategories: Category[];
    setCurrentCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    pivots: Pivot[];
    setPivots: React.Dispatch<React.SetStateAction<Pivot[]>>;
    pinnedSubjects: number[];
    setPinnedSubjects: React.Dispatch<React.SetStateAction<number[]>>;
    notification: NotificationState;
    isFilterCoursesEmpty: boolean;
    generateSchedules: (categories: Category[]) => Promise<void>;
    handleCategoryClick: (categories: Category[]) => void;
    handleRemoveSubject: (categoryIndex: number, subjectId: number) => void;
    selectedSubjectsCount: number | number[];
    setSelectedSubjectsCount: React.Dispatch<React.SetStateAction<number | number[]>>;
    maxSubjectsCount: number;
    defaultSubjectsCount: number;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    school: School | undefined;
}

export function useScheduleGenerator(schoolSlug: string): UseScheduleGeneratorReturn {
    const scheduleUseCase = useMemo(() => new ScheduleUseCase(), []);
    const school = useMemo(() => School.fromSlug(schoolSlug), [schoolSlug]);

    const repository = useMemo(() => {
        const key = `AcademicOfferRepository:${schoolSlug}`;
        container.register(key, () =>
            new LocalAcademicOfferRepository(
                new RemoteAcademicOfferRepository(schoolSlug),
                schoolSlug
            )
        );
        return container.resolve<AcademicOfferRepository>(key);
    }, [schoolSlug]);

    const [generatedSchedules, setGeneratedSchedules] = useState<Schedule[]>([]);
    const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
    const [pivots, setPivots] = useState<Pivot[]>([]);
    const [pinnedSubjects, setPinnedSubjects] = useState<number[]>([]);
    const [isFilterCoursesEmpty, setIsFilterCoursesEmpty] = useState(false);
    const [selectedSubjectsCount, setSelectedSubjectsCount] = useState<number | number[]>(0);
    const [maxSubjectsCount, setMaxSubjectsCount] = useState(0);
    const [defaultSubjectsCount, setDefaultSubjectsCount] = useState(0);
    const [page, setPage] = useState(0);
    const [notification, setNotification] = useState<NotificationState>({
        message: "",
        visible: false
    });

    const showNotification = useCallback((message: string, duration: number = 3000) => {
        setNotification({ message, visible: true });
        setTimeout(() => setNotification({ message: "", visible: false }), duration);
    }, []);

    const schedulesToShow = useMemo(() => {
        if (typeof selectedSubjectsCount === "number" && selectedSubjectsCount > 0) {
            return generatedSchedules.filter(
                gs => gs.courses.length === selectedSubjectsCount
            );
        }
        return generatedSchedules;
    }, [generatedSchedules, selectedSubjectsCount]);

    const generateSchedules = useCallback(async (categories: Category[]) => {
        showNotification("Generando horarios...");

        const allCourses = await repository.getCourses();

        const courseFilters: CourseFilter[] = categories.map(c => c.toCourseFilter());
        const filteredCourses = allCourses.filter(course =>
            courseFilters.every(f => f.satisfy(course))
        );

        if (filteredCourses.length === 0) {
            setGeneratedSchedules([]);
            setIsFilterCoursesEmpty(true);
            setNotification({ message: "", visible: false });
            return;
        }

        const result = scheduleUseCase.generateSchedules(filteredCourses, pinnedSubjects, pivots);

        setDefaultSubjectsCount(result.maxCourses);
        setGeneratedSchedules(result.schedules);
        showNotification(`${result.schedules.length} Horarios Generados!`);
    }, [pinnedSubjects, pivots, scheduleUseCase, showNotification, repository]);

    const handleCategoryClick = useCallback((categories: Category[]) => {
        setCurrentCategories(categories);
        const { cleanPinnedSubjects, cleanPivots, maxSubjectsCount } = scheduleUseCase.cleanOrphanedState(categories, pinnedSubjects, pivots);
        setPinnedSubjects(cleanPinnedSubjects);
        setPivots(cleanPivots);
        setMaxSubjectsCount(maxSubjectsCount);
    }, [pinnedSubjects, pivots, scheduleUseCase]);

    const handleRemoveSubject = useCallback((categoryIndex: number, subjectId: number) => {
        const newCategories = [...currentCategories];
        const category = newCategories[categoryIndex];
        category.onClick(subjectId);
        newCategories[categoryIndex] = category;
        currentCategories.forEach(cat => cat.filterWithCategories(newCategories));
        handleCategoryClick(newCategories);
    }, [currentCategories, handleCategoryClick]);

    useEffect(() => {
        const hasSelectedSubjects = currentCategories
            .filter(c => c instanceof SubjectCategory)
            .some(c => c.selectedValues && c.selectedValues.length > 0);

        if (currentCategories.length > 0 && hasSelectedSubjects) {
            generateSchedules(currentCategories);
        }
    }, [currentCategories, pivots, pinnedSubjects, generateSchedules]);

    const mapCategories = useCallback(async () => {
        if (!school) return;
        const degrees: Degree[] = await repository.getDegrees();
        const subjects: Subject[] = await repository.getSubjects();
        setCurrentCategories(scheduleUseCase.buildInitialCategories(degrees, subjects));
    }, [scheduleUseCase, school, repository]);

    useEffect(() => {
        mapCategories();
    }, [mapCategories]);

    useEffect(() => {
        if (isFilterCoursesEmpty) {
            alert("No hay cursos disponibles con los filtros seleccionados");
            setIsFilterCoursesEmpty(false);
        }
    }, [isFilterCoursesEmpty]);

    return {
        generatedSchedules,
        schedulesToShow,
        currentCategories,
        setCurrentCategories,
        pivots,
        setPivots,
        pinnedSubjects,
        setPinnedSubjects,
        notification,
        isFilterCoursesEmpty,
        generateSchedules,
        handleCategoryClick,
        handleRemoveSubject,
        selectedSubjectsCount,
        setSelectedSubjectsCount,
        maxSubjectsCount,
        defaultSubjectsCount,
        page,
        setPage,
        school,
    };
}
