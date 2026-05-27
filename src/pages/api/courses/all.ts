import { Course } from "@/domain/entities/Course";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";


export class Courses {
    public static get courses(): Course[] {
        return catalogState.courses;
    }
    public static set courses(value: Course[]) {
        catalogState.courses = value;
    }

    public static async initialLoad() {
        await globalInitialLoad();
    }

    public static async getAll() {

        if (this.courses.length === 0) {
            await globalInitialLoad();
        }

        return this.courses;
    }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const courses = await Courses.getAll()

    return res.status(200).json(courses);
}