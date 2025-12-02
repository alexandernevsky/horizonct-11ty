const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");
const fs = require("fs");
const path = require("path");

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

  // Check if URL is active (improved for nested routes)
  eleventyConfig.addFilter("isActive", (pageUrl, navUrl) => {
    if (!pageUrl || !navUrl) return false;
    if (pageUrl === navUrl) return true;
    if (navUrl === '/' && pageUrl === '/') return true;
    // For nested routes: if we're on /news/posts/article, /news should be active
    if (navUrl !== '/' && pageUrl.startsWith(navUrl)) {
      // Make sure it's not just a partial match (e.g., /new shouldn't match /news)
      const nextChar = pageUrl[navUrl.length];
      return !nextChar || nextChar === '/' || nextChar === '?';
    }
    return false;
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

  // Store all pages for language switching
  let allPagesCache = [];

  // Language switcher filter - returns alternate language URL using translationKey
  eleventyConfig.addFilter("switchLang", (page, targetLang) => {
    if (!page) return targetLang === 'ru' ? '/ru/' : '/';

    // If on news page, always redirect to home page of target language
    if (page.url && page.url.startsWith('/news')) {
      return targetLang === 'ru' ? '/ru/' : '/';
    }

    // If page has translationKey, find the corresponding page in target language
    if (page.data && page.data.translationKey) {
      const translationKey = page.data.translationKey;
      
      const translatedPage = allPagesCache.find(p => 
        p.data && 
        p.data.translationKey === translationKey && 
        p.data.lang === targetLang
      );

      if (translatedPage && translatedPage.data.permalink) {
        return translatedPage.data.permalink;
      }
    }

    // Fallback: use URL manipulation
    const currentUrl = page.url || '';
    let cleanUrl = currentUrl.replace(/^\/en\//, '/').replace(/^\/ru\//, '/');
    if (cleanUrl === '/') cleanUrl = '';

    if (targetLang === 'ru') {
      return '/ru' + cleanUrl;
    } else {
      return cleanUrl || '/';
    }
  });

  // Build cache of all pages after first pass
  eleventyConfig.on('eleventy.after', ({ allPages }) => {
    allPagesCache = allPages;
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
              templateContent: content,
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

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath && outputPath.endsWith(".html")) {
      // Temporarily disable minification to debug language switcher
      // let minified = htmlmin.minify(content, {
      //   useShortDoctype: true,
      //   removeComments: true,
      //   collapseWhitespace: true,
      //   removeEmptyElements: false, // Don't remove empty elements
      //   keepClosingSlash: true,
      // });
      // return minified;
      return content;
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
