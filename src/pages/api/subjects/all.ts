import { Subject } from "@/domain/entities/Subject";
import { CourseCSV } from "@/lib/data/CourseModel";
import { CoursesModelDao } from "@/lib/data/CoursesModelDAO";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { SubjectMapper } from "@/lib/data/SubjectMapper";
import { NextApiRequest, NextApiResponse } from "next";
import { Degrees } from "../degrees/all";

export class Subjects {

    private static _subjects: Subject[] = [];

    public static get subjects(): Subject[] {
        return Subjects._subjects;
    }
    public static set subjects(value: Subject[]) {
        Subjects._subjects = value;
    }

    public static async initialLoad() {


        const results = await CoursesModelDao.getCourses();
        let count = 0;

        for (const result of results) {
            if (this.findSubject(result) === undefined) {
                count++;

                this.subjects.push(SubjectMapper.fromModelToEntity(count, result));

                const degreesString = result.PE.split("-");

                degreesString.forEach((degreeString) => {
                    const degree = Degrees.findDegree(degreeString.trim());
                    if (degree) {
                        degree.addSubject(this.subjects[count - 1]);
                        this.subjects[count - 1].addDegree(degree.id);
                    }
                })
            }
        }
    }

    public static findSubject(result: CourseCSV): Subject | undefined {
        const normalize = (s?: string) =>
            (s || '')
                .toString()
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

        return this.subjects.find(
            (subject) =>
                normalize(subject.name) === normalize(result.Asignatura) &&
                normalize(subject.degreeResume) === normalize(result.PE)
        )
    }

    public static async getAll() {

        if (this._subjects.length === 0) {
            await globalInitialLoad();
        }

        return this._subjects;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const subjects = await Subjects.getAll();
    return res.status(200).json(subjects);
}


