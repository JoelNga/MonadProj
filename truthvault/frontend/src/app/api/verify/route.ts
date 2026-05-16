import { NextRequest, NextResponse } from "next/server";
import { markScanned } from "@/lib/verifyStore";

export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session");
  
  if (!session) {
    return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
  }

  markScanned(session);

  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          background: #0a0a0a; 
          color: #22c55e; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          margin: 0; 
          font-family: system-ui;
        }
        .container { text-align: center; }
        .check { font-size: 64px; margin-bottom: 16px; }
        .text { font-size: 24px; font-weight: bold; }
        .sub { color: #6b7280; margin-top: 8px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="check">✓</div>
        <div class="text">Verified</div>
        <div class="sub">You can close this page</div>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}