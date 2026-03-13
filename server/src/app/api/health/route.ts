import { ok } from "@/lib/api";

export async function GET() {
  return ok({ status: "ok", service: "nextjs-server-template", version: "v1" });
}
