import { Course } from "./Course";
import { Pivot } from "./Pivot";
import { Professor } from "./Professor";
import { Subject } from "./Subject";


export class Schedule {

    private _id: number;
    private _subjects: Subject[] = [];
    private _professors: Set<Professor> = new Set();
    private _courses: Course[] = [];
    private _incompatibleCourses: Course[] = [];

    public get incompatibleCourses(): Course[] {
        return this._incompatibleCourses;
    }

    public set incompatibleCourses(value: Course[]) {
        this._incompatibleCourses = value;
    }

    public addIncompatibleCourse(course: Course): void {
        this._incompatibleCourses.push(course);
    }
    
    constructor(id: number) {
        this._id = id;
    }

    public get id(): number {
        return this._id;
    }

    public get subjects(): Subject[] {
        return this._subjects;
    }

    public get professors(): Set<Professor> {
        return this._professors;
    }

    public get courses(): Course[] {
        return this._courses;
    }

    public addSubject(subject: Subject): void {
        this._subjects.push(subject);
    }

    public addProfessor(professor: Professor): void {
        this._professors.add(professor);
    }

    public addCourse(course: Course): void {
        this._courses.push(course);
        this._subjects.push(course.subject)
        this.professors.add(course.professor)
    }

    public set subjects(subjects: Subject[]) {
        this._subjects = subjects;
    }

    public set professors(professors: Set<Professor>) {
        this._professors = professors;
    }

    public set courses(courses: Course[]) {
        this._courses = courses;
        // Reset subjects and professors to keep them in sync with courses
        this._subjects = [];
        this._professors = new Set();
        for (const course of courses) {
            this._subjects.push(course.subject);
            this._professors.add(course.professor);
        }
    }


    public hasAllPinnedSubjects(pinnedSubjectIds: number[]): boolean {

    if (pinnedSubjectIds.length === 0) return true;

    return pinnedSubjectIds.every(subjectId =>

        this._courses.some(course => course.subject.id === subjectId)

    );

}

public hasPivots(pivots: Pivot[]): boolean {

    if (pivots.length === 0) return true;

    const pivotsBySubject = new Map<number, number[]>();

    for (const pivot of pivots) {

        const existing = pivotsBySubject.get(pivot.idSubject) ?? [];

        existing.push(pivot.idProfessor);

        pivotsBySubject.set(pivot.idSubject, existing);

    }

    for (const [subjectId, professorIds] of pivotsBySubject) {

        const courseForSubject = this._courses.find(

            course => course.subject.id === subjectId

        );

        if (courseForSubject && !professorIds.includes(courseForSubject.professor.id)) {

            return false;

        }

    }

    return true;

}


    



}