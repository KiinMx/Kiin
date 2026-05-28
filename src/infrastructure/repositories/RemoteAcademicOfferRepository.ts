import { AcademicOfferRepository } from "@/domain/repositories/AcademicOfferRepository";
import { Course } from "@/domain/entities/Course";
import { Degree } from "@/domain/entities/Degree";
import { Professor } from "@/domain/entities/Professor";
import { Subject } from "@/domain/entities/Subject";
import { Mapper } from "@/infrastructure/mappers/Mapper";

export class RemoteAcademicOfferRepository implements AcademicOfferRepository {
  constructor(private readonly schoolSlug: string) {}

  async getDegrees(): Promise<Degree[]> {
    const res = await this.fetch(`/api/degrees/all?school=${this.schoolSlug}`);
    return Mapper.toDegrees(await res.json());
  }

  async getSubjects(): Promise<Subject[]> {
    const res = await this.fetch(`/api/subjects/all?school=${this.schoolSlug}`);
    return Mapper.toSubjects(await res.json());
  }

  async getProfessors(): Promise<Professor[]> {
    const res = await this.fetch(`/api/professors/all?school=${this.schoolSlug}`);
    return Mapper.toProfessors(await res.json());
  }

  async getCourses(): Promise<Course[]> {
    const res = await this.fetch(`/api/courses/all?school=${this.schoolSlug}`);
    return Mapper.toCourses(await res.json());
  }

  private async fetch(path: string): Promise<Response> {
    const { apiFetch } = await import("@/infrastructure/datasource/apiFetch");
    return apiFetch(path);
  }
}
