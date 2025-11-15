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

export async function onRequestGet({ request, env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_NOTICE);
    let notices = response.results.map(mapNotionPage);

    const url = new URL(request.url);
    const search = url.searchParams.get("q");
    const limit = Number(url.searchParams.get("limit"));

    if (search) {
      const keyword = search.toLowerCase();
      notices = notices.filter((notice) => {
        const title = notice.properties?.Title ?? notice.properties?.Name ?? "";
        const body = notice.properties?.Body ?? notice.properties?.Content ?? "";
        return (
          String(title).toLowerCase().includes(keyword) ||
          String(body).toLowerCase().includes(keyword)
        );
      });
    }

    if (Number.isFinite(limit) && limit > 0) {
      notices = notices.slice(0, limit);
    }

    return successResponse({ notices });
  } catch (error) {
    return errorResponse(error.message || "Failed to load notices.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const body = await request.json();
    const { title, body: noticeBody, content, date, role } = body || {};

    if (role !== "admin") {
      return errorResponse("Only administrators can create notices.", 403);
    }

    const noticeContent = noticeBody ?? content;

    if (!title || !noticeContent) {
      return errorResponse("Title and body are required.", 400);
    }

    const schema = await retrieveDatabase(env.DB_NOTICE);
    const titlePropertyName = getTitlePropertyName(schema);

    const properties = {
      [titlePropertyName]: buildTitleProperty(title),
    };

    const bodyPropertyName = resolvePropertyName(schema, ["Body", "Content", "Description"], "rich_text");
    properties[bodyPropertyName] = buildRichTextProperty(noticeContent);

    const datePropertyName = resolvePropertyName(schema, ["Date", "Published", "Created"], "date");
    properties[datePropertyName] = buildDateProperty(date || new Date());

    const page = await createPage(env.DB_NOTICE, properties);
    return successResponse({ notice: mapNotionPage(page) }, 201);
  } catch (error) {
    return errorResponse(error.message || "Failed to create notice.");
  }
}
