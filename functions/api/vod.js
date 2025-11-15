import {
  initNotion,
  queryDB,
  createPage,
  retrieveDatabase,
  getTitlePropertyName,
  tryResolvePropertyName,
  buildTitleProperty,
  buildRichTextProperty,
  buildUrlProperty,
  buildDateProperty,
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

export async function onRequestGet({ request, env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_VOD_VIDEO);
    let videos = response.results.map(mapNotionPage);

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("q");
    const limit = Number(url.searchParams.get("limit"));

    if (category) {
      const normalized = category.toLowerCase();
      videos = videos.filter((video) => {
        const value =
          video.properties?.Category ??
          video.properties?.카테고리 ??
          video.properties?.Type;
        if (!value) return false;
        if (Array.isArray(value)) {
          return value.some((entry) => String(entry).toLowerCase() === normalized);
        }
        return String(value).toLowerCase() === normalized;
      });
    }

    if (search) {
      const keyword = search.toLowerCase();
      videos = videos.filter((video) => {
        const title = video.properties?.Title ?? video.properties?.Name ?? "";
        const description = video.properties?.Description ?? video.properties?.소개 ?? "";
        return (
          String(title).toLowerCase().includes(keyword) ||
          String(description).toLowerCase().includes(keyword)
        );
      });
    }

    if (Number.isFinite(limit) && limit > 0) {
      videos = videos.slice(0, limit);
    }

    return successResponse({ videos });
  } catch (error) {
    return errorResponse(error.message || "Failed to load VOD content.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const payload = await request.json();
    const { title, description, videoUrl, publishedAt } = payload || {};

    if (!title || !videoUrl) {
      return errorResponse("Title and videoUrl are required.", 400);
    }

    const schema = await retrieveDatabase(env.DB_VOD_VIDEO);
    const titlePropertyName = getTitlePropertyName(schema);

    const properties = {
      [titlePropertyName]: buildTitleProperty(title),
    };

    const descriptionPropertyName = tryResolvePropertyName(schema, ["Description", "Body", "Summary"], "rich_text");
    if (descriptionPropertyName && description) {
      properties[descriptionPropertyName] = buildRichTextProperty(description);
    }

    const urlPropertyName = tryResolvePropertyName(schema, ["URL", "Link", "Video"], "url");
    if (urlPropertyName) {
      properties[urlPropertyName] = buildUrlProperty(videoUrl);
    }

    const publishedPropertyName = tryResolvePropertyName(schema, ["Published", "Date", "Released"], "date");
    if (publishedPropertyName) {
      properties[publishedPropertyName] = buildDateProperty(publishedAt || new Date());
    }

    const page = await createPage(env.DB_VOD_VIDEO, properties);
    return successResponse({ vod: mapNotionPage(page) }, 201);
  } catch (error) {
    return errorResponse(error.message || "Failed to create VOD entry.");
  }
}
