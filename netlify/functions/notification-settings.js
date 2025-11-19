import { errorResponse, getSupabaseClient, handleCors, jsonResponse, methodNotAllowed, parseJsonBody } from "./_supabaseClient.js";

const DEFAULT_SETTINGS = {
  email: true,
  push: true,
  sms: false,
};

async function fetchSettings(supabase, userId) {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("user_id, email, push, sms")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? { user_id: userId, ...DEFAULT_SETTINGS };
}

export async function handler(event) {
  const cors = handleCors(event);
  if (cors) return cors;

  const supabase = getSupabaseClient();

  if (event.httpMethod === "GET") {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return jsonResponse(400, { error: "userId query parameter is required" });
    }

    try {
      const settings = await fetchSettings(supabase, userId);
      return jsonResponse(200, { settings });
    } catch (error) {
      return errorResponse(error);
    }
  }

  if (event.httpMethod === "PUT") {
    let payload;
    try {
      payload = parseJsonBody(event);
    } catch (error) {
      return errorResponse(error, 400);
    }

    const { userId, email = true, push = true, sms = false } = payload;
    if (!userId) {
      return jsonResponse(400, { error: "userId is required" });
    }

    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .upsert(
          {
            user_id: userId,
            email,
            push,
            sms,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      return jsonResponse(200, { settings: data });
    } catch (error) {
      return errorResponse(error);
    }
  }

  return methodNotAllowed(event.httpMethod);
}
