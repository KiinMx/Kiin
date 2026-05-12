import { useState, useCallback, useMemo, useEffect } from "react";
import { Schedule } from "@/domain/entities/Schedule";
import { ScheduleGenerator } from "@/domain/entities/ScheduleGenerator";
import { Pivot } from "@/domain/entities/Pivot";
import Category from "@/domain/entities/Category";
import SubjectCategory from "@/domain/entities/SubjectCategory";
import { CoursesCsvDatasource } from "@/infrastructure/datasource/CoursesCsvDatasource";
import { DegreesCsvDataSource } from "@/infrastructure/datasource/DegreesCsvDataSource";
import { SubjectsCsvDataSource } from "@/infrastructure/datasource/SubjectsCSvDataSource";
import { FilterImpl } from "@/infrastructure/datasource/FilterImpl";
import { PinnedSubjectFilter } from "@/domain/entities/PinnedSubjectFilter";
import { PivotFilter } from "@/domain/entities/PivotFilter";
import { PostGenerationFilter } from "@/domain/entities/PostGenerationFilter";
import { Degree } from "@/domain/entities/Degree";
import DegreeCategory from "@/domain/entities/DegreeCategory";
import { Subject } from "@/domain/entities/Subject";

interface NotificationState {
    message: string;
    visible: boolean;
}

interface UseScheduleGeneratorReturn {
    generatedSchedules: Schedule[];
    schedulesToShow: Schedule[];
    currentCategories: Category[];
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
}

export function useScheduleGenerator(): UseScheduleGeneratorReturn {
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

    const removeOrphanPinnedItems = useCallback((categories: Category[]): {
        cleanPinnedSubjects: number[];
        cleanPivots: Pivot[];
    } => {
        const semestersWithSubjectsSelected = categories.filter(
            c => c instanceof SubjectCategory
        );
        const selectedSubjectIds = semestersWithSubjectsSelected.flatMap(
            s => s.selectedValues.flatMap(sv => (sv as { id: number }).id)
        );
        return {
            cleanPinnedSubjects: pinnedSubjects.filter(id =>
                selectedSubjectIds.includes(id)
            ),
            cleanPivots: pivots.filter(p =>
                selectedSubjectIds.includes(p.idSubject)
            )
        };
    }, [pinnedSubjects, pivots]);

    const generateSchedules = useCallback(async (categories: Category[]) => {
        setPage(0);
        showNotification("Generando horarios...");

        const data = new CoursesCsvDatasource();
        const filter = new FilterImpl(categories.map(c => c.toCourseFilter()));
        const courses = await data.getCoursesByFilter(filter);

        if (courses.length === 0) {
            setGeneratedSchedules([]);
            setIsFilterCoursesEmpty(true);
            setNotification({ message: "", visible: false });
            return;
        }

        const generator = new ScheduleGenerator();
        const schedules = generator.generateSchedules(courses);

        const pipeline: PostGenerationFilter[] = [
            new PinnedSubjectFilter(pinnedSubjects),
            new PivotFilter(pivots)
        ];

        const filtered = pipeline.reduce(
            (result, filter) => filter.apply(result),
            schedules
        );

        const sorted = filtered.sort((a, b) => b.courses.length - a.courses.length);
        const maxCourses = sorted.length > 0
            ? Math.max(...sorted.map(s => s.courses.length))
            : 0;

        setDefaultSubjectsCount(maxCourses);
        setGeneratedSchedules(sorted);
        showNotification(`${sorted.length} Horarios Generados!`);
    }, [pinnedSubjects, pivots, showNotification]);

    const handleCategoryClick = useCallback((categories: Category[]) => {
        setCurrentCategories(categories);
        const { cleanPinnedSubjects, cleanPivots } = removeOrphanPinnedItems(categories);
        setPinnedSubjects(cleanPinnedSubjects);
        setPivots(cleanPivots);

        const semestersWithSubjectsSelected = categories.filter(
            c => c instanceof SubjectCategory
        );
        let count = 0;
        semestersWithSubjectsSelected.forEach(c => {
            count += c.selectedValues.length;
        });
        setMaxSubjectsCount(count);
    }, [removeOrphanPinnedItems]);

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
        const degrees: Degree[] = await (new DegreesCsvDataSource()).getAll();
        const degreesCategory: Category = new DegreeCategory("Carrera", degrees);
        const subjects: Subject[] = await (new SubjectsCsvDataSource()).getAll();
        const semesters: SubjectCategory[] = Array(9).fill(0).map((_, index) => new SubjectCategory(index + 1, subjects));

        setCurrentCategories([degreesCategory, ...semesters]);
    }, []);

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
        setPage
    };
}