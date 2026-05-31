import { ValidationError } from "./validation";

/** Read and parse a JSON request body, surfacing a clean 400 on bad JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}

/** Map thrown errors to JSON responses: ValidationError -> 400, else 500. */
export function errorResponse(err: unknown): Response {
  if (err instanceof ValidationError) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  console.error("[macrotrackro] unhandled error:", err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
