import { Subject } from "@/domain/entities/Subject";
import { CourseCSV } from "@/lib/data/CourseModel";
import { DEFAULT_FACULTY, getFacultyDAO } from "@/lib/data/FacultyLoaderFactory";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { SubjectMapper } from "@/lib/data/SubjectMapper";
import { NextApiRequest, NextApiResponse } from "next";
import { Degrees } from "../degrees/all";

export class Subjects {

    private static _subjectsByFaculty: Map<string, Subject[]> = new Map();

    public static getSubjectsForFaculty(faculty: string): Subject[] {
        return Subjects._subjectsByFaculty.get(faculty) ?? [];
    }

    /** @deprecated Use getSubjectsForFaculty for explicit access */
    public static get subjects(): Subject[] {
        return Subjects.getSubjectsForFaculty(DEFAULT_FACULTY);
    }

    public static async initialLoad(faculty: string = DEFAULT_FACULTY) {
        if (Subjects._subjectsByFaculty.has(faculty)) return;

        const dao = getFacultyDAO(faculty);
        const results = await dao.getCourses();
        const list: Subject[] = [];
        let count = 0;

        for (const result of results) {
            if (Subjects._findInList(list, result) === undefined) {
                count++;
                list.push(SubjectMapper.fromModelToEntity(count, result));

                const degreesString = result.PE.split("-");
                degreesString.forEach((degreeString) => {
                    const degree = Degrees.findDegree(degreeString.trim(), faculty);
                    if (degree) {
                        degree.addSubject(list[count - 1]);
                        list[count - 1].addDegree(degree.id);
                    }
                });
            }
        }

        Subjects._subjectsByFaculty.set(faculty, list);
    }

    public static findSubject(result: CourseCSV, faculty: string = DEFAULT_FACULTY): Subject | undefined {
        return Subjects.getSubjectsForFaculty(faculty).find(
            (subject) => subject.name === result.Asignatura && subject.degreeResume === result.PE
        );
    }

    private static _findInList(list: Subject[], result: CourseCSV): Subject | undefined {
        return list.find(s => s.name === result.Asignatura && s.degreeResume === result.PE);
    }

    public static async getAll(faculty: string = DEFAULT_FACULTY) {
        if (!Subjects._subjectsByFaculty.has(faculty)) {
            await globalInitialLoad(faculty);
        }
        return Subjects.getSubjectsForFaculty(faculty);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const faculty = (req.query.faculty as string) ?? DEFAULT_FACULTY;
    const subjects = await Subjects.getAll(faculty);
    return res.status(200).json(subjects);
}


