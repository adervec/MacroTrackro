import { errorResponse, readJson } from "@/lib/http";
import { createFood, searchFoods } from "@/lib/store";
import { parseFoodInput } from "@/lib/validation";

// GET /api/foods?q=chicken  -> Food[]
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return Response.json(searchFoods(q));
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/foods  -> creates a custom food, returns it
export async function POST(request: Request) {
  try {
    const input = parseFoodInput(await readJson(request));
    const food = createFood(input);
    return Response.json(food, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
