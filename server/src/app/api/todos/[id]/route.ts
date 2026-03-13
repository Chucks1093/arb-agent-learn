import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const updateTodoSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    done: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
  });

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("todos")
    .select("id, title, done, created_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return fail("Todo not found", 404);
    return fail("Failed to fetch todo", 500, error.message);
  }

  return ok(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => null);
  const parsed = updateTodoSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("Invalid request body", 422, parsed.error.flatten());
  }

  const { data, error } = await supabaseAdmin
    .from("todos")
    .update(parsed.data)
    .eq("id", id)
    .select("id, title, done, created_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") return fail("Todo not found", 404);
    return fail("Failed to update todo", 500, error.message);
  }

  return ok(data);
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseAdmin.from("todos").delete().eq("id", id);

  if (error) {
    return fail("Failed to delete todo", 500, error.message);
  }

  return ok({ id, deleted: true });
}
