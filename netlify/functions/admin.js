export async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, role: "admin", message: "Admin login available" }),
  };
}
