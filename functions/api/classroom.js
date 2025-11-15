import {
  initNotion,
  queryDB,
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

function includesValue(value, keyword) {
  if (!value || !keyword) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => includesValue(entry, keyword));
  }
  return String(value).toLowerCase().includes(keyword.toLowerCase());
}

export async function onRequestGet({ request, env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_CLASSROOM_LIST);
    let classrooms = response.results.map(mapNotionPage);

    const url = new URL(request.url);
    const studentName = url.searchParams.get("student") || url.searchParams.get("studentName");
    const status = url.searchParams.get("status");
    const query = url.searchParams.get("q");

    if (studentName) {
      const keyword = studentName.toLowerCase();
      classrooms = classrooms.filter((classroom) => {
        const candidates = [
          classroom.properties?.Students,
          classroom.properties?.수강생,
          classroom.properties?.학생,
          classroom.properties?.Learners,
        ];
        return candidates.some((value) => {
          if (Array.isArray(value)) {
            return value.some((entry) => String(entry).toLowerCase() === keyword);
          }
          if (typeof value === "string") {
            return value.toLowerCase().includes(keyword);
          }
          return false;
        });
      });
    }

    if (status) {
      classrooms = classrooms.filter((classroom) => {
        const value =
          classroom.properties?.Status ??
          classroom.properties?.상태 ??
          classroom.properties?.state ??
          classroom.properties?.진행상태;
        return includesValue(value, status);
      });
    }

    if (query) {
      const keyword = query.toLowerCase();
      classrooms = classrooms.filter((classroom) => {
        const title = classroom.properties?.Title ?? classroom.properties?.Name ?? "";
        const description = classroom.properties?.Description ?? classroom.properties?.소개 ?? "";
        return includesValue(title, keyword) || includesValue(description, keyword);
      });
    }

    return successResponse({ classrooms });
  } catch (error) {
    return errorResponse(error.message || "Failed to load classrooms.");
  }
}
