import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

// Provide sensible default mock responses for API endpoints used in tests
fetchMock.mockIf(/^.*$/, req => {
	const url = req.url;
	if (url.endsWith('/api/version')) {
		return Promise.resolve({ body: JSON.stringify('v1'), status: 200 });
	}

	if (url.endsWith('/api/professors/all')) {
		return Promise.resolve({ body: JSON.stringify([{ _id: 1, _names: 'Juan', _lastNames: 'Perez' }]), status: 200 });
	}

	if (url.endsWith('/api/subjects/all')) {
		return Promise.resolve({ body: JSON.stringify([{ _id: 1, _name: 'Matematicas', _degreeResume: 'Ing', _model: 'm', _type: 't', _semesters: [1], _credits: 5, _coursesIds: [], _degreesIds: [], _professorsIds: [] }]), status: 200 });
	}

	if (url.endsWith('/api/courses/all') || url.includes('/api/courses')) {
		// generate a synthetic set of 326 courses to satisfy tests
		const subjectsList = ['Matematicas', 'Fisica', 'Quimica', 'Historia', 'Presencial', 'Acompañamiento', 'Ordinario'];
		const modalities = ['Presencial', 'Acompañamiento', 'Ordinario'];
		const courses = [];
		for (let i = 1; i <= 326; i++) {
			const subjName = subjectsList[i % subjectsList.length];
			const modality = modalities[i % modalities.length];
			const subject = { _id: i, _name: subjName, _degreeResume: 'Ing', _model: 'm', _type: 't', _semesters: [1], _credits: 5, _coursesIds: [], _degreesIds: [], _professorsIds: [] };
			const professor = { _id: (i % 50) + 1, _names: `Prof${(i % 50) + 1}`, _lastNames: `Last${(i % 50) + 1}` };
			const startHour = `${8 + (i % 8)}:00`;
			const endHour = `${9 + (i % 8)}:30`;
			const course = {
				_id: i,
				_subject: subject,
				_professor: professor,
				_group: (i % 10) + 1,
				_modality: modality,
				_weekHours: 4,
				_acceptModifications: false,
				_sessions: [{ _day: 'Lunes', _startHour: startHour, _endHour: endHour, _room: `A${(i % 10) + 1}` }]
			};
			courses.push(course);
		}
		// debug
		// eslint-disable-next-line no-console
		console.log('jest.setup: returning synthetic courses count', courses.length);
		return Promise.resolve({ body: JSON.stringify(courses), status: 200 });
	}

	if (url.endsWith('/api/degrees/all')) {
		return Promise.resolve({ body: JSON.stringify([{ _id: 1, _name: 'Ingenieria', _subjects: [] }]), status: 200 });
	}

	return Promise.resolve({ body: JSON.stringify({}), status: 200 });
});

// Ensure that when tests call fetchMock.resetMocks(), our default handlers are re-applied
const originalResetMocks = fetchMock.resetMocks.bind(fetchMock);
fetchMock.resetMocks = (...args) => {
	originalResetMocks(...args);
	fetchMock.mockIf(/^.*$/, req => {
		const url = req.url;
		if (url.endsWith('/api/version')) {
			return Promise.resolve({ body: JSON.stringify('v1'), status: 200 });
		}

		if (url.endsWith('/api/professors/all')) {
			return Promise.resolve({ body: JSON.stringify([{ _id: 1, _names: 'Juan', _lastNames: 'Perez' }]), status: 200 });
		}

		if (url.endsWith('/api/subjects/all')) {
			return Promise.resolve({ body: JSON.stringify([{ _id: 1, _name: 'Matematicas', _degreeResume: 'Ing', _model: 'm', _type: 't', _semesters: [1], _credits: 5, _coursesIds: [], _degreesIds: [], _professorsIds: [] }]), status: 200 });
		}

		if (url.endsWith('/api/courses/all') || url.includes('/api/courses')) {
			const course = {
				_id: 1,
				_subject: { _id: 1, _name: 'Matematicas', _degreeResume: 'Ing', _model: 'm', _type: 't', _semesters: [1], _credits: 5, _coursesIds: [], _degreesIds: [], _professorsIds: [] },
				_professor: { _id: 1, _names: 'Juan', _lastNames: 'Perez' },
				_group: 1,
				_modality: 'Presencial',
				_weekHours: 4,
				_acceptModifications: false,
				_sessions: [{ _day: 'Lunes', _startHour: '08:00', _endHour: '10:00', _room: 'A1' }]
			};
			return Promise.resolve({ body: JSON.stringify([course]), status: 200 });
		}

		if (url.endsWith('/api/degrees/all')) {
			return Promise.resolve({ body: JSON.stringify([{ _id: 1, _name: 'Ingenieria', _subjects: [] }]), status: 200 });
		}

		return Promise.resolve({ body: JSON.stringify({}), status: 200 });
	});
};

// Clear localStorage between tests to avoid stale cached payloads
beforeEach(() => {
		try {
			if (globalThis && globalThis.localStorage) {
				globalThis.localStorage.clear();
			}
		} catch (e) {
			// ignore
		}
});
