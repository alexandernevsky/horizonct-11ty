const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");

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
      const slug = tag.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
      
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
    "./node_modules/lenis/dist/lenis.min.js": "./static/js/lenis.min.js",
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

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
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
