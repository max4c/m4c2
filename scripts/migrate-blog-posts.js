/**
 * Blog Post Migration Script
 * 
 * This script migrates existing blog posts from src/app/blog/*.mdx
 * to the new structure in src/content/blog/{year}/{month}/{slug}.mdx
 * and enhances their frontmatter with SEO metadata.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const slugify = require('slugify');

// Configuration
const sourceDir = path.join(process.cwd(), 'src/app/blog');
const targetDir = path.join(process.cwd(), 'src/content/blog');

// Helper function to create a slug from title
function createSlug(title) {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

// Helper function to format date for directory structure
function formatDateForPath(date) {
  let d;
  
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else {
    console.error(`Invalid date type: ${typeof date}, value: ${date}`);
    return { year: '0000', month: 'jan' };
  }
  
  if (isNaN(d.getTime())) {
    console.error(`Invalid date: ${date}`);
    return { year: '0000', month: 'jan' };
  }
  
  const year = d.getFullYear().toString();
  
  // Month as three-letter abbreviation
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = monthNames[d.getMonth()];
  
  return { year, month };
}

// Helper function to generate a description if none exists
function generateDescription(content, title, maxLength = 160) {
  // Remove markdown formatting and extract plain text
  const plainText = content
    .replace(/#+\s+(.*)/g, '') // Remove headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/[*_~`]/g, '') // Remove formatting characters
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Use the first portion of text as the description
  let description = plainText.slice(0, maxLength);
  
  // If description was cut, find the last complete word and add ellipsis
  if (plainText.length > maxLength) {
    const lastSpaceIndex = description.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      description = description.slice(0, lastSpaceIndex) + '...';
    } else {
      description += '...';
    }
  }
  
  return description || `${title} - Read more about this topic on Max Forsey's blog.`;
}

// Helper function to suggest tags based on content
function suggestTags(content, title) {
  const commonTags = [
    { tag: 'productivity', keywords: ['productive', 'efficiency', 'workflow', 'time', 'management', 'schedule', 'chronotype'] },
    { tag: 'technology', keywords: ['tech', 'software', 'api', 'code', 'programming', 'developer', 'engineering'] },
    { tag: 'health', keywords: ['health', 'fitness', 'exercise', 'wellbeing', 'longevity', 'nutrition', 'sleep'] },
    { tag: 'science', keywords: ['research', 'study', 'scientific', 'data', 'evidence'] },
    { tag: 'philosophy', keywords: ['philosophical', 'ethics', 'moral', 'thinking', 'ideas'] },
    { tag: 'artificial-intelligence', keywords: ['ai', 'machine learning', 'neural', 'model', 'gpt', 'llm', 'deep learning'] },
    { tag: 'personal-development', keywords: ['growth', 'improve', 'learning', 'skill', 'habit'] }
  ];
  
  const normalizedContent = (content + ' ' + title).toLowerCase();
  const suggestedTags = [];
  
  for (const { tag, keywords } of commonTags) {
    for (const keyword of keywords) {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        suggestedTags.push(tag);
        break; // Only add each tag once
      }
    }
  }
  
  return suggestedTags;
}

// Main migration function
async function migrateBlogPosts(dryRun = false) {
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Migrating blog posts...\n`);
  
  // Get all MDX files
  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.mdx') && !file.startsWith('_'));
  
  console.log(`Found ${files.length} MDX files to migrate.\n`);
  
  // Track migrations for redirect generation
  const migrations = [];
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    // Extract key metadata
    const title = data.title || 'Untitled';
    const date = data.date || new Date(0);
    let type = data.type || 'post';
    const location = data.location || '';
    
    // Generate slug from title
    const slug = createSlug(title);
    
    // Format date for directory path
    const { year, month } = formatDateForPath(date);
    
    // Create target directory path
    const targetDirPath = path.join(targetDir, year, month);
    const targetFilePath = path.join(targetDirPath, `${slug}.mdx`);
    
    // Generate missing metadata
    const description = data.description || generateDescription(content, title);
    const tags = data.tags || suggestTags(content, title);
    const keywords = data.keywords || [...tags]; // Use tags as default keywords
    
    // Create enhanced frontmatter
    const enhancedFrontmatter = {
      title,
      description,
      date: typeof date === 'object' ? date.toISOString().split('T')[0] : date,
      lastModified: new Date().toISOString().split('T')[0],
      tags,
      keywords,
      type,
      ...(location && { location }),
      slug
    };
    
    // Create new file content with enhanced frontmatter
    const newFileContent = matter.stringify(content, enhancedFrontmatter);
    
    // Create migration record
    migrations.push({
      originalSlug: file.replace('.mdx', ''),
      newSlug: slug
    });
    
    // Output what would be done
    console.log(`Migrating: ${file} → ${path.relative(process.cwd(), targetFilePath)}`);
    console.log(`  Title: ${title}`);
    console.log(`  Slug: ${slug}`);
    console.log(`  Date: ${enhancedFrontmatter.date}`);
    console.log(`  Tags: ${tags.join(', ')}`);
    console.log('---');
    
    // Skip actual file operations in dry run mode
    if (dryRun) continue;
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath, { recursive: true });
    }
    
    // Write the new file
    fs.writeFileSync(targetFilePath, newFileContent);
  }
  
  if (dryRun) {
    console.log('\n[DRY RUN] No files were actually migrated.\n');
  } else {
    console.log('\nMigration completed successfully!\n');
    
    // Generate redirects file
    generateRedirects(migrations);
  }
  
  return migrations;
}

// Generate redirects file
function generateRedirects(migrations) {
  const redirectsPath = path.join(process.cwd(), 'public', '_redirects');
  
  let redirectsContent = '# Redirects from old blog URLs to new structure\n\n';
  
  for (const { originalSlug, newSlug } of migrations) {
    redirectsContent += `/blog/${originalSlug} /blog/${newSlug} 301\n`;
  }
  
  // Ensure public directory exists
  if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
    fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });
  }
  
  fs.writeFileSync(redirectsPath, redirectsContent);
  console.log(`Generated redirects file at: ${redirectsPath}`);
}

// Run migration in dry-run mode first
migrateBlogPosts(true).then(() => {
  // Uncomment to run the actual migration
  return migrateBlogPosts(false);
}); 