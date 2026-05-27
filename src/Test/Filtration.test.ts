import { CoursesCsvDatasource } from "@/infrastructure/datasource/CoursesCsvDatasource";
import fetchMock from 'jest-fetch-mock';
import { Course } from "../domain/entities/Course";
import { ProfessorsCsvDataSource } from "@/infrastructure/datasource/ProfessorsCsvDataSource";
import { FilterImpl } from "@/infrastructure/datasource/FilterImpl";
import { SubjectsCsvDataSource } from "@/infrastructure/datasource/SubjectsCSvDataSource";
import FilterModel from "@/infrastructure/models/FilterModel";
jest.mock('node-fetch');


describe('Filtration Tests', () => {
  let courseImporter: CoursesCsvDatasource;
  let courses:  Course[];
  let filter : FilterImpl;

    beforeEach(async () => {
      fetchMock.resetMocks();
      filter = new FilterImpl(new FilterModel([""],[],[""],[""]));
      courseImporter = new CoursesCsvDatasource();
      courses = await courseImporter.getAll();
    });

    it('Filter by professor', async () => {
      const professor = new ProfessorsCsvDataSource();
      const professors = await professor.getAll(); 
    
      for(const professor of professors){
        const validName = professor.fullName;
        const filteredCourses = filter.filterByProfessor(courses, validName);
        for(const course of filteredCourses){
          expect(course.professor.fullName).toBe(validName);
        }
      }
    });


    it('Filter by modality', async () => {
      const modalities = ["Presencial", "Acompañamiento", "Ordinario"];
    
      for(const modality of modalities){
        const validName = modality;
        const filteredCourses = filter.filterBySubjects(courses, validName);
        for(const course of filteredCourses){
          expect(course.subject.name === validName || course.modality === validName).toBeTruthy();
        }
      }
    });

    it('Filter by subject', async () => {
      const subjectImporter = new SubjectsCsvDataSource();
      const subjects = await subjectImporter.getAll(); 
    
      for(const subject of subjects){
        const validName = subject.name;
        const filteredCourses = filter.filterBySubjects(courses, validName);
        for(const course of filteredCourses){
          expect(course.subject.name).toBe(validName);
        }
      }
    });
});
  