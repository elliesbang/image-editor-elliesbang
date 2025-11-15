import {
  initNotion,
  queryDB,
  mapNotionPage,
  errorResponse,
  successResponse,
} from "./utils/notion.js";

function getPasswordFromProperties(page) {
  const mapped = mapNotionPage(page);
  return mapped?.properties?.Password ?? null;
}

export async function onRequestPost({ request, env }) {
  try {
    initNotion(env);
    const body = await request.json();
    const { email, password, role } = body || {};

    if (!email || !password || !role) {
      return errorResponse("Missing email, password, or role.", 400);
    }

    const databaseByRole = {
      student: env.DB_STUDENT_ACCOUNT,
      admin: env.DB_ADMIN_ACCOUNT,
      vod: env.DB_VOD_ACCOUNT,
    };

    const databaseId = databaseByRole[role];

    if (!databaseId) {
      return errorResponse("Invalid role provided.", 400);
    }

    const response = await queryDB(databaseId, {
      filter: {
        property: "Email",
        email: { equals: email },
      },
    });

    const accountPage = response.results?.[0];

    if (!accountPage) {
      return errorResponse("Invalid email or password.", 401);
    }

    const storedPassword = getPasswordFromProperties(accountPage);
    if (storedPassword !== password) {
      return errorResponse("Invalid email or password.", 401);
    }

    const user = mapNotionPage(accountPage);
    if (user?.properties) {
      delete user.properties.Password;
    }
    return successResponse({ user });
  } catch (error) {
    return errorResponse(error.message || "Failed to process login request.");
  }
}
