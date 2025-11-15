import { Client } from "@notionhq/client";

let notionClient = null;
let notionToken = null;
const databaseSchemaCache = new Map();

function ensureClient() {
  if (!notionClient) {
    throw new Error("Notion client is not initialized. Call initNotion(env) first.");
  }
}

function normalizeNotionError(error) {
  if (error?.body?.message) {
    return new Error(`Notion API error: ${error.body.message}`);
  }
  if (error?.message) {
    return new Error(`Notion API error: ${error.message}`);
  }
  return new Error("Unknown Notion API error");
}

export function initNotion(env) {
  const token = env?.NOTION_TOKEN;
  if (!token) {
    throw new Error("NOTION_TOKEN environment variable is missing.");
  }

  if (!notionClient || notionToken !== token) {
    notionClient = new Client({ auth: token });
    notionToken = token;
    databaseSchemaCache.clear();
  }

  return notionClient;
}

export async function queryDB(databaseId, params = {}) {
  ensureClient();
  try {
    return await notionClient.databases.query({
      database_id: databaseId,
      ...params,
    });
  } catch (error) {
    throw normalizeNotionError(error);
  }
}

export async function querySingle(databaseId, filter) {
  const response = await queryDB(databaseId, { filter, page_size: 1 });
  return response.results?.[0] ?? null;
}

export async function createPage(databaseId, properties) {
  ensureClient();
  try {
    return await notionClient.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
  } catch (error) {
    throw normalizeNotionError(error);
  }
}

export async function updatePage(pageId, properties) {
  ensureClient();
  try {
    return await notionClient.pages.update({
      page_id: pageId,
      properties,
    });
  } catch (error) {
    throw normalizeNotionError(error);
  }
}

export async function retrieveDatabase(databaseId) {
  ensureClient();
  if (databaseSchemaCache.has(databaseId)) {
    return databaseSchemaCache.get(databaseId);
  }
  try {
    const schema = await notionClient.databases.retrieve({ database_id: databaseId });
    databaseSchemaCache.set(databaseId, schema);
    return schema;
  } catch (error) {
    throw normalizeNotionError(error);
  }
}

export function getTitlePropertyName(databaseSchema) {
  const entry = Object.entries(databaseSchema?.properties || {}).find(
    ([, value]) => value?.type === "title",
  );
  if (!entry) {
    throw new Error("No title property found in the Notion database.");
  }
  return entry[0];
}

export function resolvePropertyName(databaseSchema, candidates = [], type) {
  const properties = databaseSchema?.properties || {};
  for (const candidate of candidates) {
    if (properties[candidate] && (!type || properties[candidate].type === type)) {
      return candidate;
    }
  }
  if (type) {
    const entry = Object.entries(properties).find(([, value]) => value?.type === type && value?.type !== "title");
    if (entry) {
      return entry[0];
    }
  }
  if (candidates.length > 0) {
    throw new Error(`Required property not found. Expected one of: ${candidates.join(", ")}`);
  }
  throw new Error("Unable to resolve property name for the provided schema.");
}

export function tryResolvePropertyName(databaseSchema, candidates = [], type) {
  try {
    return resolvePropertyName(databaseSchema, candidates, type);
  } catch (error) {
    return null;
  }
}

export function mapNotionPage(page) {
  if (!page) {
    return null;
  }
  const properties = {};
  for (const [key, value] of Object.entries(page.properties || {})) {
    properties[key] = extractPropertyValue(value);
  }
  return {
    id: page.id,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    archived: page.archived,
    url: page.url,
    properties,
  };
}

function extractPropertyValue(property) {
  if (!property) return null;
  switch (property.type) {
    case "title":
      return property.title.map((item) => item.plain_text || "").join("");
    case "rich_text":
      return property.rich_text.map((item) => item.plain_text || "").join("");
    case "number":
      return property.number;
    case "checkbox":
      return property.checkbox;
    case "select":
      return property.select ? property.select.name : null;
    case "multi_select":
      return property.multi_select.map((option) => option.name);
    case "date":
      return property.date;
    case "email":
      return property.email;
    case "url":
      return property.url;
    case "phone_number":
      return property.phone_number;
    case "people":
      return property.people.map((person) => ({
        id: person.id,
        name: person.name,
        avatarUrl: person.avatar_url,
        email: person.person?.email ?? null,
      }));
    case "relation":
      return property.relation.map((item) => item.id);
    case "files":
      return property.files.map((file) => ({
        name: file.name,
        url: file[file.type]?.url ?? null,
        expiryTime: file[file.type]?.expiry_time ?? null,
      }));
    case "formula":
      return (
        property.formula?.string ??
        property.formula?.number ??
        property.formula?.boolean ??
        property.formula?.date ??
        null
      );
    case "status":
      return property.status?.name ?? null;
    case "created_by":
      return property.created_by?.id ?? null;
    case "last_edited_by":
      return property.last_edited_by?.id ?? null;
    case "created_time":
      return property.created_time;
    case "last_edited_time":
      return property.last_edited_time;
    default:
      return property[property.type] ?? null;
  }
}

export function buildTitleProperty(content) {
  return {
    title: content
      ? [
          {
            type: "text",
            text: { content },
          },
        ]
      : [],
  };
}

export function buildRichTextProperty(content) {
  return {
    rich_text: content
      ? [
          {
            type: "text",
            text: { content },
          },
        ]
      : [],
  };
}

export function buildDateProperty(value) {
  if (!value) {
    return { date: null };
  }
  const date = value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  return {
    date: { start: date },
  };
}

export function buildUrlProperty(url) {
  return {
    url: url || null,
  };
}

export function buildNumberProperty(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return { number: null };
  }
  return {
    number: Number(value),
  };
}

export function buildRelationProperty(ids = []) {
  return {
    relation: ids.filter(Boolean).map((id) => ({ id })),
  };
}

export function buildSelectProperty(name) {
  return {
    select: name ? { name } : null,
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function successResponse(payload = {}, status = 200) {
  const data = typeof payload === "object" && payload !== null ? payload : { data: payload };
  return jsonResponse({ success: true, ...data }, status);
}

export function errorResponse(message, status = 500, details) {
  const body = { success: false, error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return jsonResponse(body, status);
}
