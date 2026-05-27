import { Degree } from "@/domain/entities/Degree";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/application/use_cases/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export class Degrees {
    public static get degrees(): Degree[] {
        return catalogState.degrees;
    }
    public static set degrees(value: Degree[]) {
        catalogState.degrees = value;
    }

    public static async initialLoad(schoolSlug: string) {
        await globalInitialLoad(schoolSlug);
    }

    public static async getAll(schoolSlug: string) {
        if (catalogState.schoolSlug !== schoolSlug || this.degrees.length === 0) {
            await globalInitialLoad(schoolSlug);
        }
        return this.degrees;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const school = req.query.school as string || 'fmat';
    const degrees = await Degrees.getAll(school);
    return res.status(200).json(degrees);
}