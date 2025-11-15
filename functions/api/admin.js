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
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

async function fetchAllPages(databaseId) {
  const pages = [];
  let startCursor;

  do {
    const response = await queryDB(databaseId, startCursor ? { start_cursor: startCursor } : {});
    pages.push(...response.results);
    startCursor = response.has_more ? response.next_cursor : null;
  } while (startCursor);

  return pages;
}

export async function onRequestGet({ env }) {
  try {
    initNotion(env);

    const [classrooms, assignments, feedbacks, notices, activityLogs] = await Promise.all([
      fetchAllPages(env.DB_CLASSROOM_LIST),
      fetchAllPages(env.DB_ASSIGNMENT),
      fetchAllPages(env.DB_FEEDBACK),
      fetchAllPages(env.DB_NOTICE),
      fetchAllPages(env.DB_ACTIVITY_LOG),
    ]);

    const classroomItems = classrooms.map(mapNotionPage);
    const assignmentItems = assignments.map(mapNotionPage);
    const feedbackItems = feedbacks.map(mapNotionPage);
    const noticeItems = notices.map(mapNotionPage);
    const activityItems = activityLogs.map(mapNotionPage);

    const feedbackAssignments = new Set();
    for (const feedbackItem of feedbackItems) {
      const relations =
        feedbackItem.properties?.Assignment ??
        feedbackItem.properties?.Submission ??
        feedbackItem.properties?.과제 ?? [];
      const relationIds = Array.isArray(relations) ? relations : [relations];
      for (const relationId of relationIds) {
        if (relationId) {
          feedbackAssignments.add(relationId);
        }
      }
    }

    const pendingFeedbackCount = assignmentItems.filter((assignment) => {
      return !feedbackAssignments.has(assignment.id);
    }).length;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const thisWeekFeedback = feedbackItems.filter((feedbackItem) => {
      const created = feedbackItem.createdTime || feedbackItem.properties?.Created;
      if (!created) return false;
      const createdDate = new Date(created?.start ?? created);
      return Number.isFinite(createdDate.getTime()) && createdDate >= weekStart;
    }).length;

    const ongoingClasses = classroomItems.filter((classroom) => {
      const status = (
        classroom.properties?.Status ??
        classroom.properties?.상태 ??
        classroom.properties?.State ??
        classroom.properties?.진행상태 ??
        ""
      )
        .toString()
        .toLowerCase();
      if (!status) return true;
      return !["done", "완료", "종료", "completed", "finished"].includes(status);
    });

    const recentActivities = [...activityItems]
      .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime))
      .slice(0, 10);

    return successResponse({
      metrics: {
        totalFeedback: feedbackItems.length,
        pendingFeedback: pendingFeedbackCount,
        thisWeekFeedback,
        ongoingClassCount: ongoingClasses.length,
        totalAssignments: assignmentItems.length,
        totalNotices: noticeItems.length,
      },
      classrooms: {
        all: classroomItems,
        ongoing: ongoingClasses,
      },
      assignments: assignmentItems,
      feedbacks: feedbackItems,
      notices: noticeItems,
      recentActivities,
      activityLogs: activityItems,
    });
  } catch (error) {
    return errorResponse(error.message || "Failed to load admin dashboard data.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const payload = await request.json();
    const { action, actor, details } = payload || {};

    if (!action) {
      return errorResponse("Action is required to log activity.", 400);
    }

    const schema = await retrieveDatabase(env.DB_ACTIVITY_LOG);
    const titlePropertyName = getTitlePropertyName(schema);

    const properties = {
      [titlePropertyName]: buildTitleProperty(action),
    };

    const actionPropertyName = tryResolvePropertyName(schema, ["Action", "Event"], "rich_text");
    if (actionPropertyName) {
      properties[actionPropertyName] = buildRichTextProperty(action);
    }

    const actorPropertyName = tryResolvePropertyName(schema, ["Actor", "User", "Owner"], "rich_text");
    if (actorPropertyName && actor) {
      properties[actorPropertyName] = buildRichTextProperty(actor);
    }

    const detailsPropertyName = tryResolvePropertyName(schema, ["Details", "Notes", "Description"], "rich_text");
    if (detailsPropertyName && details) {
      properties[detailsPropertyName] = buildRichTextProperty(details);
    }

    const datePropertyName = tryResolvePropertyName(schema, ["Timestamp", "Date", "Created"], "date");
    if (datePropertyName) {
      properties[datePropertyName] = buildDateProperty(new Date());
    }

    const page = await createPage(env.DB_ACTIVITY_LOG, properties);
    return successResponse({ activity: mapNotionPage(page) }, 201);
  } catch (error) {
    return errorResponse(error.message || "Failed to log activity.");
  }
}
