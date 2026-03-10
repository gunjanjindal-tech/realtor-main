import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBlogById, updateBlog, deleteBlog } from "@/lib/blogStorage";

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session && session.value;
}

// GET - Fetch a single blog
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const blog = getBlogById(id);

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

// PUT - Update a blog
export async function PUT(req, { params }) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { title, content, metaTitle, metaDescription, slug } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const blog = updateBlog(id, {
      title,
      content,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || "",
      slug: slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error updating blog:", error);
    if (error.message === "Blog not found") {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a blog
export async function DELETE(req, { params }) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    deleteBlog(id);

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    if (error.message === "Blog not found") {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}

