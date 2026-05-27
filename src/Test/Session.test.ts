import { Session } from '../domain/entities/Session';
import { CoursesCsvDatasource } from '../infrastructure/datasource/CoursesCsvDatasource';
import { Course } from '../domain/entities/Course';
import fetchMock from 'jest-fetch-mock';
jest.mock('node-fetch');

describe('Session Tests', () => {
  let courseImporter: CoursesCsvDatasource;
  let courses:  Course[];

    beforeEach(async () => {
      fetchMock.resetMocks();
      courseImporter = new CoursesCsvDatasource();
      courses = await courseImporter.getAll();
    });
    it('Session should have a start time', async () => { 
        for(const course of courses ){
            for(const session of course.sessions){
                expect(session.startHour).not.toBeNull();
            }
        }
    });
  
    it('Session should have an end time', async () => {
      for(const course of courses ){
        for(const session of course.sessions){
            expect(session.endHour).not.toBeNull();
        }
    } 
    });

    it('End time should be after start time', async () => {
      for(const course of courses ){
        for(const session of course.sessions){
            expect(session.endHour).toBeGreaterThan(session.startHour);
        }
    } 
      });

    it('Session.fromTimeString converts correctly', () => {
        expect(Session.fromTimeString('08:00')).toBe(480);
        expect(Session.fromTimeString('14:30')).toBe(870);
        expect(Session.fromTimeString('23:59')).toBe(1439);
    });

    it('Session.formatMinutes converts correctly', () => {
        expect(Session.formatMinutes(480)).toBe('08:00');
        expect(Session.formatMinutes(870)).toBe('14:30');
        expect(Session.formatMinutes(0)).toBe('00:00');
    });
});