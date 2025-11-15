import {
  initNotion,
  queryDB,
  mapNotionPage,
  successResponse,
  errorResponse,
} from "./utils/notion.js";

export async function onRequestGet({ env }) {
  try {
    initNotion(env);
    const response = await queryDB(env.DB_COURSE);
    const courses = response.results.map(mapNotionPage);
    return successResponse({ courses });
  } catch (error) {
    return errorResponse(error.message || "Failed to load course data.");
  }
}
