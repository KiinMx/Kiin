import { Subject } from "../entities/Subject";


export interface SubjectsDataSource {

    getAll(): Promise<Subject[]>;

}