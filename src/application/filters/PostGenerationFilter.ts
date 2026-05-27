import { Schedule } from "@/domain/entities/Schedule";

export interface PostGenerationFilter {

    apply(schedules: Schedule[]): Schedule[];

}