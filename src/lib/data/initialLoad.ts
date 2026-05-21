import { Courses } from "@/pages/api/courses/all";
import { Degrees } from "@/pages/api/degrees/all";
import { Professors } from "@/pages/api/professors/all";
import { Subjects } from "@/pages/api/subjects/all";
import { DEFAULT_FACULTY, FacultySlug } from "./FacultyLoaderFactory";

/** Tracks which faculties have already been fully loaded to prevent duplicate work. */
const _loadedFaculties = new Set<string>();

export async function globalInitialLoad(faculty: string = DEFAULT_FACULTY) {
  if (_loadedFaculties.has(faculty)) return;

  await Degrees.initialLoad(faculty);
  await Subjects.initialLoad(faculty);
  await Professors.initialLoad(faculty);
  await Courses.initialLoad(faculty);

  const courses = Courses.getCoursesForFaculty(faculty as FacultySlug);

  for (const course of courses) {
    const subject = course.subject;
    subject.addCourse(course.id);

    const professor = course.professor;
    if (subject.professors.find(professorId => professorId === professor.id) === undefined) {
      subject.addProfessor(professor.id);
    }
  }

  _loadedFaculties.add(faculty);
}

/** Clears the loaded-faculties set (useful in tests). */
export function clearInitialLoadCache() {
  _loadedFaculties.clear();
}