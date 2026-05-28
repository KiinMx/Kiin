import SubjectsView from '@/app/widgets/SubjectsView';
import { Pivot } from '@/application/filters/Pivot';
import SubjectCategory from '@/application/filters/SubjectCategory';
import { Subject } from '@/domain/entities/Subject';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React, { useState } from 'react';

const mockProfessors = [
  { id: 201, fullName: 'Profesor Uno' },
  { id: 202, fullName: 'Profesor Dos' },
];

jest.mock('@/infrastructure/repositories/LocalAcademicOfferRepository', () => ({
  LocalAcademicOfferRepository: jest.fn().mockImplementation(() => ({
    getProfessors: async () => mockProfessors,
    getDegrees: async () => [],
    getSubjects: async () => [],
    getCourses: async () => [],
  })),
}));

jest.mock('@/infrastructure/repositories/RemoteAcademicOfferRepository', () => ({
  RemoteAcademicOfferRepository: jest.fn().mockImplementation(() => ({
    getProfessors: async () => mockProfessors,
    getDegrees: async () => [],
    getSubjects: async () => [],
    getCourses: async () => [],
  })),
}));

const defaultSubject: Subject = (() => {
  const s = new Subject(101, 'Materia 101', 'Ingeniería', 'Modelo 21', 'Teórica', [1], 3);
  s.professors = [201, 202];
  return s;
})();

const lastProfessorSubject: Subject = (() => {
  const s = new Subject(101, 'Materia 101', 'Ingeniería', 'Modelo 21', 'Teórica', [1], 3);
  s.professors = [201];
  return s;
})();

function createSelectedCategory(subject: Subject) {
  const category = new SubjectCategory(1, [subject]);
  category.onClick(subject.id);
  return category;
}

function renderSubjectsView(initialPivots: Pivot[], subject: Subject = defaultSubject) {
  function SubjectsViewTestWrapper() {
    const [pivots, setPivots] = useState<Pivot[]>(initialPivots);
    const [pinnedSubjects, setPinnedSubjects] = useState<number[]>([]);
    const currentCategories = [createSelectedCategory(subject)];

    return React.createElement(SubjectsView, {
      toggleSideBar: () => undefined,
      isSideBarOpen: false,
      currentCategories: currentCategories,
      handleClickFilter: () => undefined,
      pivots: pivots,
      setPivots: setPivots,
      pinnedSubjects: pinnedSubjects,
      setPinnedSubjects: setPinnedSubjects,
      onRemoveSubject: () => undefined,
    });
  }

  return render(React.createElement(SubjectsViewTestWrapper));
}

function getProfessorRow(name: string) {
  const rowElement = screen.getByText(name).closest('div');
  if (!rowElement) throw new Error(`No se encontró fila para el profesor ${name}`);
  return within(rowElement).getByRole('button');
}

const lastProfessorWarning =
  'Para desfijar todos los profesores, debes eliminar la materia seleccionada';

describe('Comportamiento de sincronización y selección de profesores', () => {
  test('Caso 1: Sincronizar pivotes (CP-001)', async () => {
    renderSubjectsView([]);

    await screen.findByText('Profesor Uno');
    await screen.findByText('Profesor Dos');

    expect(getProfessorRow('Profesor Uno')).toHaveTextContent('Fijado');
    expect(getProfessorRow('Profesor Dos')).toHaveTextContent('Fijado');
  });

  test('Caso 2: Duplicar pivotes (CP-002)', async () => {
    renderSubjectsView([Pivot.create(101, 201)]);

    await screen.findByText('Profesor Dos');

    expect(getProfessorRow('Profesor Uno')).toHaveTextContent('Fijado');
    expect(getProfessorRow('Profesor Dos')).toHaveTextContent('Fijar');
  });

  test('Caso 3: Deselección profesor (CP-003)', async () => {
    renderSubjectsView([
      Pivot.create(101, 201),
      Pivot.create(101, 202),
    ]);

    const button202 = await screen.findByText('Profesor Dos');
    const rowButton202 = within(button202.closest('div') as HTMLElement).getByRole('button');
    fireEvent.click(rowButton202);

    expect(getProfessorRow('Profesor Uno')).toHaveTextContent('Fijado');
    expect(getProfessorRow('Profesor Dos')).toHaveTextContent('Fijar');
  });

  test('Caso 4: Bloquear último profesor (CP-004)', async () => {
    renderSubjectsView([Pivot.create(101, 201)], lastProfessorSubject);

    await screen.findByText('Profesor Uno');
    const professorButton = getProfessorRow('Profesor Uno');

    expect(professorButton).toBeDisabled();
    expect(professorButton).toHaveAttribute('title', lastProfessorWarning);
    expect(professorButton).toHaveTextContent('Fijado');
  });
});
