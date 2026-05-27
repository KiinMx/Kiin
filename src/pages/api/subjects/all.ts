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

    public static async initialLoad() {
        await globalInitialLoad();
    }

    public static async getAll() {

        if (this.subjects.length === 0) {
            await globalInitialLoad();
        }

        return this.subjects;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const subjects = await Subjects.getAll();
    return res.status(200).json(subjects);
}


