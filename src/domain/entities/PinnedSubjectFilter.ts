import { Schedule } from "./Schedule";

import { PostGenerationFilter } from "./PostGenerationFilter";

export class PinnedSubjectFilter implements PostGenerationFilter {

    constructor(private readonly pinnedSubjectIds: number[]) {}

    apply(schedules: Schedule[]): Schedule[] {

        if (this.pinnedSubjectIds.length === 0) return schedules;

        return schedules.filter(schedule =>

            schedule.hasAllPinnedSubjects(this.pinnedSubjectIds)

        );

    }

}