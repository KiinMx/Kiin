import { AcademicOfferRepository } from "@/domain/repositories/AcademicOfferRepository";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";
import { Mapper } from "@/infrastructure/mappers/Mapper";

export class LocalAcademicOfferRepository implements AcademicOfferRepository {
  private degrees: Degree[] | null = null;
  private subjects: Subject[] | null = null;
  private professors: Professor[] | null = null;
  private courses: Course[] | null = null;
  private version: string | null = null;

  constructor(
    private readonly remote: AcademicOfferRepository,
    private readonly schoolSlug: string
  ) {}

  async getDegrees(): Promise<Degree[]> {
    if (this.degrees) return this.degrees;
    const stored = await this.readCache("degree");
    if (stored) {
      this.degrees = Mapper.toDegrees(JSON.parse(stored));
      return this.degrees;
    }
    this.degrees = await this.remote.getDegrees();
    this.writeCache("degree", JSON.stringify(this.degrees));
    return this.degrees;
  }

  async getSubjects(): Promise<Subject[]> {
    if (this.subjects) return this.subjects;
    const stored = await this.readCache("subject");
    if (stored) {
      this.subjects = Mapper.toSubjects(JSON.parse(stored));
      return this.subjects;
    }
    this.subjects = await this.remote.getSubjects();
    this.writeCache("subject", JSON.stringify(this.subjects));
    return this.subjects;
  }

  async getProfessors(): Promise<Professor[]> {
    if (this.professors) return this.professors;
    const stored = await this.readCache("professor");
    if (stored) {
      this.professors = Mapper.toProfessors(JSON.parse(stored));
      return this.professors;
    }
    this.professors = await this.remote.getProfessors();
    this.writeCache("professor", JSON.stringify(this.professors));
    return this.professors;
  }

  async getCourses(): Promise<Course[]> {
    if (this.courses) return this.courses;
    const stored = await this.readCache("course");
    if (stored) {
      this.courses = Mapper.toCourses(JSON.parse(stored));
      return this.courses;
    }
    this.courses = await this.remote.getCourses();
    this.writeCache("course", JSON.stringify(this.courses));
    return this.courses;
  }

  private async readCache(entity: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const version = await this.getVersion();
    const cacheKey = `${entity}-info-${this.schoolSlug}-${version}`;
    return localStorage.getItem(cacheKey);
  }

  private writeCache(entity: string, data: string): void {
    if (typeof window === "undefined") return;
    const version = this.version;
    if (!version) return;
    const cacheKey = `${entity}-info-${this.schoolSlug}-${version}`;

    Object.keys(localStorage)
      .filter(k => k.startsWith(`${entity}-info-${this.schoolSlug}-`))
      .forEach(k => localStorage.removeItem(k));

    localStorage.setItem(cacheKey, data);
  }

  private async getVersion(): Promise<string> {
    if (this.version) return this.version;
    if (typeof window === "undefined") return "server";

    const { apiFetch } = await import("@/infrastructure/datasource/apiFetch");
    const res = await apiFetch("/api/version");
    const v = await res.json() as string;
    this.version = v;
    return v;
  }
}
