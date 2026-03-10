import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@realtor.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Simple authentication (in production, use proper password hashing)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create a simple session token (in production, use JWT or proper session management)
      const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString("base64");
      
      // Set cookie with session token
      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true, message: "Login successful" });
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

