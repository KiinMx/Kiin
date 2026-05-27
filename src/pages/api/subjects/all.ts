import { Subject } from "@/domain/entities/Subject";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/application/use_cases/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export class Subjects {
    public static get subjects(): Subject[] {
        return catalogState.subjects;
    }
    public static set subjects(value: Subject[]) {
        catalogState.subjects = value;
    }

    public static async initialLoad(schoolSlug: string) {
        await globalInitialLoad(schoolSlug);
    }

    public static async getAll(schoolSlug: string) {
        if (catalogState.schoolSlug !== schoolSlug || this.subjects.length === 0) {
            await globalInitialLoad(schoolSlug);
        }
        return this.subjects;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const school = req.query.school as string || 'fmat';
    const subjects = await Subjects.getAll(school);
    return res.status(200).json(subjects);
}