import {
  initNotion,
  queryDB,
  createPage,
  retrieveDatabase,
  getTitlePropertyName,
  tryResolvePropertyName,
  buildTitleProperty,
  buildRichTextProperty,
  buildDateProperty,
  buildUrlProperty,
  buildNumberProperty,
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

export async function onRequestGet({ request, env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_ASSIGNMENT);
    let assignments = response.results.map(mapNotionPage);

    const url = new URL(request.url);
    const student = url.searchParams.get("student") || url.searchParams.get("studentName");
    const week = url.searchParams.get("week");
    const classroomId = url.searchParams.get("classroomId");

    if (student) {
      const keyword = student.toLowerCase();
      assignments = assignments.filter((assignment) => {
        const candidates = [
          assignment.properties?.Student,
          assignment.properties?.Name,
          assignment.properties?.학생,
          assignment.properties?.Learner,
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

    if (week) {
      assignments = assignments.filter((assignment) => {
        const weekValue =
          assignment.properties?.Week ??
          assignment.properties?.주차 ??
          assignment.properties?.차시 ??
          assignment.properties?.Lesson;
        if (typeof weekValue === "number") {
          return Number(weekValue) === Number(week);
        }
        if (weekValue === undefined || weekValue === null) {
          return false;
        }
        return String(weekValue).toLowerCase() === String(week).toLowerCase();
      });
    }

    if (classroomId) {
      const normalized = classroomId.toLowerCase();
      assignments = assignments.filter((assignment) => {
        const relation =
          assignment.properties?.Classroom ??
          assignment.properties?.Class ??
          assignment.properties?.수업;
        if (!relation) return false;
        if (Array.isArray(relation)) {
          return relation.some((entry) => String(entry).toLowerCase() === normalized);
        }
        return String(relation).toLowerCase() === normalized;
      });
    }

    return successResponse({ assignments });
  } catch (error) {
    return errorResponse(error.message || "Failed to load assignments.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const payload = await request.json();
    const { student, week, link, comment } = payload || {};

    if (!student || !week || !link) {
      return errorResponse("Student, week, and link are required.", 400);
    }

    const schema = await retrieveDatabase(env.DB_ASSIGNMENT);
    const titlePropertyName = getTitlePropertyName(schema);
    const weekNumber = Number(week);

    const properties = {
      [titlePropertyName]: buildTitleProperty(`${student} - Week ${weekNumber || week}`),
    };

    const studentPropertyName = tryResolvePropertyName(schema, ["Student", "Name", "Learner"], "rich_text");
    if (studentPropertyName) {
      properties[studentPropertyName] = buildRichTextProperty(student);
    }

    const weekPropertyName = tryResolvePropertyName(schema, ["Week", "Course Week"], "number");
    if (weekPropertyName) {
      properties[weekPropertyName] = buildNumberProperty(weekNumber);
    }

    const linkPropertyName = tryResolvePropertyName(schema, ["Link", "URL", "Submission"], "url");
    if (linkPropertyName) {
      properties[linkPropertyName] = buildUrlProperty(link);
    }

    const commentPropertyName = tryResolvePropertyName(
      schema,
      ["Comment", "Notes", "Feedback", "비고"],
      "rich_text",
    );
    if (commentPropertyName && comment) {
      properties[commentPropertyName] = buildRichTextProperty(comment);
    }

    const submittedAtPropertyName = tryResolvePropertyName(schema, ["Submitted At", "Created", "Date"], "date");
    if (submittedAtPropertyName) {
      properties[submittedAtPropertyName] = buildDateProperty(new Date());
    }

    const page = await createPage(env.DB_ASSIGNMENT, properties);
    return successResponse({ assignment: mapNotionPage(page) }, 201);
  } catch (error) {
    return errorResponse(error.message || "Failed to submit assignment.");
  }
}
