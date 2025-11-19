import { errorResponse, getSupabaseClient, handleCors, jsonResponse, methodNotAllowed } from "./_supabaseClient.js";

export async function handler(event) {
  const cors = handleCors(event);
  if (cors) return cors;

  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod);
  }

  const userId = event.queryStringParameters?.userId;
  const limit = Number(event.queryStringParameters?.limit ?? 50);

  if (!userId) {
    return jsonResponse(400, { error: "userId query parameter is required" });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, body, created_at, read")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(Number.isFinite(limit) ? Math.max(1, limit) : 50);

    if (error) throw error;

    return jsonResponse(200, { notifications: data ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}
