import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().optional(),
});

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("todos")
    .select("id, title, done, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return fail("Failed to fetch todos", 500, error.message);
  }

  return ok(data);
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const parsed = createTodoSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("Invalid request body", 422, parsed.error.flatten());
  }

  const { data, error } = await supabaseAdmin
    .from("todos")
    .insert({ title: parsed.data.title, done: parsed.data.done ?? false })
    .select("id, title, done, created_at")
    .single();

  if (error) {
    return fail("Failed to create todo", 500, error.message);
  }

  return ok(data, 201);
}
