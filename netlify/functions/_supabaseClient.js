import { createClient } from "@supabase/supabase-js";

let cachedClient;

function getEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = getEnvVar("SUPABASE_URL");
  const key = getEnvVar("SUPABASE_ANON_KEY");

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(payload ?? {}),
  };
}

export function handleCors(event) {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, { success: true });
  }
  return null;
}

export function methodNotAllowed(method) {
  return jsonResponse(405, { error: `${method} is not allowed for this endpoint.` });
}

export function parseJsonBody(event) {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error("Invalid JSON body supplied");
  }
}

export function errorResponse(error, statusCode = 500) {
  const message = error?.message || "Unexpected error";
  return jsonResponse(statusCode, { error: message });
}
