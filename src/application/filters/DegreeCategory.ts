import Category from "./Category";
import CourseFilter from "./CourseFilter";
import { Degree } from "@/domain/entities/Degree";
import DegreeFilter from "./DegreeFilter";

export default class DegreeCategory implements Category {
    title: string;
    values: { label: string, id: number, value: Degree }[];
    private _selectedValues: Degree[] = [];

    constructor(title: string, values: Degree[]) {
        this.title = title;
        this.values = values.map(degree => ({ label: degree.name, id: degree.id, value: degree }));
    }

    filterWithCategories() {
        // NOT IMPLEMENTED
    }

    onClick(id: number): void {
        const selectedDegree = this._selectedValues[0];

        if (selectedDegree?.id !== id) {
            const newSelectedDegree = this.values.find(degree => degree.id === id);
            if (!newSelectedDegree) return;

            this._selectedValues[0] = newSelectedDegree.value;

            return;
        }

        this._selectedValues.splice(0, 1);
    }

    get selectedValues(): Degree[] {
        return this._selectedValues;
    }

    toCourseFilter(): CourseFilter {
        return new DegreeFilter(this._selectedValues);
    }

    isSelected(id: number): boolean {
        return this._selectedValues.some(degree => degree.id === id);
    }
}