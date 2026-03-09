"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Edit, Trash2, Eye } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

export default function AdminPanel() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    slug: "",
  });

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBlog
        ? `/api/blogs/${editingBlog.id}`
        : "/api/blogs";
      const method = editingBlog ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBlogs();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save blog");
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      alert("Failed to save blog");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBlogs();
      } else {
        alert("Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      content: blog.content || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      slug: blog.slug || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      slug: "",
    });
    setEditingBlog(null);
    setShowForm(false);
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#091D35]">Admin Panel</h1>
              <p className="text-sm text-gray-500">Manage your blog posts</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Blog Posts</h2>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <Plus size={18} />
            New Blog Post
          </button>
        </div>

        {/* Blog Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Blog post title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL-friendly)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="blog-post-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate from title
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title (SEO)
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="SEO title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description (SEO)
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="SEO description for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={handleContentChange}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                >
                  {editingBlog ? "Update Blog" : "Create Blog"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blogs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {blogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No blog posts yet. Create your first blog post!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {blogs.map((blog) => (
                <div key={blog.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {blog.metaDescription || "No description"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Created: {new Date(blog.createdAt).toLocaleDateString()}</span>
                        {blog.updatedAt !== blog.createdAt && (
                          <span>Updated: {new Date(blog.updatedAt).toLocaleDateString()}</span>
                        )}
                        <span>Slug: /blog/{blog.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={`/blog/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
                        title="View"
                      >
                        <Eye size={18} />
                      </a>
                      <button
                        onClick={() => handleEdit(blog)}
                        className="p-2 text-yellow-500 hover:bg-yellow-50 rounded transition"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

