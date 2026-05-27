import { Course } from "@/domain/entities/Course";
import CourseFilter from "./CourseFilter";
import { Degree } from "@/domain/entities/Degree";

export default class DegreeFilter implements CourseFilter {
    private _degrees: Degree[];

    constructor(degrees: Degree[]) {
        this._degrees = degrees;
    }

    satisfy(course: Course): boolean {
        if (this._degrees.length === 0) {
            return true;
        }
        return this._degrees.some(degree => course.subject.degrees.includes(degree.id));
    }
}