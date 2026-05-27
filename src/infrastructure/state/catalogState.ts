import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";

export const catalogState: {
  degrees: Degree[];
  subjects: Subject[];
  professors: Professor[];
  courses: Course[];
} = {
  degrees: [],
  subjects: [],
  professors: [],
  courses: [],
};