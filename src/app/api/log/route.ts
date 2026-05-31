import { errorResponse, readJson } from "@/lib/http";
import { addEntry, getDayView } from "@/lib/store";
import { isISODate, parseLogEntryInput, ValidationError } from "@/lib/validation";

// GET /api/log?date=YYYY-MM-DD  -> DayView (entries + totals + goals for the day)
export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date");
    if (!isISODate(date)) {
      throw new ValidationError(`"date" query param must be YYYY-MM-DD`);
    }
    return Response.json(getDayView(date));
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/log  -> add a food to the day's log, returns the refreshed DayView
export async function POST(request: Request) {
  try {
    const input = parseLogEntryInput(await readJson(request));
    addEntry(input);
    return Response.json(getDayView(input.date), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
