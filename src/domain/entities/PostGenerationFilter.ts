import { Schedule } from "./Schedule";

export interface PostGenerationFilter {
    apply(schedules: Schedule[]): Schedule[];
}