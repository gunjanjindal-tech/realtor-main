"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";
import { renderBlogContent } from "@/lib/blogRenderer";

export default function BlogPostPage() {
  const params = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchBlog();
    }
  }, [params.slug]);

  const fetchBlog = async () => {
    try {
      const response = await fetch("/api/blogs");
      if (response.ok) {
        const blogs = await response.json();
        const foundBlog = blogs.find((b) => b.slug === params.slug);
        
        if (foundBlog) {
          setBlog(foundBlog);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Blog Post Not Found</h1>
          <Link
            href="/blog"
            className="text-red-500 hover:text-red-600 underline"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#091D35] to-[#0B1F3B] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={18} />
            Back to Blog
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{blog.title}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar size={18} />
            <span>{new Date(blog.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
          <div
            className="prose prose-lg max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: renderBlogContent(blog.content) }}
          />
        </div>
      </article>
    </div>
  );
}

