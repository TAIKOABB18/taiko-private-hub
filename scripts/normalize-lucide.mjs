import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../app/", import.meta.url);

function pascal(slug) {
  return slug.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join("");
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) await normalize(path);
  }
}

async function normalize(path) {
  const source = await readFile(path, "utf8");
  const imports = [];
  const next = source.replace(/^import\s+([A-Za-z_$][\w$]*)\s+from\s+["']lucide-react\/dist\/esm\/icons\/([a-z0-9-]+)\.js["'];?\s*$/gm, (_, local, slug) => {
    const exported = pascal(slug);
    imports.push(local === exported ? exported : `${exported} as ${local}`);
    return "";
  });
  if (!imports.length) return;
  const unique = [...new Set(imports)].sort();
  const output = `import { ${unique.join(", ")} } from "lucide-react";\n${next.replace(/^\n+/, "")}`;
  await writeFile(path, output);
}

await walk(root);
