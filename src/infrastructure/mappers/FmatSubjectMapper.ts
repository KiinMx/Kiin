import { Subject } from "@/domain/entities/Subject";
import { CourseCSV } from "@/infrastructure/models/CourseModel";
import { normalizeName } from "@/infrastructure/helpers/normalizeName";

export class SubjectMapper {

  public static fromModelToEntity(count: number, model: CourseCSV): Subject {
    const semesters = model.Semestre.split(",").map((semester) => parseInt(semester));
    const subject = new Subject(count, normalizeName(model.Asignatura), normalizeName(model.PE), model.Modelo, model.Tipo, semesters, parseInt(model.Creditos));
    return subject;
  }

}