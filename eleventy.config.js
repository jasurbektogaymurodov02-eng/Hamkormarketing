export default function (eleventyConfig) {
  // O'zgarmaydigan fayllarni to'g'ridan-to'g'ri ko'chirish
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_redirects");

  // Sana formati: 07.08.2026
  eleventyConfig.addFilter("sana", (d) => {
    if (!d) return "";
    const x = new Date(d);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(x.getDate())}.${p(x.getMonth() + 1)}.${x.getFullYear()}`;
  });

  // ISO sana (<time datetime="...">)
  eleventyConfig.addFilter("iso", (d) => (d ? new Date(d).toISOString().slice(0, 10) : ""));

  // Maqolalar — yangi birinchi
  eleventyConfig.addCollection("maqolalar", (api) =>
    api.getFilteredByGlob("src/blog/*.md").reverse()
  );

  // Keyslar — tartib raqami bo'yicha
  eleventyConfig.addCollection("keyslar", (api) =>
    api.getFilteredByGlob("src/keys/*.md").sort((a, b) => (a.data.tartib || 0) - (b.data.tartib || 0))
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
