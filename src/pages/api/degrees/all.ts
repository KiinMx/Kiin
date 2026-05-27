import { Degree } from "@/domain/entities/Degree";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export class Degrees {
    public static get degrees(): Degree[] {
        return catalogState.degrees;
    }
    public static set degrees(value: Degree[]) {
        catalogState.degrees = value;
    }

    public static async initialLoad() {
        await globalInitialLoad();
    }

    public static findDegree(degreeCourseCSV: string): Degree | undefined {
        return this.degrees.find(
            (degree) =>
                degree.name === degreeCourseCSV
        )
    }

    public static async getAll() {

        if (this.degrees.length === 0) {
            await globalInitialLoad();
        }

        return this.degrees;
    }


}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const degrees = await Degrees.getAll()

    return res.status(200).json(degrees);
}


