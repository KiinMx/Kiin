import { Schedule } from "./Schedule";

import { PostGenerationFilter } from "./PostGenerationFilter";

import { Pivot } from "./Pivot";

export class PivotFilter implements PostGenerationFilter {

    constructor(private readonly pivots: Pivot[]) {}

    apply(schedules: Schedule[]): Schedule[] {

        if (this.pivots.length === 0) return schedules;

        return schedules.filter(schedule => schedule.hasPivots(this.pivots));

    }

}