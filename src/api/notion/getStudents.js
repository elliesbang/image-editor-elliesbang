const NOTION_API_BASE_URL = "https://api.notion.com/v1/databases";
const NOTION_VERSION = "2022-06-28";

const resolveEnv = (key) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key];
  }

  const globalProcess = typeof globalThis !== "undefined" ? globalThis.process : undefined;

  if (globalProcess?.env) {
    return globalProcess.env[key];
  }

  return undefined;
};

const notionToken = resolveEnv("VITE_NOTION_TOKEN") || resolveEnv("NOTION_TOKEN");
const studentDatabaseId = resolveEnv("VITE_NOTION_STUDENT_DB_ID") || resolveEnv("NOTION_STUDENT_DB_ID");
const vodDatabaseId = resolveEnv("VITE_NOTION_VOD_DB_ID") || resolveEnv("NOTION_VOD_DB_ID");

const fetchNotionDatabase = async (databaseId) => {
  if (!databaseId) {
    throw new Error("Notion Database ID가 설정되지 않았습니다.");
  }

  if (!notionToken) {
    throw new Error("Notion API 토큰이 설정되지 않았습니다.");
  }

  const response = await fetch(`${NOTION_API_BASE_URL}/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Notion API 요청에 실패했습니다. (status: ${response.status}) ${errorBody}`
    );
  }

  const payload = await response.json();
  return payload?.results ?? [];
};

const resolvePropertyValue = (property) => {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return (property.title || [])
        .map((item) => item?.plain_text || "")
        .join(" ")
        .trim();
    case "rich_text":
      return (property.rich_text || [])
        .map((item) => item?.plain_text || "")
        .join(" ")
        .trim();
    case "email":
      return property.email || "";
    case "phone_number":
      return property.phone_number || "";
    case "select":
      return property.select?.name || "";
    case "multi_select":
      return (property.multi_select || [])
        .map((item) => item?.name || "")
        .filter(Boolean)
        .join(", ");
    case "status":
      return property.status?.name || "";
    case "people":
      return (property.people || [])
        .map((item) => item?.name || item?.email || "")
        .filter(Boolean)
        .join(", ");
    case "date":
      return property.date?.start || "";
    default:
      return "";
  }
};

const pickPropertyValue = (page, keys) => {
  if (!page?.properties) return "";

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(page.properties, key)) {
      const value = resolvePropertyValue(page.properties[key]);
      if (value) return value;
    }
  }

  return "";
};

const parseStudentRecord = (page) => ({
  id: page.id,
  name: pickPropertyValue(page, ["Name", "이름", "학생명"]),
  email: pickPropertyValue(page, ["Email", "이메일"]),
  status: pickPropertyValue(page, ["Status", "상태"]),
  enrolledCourses: pickPropertyValue(page, [
    "Enrolled Courses",
    "수강중강의",
    "수강 중 강의",
    "Courses",
  ]),
  progress: pickPropertyValue(page, ["Progress", "학습 진척도", "수강 진도"]),
});

const parseVodRecord = (page) => ({
  id: page.id,
  name: pickPropertyValue(page, ["Name", "이름", "구독자"]),
  email: pickPropertyValue(page, ["Email", "이메일"]),
  status: pickPropertyValue(page, ["Status", "상태", "구독 상태"]),
  vodAccess: pickPropertyValue(page, ["VOD 권한", "권한", "Access", "VOD Access"]),
  subscriptionPlan: pickPropertyValue(page, [
    "Subscription",
    "구독 정보",
    "Plan",
    "상품",
  ]),
});

export const getStudents = async () => {
  const pages = await fetchNotionDatabase(studentDatabaseId);
  return pages.map(parseStudentRecord);
};

export const getVODStudents = async () => {
  const pages = await fetchNotionDatabase(vodDatabaseId);
  return pages.map(parseVodRecord);
};

export default getStudents;
