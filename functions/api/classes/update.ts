const normalizeInt = (v: any) =>
  v === '' || v === undefined || v === null ? null : Number(v);

const requireJsonBody = async (request: Request) => {
  if (request.headers.get('content-type')?.includes('application/json')) {
    return request.json();
  }

  throw new Error('Expected JSON body');
};

export default async function handler(request: Request): Promise<Response> {
  try {
    const raw = await requireJsonBody(request);

    const body = {
      ...raw,
      category_id: normalizeInt(raw.category_id),
      duration: normalizeInt(raw.duration),
      assignment_upload_time: normalizeInt(raw.assignment_upload_time),
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
