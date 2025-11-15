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

    const data = {
      counts: {
        classrooms: classrooms.length,
        assignments: assignments.length,
        feedbacks: feedbacks.length,
        notices: notices.length,
        activityLogs: activityLogs.length,
      },
      classrooms: classrooms.map(mapNotionPage),
      assignments: assignments.map(mapNotionPage),
      feedbacks: feedbacks.map(mapNotionPage),
      notices: notices.map(mapNotionPage),
      activityLogs: activityLogs.map(mapNotionPage),
    };

    return successResponse(data);
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
