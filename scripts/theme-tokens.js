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

const pairs = [
  [/bg-\[#F5F6FA\]/g, "bg-background"],
  [/bg-\[#EEF0F5\]/g, "bg-surface"],
  [/bg-\[#F9FAFB\]/g, "bg-surface"],
  [/bg-\[#FAFAFB\]/g, "bg-surface"],
  [/bg-\[#F3F4F6\]/g, "bg-surface"],
  [/active:bg-\[#F9FAFB\]/g, "active:bg-surface"],
  [/active:bg-\[#FAFAFB\]/g, "active:bg-surface"],
  [/text-\[#9CA3AF\]/g, "text-muted"],
  [/text-\[#6B7280\]/g, "text-muted-strong"],
  [/text-\[#111827\]/g, "text-foreground"],
  [/text-\[#D1D5DB\]/g, "text-muted"],
  [/text-\[#374151\]/g, "text-muted-strong"],
  [/text-\[#4B5563\]/g, "text-muted-strong"],
  [/border-\[#EEF0F5\]/g, "border-line"],
  [/border-\[#E5E7EB\]/g, "border-line-strong"],
  [/divide-\[#EEF0F5\]/g, "divide-line"],
  [/bg-\[#E5E7EB\]/g, "bg-line-strong"],
  [/shadow-\[0_8px_24px_rgba\(17,24,39,0\.04\)\]/g, "shadow-card"],
  [/shadow-\[0_6px_20px_rgba\(17,24,39,0\.04\)\]/g, "shadow-card"],
  [/shadow-\[0_4px_14px_rgba\(17,24,39,0\.04\)\]/g, "shadow-card"],
];

let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  s = s.replace(/(?<![\w-])bg-white(?![\w-/])/g, "bg-card");
  for (const [re, to] of pairs) s = s.replace(re, to);
  if (s !== orig) {
    fs.writeFileSync(f, s);
    changed++;
    console.log(path.relative(root, f));
  }
}
console.log("changed", changed);
