import { Degree } from "@/domain/entities/Degree";
import { DEFAULT_FACULTY, getFacultyDAO } from "@/lib/data/FacultyLoaderFactory";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export class Degrees {
    private static _degreesByFaculty: Map<string, Degree[]> = new Map();

    public static getDegreesForFaculty(faculty: string): Degree[] {
        return Degrees._degreesByFaculty.get(faculty) ?? [];
    }

    /** @deprecated Use getDegreesForFaculty for explicit access */
    public static get degrees(): Degree[] {
        return Degrees.getDegreesForFaculty(DEFAULT_FACULTY);
    }

    public static async initialLoad(faculty: string = DEFAULT_FACULTY) {
        if (Degrees._degreesByFaculty.has(faculty)) return;

        const dao = getFacultyDAO(faculty);
        const results = await dao.getCourses();
        const list: Degree[] = [];
        let count = 0;

        for (const result of results) {
            const degreesResultCsv = result.PE.split("-");
            degreesResultCsv.forEach((degreeString) => {
                const name = degreeString.trim() === "" ? "Unknown" : degreeString.trim();
                if (!list.find(d => d.name === name)) {
                    count++;
                    list.push(new Degree(count, name));
                }
            });
        }

        Degrees._degreesByFaculty.set(faculty, list);
    }

    public static findDegree(degreeCourseCSV: string, faculty: string = DEFAULT_FACULTY): Degree | undefined {
        return Degrees.getDegreesForFaculty(faculty).find(d => d.name === degreeCourseCSV);
    }

    public static async getAll(faculty: string = DEFAULT_FACULTY) {
        if (!Degrees._degreesByFaculty.has(faculty)) {
            await globalInitialLoad(faculty);
        }
        return Degrees.getDegreesForFaculty(faculty);
    }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const faculty = (req.query.faculty as string) ?? DEFAULT_FACULTY;
    const degrees = await Degrees.getAll(faculty);
    return res.status(200).json(degrees);
}


