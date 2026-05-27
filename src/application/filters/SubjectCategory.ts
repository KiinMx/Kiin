import CourseFilter from "./CourseFilter";
import { Degree } from "@/domain/entities/Degree";
import DynamicCategory from "./DynamicCategory";
import { Subject } from "@/domain/entities/Subject";
import SubjectFilter from "./SubjectFilter";

export default class SubjectCategory extends DynamicCategory<Subject> {

    private _semester: number;
   
    constructor(semester: number, values: Subject[]) {
        super(`Semestre ${semester}`, values.filter(s => s.semestre.includes(semester)).map(subject => ({ label: subject.name, id: subject.id, value: subject })));
        this._semester = semester;
    }
    
    filterWithDegreesAndSemesters(selectedDegrees: Degree[]): { label: string; id: number; value: Subject; }[] {
        return this._original_values.filter(subject =>
            (selectedDegrees.length > 0 ? selectedDegrees.some(degree => subject.value.degrees.includes(degree.id)) : true)
            &&
            (subject.value.semestre.includes(this._semester) || subject.value.semestre.length === 0)
        );

    }

    toCourseFilter(): CourseFilter {
        return new SubjectFilter(Array.from(this._selectedValues.values()));
    }
    
}