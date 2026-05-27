import Category from "@/domain/entities/Category";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import DegreeCategory from "@/domain/entities/DegreeCategory";
import { PinnedSubjectFilter } from "@/domain/entities/PinnedSubjectFilter";
import { Pivot } from "@/domain/entities/Pivot";
import { PivotFilter } from "@/domain/entities/PivotFilter";
import { PostGenerationFilter } from "@/domain/entities/PostGenerationFilter";
import { Schedule } from "@/domain/entities/Schedule";
import { ScheduleGenerator } from "@/domain/entities/ScheduleGenerator";
import { Subject } from "@/domain/entities/Subject";
import SubjectCategory from "@/domain/entities/SubjectCategory";

export interface ScheduleGenerationResult {
	schedules: Schedule[];
	maxCourses: number;
}

export interface OrphanedScheduleState {
	cleanPinnedSubjects: number[];
	cleanPivots: Pivot[];
	maxSubjectsCount: number;
}

export class ScheduleUseCase {
	buildInitialCategories(degrees: Degree[], subjects: Subject[], semesterCount: number = 9): Category[] {
		const degreesCategory: Category = new DegreeCategory("Carrera", degrees);
		const semesters: SubjectCategory[] = Array(semesterCount)
			.fill(0)
			.map((_, index) => new SubjectCategory(index + 1, subjects));

		return [degreesCategory, ...semesters];
	}

	cleanOrphanedState(categories: Category[], pinnedSubjects: number[], pivots: Pivot[]): OrphanedScheduleState {
		const semestersWithSubjectsSelected = categories.filter(
			category => category instanceof SubjectCategory
		);

		const selectedSubjectIds = semestersWithSubjectsSelected.flatMap(
			semester => semester.selectedValues.flatMap(selectedValue => (selectedValue as { id: number }).id)
		);

		return {
			cleanPinnedSubjects: pinnedSubjects.filter(id => selectedSubjectIds.includes(id)),
			cleanPivots: pivots.filter(pivot => selectedSubjectIds.includes(pivot.idSubject)),
			maxSubjectsCount: semestersWithSubjectsSelected.reduce(
				(count, semester) => count + semester.selectedValues.length,
				0,
			),
		};
	}

	generateSchedules(courses: Course[], pinnedSubjects: number[], pivots: Pivot[]): ScheduleGenerationResult {
		const generator = new ScheduleGenerator();
		const schedules = generator.generateSchedules(courses);

		const pipeline: PostGenerationFilter[] = [
			new PinnedSubjectFilter(pinnedSubjects),
			new PivotFilter(pivots),
		];

		const filtered = pipeline.reduce(
			(result, filter) => filter.apply(result),
			schedules,
		);

		const sorted = filtered.sort((a, b) => b.courses.length - a.courses.length);
		const maxCourses = sorted.length > 0
			? Math.max(...sorted.map(schedule => schedule.courses.length))
			: 0;

		return {
			schedules: sorted,
			maxCourses,
		};
	}
}

export default ScheduleUseCase;