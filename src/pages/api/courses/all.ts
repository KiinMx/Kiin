import { Course } from "@/domain/entities/Course";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/application/use_cases/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export class Courses {
    public static get courses(): Course[] {
        return catalogState.courses;
    }
    public static set courses(value: Course[]) {
        catalogState.courses = value;
    }

    public static async initialLoad(schoolSlug: string) {
        await globalInitialLoad(schoolSlug);
    }

    public static async getAll(schoolSlug: string) {
        if (catalogState.schoolSlug !== schoolSlug || this.courses.length === 0) {
            await globalInitialLoad(schoolSlug);
        }
        return this.courses;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const school = req.query.school as string || 'fmat';
    const courses = await Courses.getAll(school);
    return res.status(200).json(courses);
}