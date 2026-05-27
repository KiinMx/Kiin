export class School {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly logoUrl?: string
  ) {}

  static readonly FMAT = new School('fmat', 'Facultad de Matemáticas', 'fmat');
  static readonly EDUCACION = new School('educacion', 'Facultad de Educación', 'educacion');
  static readonly ARQUITECTURA = new School('arquitectura', 'Facultad de Arquitectura', 'arquitectura');
  static readonly PSICOLOGIA = new School('psicologia', 'Facultad de Psicología', 'psicologia');
  static readonly CONTABILIDAD = new School('contabilidad', 'Facultad de Contabilidad', 'contabilidad');

  static readonly ALL: School[] = [
    School.FMAT,
    School.EDUCACION,
    School.ARQUITECTURA,
    School.PSICOLOGIA,
    School.CONTABILIDAD,
  ];

  static fromSlug(slug: string): School | undefined {
    return School.ALL.find(s => s.slug === slug);
  }
}