import { Course } from "@/domain/entities/Course";
import CourseFilter from "./CourseFilter";
import { Subject } from "@/domain/entities/Subject";

export default class SubjectFilter implements CourseFilter {
    private _subjects: Subject[];

    constructor(subjects: Subject[]) {
        this._subjects = subjects;
    }

    satisfy(course: Course): boolean {
        if (this._subjects.length === 0) {
            return true;
        }
        return this._subjects.some(subject => subject.id === course.subject.id);
    }

    
    public get subjects() : Subject[] {
        return this._subjects;
    }
    
}