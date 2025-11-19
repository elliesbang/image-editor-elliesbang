import { errorResponse, getSupabaseClient, handleCors, jsonResponse, methodNotAllowed } from "./_supabaseClient.js";

export async function handler(event) {
  const cors = handleCors(event);
  if (cors) return cors;

  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("vod_categories")
      .select("id, name, parent_id, sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return jsonResponse(200, { categories: data ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
}
