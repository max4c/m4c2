/**
 * Blog utility functions for working with the new blog structure
 */
import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Configuration
const contentDir = path.join(process.cwd(), 'src/content/blog');

// Post type definition
export interface Post {
  slug: string;
  title: string;
  date: Date;
  description: string;
  tags: string[];
  keywords: string[];
  type: string;
  draft?: boolean;
  unlisted?: boolean;
  published?: boolean;
  location?: string;
  banner?: string;
  lastModified?: string;
  path: string;
  content?: string;
  series?: {
    name: string;
    part: number;
  };
}

/**
 * Get all blog posts with their metadata
 */
export function getAllPosts(): Post[] {
  const parseFrontmatterBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return undefined;
  };

  // Get all year directories
  const yearDirs = fs.readdirSync(contentDir).filter(dir => {
    return fs.statSync(path.join(contentDir, dir)).isDirectory();
  });
  
  let posts: Post[] = [];
  
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

        const draft = parseFrontmatterBoolean(data.draft) ?? false;
        const unlisted = parseFrontmatterBoolean(data.unlisted) ?? false;
        const published = parseFrontmatterBoolean(data.published);
        const isHidden = draft || unlisted || published === false;

        if (isHidden) {
          continue;
        }
        
        // Create post object
        posts.push({
          slug: data.slug || file.replace('.mdx', ''),
          title: data.title || 'Untitled',
          date: new Date(data.date),
          description: data.description || '',
          tags: data.tags || [],
          keywords: data.keywords || [],
          type: data.type || 'post',
          draft,
          unlisted,
          published,
          location: data.location || '',
          banner: data.banner || undefined,
          lastModified: data.lastModified || data.date,
          path: `/${year}/${month}/${file.replace('.mdx', '')}`,
          series: data.series || undefined
        });
      }
    }
  }
  
  // Sort posts by date (newest first)
  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get a specific blog post by slug
 */
export function getPostBySlug(slug: string): Post | null {
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
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const allTags = posts.reduce((tags: string[], post) => {
    if (post.tags && Array.isArray(post.tags)) {
      return [...tags, ...post.tags];
    }
    return tags;
  }, []);
  
  // Get unique tags and sort alphabetically
  return Array.from(new Set(allTags)).sort();
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): Post[] {
  const posts = getAllPosts();
  return posts.filter(post => post.tags && post.tags.includes(tag));
}

/**
 * Get posts by year
 */
export function getPostsByYear(year: string): Post[] {
  const posts = getAllPosts();
  return posts.filter(post => {
    const postYear = post.date.getFullYear().toString();
    return postYear === year;
  });
}

/**
 * Get all years that have posts
 */
export function getAllYears(): string[] {
  // Get all year directories
  const yearDirs = fs.readdirSync(contentDir).filter(dir => {
    return fs.statSync(path.join(contentDir, dir)).isDirectory();
  });
  
  // Sort years in descending order (newest first)
  return yearDirs.sort((a, b) => Number(b) - Number(a));
}

/**
 * Get all posts that belong to a specific series
 */
export function getSeriesPosts(seriesName: string): Post[] {
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
export function getAllSeries(): { name: string; count: number }[] {
  const posts = getAllPosts();
  const seriesMap = new Map<string, number>();
  
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
export function getSeriesNavigation(currentPost: Post): { 
  series: { name: string; totalParts: number } | null;
  prev: Post | null;
  next: Post | null;
} {
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
