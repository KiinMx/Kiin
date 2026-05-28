import { catalogState } from "@/infrastructure/state/catalogState";
import { globalInitialLoad } from "@/application/use_cases/initialLoad";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const schoolSlug = req.query.school as string;

  if (!schoolSlug) {
    return res.status(400).json({ error: "Missing 'school' query parameter" });
  }

  if (catalogState.schoolSlug !== schoolSlug || catalogState.courses.length === 0) {
    await globalInitialLoad(schoolSlug);
  }

  return res.status(200).json({
    degrees: catalogState.degrees,
    subjects: catalogState.subjects,
    professors: catalogState.professors,
    courses: catalogState.courses,
  });
}