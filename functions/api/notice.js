import {
  initNotion,
  queryDB,
  createPage,
  retrieveDatabase,
  getTitlePropertyName,
  resolvePropertyName,
  mapNotionPage,
  buildTitleProperty,
  buildRichTextProperty,
  buildDateProperty,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

export async function onRequestGet({ env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_NOTICE);
    const notices = response.results.map(mapNotionPage);
    return successResponse({ notices });
  } catch (error) {
    return errorResponse(error.message || "Failed to load notices.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const body = await request.json();
    const { title, body: noticeBody, date, role } = body || {};

    if (role !== "admin") {
      return errorResponse("Only administrators can create notices.", 403);
    }

    if (!title || !noticeBody) {
      return errorResponse("Title and body are required.", 400);
    }

    const schema = await retrieveDatabase(env.DB_NOTICE);
    const titlePropertyName = getTitlePropertyName(schema);

    const properties = {
      [titlePropertyName]: buildTitleProperty(title),
    };

    const bodyPropertyName = resolvePropertyName(schema, ["Body", "Content", "Description"], "rich_text");
    properties[bodyPropertyName] = buildRichTextProperty(noticeBody);

    const datePropertyName = resolvePropertyName(schema, ["Date", "Published", "Created"], "date");
    properties[datePropertyName] = buildDateProperty(date || new Date());

    const page = await createPage(env.DB_NOTICE, properties);
    return successResponse({ notice: mapNotionPage(page) }, 201);
  } catch (error) {
    return errorResponse(error.message || "Failed to create notice.");
  }
}
