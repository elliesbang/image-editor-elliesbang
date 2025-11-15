import {
  initNotion,
  queryDB,
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

export async function onRequestGet({ request, env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_FEEDBACK);
    let feedbacks = response.results.map(mapNotionPage);

    const url = new URL(request.url);
    const assignmentId = url.searchParams.get("assignmentId");
    const student = url.searchParams.get("student") || url.searchParams.get("studentName");
    const status = url.searchParams.get("status");

    if (assignmentId) {
      const normalized = assignmentId.toLowerCase();
      feedbacks = feedbacks.filter((feedbackItem) => {
        const relation =
          feedbackItem.properties?.Assignment ??
          feedbackItem.properties?.Submission ??
          feedbackItem.properties?.과제;
        if (!relation) return false;
        if (Array.isArray(relation)) {
          return relation.some((entry) => String(entry).toLowerCase() === normalized);
        }
        return String(relation).toLowerCase() === normalized;
      });
    }

    if (student) {
      const keyword = student.toLowerCase();
      feedbacks = feedbacks.filter((feedbackItem) => {
        const candidates = [
          feedbackItem.properties?.Student,
          feedbackItem.properties?.Learner,
          feedbackItem.properties?.학생,
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
      feedbacks = feedbacks.filter((feedbackItem) => {
        const value =
          feedbackItem.properties?.Status ??
          feedbackItem.properties?.상태 ??
          feedbackItem.properties?.state;
        if (!value) return false;
        if (Array.isArray(value)) {
          return value.some((entry) => String(entry).toLowerCase() === status.toLowerCase());
        }
        return String(value).toLowerCase() === status.toLowerCase();
      });
    }

    return successResponse({ feedbacks });
  } catch (error) {
    return errorResponse(error.message || "Failed to load feedback.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const payload = await request.json();
    const { assignmentId, feedback: feedbackMessage, adminName } = payload || {};

    if (!assignmentId || !feedbackMessage) {
      return errorResponse("assignmentId and feedback are required.", 400);
    }

    const schema = await retrieveDatabase(env.DB_FEEDBACK);
    const titlePropertyName = getTitlePropertyName(schema);

    const properties = {
      [titlePropertyName]: buildTitleProperty(`Feedback - ${assignmentId}`),
    };

    const feedbackPropertyName = tryResolvePropertyName(schema, ["Feedback", "Content", "Body"], "rich_text");
    if (feedbackPropertyName) {
      properties[feedbackPropertyName] = buildRichTextProperty(feedbackMessage);
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
