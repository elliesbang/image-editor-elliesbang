export async function handler(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, metrics: {}, classrooms: {}, assignments: [], feedbacks: [], notices: [], recentActivities: [], activityLogs: [] }),
  };
}
