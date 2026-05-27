import { SubjectsDataSource } from "@/domain/datasources/SubjectsDataSource";
import { Subject } from "@/domain/entities/Subject";
import { SubjectsRepository } from "@/domain/repositories/SubjectsRepository";


export class SubjectsRepositoryImpl implements SubjectsRepository {

    private _dataSource;

    constructor(dataSource: SubjectsDataSource) {
        this._dataSource = dataSource;

    }
    getAll(): Promise<Subject[]> {
        return this._dataSource.getAll();
    }


}