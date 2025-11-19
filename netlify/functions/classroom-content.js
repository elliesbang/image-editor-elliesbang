import { errorResponse, getSupabaseClient, handleCors, jsonResponse, methodNotAllowed } from "./_supabaseClient.js";

export async function handler(event) {
  const cors = handleCors(event);
  if (cors) return cors;

  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod);
  }

  const classroomId = event.queryStringParameters?.classroomId;
  if (!classroomId) {
    return jsonResponse(400, { error: "classroomId query parameter is required" });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("classroom_content")
      .select("id, classroom_id, title, description, content_url, sort_order")
      .eq("classroom_id", classroomId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return jsonResponse(200, { items: data ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}
