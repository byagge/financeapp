const fs = require("fs");
const ru = JSON.parse(fs.readFileSync("messages/ru.json", "utf8"));

function walk(obj, map) {
  if (typeof obj === "string") return map[obj] ?? obj;
  if (Array.isArray(obj)) return obj.map((x) => walk(x, map));
  if (obj && typeof obj === "object") {
    const n = {};
    for (const k of Object.keys(obj)) n[k] = walk(obj[k], map);
    return n;
  }
  return obj;
}

function patchLangLabels(out) {
  out.profile.uzbekCyrillic =
    out.profile.uzbekCyrillic || out.profile.uzbek || "Uzbek (Cyrillic)";
  out.profile.uzbekLatin = out.profile.uzbekLatin || "Uzbek (Latin)";
  out.profile.kyrgyz = out.profile.kyrgyz || "Kyrgyz";
  out.profile.english = out.profile.english || "English";
  out.settings.theme = out.settings.theme || "Theme";
  out.settings.themeSystem = out.settings.themeSystem || "System";
  out.settings.themeLight = out.settings.themeLight || "Light";
  out.settings.themeDark = out.settings.themeDark || "Dark";
}

const enMap = JSON.parse(fs.readFileSync("scripts/i18n-en-map.json", "utf8"));
const kyMap = JSON.parse(fs.readFileSync("scripts/i18n-ky-map.json", "utf8"));

const enOut = walk(JSON.parse(JSON.stringify(ru)), enMap);
enOut.app.name = "Finance";
enOut.app.tagline = "Income and expense tracking";
enOut.profile.russian = "Russian";
enOut.profile.uzbek = "Uzbek";
enOut.profile.uzbekCyrillic = "Uzbek (Cyrillic)";
enOut.profile.uzbekLatin = "Uzbek (Latin)";
enOut.profile.kyrgyz = "Kyrgyz";
enOut.profile.english = "English";
enOut.settings.theme = "Theme";
enOut.settings.themeSystem = "System";
enOut.settings.themeLight = "Light";
enOut.settings.themeDark = "Dark";
fs.writeFileSync("messages/en.json", JSON.stringify(enOut, null, 2) + "\n");

const kyOut = walk(JSON.parse(JSON.stringify(ru)), kyMap);
kyOut.app.name = "Каржы";
kyOut.profile.uzbekCyrillic = "Өзбек (кириллица)";
kyOut.profile.uzbekLatin = "Өзбек (латын)";
kyOut.profile.kyrgyz = "Кыргызча";
kyOut.profile.english = "English";
kyOut.settings.theme = "Тема";
kyOut.settings.themeSystem = "Система";
kyOut.settings.themeLight = "Жарык";
kyOut.settings.themeDark = "Караңгы";
fs.writeFileSync("messages/ky.json", JSON.stringify(kyOut, null, 2) + "\n");

// Patch existing ru/uz/uz-Latn
for (const file of ["ru", "uz", "uz-Latn"]) {
  const data = JSON.parse(fs.readFileSync(`messages/${file}.json`, "utf8"));
  if (file === "ru") {
    data.profile.uzbek = "Ўзбекча";
    data.profile.uzbekCyrillic = "Узбек (кириллица)";
    data.profile.uzbekLatin = "Узбек (латиница)";
    data.profile.kyrgyz = "Кыргызский";
    data.profile.english = "English";
    data.settings.theme = "Тема";
    data.settings.themeSystem = "Системная";
    data.settings.themeLight = "Светлая";
    data.settings.themeDark = "Тёмная";
  } else if (file === "uz") {
    data.profile.uzbek = "Ўзбекча";
    data.profile.uzbekCyrillic = "Ўзбек (кириллица)";
    data.profile.uzbekLatin = "Ўзбек (лотин)";
    data.profile.kyrgyz = "Қирғизча";
    data.profile.english = "English";
    data.profile.russian = "Русча";
    data.settings.theme = "Мавзу";
    data.settings.themeSystem = "Тизим";
    data.settings.themeLight = "Ёруғ";
    data.settings.themeDark = "Қоронғу";
  } else {
    data.profile.uzbek = "Oʻzbekcha";
    data.profile.uzbekCyrillic = "Oʻzbek (kirill)";
    data.profile.uzbekLatin = "Oʻzbek (lotin)";
    data.profile.kyrgyz = "Qirgʻizcha";
    data.profile.english = "English";
    data.profile.russian = "Ruscha";
    data.settings.theme = "Mavzu";
    data.settings.themeSystem = "Tizim";
    data.settings.themeLight = "Yorugʻ";
    data.settings.themeDark = "Qorongʻu";
  }
  fs.writeFileSync(`messages/${file}.json`, JSON.stringify(data, null, 2) + "\n");
}

console.log("done");
