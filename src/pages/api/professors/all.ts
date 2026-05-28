import { Professor } from "@/domain/entities/Professor";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/application/use_cases/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export class Professors {
    public static get professors() {
        return catalogState.professors;
    }
    public static set professors(professors: Professor[]) {
        catalogState.professors = professors;
    }

    public static async initialLoad(schoolSlug: string) {
        await globalInitialLoad(schoolSlug);
    }

    public static async getAll(schoolSlug: string) {
        if (catalogState.schoolSlug !== schoolSlug || this.professors.length === 0) {
            await globalInitialLoad(schoolSlug);
        }
        return this.professors;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const school = req.query.school as string || 'fmat';
    const professors = await Professors.getAll(school);
    return res.status(200).json(professors);
}