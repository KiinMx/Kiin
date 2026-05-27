import { Professor } from "@/domain/entities/Professor";
import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";



export class Professors {
    public static get professors() {
        return catalogState.professors;
    }

    public static set professors(professors: Professor[]) {
        catalogState.professors = professors;
    }

    public static async initialLoad() {
        await globalInitialLoad();
    }

    public static async getAll() {

        if (this.professors.length === 0) {
            await globalInitialLoad();
        }

        return this.professors;
    }

}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const professors = await Professors.getAll();

    return res.status(200).json(professors);
}