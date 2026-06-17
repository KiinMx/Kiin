import { Professor } from "@/domain/entities/Professor";
import { CourseCSV } from "@/lib/data/CourseModel";
import { CoursesModelDao } from "@/lib/data/CoursesModelDAO";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";



export class Professors {
    private static _professors: Professor[] = []

    public static get professors() {
        return Professors._professors;
    }

    public static set professors(professors: Professor[]) {
        Professors._professors = professors;
    }

    public static async initialLoad() {
        const results = await CoursesModelDao.getCourses();
        let count = 0;

        for (const result of results) {
            if (this.findProfessor(result) === undefined) {
                count++;
                this._professors.push(new Professor(count, result.Nombres, result.Apellidos));
            }
        }
    }

    public static async getAll() {

        if (this._professors.length === 0) {
            await globalInitialLoad();
        }

        return this._professors;
    }

    public static findProfessor(result: CourseCSV): Professor | undefined {
        const normalize = (s?: string) =>
            (s || '')
                .toString()
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

        return this._professors.find(
            (professor) =>
                normalize(professor.names) === normalize(result.Nombres) &&
                normalize(professor.lastNames) === normalize(result.Apellidos)
        )
    }

}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const professors = await Professors.getAll();

    return res.status(200).json(professors);
}