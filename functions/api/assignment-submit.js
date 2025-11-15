import {
  initNotion,
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

    const commentPropertyName = tryResolvePropertyName(schema, ["Comment", "Notes", "Feedback"], "rich_text");
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
