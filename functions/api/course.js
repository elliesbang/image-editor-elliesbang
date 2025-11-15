import {
  initNotion,
  queryDB,
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

function matchValue(value, expected) {
  if (!expected) return true;
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((entry) => matchValue(entry, expected));
  }
  return String(value).toLowerCase() === String(expected).toLowerCase();
}

export async function onRequestGet({ request, env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_COURSE);
    let courses = response.results.map(mapNotionPage);

    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    const classroomId = url.searchParams.get("classroomId");
    const week = url.searchParams.get("week");
    const search = url.searchParams.get("q");

    if (courseId) {
      courses = courses.filter((course) => {
        return (
          course.id === courseId ||
          matchValue(course.properties?.CourseId, courseId) ||
          matchValue(course.properties?.ID, courseId)
        );
      });
    }

    if (classroomId) {
      const normalized = classroomId.toLowerCase();
      courses = courses.filter((course) => {
        const relation =
          course.properties?.Classroom ??
          course.properties?.ClassroomId ??
          course.properties?.Class ??
          course.properties?.수업;
        if (!relation) return false;
        if (Array.isArray(relation)) {
          return relation.some((entry) => String(entry).toLowerCase() === normalized);
        }
        return String(relation).toLowerCase() === normalized;
      });
    }

    if (week) {
      courses = courses.filter((course) => {
        const weekValue =
          course.properties?.Week ??
          course.properties?.주차 ??
          course.properties?.차시 ??
          course.properties?.Lesson;
        if (weekValue === undefined || weekValue === null) {
          return false;
        }
        if (typeof weekValue === "number") {
          return Number(weekValue) === Number(week);
        }
        return String(weekValue).toLowerCase() === String(week).toLowerCase();
      });
    }

    if (search) {
      const keyword = search.toLowerCase();
      courses = courses.filter((course) => {
        const title = course.properties?.Title ?? course.properties?.Name ?? "";
        const description = course.properties?.Description ?? course.properties?.소개 ?? "";
        return (
          String(title).toLowerCase().includes(keyword) ||
          String(description).toLowerCase().includes(keyword)
        );
      });
    }

    return successResponse({ courses });
  } catch (error) {
    return errorResponse(error.message || "Failed to load course data.");
  }
}
