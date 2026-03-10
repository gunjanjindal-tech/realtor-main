import fs from "fs";
import path from "path";

const BLOG_FILE_PATH = path.join(process.cwd(), "data", "blogs.json");

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(BLOG_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize blogs file if it doesn't exist
function initializeBlogsFile() {
  ensureDataDirectory();
  if (!fs.existsSync(BLOG_FILE_PATH)) {
    fs.writeFileSync(BLOG_FILE_PATH, JSON.stringify([], null, 2));
  }
}

// Read all blogs
export function getAllBlogs() {
  try {
    initializeBlogsFile();
    const data = fs.readFileSync(BLOG_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading blogs:", error);
    return [];
  }
}

// Get a single blog by ID
export function getBlogById(id) {
  const blogs = getAllBlogs();
  return blogs.find((blog) => blog.id === id);
}

// Create a new blog
export function createBlog(blogData) {
  try {
    initializeBlogsFile();
    const blogs = getAllBlogs();
    const newBlog = {
      id: Date.now().toString(),
      ...blogData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    blogs.push(newBlog);
    fs.writeFileSync(BLOG_FILE_PATH, JSON.stringify(blogs, null, 2));
    return newBlog;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
}

// Update a blog
export function updateBlog(id, blogData) {
  try {
    initializeBlogsFile();
    const blogs = getAllBlogs();
    const index = blogs.findIndex((blog) => blog.id === id);
    
    if (index === -1) {
      throw new Error("Blog not found");
    }

    blogs[index] = {
      ...blogs[index],
      ...blogData,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(BLOG_FILE_PATH, JSON.stringify(blogs, null, 2));
    return blogs[index];
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
}

// Delete a blog
export function deleteBlog(id) {
  try {
    initializeBlogsFile();
    const blogs = getAllBlogs();
    const filteredBlogs = blogs.filter((blog) => blog.id !== id);
    
    if (filteredBlogs.length === blogs.length) {
      throw new Error("Blog not found");
    }

    fs.writeFileSync(BLOG_FILE_PATH, JSON.stringify(filteredBlogs, null, 2));
    return true;
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
}

