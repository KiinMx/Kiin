import { Professor } from "@/domain/entities/Professor";
import { CourseCSV } from "@/lib/data/CourseModel";
import { DEFAULT_FACULTY, getFacultyDAO } from "@/lib/data/FacultyLoaderFactory";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";



export class Professors {
    private static _professorsByFaculty: Map<string, Professor[]> = new Map();

    public static getProfessorsForFaculty(faculty: string): Professor[] {
        return Professors._professorsByFaculty.get(faculty) ?? [];
    }

    /** @deprecated Use getProfessorsForFaculty for explicit access */
    public static get professors() {
        return Professors.getProfessorsForFaculty(DEFAULT_FACULTY);
    }

    public static async initialLoad(faculty: string = DEFAULT_FACULTY) {
        if (Professors._professorsByFaculty.has(faculty)) return;

        const dao = getFacultyDAO(faculty);
        const results = await dao.getCourses();
        const list: Professor[] = [];
        let count = 0;

        for (const result of results) {
            if (Professors._findInList(list, result) === undefined) {
                count++;
                list.push(new Professor(count, result.Nombres, result.Apellidos));
            }
        }

        Professors._professorsByFaculty.set(faculty, list);
    }

    public static async getAll(faculty: string = DEFAULT_FACULTY) {
        if (!Professors._professorsByFaculty.has(faculty)) {
            await globalInitialLoad(faculty);
        }
        return Professors.getProfessorsForFaculty(faculty);
    }

    public static findProfessor(result: CourseCSV, faculty: string = DEFAULT_FACULTY): Professor | undefined {
        return Professors.getProfessorsForFaculty(faculty).find(
            (professor) =>
                professor.names === result.Nombres &&
                professor.lastNames === result.Apellidos
        );
    }

    private static _findInList(list: Professor[], result: CourseCSV): Professor | undefined {
        return list.find(p => p.names === result.Nombres && p.lastNames === result.Apellidos);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const faculty = (req.query.faculty as string) ?? DEFAULT_FACULTY;
    const professors = await Professors.getAll(faculty);
    return res.status(200).json(professors);
}