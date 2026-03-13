import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllBlogs, createBlog } from "@/lib/blogStorage";

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session && session.value;
}

// GET - Fetch all blogs
export async function GET() {
  try {
    const blogs = getAllBlogs();
    // Sort by createdAt (newest first)
    const sortedBlogs = blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json(sortedBlogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST - Create a new blog
export async function POST(req) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content, metaTitle, metaDescription, slug } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const blog = createBlog({
      title,
      content,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || "",
      slug: slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}

