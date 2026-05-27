import { Course } from "@/domain/entities/Course";
import { Professor } from "@/domain/entities/Professor";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";
import { CourseCSV } from "@/infrastructure/models/CourseModel";

export class CourseMapper {

    public static fromModelToEntity(
        id: number,
        model: CourseCSV,
        subjectResolver: (model: CourseCSV) => Subject | undefined,
        professorResolver: (model: CourseCSV) => Professor | undefined,
    ): Course {

        const subject = subjectResolver(model);
        const professor = professorResolver(model);

        if (!subject || !professor) {
            throw new Error("Subject or professor not found");
        }

        const course = new Course(
            id,
            subject,
            professor,
            parseInt(model.GRUPO),
            model.Modalidad,
            parseFloat(model.Horas_a_la_semana),
            false
        );

        course.sessions = this.getSessions(model);

        return course;
    }

    private static getSessions(result: CourseCSV): Session[] {

        const sessions: Session[] = [];

        const days = new Map<keyof CourseCSV, keyof CourseCSV>([
            ["Lunes", "Aula1"],
            ["Martes", "Aula2"],
            ["Miercoles", "Aula3"],
            ["Jueves", "Aula4"],
            ["Viernes", "Aula5"],
        ]);

        for (const day of days) {
            if (!result[day[0]]) {
                continue;
            }

            const timeSlots = result[day[0]].split(/\r?\n/).map(t => t.trim()).filter(Boolean);
            const classrooms = result[day[1]].split(/\r?\n/).map(c => c.trim()).filter(Boolean);

            for (let i = 0; i < timeSlots.length; i++) {
                const hours = this.getHours(timeSlots[i]);
                if (!hours) {
                    continue;
                }

                const classroom = classrooms[i] || classrooms[0];
                const session = new Session(day[0], hours[0], hours[1], classroom);
                sessions.push(session);
            }
        }

        return sessions;
    }

    private static getHours(time: string): [number, number] | null {
        const parts = time.split('-').map(h => h.trim());

        if (parts.length === 2) {
            const startMinutes = Session.fromTimeString(parts[0]);
            const endMinutes = Session.fromTimeString(parts[1]);
            if (!isNaN(startMinutes) && !isNaN(endMinutes)) {
                return [startMinutes, endMinutes];
            }
        }
        return null;
    }
}