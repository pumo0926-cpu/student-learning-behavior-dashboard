import { readFile, writeFile } from "node:fs/promises";

const [template, css, behaviorCss, js] = await Promise.all([
  readFile(new URL("./index.template.html", import.meta.url), "utf8"),
  readFile(new URL("./styles.css", import.meta.url), "utf8"),
  readFile(new URL("./styles.behavior.css", import.meta.url), "utf8"),
  readFile(new URL("./app.js", import.meta.url), "utf8"),
]);

const output = template
  .replace('    <link rel="stylesheet" href="./styles.css" />', `    <style>\n${css}\n${behaviorCss}\n    </style>`)
  .replace('    <link rel="stylesheet" href="./styles.behavior.css" />', "")
  .replace('    <script src="./app.js"></script>', `    <script>\n${js}\n    </script>`);

await writeFile(new URL("./index.html", import.meta.url), output);
console.log("已生成自包含预览文件 index.html");
