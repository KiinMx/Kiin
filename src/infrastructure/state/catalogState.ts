import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";

export const catalogState: {
  schoolSlug: string;
  degrees: Degree[];
  subjects: Subject[];
  professors: Professor[];
  courses: Course[];
} = {
  schoolSlug: '',
  degrees: [],
  subjects: [],
  professors: [],
  courses: [],
};