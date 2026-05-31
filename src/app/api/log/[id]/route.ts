import { errorResponse, readJson } from "@/lib/http";
import { deleteEntry, getDayView, updateEntry } from "@/lib/store";
import { parseLogEntryPatch } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

// PATCH /api/log/:id  -> update servings/meal, returns refreshed DayView
export async function PATCH(request: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const patch = parseLogEntryPatch(await readJson(request));
    const entry = updateEntry(id, patch);
    if (!entry) return Response.json({ error: "Log entry not found" }, { status: 404 });
    return Response.json(getDayView(entry.date));
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/log/:id  -> remove entry, returns refreshed DayView
export async function DELETE(_request: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const entry = deleteEntry(id);
    if (!entry) return Response.json({ error: "Log entry not found" }, { status: 404 });
    return Response.json(getDayView(entry.date));
  } catch (err) {
    return errorResponse(err);
  }
}
