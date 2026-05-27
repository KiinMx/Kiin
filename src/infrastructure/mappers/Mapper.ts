/* eslint-disable @typescript-eslint/no-explicit-any */
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Session } from "@/domain/entities/Session";
import { Subject } from "@/domain/entities/Subject";
import moment from "moment";


export class Mapper {

    static toSubject(json: any): Subject {
        const subject = new Subject(
            json._id,
            json._name,
            json._degreeResume,
            json._model,
            json._type,
            json._semesters,
            json._credits
        );


        console.log(json)
        subject.courses = json._coursesIds
        subject.degrees = json._degreesIds
        subject.professors = json._professorsIds

        return subject
    }

    static toSubjects(jsonArray: any[]): Subject[] {
        return jsonArray.map(json => Mapper.toSubject(json));
    }

    static toProfessor(json: any): Professor {
        return new Professor(
            json._id,
            json._names,
            json._lastNames
        );
    }

    static toProfessors(jsonArray: any[]): Professor[] {
        return jsonArray.map(json => Mapper.toProfessor(json));
    }

    static toSession(json: any): Session {
        return new Session(
            json._day,
            moment.utc(json._startHour, 'HH:mm'),
            moment.utc(json._endHour, 'HH:mm'),
            json._room
        );
    }

    static toCourse(json: any): Course {
        const subject = Mapper.toSubject(json._subject);
        const professor = Mapper.toProfessor(json._professor);

        const sessions = json._sessions.map((sessionJson: any) => {
            if (sessionJson === null) {
                return
            }
            return Mapper.toSession(sessionJson)
        });
        const course = new Course(
            json._id,
            subject,
            professor,
            json._group,
            json._modality,
            json._weekHours,
            json._acceptModifications
        );
        course.sessions = sessions;
        return course;
    }

    static toCourses(jsonArray: any[]): Course[] {
        return jsonArray.map(json => Mapper.toCourse(json));
    }

    static toDegree(json: any): Degree {
        const degree = new Degree(
            json._id,
            json._name,
        );

        degree.subjects = Mapper.toSubjects(json._subjects);

        return degree

    }

    static toDegrees(jsonArray: any[]): Degree[] {
        return jsonArray.map(json => Mapper.toDegree(json));
    }
}