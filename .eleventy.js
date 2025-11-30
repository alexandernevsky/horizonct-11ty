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

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  // Add collection for news posts
  eleventyConfig.addCollection("news", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/news/posts/*.md");
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
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

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
