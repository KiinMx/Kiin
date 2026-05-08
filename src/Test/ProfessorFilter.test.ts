import SubjectsView from '@/app/widgets/SubjectsView';
import Pivot from '@/domain/entities/Pivot';
import { Subject } from '@/domain/entities/Subject';
import SubjectCategory from '@/domain/entities/SubjectCategory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React, { useState } from 'react';

const mockProfessors = [
  { id: 201, fullName: 'Profesor Uno' },
  { id: 202, fullName: 'Profesor Dos' },
];

jest.mock('@/infrastructure/datasource/ProfessorsCsvDataSource', () => ({
  ProfessorsCsvDataSource: jest.fn().mockImplementation(() => ({
    getAll: async () => mockProfessors,
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
    // Preparación: renderizamos la vista con la materia 101 y sin pivotes iniciales.
    renderSubjectsView([]);

    // Ejecución: esperamos a que los profesores sean cargados y el useEffect genere pivotes.
    await screen.findByText('Profesor Uno');
    await screen.findByText('Profesor Dos');

    // Validación: ambos profesores deben aparecer como seleccionados y con botón "Fijado".
    expect(getProfessorRow('Profesor Uno')).toHaveTextContent('Fijado');
    expect(getProfessorRow('Profesor Dos')).toHaveTextContent('Fijado');
  });

  test('Caso 2: Duplicar pivotes (CP-002)', async () => {
    // Preparación: renderizamos con un pivote existente para la materia 101 y profesor 201.
    renderSubjectsView([Pivot.create(101, 201)]);

    // Ejecución: esperamos a que se carguen los profesores y se procese el useEffect.
    await screen.findByText('Profesor Dos');

    // Validación: no debe crear duplicados, el profesor 201 sigue fijado y el 202 permanece no fijado.
    expect(getProfessorRow('Profesor Uno')).toHaveTextContent('Fijado');
    expect(getProfessorRow('Profesor Dos')).toHaveTextContent('Fijar');
  });

  test('Caso 3: Deselección profesor (CP-003)', async () => {
    // Preparación: renderizamos con dos pivotes activos en la materia 101.
    renderSubjectsView([
      Pivot.create(101, 201),
      Pivot.create(101, 202),
    ]);

    // Ejecución: esperamos los profesores y deseleccionamos al profesor 202.
    const button202 = await screen.findByText('Profesor Dos');
    const rowButton202 = within(button202.closest('div') as HTMLElement).getByRole('button');
    fireEvent.click(rowButton202);

    // Validación: 202 debe quedar deseleccionado y 201 debe seguir activo.
    expect(getProfessorRow('Profesor Uno')).toHaveTextContent('Fijado');
    expect(getProfessorRow('Profesor Dos')).toHaveTextContent('Fijar');
  });

  test('Caso 4: Bloquear último profesor (CP-004)', async () => {
    // Preparación: renderizamos la materia con un solo profesor activo.
    renderSubjectsView([Pivot.create(101, 201)], lastProfessorSubject);

    // Ejecución: esperamos la carga del profesor y revisamos el estado del botón.
    await screen.findByText('Profesor Uno');
    const professorButton = getProfessorRow('Profesor Uno');

    // Validación: el botón debe estar deshabilitado y mostrar el mensaje de bloqueo.
    expect(professorButton).toBeDisabled();
    expect(professorButton).toHaveAttribute('title', lastProfessorWarning);
    expect(professorButton).toHaveTextContent('Fijado');
  });
});
