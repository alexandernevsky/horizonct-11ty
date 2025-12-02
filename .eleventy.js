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

  // Language switcher filter - simple hardcoded URL mapping
  eleventyConfig.addFilter("switchLang", (page, targetLang) => {
    if (!page || !page.url) {
      return targetLang === 'ru' ? '/ru/' : '/';
    }

    const currentUrl = page.url;
    
    // Hardcoded URL mapping table - NO CACHING, NO LOGIC, JUST SIMPLE MAPPING
    const urlMap = {
      // English to Russian
      '/': '/ru/',
      '/about/': '/ru/about/',
      '/careers/': '/ru/careers/',
      '/contact/': '/ru/contact/',
      '/customers/': '/ru/customers/',
      '/privacy-policy/': '/ru/privacy-policy/',
      '/news/': '/ru/news/',
      '/news': '/ru/news/',
      // Russian to English
      '/ru/': '/',
      '/ru/about/': '/about/',
      '/ru/careers/': '/careers/',
      '/ru/contact/': '/contact/',
      '/ru/customers/': '/customers/',
      '/ru/privacy-policy/': '/privacy-policy/',
      '/ru/news/': '/news/',
      '/ru/news': '/news/',
    };

    // Normalize URL - remove trailing slash for lookup, but keep / for root
    let lookupUrl = currentUrl;
    if (lookupUrl !== '/' && lookupUrl.endsWith('/')) {
      lookupUrl = lookupUrl.slice(0, -1);
    }
    if (lookupUrl === '') {
      lookupUrl = '/';
    }
    
    // Direct lookup in map
    if (urlMap[lookupUrl]) {
      return urlMap[lookupUrl];
    }
    
    // Also try with trailing slash
    if (urlMap[currentUrl]) {
      return urlMap[currentUrl];
    }

    // Fallback: simple URL manipulation
    if (currentUrl.startsWith('/ru/')) {
      // Russian to English
      const enUrl = currentUrl.replace('/ru/', '/');
      return enUrl === '/' ? '/' : enUrl;
    } else {
      // English to Russian
      if (currentUrl === '/') {
        return '/ru/';
      }
      return '/ru' + currentUrl;
    }
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

  // Format HTML beautifully using Prettier
  eleventyConfig.addTransform("htmlformat", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      try {
        // Remove all HTML comments
        let cleaned = content
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]+$/gm, '');
        
        // Format with Prettier - keep attributes on one line
        const formatted = await prettier.format(cleaned, {
          parser: "html",
          printWidth: 200,
          tabWidth: 2,
          useTabs: false,
          htmlWhitespaceSensitivity: "ignore",
          endOfLine: "lf",
          singleAttributePerLine: false
        });
        
        // Post-formatting cleanup: remove excessive blank lines
        return formatted
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\n\s*\n(\s*<\/)/g, '\n$1')
          .replace(/(>\s*)\n\s*\n(\s*<meta|\s*<link)/g, '$1\n$2');
      } catch (error) {
        console.error("Error formatting HTML:", error);
        return content;
      }
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
