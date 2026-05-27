import { ProfessorsCsvDataSource } from "@/infrastructure/datasource/ProfessorsCsvDataSource";
import fetchMock from 'jest-fetch-mock';
jest.mock('node-fetch');

describe('professors Tests', () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it('Professor should have a name', async () => { 
      const professor = new ProfessorsCsvDataSource();
      const professors = await professor.getAll(); 

      for (const professor of professors){
        const expected = professor.fullName;
        expect(expected).toBeDefined();
        expect(expected).not.toBe('');
      }

    });
  
    it('Professor should have a list of subjects', async () => {
      const professor = new ProfessorsCsvDataSource();
      const professors = await professor.getAll(); 

      for (const professor of professors){
        const expected = professor.fullName;
        console.log(expected);
      } 
    });

});
  