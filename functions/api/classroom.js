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
    const response = await queryDB(env.DB_CLASSROOM_LIST);
    const classrooms = response.results.map(mapNotionPage);
    return successResponse({ classrooms });
  } catch (error) {
    return errorResponse(error.message || "Failed to load classrooms.");
  }
}
