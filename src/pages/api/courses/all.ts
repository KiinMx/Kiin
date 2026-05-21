import { Course } from "@/domain/entities/Course";
import { CourseMapper } from "@/lib/data/CourseMapper";
import { DEFAULT_FACULTY, getFacultyDAO } from "@/lib/data/FacultyLoaderFactory";
import { globalInitialLoad } from "@/lib/data/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";


export class Courses {

    private static _coursesByFaculty: Map<string, Course[]> = new Map();

    public static getCoursesForFaculty(faculty: string): Course[] {
        return Courses._coursesByFaculty.get(faculty) ?? [];
    }

    /** @deprecated Use getCoursesForFaculty("matematicas") for backward compat */
    public static get courses(): Course[] {
        return Courses.getCoursesForFaculty(DEFAULT_FACULTY);
    }

    public static async initialLoad(faculty: string = DEFAULT_FACULTY) {
        if (Courses._coursesByFaculty.has(faculty)) return;

        const dao = getFacultyDAO(faculty);
        const results = await dao.getCourses();
        const list: Course[] = [];
        let count = (Courses._coursesByFaculty.size > 0
            ? Math.max(...[...Courses._coursesByFaculty.values()].flatMap(c => c.map(x => x.id)))
            : 0) + 1;

        for (const result of results) {
            const currentCourse = CourseMapper.fromModelToEntity(count, result, faculty);

            const courseAlreadyExist = list.find(
                (course) => course.subject.id == currentCourse.subject.id && course.group == currentCourse.group
            );

            if (!courseAlreadyExist) {
                list.push(currentCourse);
                count++;
            } else {
                courseAlreadyExist.addSession(currentCourse.sessions[0]);
            }
        }

        Courses._coursesByFaculty.set(faculty, list);
    }

    public static async getAll(faculty: string = DEFAULT_FACULTY) {
        if (!Courses._coursesByFaculty.has(faculty)) {
            await globalInitialLoad(faculty);
        }
        return Courses.getCoursesForFaculty(faculty);
    }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const faculty = (req.query.faculty as string) ?? DEFAULT_FACULTY;
    const courses = await Courses.getAll(faculty);
    return res.status(200).json(courses);
}