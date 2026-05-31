import { errorResponse, readJson } from "@/lib/http";
import { getGoals, setGoals } from "@/lib/store";
import { parseGoals } from "@/lib/validation";

// GET /api/goals  -> Goals
export async function GET() {
  try {
    return Response.json(getGoals());
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/goals  -> replace daily targets, returns saved Goals
export async function PUT(request: Request) {
  try {
    const goals = parseGoals(await readJson(request));
    return Response.json(setGoals(goals));
  } catch (err) {
    return errorResponse(err);
  }
}
