const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const files = [];

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx$/.test(e.name)) files.push(p);
  }
}
walk(root);

const pairs = [
  [/bg-\[#EEECFF\]\/70/g, "bg-primary-soft/70"],
  [/bg-\[#EEECFF\]/g, "bg-primary-soft"],
  [/hover:bg-\[#F8F9FC\]/g, "hover:bg-surface"],
  [/hover:bg-\[#F4FAF8\]/g, "hover:bg-surface"],
  [/hover:bg-black\/5/g, "hover:bg-surface"],
  [/hover:bg-rose-50/g, "hover:bg-[#FEF2F2]/20 dark:hover:bg-[#7f1d1d]/30"],
  [/text-black\/45/g, "text-muted"],
  [/text-black\/40/g, "text-muted"],
  [/text-black\/35/g, "text-muted"],
  [/text-black\/50/g, "text-muted-strong"],
  [/text-black\/70/g, "text-muted-strong"],
  [/text-black\/55/g, "text-muted-strong"],
  [/border-black\/5/g, "border-line"],
  [/border-black\/\[0\.04\]/g, "border-line"],
  [/text-emerald-700/g, "text-[#16A34A]"],
];

let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  for (const [re, to] of pairs) s = s.replace(re, to);
  if (s !== orig) {
    fs.writeFileSync(f, s);
    n++;
    console.log(path.relative(root, f));
  }
}
console.log("changed", n);
