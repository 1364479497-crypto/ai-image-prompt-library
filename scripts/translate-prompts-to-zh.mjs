import fs from "node:fs";

const dataPath = "data/prompts.json";
const cachePath = "tmp/translation-cache.json";
const backupPath = "tmp/prompts-before-zh-translation.json";

const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

const protectedTerms = [
  "GPT Image 2",
  "GPT-Image-2",
  "ChatGPT",
  "OpenAI",
  "EvoLinkAI",
  "GitHub",
  "Midjourney",
  "Stable Diffusion",
  "SDXL",
  "DALL·E",
  "DALL-E",
  "UI/UX",
  "JSON",
  "HTML",
  "CSS",
  "TVC",
  "DSLR",
  "CCD",
  "VR",
  "AR",
  "3D",
  "2D",
  "4K",
  "8K",
  "16:9",
  "9:16",
  "4:5",
  "3:4",
  "1:1",
  "35mm",
  "50mm",
  "85mm",
  "iPhone"
];

const tagTranslations = new Map([
  ["Campaign", "广告战役"],
  ["UI", "界面"],
  ["IP", "角色 IP"],
  ["EvoLinkAI", "EvoLinkAI"],
  ["GPT Image 2", "GPT Image 2"]
]);

const titleCleanup = [
  [/^Case\s+(\d+)\s*·\s*/i, "案例 $1 · "],
  [/\bE-commerce Main Image\b/gi, "电商主图"],
  [/\bE-commerce\b/gi, "电商"],
  [/\bPremium\b/gi, "高级"],
  [/\bLuxury\b/gi, "奢华"],
  [/\bMinimalist\b/gi, "极简"],
  [/\bCinematic\b/gi, "电影感"],
  [/\bPortrait\b/gi, "人像"],
  [/\bPoster\b/gi, "海报"],
  [/\bInfographic\b/gi, "信息图"],
  [/\bStoryboard\b/gi, "分镜"],
  [/\bTemplate\b/gi, "模板"],
  [/\bMockup\b/gi, "样机"],
  [/\bBrand Identity\b/gi, "品牌识别"],
  [/\bAd\b/gi, "广告"],
  [/\bProduct\b/gi, "产品"],
  [/\bStudio Shot\b/gi, "棚拍"],
  [/\bCharacter\b/gi, "角色"],
  [/\bIllustration\b/gi, "插画"],
  [/\bFashion\b/gi, "时尚"],
  [/\bTravel\b/gi, "旅行"],
  [/\bFood\b/gi, "美食"],
  [/\bUI Design\b/gi, "UI 设计"]
];

const shouldTranslatePattern = /[A-Za-z]{4,}|[\u3040-\u30ff]/;
const requestDelayMs = Number(process.env.TRANSLATE_DELAY_MS || 850);
const preferFallback = process.env.TRANSLATE_PROVIDER === "fallback";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function saveCache() {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");
}

