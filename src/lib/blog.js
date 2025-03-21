/**
 * Blog utility functions for working with the new blog structure
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Configuration
const contentDir = path.join(process.cwd(), 'src/content/blog');

/**
 * Get all blog posts with their metadata
 */
export function getAllPosts() {
  // Get all year directories
  const yearDirs = fs.readdirSync(contentDir).filter(dir => {
    return fs.statSync(path.join(contentDir, dir)).isDirectory();
  });
  
  let posts = [];
  
  // Process each year directory
  for (const year of yearDirs) {
    const yearPath = path.join(contentDir, year);
    
    // Get all month directories
    const monthDirs = fs.readdirSync(yearPath).filter(dir => {
      return fs.statSync(path.join(yearPath, dir)).isDirectory();
    });
    
    // Process each month directory
    for (const month of monthDirs) {
      const monthPath = path.join(yearPath, month);
      
      // Get all MDX files in this month
      const files = fs.readdirSync(monthPath).filter(file => file.endsWith('.mdx'));
      
      // Process each file
      for (const file of files) {
        const filePath = path.join(monthPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        
        // Create post object
        posts.push({
          slug: data.slug || file.replace('.mdx', ''),
          title: data.title || 'Untitled',
          date: new Date(data.date),
          description: data.description || '',
          tags: data.tags || [],
          keywords: data.keywords || [],
          type: data.type || 'post',
          location: data.location || '',
          lastModified: data.lastModified || data.date,
          path: `/${year}/${month}/${file.replace('.mdx', '')}`,
          series: data.series || undefined
        });
      }
    }
  }
  
  // Sort posts by date (newest first)
  return posts.sort((a, b) => b.date - a.date);
}

/**
 * Get a specific blog post by slug
 */
export function getPostBySlug(slug) {
  // Get all posts
  const posts = getAllPosts();
  
  // Find the post with matching slug
  const post = posts.find(post => post.slug === slug);
  
  if (!post) {
    return null;
  }
  
  // Get the full file path
  const filePath = path.join(
    contentDir, 
    post.path.split('/').filter(Boolean)[0],
    post.path.split('/').filter(Boolean)[1],
    `${post.slug}.mdx`
  );
  
  // Read the file
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  // Return the post with content
  return {
    ...post,
    content,
    ...data
  };
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags() {
  const posts = getAllPosts();
  const allTags = posts.reduce((tags, post) => {
    if (post.tags && Array.isArray(post.tags)) {
      return [...tags, ...post.tags];
    }
    return tags;
  }, []);
  
  // Get unique tags and sort alphabetically
  return [...new Set(allTags)].sort();
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag) {
  const posts = getAllPosts();
  return posts.filter(post => post.tags && post.tags.includes(tag));
}

/**
 * Get posts by year
 */
export function getPostsByYear(year) {
  const posts = getAllPosts();
  return posts.filter(post => {
    const postYear = post.date.getFullYear().toString();
    return postYear === year;
  });
}

/**
 * Get all years that have posts
 */
export function getAllYears() {
  // Get all year directories
  const yearDirs = fs.readdirSync(contentDir).filter(dir => {
    return fs.statSync(path.join(contentDir, dir)).isDirectory();
  });
  
  // Sort years in descending order (newest first)
  return yearDirs.sort((a, b) => b - a);
}

/**
 * Get all posts that belong to a specific series
 */
export function getSeriesPosts(seriesName) {
  const posts = getAllPosts();
  
  return posts
    .filter(post => post.series && post.series.name === seriesName)
    .sort((a, b) => {
      // Sort by part number
      return (a.series?.part || 0) - (b.series?.part || 0);
    });
}

/**
 * Get all unique series names with post counts
 */
export function getAllSeries() {
  const posts = getAllPosts();
  const seriesMap = new Map();
  
  posts.forEach(post => {
    if (post.series && post.series.name) {
      seriesMap.set(
        post.series.name, 
        (seriesMap.get(post.series.name) || 0) + 1
      );
    }
  });
  
  return Array.from(seriesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get next and previous posts in a series
 */
export function getSeriesNavigation(currentPost) {
  if (!currentPost.series) {
    return { series: null, prev: null, next: null };
  }
  
  const seriesPosts = getSeriesPosts(currentPost.series.name);
  const totalParts = seriesPosts.length;
  
  const currentIndex = seriesPosts.findIndex(post => post.slug === currentPost.slug);
  
  if (currentIndex === -1) {
    return { 
      series: { name: currentPost.series.name, totalParts }, 
      prev: null, 
      next: null 
    };
  }
  
  const prev = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null;
  const next = currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null;
  
  return {
    series: { name: currentPost.series.name, totalParts },
    prev,
    next
  };
} 