import { Course } from "@/domain/entities/Course";
import { Session } from "@/domain/entities/Session";
import { Professors } from "@/pages/api/professors/all";
import { Subjects } from "@/pages/api/subjects/all";
import moment from "moment";
import { CourseCSV } from "./CourseModel";

export class CourseMapper {

    public static fromModelToEntity(id: number, model: CourseCSV): Course {

        const subject = Subjects.findSubject(model);
        const professor = Professors.findProfessor(model);

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
                if (!hours || hours.length !== 2) {
                    continue;
                }

                const classroom = classrooms[i] || classrooms[0]; // Use first classroom if not enough classrooms
                const session = new Session(day[0], hours[0], hours[1], classroom);
                sessions.push(session);
            }
        }

        return sessions;
    }
    private static getHours(time: string): moment.Moment[] | null {
        const hours = time.split('-').map(h => h.trim());

        if (hours.length === 2) {
            return [
                moment.utc(hours[0], 'HH:mm'),
                moment.utc(hours[1], 'HH:mm')
            ];
        }
        return null;
    }

}
