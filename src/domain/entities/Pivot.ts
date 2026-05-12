export class Pivot {

    constructor(

        public readonly idSubject: number,

        public readonly idProfessor: number

    ) {}

    belongsTo(subjectId: number): boolean {

        return this.idSubject === subjectId;

    }

    static create(idSubject: number, idProfessor: number): Pivot {

        return new Pivot(idSubject, idProfessor);

    }

}
