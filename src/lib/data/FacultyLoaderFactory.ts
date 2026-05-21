import { CourseCSV } from "./CourseModel";
import { CoursesModelDao } from "./CoursesModelDAO";
import { PsicologiaModelDAO } from "./PsicologiaModelDAO";

export type FacultySlug = "matematicas" | "psicologia";

interface FacultyDAO {
    getCourses(): Promise<CourseCSV[]>;
    getVersion?(): string;
    clearCache(): void;
}

const FACULTY_DAOS: Record<FacultySlug, FacultyDAO> = {
    matematicas: CoursesModelDao,
    psicologia: PsicologiaModelDAO,
};

export const DEFAULT_FACULTY: FacultySlug = "matematicas";

export function getFacultyDAO(faculty: string): FacultyDAO {
    const slug = faculty as FacultySlug;
    return FACULTY_DAOS[slug] ?? FACULTY_DAOS[DEFAULT_FACULTY];
}

export function isValidFaculty(faculty: string): faculty is FacultySlug {
    return faculty in FACULTY_DAOS;
}
