const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const files = [];

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) files.push(p);
  }
}
walk(root);

let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  // casts
  s = s.replace(/useLocale\(\) as "ru" \| "uz"/g, 'useLocale()');
  s = s.replace(/locale: "ru" \| "uz"/g, "locale: string");
  s = s.replace(/locale === "uz" \? uzCyrl : ru/g, "dateFnsLocale(locale)");
  if (s !== orig) {
    // ensure import if dateFnsLocale used and file imported date-fns locales for this pattern
    if (s.includes("dateFnsLocale(") && !s.includes('from "@/lib/locale"')) {
      if (s.includes('from "date-fns/locale"')) {
        s = s.replace(
          /import \{[^}]+\} from "date-fns\/locale";\n?/,
          'import { dateFnsLocale } from "@/lib/locale";\n'
        );
      } else if (!s.includes("dateFnsLocale")) {
        // already
      }
    }
    fs.writeFileSync(f, s);
    n++;
    console.log(path.relative(root, f));
  }
}
console.log("updated", n);
