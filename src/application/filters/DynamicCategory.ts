import Category from "./Category";
import CourseFilter from "./CourseFilter";
import { Degree } from "@/domain/entities/Degree";
import DegreeCategory from "./DegreeCategory";

/**
 * This class is responsible for managing the dynamic categories of the filters using degree and semester categories
 * @param T The type of the values of the category
 */
export default abstract class DynamicCategory<T> implements Category {
    title: string;
    values: { label: string; id: number; value: T; }[];
    _original_values: { label: string; id: number; value: T; }[];
    _selectedValues: Map<number, T> = new Map<number, T>();//Key values is the same as the id of the values array

    constructor(title: string, values: { label: string; id: number; value: T; }[]) {
        this.title = title;
        this.values = values;
        this._original_values = this.values;
    }

    filterWithCategories(categories: Category[]): void {
        const categoriesHashMap: Map<string, Category> = new Map(categories.map(category => [category.title, category]));
        const degreeCategory = categoriesHashMap.get('Carrera') as (DegreeCategory | undefined);

        const isSelected = degreeCategory && (degreeCategory.selectedValues.length > 0 )
        if (!isSelected) {
            this.values = this._original_values;
            return;
        };
        const selectedDegrees = degreeCategory.selectedValues;
        this.values = this.filterWithDegreesAndSemesters(selectedDegrees);
        this.deleteSelectedValuesWithoutRelation()
    }

    deleteSelectedValuesWithoutRelation() {
        const selectedValuesToKeep = this.values.filter(value => this._selectedValues.has(value.id));
        this._selectedValues.clear();
        selectedValuesToKeep.forEach(value => this._selectedValues.set(value.id, value.value));
    }

    abstract filterWithDegreesAndSemesters(selectedDegrees: Degree[]): { label: string; id: number; value: T; }[]

    get selectedValues(): T[] {
        return Array.from(this._selectedValues.values());
    }
    abstract toCourseFilter(): CourseFilter
    onClick(id: number): void {
        const selectedSubject = this._selectedValues.get(id);
        const isSelected = selectedSubject !== undefined;
        if (isSelected) {
            this._selectedValues.delete(id);
            return;
        }

        const newSelectedSubject = this.values.find(value => value.id === id);
        if (!newSelectedSubject) return
        this._selectedValues.set(newSelectedSubject.id, newSelectedSubject.value);
    }

    isSelected(id: number): boolean {
        return this._selectedValues.has(id);
    }
}