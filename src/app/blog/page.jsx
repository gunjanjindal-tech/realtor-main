"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      if (response.ok) {
        const data = await response.json();
        setBlogs(data);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#091D35] to-[#0B1F3B] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-gray-300">
            Insights, tips, and updates about Nova Scotia real estate
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold text-[#091D35] mb-3 group-hover:text-red-500 transition">
                    {blog.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.metaDescription || blog.content.substring(0, 150) + "..."}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500 group-hover:gap-3 transition">
                      <span>Read more</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

