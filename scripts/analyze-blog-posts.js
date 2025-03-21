/**
 * Blog Post Analysis Script
 * 
 * This script analyzes existing blog posts in src/app/blog/*.mdx
 * and creates a migration plan for moving them to the new structure.
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
    return { year: '0000', month: '00' };
  }
  
  if (isNaN(d.getTime())) {
    console.error(`Invalid date: ${date}`);
    return { year: '0000', month: '00' };
  }
  
  const year = d.getFullYear().toString();
  // Month is 0-indexed, add 1 and pad with leading zero if needed
  const month = String(d.getMonth() + 1).padStart(2, '0');
  
  return { year, month };
}

// Main function to analyze blog posts
function analyzeBlogPosts() {
  console.log('Analyzing blog posts...\n');
  
  // Get all MDX files
  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.mdx') && !file.startsWith('_'));
  
  console.log(`Found ${files.length} MDX files.\n`);
  
  // Migration plan
  const migrationPlan = [];
  
  // Analyze each file
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    
    // Extract key metadata
    const title = data.title || 'Untitled';
    const date = data.date || new Date(0);
    const type = data.type || 'unknown';
    
    // Generate slug from title
    const slug = createSlug(title);
    
    // Format date for directory path
    const { year, month } = formatDateForPath(date);
    
    // Create target directory and file path
    const targetDirPath = path.join(targetDir, year, month);
    const targetFilePath = path.join(targetDirPath, `${slug}.mdx`);
    
    // Create migration plan entry
    migrationPlan.push({
      originalFile: file,
      newSlug: slug,
      newPath: path.relative(process.cwd(), targetFilePath),
      title,
      date: typeof date === 'object' ? date.toISOString() : date,
      type,
      missingMetadata: []
    });
    
    // Check for missing metadata
    if (!data.description) migrationPlan[migrationPlan.length - 1].missingMetadata.push('description');
    if (!data.tags || !Array.isArray(data.tags)) migrationPlan[migrationPlan.length - 1].missingMetadata.push('tags');
    if (!data.keywords) migrationPlan[migrationPlan.length - 1].missingMetadata.push('keywords');
  }
  
  // Output migration plan
  console.log('Migration Plan:');
  console.log('==============\n');
  
  for (const plan of migrationPlan) {
    console.log(`Original: ${plan.originalFile}`);
    console.log(`Title: ${plan.title}`);
    console.log(`New slug: ${plan.newSlug}`);
    console.log(`New path: ${plan.newPath}`);
    console.log(`Missing metadata: ${plan.missingMetadata.join(', ') || 'None'}`);
    console.log('---');
  }
  
  // Output redirect map
  console.log('\nRedirect Map:');
  console.log('============\n');
  
  for (const plan of migrationPlan) {
    const originalSlug = plan.originalFile.replace('.mdx', '');
    console.log(`/blog/${originalSlug} -> /blog/${plan.newSlug}`);
  }
  
  return migrationPlan;
}

// Execute the analysis
analyzeBlogPosts(); 