import { cookies } from "next/headers";
import { type NextResponse } from "next/server";
import { env } from "@/lib/env";

type SessionPayload = {
  address: string;
  issuedAt: number;
};

export function createSessionToken(address: string) {
  return Buffer.from(`${address}:${Date.now()}`).toString("base64");
}

function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function parseSessionToken(token: string): SessionPayload | null {
  try {
    const [address, issuedAt] = Buffer.from(token, "base64").toString().split(":");

    if (!address || !issuedAt) {
      return null;
    }

    return {
      address,
      issuedAt: Number(issuedAt),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(address: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    env.sessionCookieName,
    createSessionToken(address),
    getSessionCookieOptions(),
  );
}

export function setSessionCookieOnResponse(response: NextResponse, address: string) {
  response.cookies.set(
    env.sessionCookieName,
    createSessionToken(address),
    getSessionCookieOptions(),
  );

  return response;
}

export function clearSessionCookieOnResponse(response: NextResponse) {
  response.cookies.set(env.sessionCookieName, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return parseSessionToken(token);
}
