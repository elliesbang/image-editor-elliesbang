import { errorResponse, getSupabaseClient, handleCors, jsonResponse, methodNotAllowed, parseJsonBody } from "./_supabaseClient.js";

export async function handler(event) {
  const cors = handleCors(event);
  if (cors) return cors;

  if (event.httpMethod !== "DELETE") {
    return methodNotAllowed(event.httpMethod);
  }

  let notificationId = event.queryStringParameters?.notificationId;

  if (!notificationId) {
    try {
      const body = parseJsonBody(event);
      notificationId = body.notificationId;
    } catch (error) {
      return errorResponse(error, 400);
    }
  }

  if (!notificationId) {
    return jsonResponse(400, { error: "notificationId is required" });
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;

    return jsonResponse(200, { success: true, notificationId });
  } catch (error) {
    return errorResponse(error);
  }
}
