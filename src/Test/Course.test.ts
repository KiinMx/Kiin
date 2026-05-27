import { CoursesCsvDatasource } from "@/infrastructure/datasource/CoursesCsvDatasource";
import fetchMock from 'jest-fetch-mock';
import { Course } from "../domain/entities/Course";
jest.mock('node-fetch');


describe('Courses Tests', () => {
  let courseImporter: CoursesCsvDatasource;
  let courses:  Course[];

    beforeEach(async () => {
      fetchMock.resetMocks();
      courseImporter = new CoursesCsvDatasource();
      courses = await courseImporter.getAll();
    });

    it('Number of Courses should be generated correctly', async () => {
      console.log(courses.length);
      expect(courses.length).toBeGreaterThan(0);
    });
  
    it('Course sessions should not overlap', async () => {
      for (const course of courses){
        for(const session of course.sessions){
          for(const otherCourse of courses){
            for(const otherSession of otherCourse.sessions){
              if(course != otherCourse){
                expect(session.startHour).not.toBe(otherSession.startHour);
                expect(session.endHour).not.toBe(otherSession.endHour);
              }
            }
          }
        }
      }
    });


    it('Every Course has a professor', async () => {
      for(const course of courses){
        expect(course.professor).not.toBeNull();
      }
    });

});
  