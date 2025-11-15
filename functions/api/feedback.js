import {
  initNotion,
  createPage,
  retrieveDatabase,
  getTitlePropertyName,
  tryResolvePropertyName,
  buildTitleProperty,
  buildRichTextProperty,
  buildRelationProperty,
  buildDateProperty,
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const payload = await request.json();
    const { assignmentId, feedbackText, adminName } = payload || {};

    if (!assignmentId || !feedbackText) {
      return errorResponse("assignmentId and feedbackText are required.", 400);
    }

    const schema = await retrieveDatabase(env.DB_FEEDBACK);
    const titlePropertyName = getTitlePropertyName(schema);

    const properties = {
      [titlePropertyName]: buildTitleProperty(`Feedback - ${assignmentId}`),
    };

    const feedbackPropertyName = tryResolvePropertyName(schema, ["Feedback", "Content", "Body"], "rich_text");
    if (feedbackPropertyName) {
      properties[feedbackPropertyName] = buildRichTextProperty(feedbackText);
    }

    const adminPropertyName = tryResolvePropertyName(schema, ["Admin", "Reviewer", "Author"], "rich_text");
    if (adminPropertyName && adminName) {
      properties[adminPropertyName] = buildRichTextProperty(adminName);
    }

    const relationPropertyName = tryResolvePropertyName(schema, ["Assignment", "Submission"], "relation");
    if (relationPropertyName) {
      properties[relationPropertyName] = buildRelationProperty([assignmentId]);
    }

    const datePropertyName = tryResolvePropertyName(schema, ["Created", "Date", "Submitted"], "date");
    if (datePropertyName) {
      properties[datePropertyName] = buildDateProperty(new Date());
    }

    const page = await createPage(env.DB_FEEDBACK, properties);
    return successResponse({ feedback: mapNotionPage(page) }, 201);
  } catch (error) {
    return errorResponse(error.message || "Failed to submit feedback.");
  }
}