function applyTitleCleanup(text) {
  return titleCleanup.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

function protect(text) {
  const values = [];
  let output = text;
  const patterns = [
    /\{argument[^{}]*\}/g,
    /https?:\/\/[^\s)"']+/g,
    /@[A-Za-z0-9_]+/g,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    ...protectedTerms.map((term) => new RegExp(escapeRegExp(term), "g"))
  ];

  for (const pattern of patterns) {
    output = output.replace(pattern, (match) => {
      const token = `XQZ${values.length}ZXQ`;
      values.push(match);
      return token;
    });
  }

  return { text: output, values };
}

function restore(text, values) {
  return values.reduce((value, original, index) => {
    const token = new RegExp(`XQZ\\s*${index}\\s*ZXQ`, "g");
    return value.replace(token, original);
  }, text);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function needsTranslation(value) {
  if (!value) return false;
  const { text } = protect(String(value));
  return shouldTranslatePattern.test(text);
}

function normalizeTranslatedText(text) {
  return text
    .replace(/案例\s+(\d+)\s*·\s*/g, "案例 $1 · ")
    .replace(/GPT-图像-2|GPT\s*图像\s*2|GPT\s*图片\s*2/gi, "GPT Image 2")
    .replace(/GPT\s*图像\s*2/gi, "GPT Image 2")
    .replace(/GPT\s*Image\s*2/gi, "GPT Image 2")
    .replace(/聊天GPT/gi, "ChatGPT")
    .replace(/Openai/gi, "OpenAI")
    .replace(/Mid journey/gi, "Midjourney")
    .replace(/达尔·E|Dall·E|Dall-E/gi, "DALL·E")
    .replace(/用户界面\/用户体验/gi, "UI/UX")
    .replace(/JSON/gi, "JSON")
    .replace(/\s+([，。；：！？])/g, "$1")
    .replace(/([（【])\s+/g, "$1")
    .replace(/\s+([）】])/g, "$1")
    .trim();
}

function splitText(text, maxLength = 3800) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let current = "";
  const parts = text.split(/(\n{2,}|(?<=[.!?。！？])\s+)/);

  for (const part of parts) {
    if ((current + part).length <= maxLength) {
      current += part;
      continue;
    }
    if (current.trim()) chunks.push(current);
    if (part.length <= maxLength) {
      current = part;
      continue;
    }
    for (let i = 0; i < part.length; i += maxLength) {
      chunks.push(part.slice(i, i + maxLength));
    }
    current = "";
  }

  if (current.trim()) chunks.push(current);
  return chunks;
}

async function translateRaw(text) {
  const cacheKey = `auto:zh-CN:${text}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const body = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: "zh-CN",
    dt: "t",
    q: text
  });

  if (preferFallback) {
    const fallback = await translateWithLingva(text);
    cache[cacheKey] = fallback;
    if (Object.keys(cache).length % 20 === 0) saveCache();
    return fallback;
  }

  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await wait(requestDelayMs + attempt * 250);
    response = await fetch("https://translate.googleapis.com/translate_a/single", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
      },
      body
    });

    if (response.ok) break;
    if (![429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(`Translate request failed: ${response.status} ${response.statusText}`);
    }
    const backoffMs = Math.min(15000, 3000 * 2 ** attempt);
    console.warn(`google translate retry ${attempt + 1}/3 after ${response.status}; waiting ${Math.round(backoffMs / 1000)}s`);
    await wait(backoffMs);
  }

  if (!response?.ok) {
    const fallback = await translateWithLingva(text);
    cache[cacheKey] = fallback;
    if (Object.keys(cache).length % 20 === 0) saveCache();
    return fallback;
  }

  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((item) => item?.[0] || "").join("")
    : text;

  cache[cacheKey] = translated;
  if (Object.keys(cache).length % 20 === 0) saveCache();
  return translated;
}

async function translateWithLingva(text) {
  const ftapiUrl = `https://ftapi.pythonanywhere.com/translate?sl=auto&dl=zh-CN&text=${encodeURIComponent(text)}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(ftapiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(20000)
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.["destination-text"]) return payload["destination-text"];
      } else {
        console.warn(`ftapi translate failed ${response.status}`);
      }
    } catch (error) {
      console.warn(`ftapi translate error: ${error.message}`);
    }
    await wait(1500 * (attempt + 1));
  }

  const providers = [
    "https://translate.plausibility.cloud/api/v1/auto/zh/",
    "https://lingva.lunar.icu/api/v1/auto/zh/"
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    for (const provider of providers) {
      try {
        const response = await fetch(provider + encodeURIComponent(text), {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(20000)
        });
        if (!response.ok) {
          console.warn(`fallback translate failed ${response.status} at ${provider}`);
          continue;
        }
        const payload = await response.json();
        if (payload?.translation) return payload.translation;
      } catch (error) {
        console.warn(`fallback translate error at ${provider}: ${error.message}`);
      }
    }
    await wait(2000 * (attempt + 1));
  }

  throw new Error("All translate providers failed.");
}

async function translateText(text, { title = false } = {}) {
  if (!needsTranslation(text)) return text;

  const cleaned = title ? applyTitleCleanup(text) : text;
  const chunks = splitText(cleaned, preferFallback ? 900 : 3800);
  const translatedChunks = [];

  for (const chunk of chunks) {
    const { text: protectedText, values } = protect(chunk);
    const translated = await translateRaw(protectedText);
    translatedChunks.push(restore(translated, values));
  }

  return normalizeTranslatedText(translatedChunks.join(""));
}

function translateTags(tags = []) {
  return tags.map((tag) => tagTranslations.get(tag) || tag);
}

async function main() {
  const prompts = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, JSON.stringify(prompts, null, 2) + "\n");
  }

  let translatedPrompts = 0;
  let translatedFields = 0;
  const fields = ["title", "style", "scenario", "notes", "negative", "params"];

  for (let index = 0; index < prompts.length; index += 1) {
    const prompt = prompts[index];

    for (const field of fields) {
      if (!needsTranslation(prompt[field])) continue;
      const nextValue = await translateText(String(prompt[field]), {
        title: field === "title" || field === "style"
      });
      if (nextValue !== prompt[field]) {
        prompt[field] = nextValue;
        translatedFields += 1;
      }
    }

    prompt.tags = translateTags(prompt.tags);

    if (needsTranslation(prompt.prompt)) {
      try {
        prompt.prompt = await translateText(prompt.prompt);
        translatedPrompts += 1;
      } catch (error) {
        console.warn(`skip prompt body for ${prompt.id}: ${error.message}`);
      }
    }

    if ((index + 1) % 10 === 0 || index === prompts.length - 1) {
      fs.writeFileSync(dataPath, JSON.stringify(prompts, null, 2) + "\n");
      saveCache();
      console.log(`progress ${index + 1}/${prompts.length}; fields=${translatedFields}; prompts=${translatedPrompts}`);
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(prompts, null, 2) + "\n");
  saveCache();
  console.log(`done; translated fields=${translatedFields}; translated prompt bodies=${translatedPrompts}`);
}

main().catch((error) => {
  saveCache();
  console.error(error);
  process.exit(1);
});
