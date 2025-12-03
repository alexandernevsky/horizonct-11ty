const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");
const prettier = require("prettier");
const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const md = new markdownIt({
  html: true,
  breaks: true,
  linkify: true
});

module.exports = function (eleventyConfig) {
  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // Date filter for sitemap (YYYY-MM-DD format)
  eleventyConfig.addFilter("sitemapDate", (dateObj) => {
    if (!dateObj) return new Date().toISOString().split('T')[0];
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("YYYY-MM-DD");
  });

  // Limit filter for arrays
  eleventyConfig.addFilter("limit", (array, limit) => {
    return array.slice(0, limit);
  });

  // Current year filter
  eleventyConfig.addFilter("currentYear", () => {
    return new Date().getFullYear();
  });

  // Check if URL is active (for navigation highlighting)
  eleventyConfig.addFilter("isActive", (pageUrl, navUrl) => {
    if (!pageUrl || !navUrl) return false;
    
    // Normalize URLs (remove trailing slashes)
    const page = pageUrl.replace(/\/$/, '') || '/';
    const nav = navUrl.replace(/\/$/, '') || '/';
    
    // Exact match
    if (page === nav) return true;
    
    // Root paths only match themselves
    if (nav === '/' || nav === '/ru') return false;
    
    // Special case: News posts (/news/posts/...) should highlight /ru/news in Russian nav
    if (nav === '/ru/news' && page.startsWith('/news/')) return true;
    
    // Nested routes: /news/posts/article -> /news, /careers/jobs/job -> /careers
    return page.startsWith(nav + '/');
  });

  // Slugify filter for tags
  eleventyConfig.addFilter("slugify", (str) => {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  });

  // Markdown filter
  eleventyConfig.addFilter("markdown", (content) => {
    if (!content) return '';
    return md.render(content);
  });

  // Lucide Icon shortcode - simple wrapper for icon components
  // Usage: {% icon "chevron-down", { size: 24, class: "w-4 h-4" } %}
  eleventyConfig.addShortcode("icon", function(iconName, options = {}) {
    const size = options.size || 24;
    const strokeWidth = options.strokeWidth || 2;
    const className = options.class || '';
    const fill = options.fill || 'none'; // для социальных иконок может быть 'currentColor'
    
    // Common Lucide icons as SVG - можно расширить по необходимости
    const icons = {
      'chevron-down': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M19 9l-7 7-7-7"></path>`,
      'chevron-up': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M5 15l7-7 7 7"></path>`,
      'check': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M5 13l4 4L19 7"></path>`,
      'sun': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`,
      'moon': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`,
      'menu': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M4 6h16M4 12h16M4 18h16"></path>`,
      'x': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="${strokeWidth}" d="M6 18L18 6M6 6l12 12"></path>`,
      // Social icons (filled)
      'facebook': `<path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>`,
      'linkedin': `<path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`,
      'youtube': `<path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`,
    };
    
    const iconPath = icons[iconName.toLowerCase()];
    if (!iconPath) {
      return `<!-- Icon "${iconName}" not found. Available: ${Object.keys(icons).join(', ')} -->`;
    }
    
    // Для filled иконок (социальные сети) используем fill, для остальных stroke
    const isFilled = ['facebook', 'linkedin', 'youtube'].includes(iconName.toLowerCase());
    const svgAttrs = isFilled 
      ? `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}"`
      : `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}"`;
    
    return `<svg ${svgAttrs}>${iconPath}</svg>`;
  });

  // Language switcher filter - hardcoded URL mapping only
  eleventyConfig.addFilter("switchLang", (page) => {
    if (!page || !page.url) {
      return '/';
    }

    const currentUrl = page.url;
    
    // Hardcoded URL mapping table
    const urlMap = {
      '/': '/ru/',
      '/about/': '/ru/about/',
      '/careers/': '/ru/careers/',
      '/contact/': '/ru/contact/',
      '/customers/': '/ru/customers/',
      '/privacy-policy/': '/ru/privacy-policy/',
      '/news/': '/ru/news/',
      '/news': '/ru/news/',
      '/ru/': '/',
      '/ru/about/': '/about/',
      '/ru/careers/': '/careers/',
      '/ru/contact/': '/contact/',
      '/ru/customers/': '/customers/',
      '/ru/privacy-policy/': '/privacy-policy/',
      '/ru/news/': '/news/',
      '/ru/news': '/news/',
    };

    // Normalize URL for lookup
    let lookupUrl = currentUrl;
    if (lookupUrl !== '/' && lookupUrl.endsWith('/')) {
      lookupUrl = lookupUrl.slice(0, -1);
    }
    if (lookupUrl === '') {
      lookupUrl = '/';
    }
    
    // Direct lookup
    return urlMap[lookupUrl] || urlMap[currentUrl] || '/';
  });

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  // Add collection for news posts with related posts
  eleventyConfig.addCollection("news", function(collectionApi) {
    const allPosts = collectionApi.getFilteredByGlob("src/news/posts/*.md");
    
    // Add related posts to each post
    return allPosts.map(post => {
      if (!post.data.tags || !Array.isArray(post.data.tags) || post.data.tags.length === 0) {
        post.data.relatedPosts = [];
        return post;
      }
      
      // Find posts with matching tags (excluding current post)
      const relatedPosts = allPosts
        .filter(otherPost => {
          // Exclude current post
          if (otherPost.url === post.url) return false;
          
          // Check if posts share at least one tag
          if (!otherPost.data.tags || !Array.isArray(otherPost.data.tags)) return false;
          
          return post.data.tags.some(tag => otherPost.data.tags.includes(tag));
        })
        // Sort by date (newest first)
        .sort((a, b) => {
          const dateA = a.data.date ? new Date(a.data.date) : new Date(0);
          const dateB = b.data.date ? new Date(b.data.date) : new Date(0);
          return dateB - dateA;
        })
        // Limit to 5 posts
        .slice(0, 5);
      
      post.data.relatedPosts = relatedPosts;
      return post;
    });
  });

  // Add collection for jobs (careers)
  // Files have permalink: false to prevent auto-page generation
  // Pages are generated via pagination in job.html template
  eleventyConfig.addCollection("jobs", function(collectionApi) {
    // Read job files directly from filesystem to include files with permalink: false
    const jobsDir = path.join(process.cwd(), 'src/careers/jobs');
    const jobs = [];
    
    try {
      const files = fs.readdirSync(jobsDir);
      files.forEach(file => {
        if (!file.endsWith('.md') || file === 'job.html') return;
        
        const filePath = path.join(jobsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const frontMatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontMatterMatch) {
          try {
            const frontMatter = yaml.load(frontMatterMatch[1]);
            const content = fileContent.replace(/^---\n[\s\S]*?\n---\n/, '');
            const fileSlug = path.basename(file, '.md');
            
            jobs.push({
              data: frontMatter,
              templateContent: md.render(content),
              inputPath: filePath,
              fileSlug: fileSlug,
              url: `/careers/jobs/${fileSlug}/`
            });
          } catch (e) {
            console.error(`Error parsing front matter in ${file}:`, e.message);
          }
        }
      });
    } catch (e) {
      console.error('Error reading jobs directory:', e.message);
    }
    
    return jobs.sort((a, b) => {
      const dateA = a.data.date ? new Date(a.data.date) : new Date(0);
      const dateB = b.data.date ? new Date(b.data.date) : new Date(0);
      return dateB - dateA;
    });
  });

  // Add collection for customer stories
  eleventyConfig.addCollection("customerStories", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/customers/stories/*.md");
  });

  // Add collection for tags
  eleventyConfig.addCollection("tags", function(collectionApi) {
    const allPosts = collectionApi.getFilteredByGlob("src/news/posts/*.md");
    const tags = new Set();

    allPosts.forEach(post => {
      if (post.data.tags && Array.isArray(post.data.tags)) {
        post.data.tags.forEach(tag => {
          if (tag) tags.add(tag);
        });
      }
    });

    return Array.from(tags).map(tag => {
      const slug = eleventyConfig.getFilter("slugify")(tag);

      return {
        tag: tag,
        slug: slug,
        posts: allPosts.filter(post =>
          post.data.tags && Array.isArray(post.data.tags) && post.data.tags.includes(tag)
        )
      };
    });
  });

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
    "./src/static/js/swup-init.js": "./static/js/swup-init.js",
    "./node_modules/alpinejs/dist/cdn.min.js": "./static/js/alpine.js",
    "./node_modules/prismjs/themes/prism-tomorrow.css":
      "./static/css/prism-tomorrow.css",
    "./node_modules/swup/dist/Swup.umd.js": "./static/js/swup.js",
    "./node_modules/@swup/scroll-plugin/dist/index.umd.js": "./static/js/swup-scroll-plugin.js",
    "./node_modules/@swup/head-plugin/dist/index.umd.js": "./static/js/swup-head-plugin.js",
    // Copy Geist font
    "./node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2": "./static/fonts/geist/Geist-Variable.woff2",
    // Copy EB Garamond fonts (latin subset for variable-like behavior)
    "./node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2": "./static/fonts/eb-garamond/eb-garamond-latin-400-normal.woff2",
    "./node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-400-italic.woff2": "./static/fonts/eb-garamond/eb-garamond-latin-400-italic.woff2",
    "./node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-800-normal.woff2": "./static/fonts/eb-garamond/eb-garamond-latin-800-normal.woff2",
    "./node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-800-italic.woff2": "./static/fonts/eb-garamond/eb-garamond-latin-800-italic.woff2",
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

  // Copy Fonts Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/fonts");

  // Copy CSS files (including fonts.css) to /_site
  eleventyConfig.addPassthroughCopy("./src/static/css");

  // Copy Webflow assets to /_site
  eleventyConfig.addPassthroughCopy("./src/static/webflow");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  
  // Copy robots.txt to route of /_site
  eleventyConfig.addPassthroughCopy("./src/robots.txt");

  // Format HTML - remove comments, keep all tags on single line
  eleventyConfig.addTransform("htmlformat", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Remove all HTML comments
      let cleaned = content.replace(/<!--[\s\S]*?-->/g, '');
      
      // Join tags that are split across multiple lines
      // Process line by line to handle multi-line tags
      const lines = cleaned.split('\n');
      const result = [];
      let inTag = false;
      let currentTag = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if line starts a tag
        if (line.startsWith('<') && !line.startsWith('</')) {
          // Check if tag is complete on this line
          if (line.endsWith('>') || line.endsWith('/>')) {
            // Complete tag - join attributes and clean up
            const cleanedTag = line.replace(/\s+/g, ' ').replace(/\s+>/g, '>');
            result.push(cleanedTag);
            inTag = false;
            currentTag = '';
          } else {
            // Tag continues on next lines
            inTag = true;
            currentTag = line;
          }
        } else if (inTag) {
          // Continue building tag
          currentTag += ' ' + line;
          // Check if tag is now complete
          if (line.endsWith('>') || line.endsWith('/>')) {
            const cleanedTag = currentTag.replace(/\s+/g, ' ').replace(/\s+>/g, '>');
            result.push(cleanedTag);
            inTag = false;
            currentTag = '';
          }
        } else {
          // Regular content line
          result.push(lines[i]);
        }
      }
      
      cleaned = result.join('\n');
      
      // Final cleanup
      cleaned = cleaned
        .replace(/>\s+</g, '>\n  <')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n\s*\n(\s*<\/)/g, '\n$1');
      
      return cleaned;
    }
    return content;
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
    },
    htmlTemplateEngine: "njk",
  };
};
