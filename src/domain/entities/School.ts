export class School {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly logoUrl?: string
  ) {}

  static readonly FMAT = new School('fmat', 'Facultad de Matemáticas', 'fmat');
  
  static readonly ARQUITECTURA = new School('arquitectura', 'Facultad de Arquitectura', 'arquitectura');
  static readonly PSICOLOGIA = new School('psicologia', 'Facultad de Psicología', 'psicologia');
  

  static readonly ALL: School[] = [
    School.FMAT,
    School.ARQUITECTURA,
    School.PSICOLOGIA,
  ];

  static fromSlug(slug: string): School | undefined {
    return School.ALL.find(s => s.slug === slug);
  }
}