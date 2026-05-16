import { NextRequest, NextResponse } from "next/server";
import { isScanned } from "@/lib/verifyStore";

export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session");
  
  if (!session) {
    return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
  }

  return NextResponse.json({ scanned: isScanned(session) });
}