import { errorResponse, getSupabaseClient, handleCors, jsonResponse, methodNotAllowed, parseJsonBody } from "./_supabaseClient.js";

export async function handler(event) {
  const cors = handleCors(event);
  if (cors) return cors;

  if (event.httpMethod !== "POST") {
    return methodNotAllowed(event.httpMethod);
  }

  let payload;
  try {
    payload = parseJsonBody(event);
  } catch (error) {
    return errorResponse(error, 400);
  }

  const { title, description = "", categoryId, vodId, slug } = payload;

  if (!title || !categoryId) {
    return jsonResponse(400, { error: "title and categoryId are required" });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("classrooms")
      .insert({
        title,
        description,
        category_id: categoryId,
        vod_id: vodId ?? null,
        slug: slug ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return jsonResponse(201, { classroom: data });
  } catch (error) {
    return errorResponse(error);
  }
}
