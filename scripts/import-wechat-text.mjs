import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const [, , inputPath, outputPath = "data/import-candidates.json"] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/import-wechat-text.mjs <article.txt> [output.json]");
  process.exit(1);
}

const text = await readFile(inputPath, "utf8");
const source = basename(inputPath);
const candidates = parseImportText(text, source);

await writeFile(outputPath, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
console.log(`Wrote ${candidates.length} candidate prompts to ${outputPath}`);

function parseImportText(rawText, source) {
  const clean = rawText.trim();
  if (!clean) return [];

  return clean
    .split(/\n{2,}|(?=提示词[:：])|(?=Prompt[:：])/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 28)
    .filter((block) => /prompt|提示词|--ar|镜头|风格|photography|illustration|cinematic/i.test(block))
    .map((block, index) => ({
      id: `wechat-${Date.now()}-${index + 1}`,
      title: buildTitle(block, index),
      category: guessCategory(block),
      model: guessModel(block),
      scenario: "微信文章导入候选",
      style: "",
      tags: ["待整理", "微信导入"],
      prompt: block.replace(/^提示词[:：]\s*/i, ""),
      negative: "",
      params: extractParams(block),
      source,
      sourceType: "wechat",
      dateAdded: new Date().toISOString().slice(0, 10),
      rating: 3,
      status: "draft",
      colors: ["#833f2e", "#d6a23d"],
      notes: "脚本初筛候选，需要人工复核分类、标题、负向词和参数。"
    }));
}

function buildTitle(block, index) {
  const firstLine = block.split(/\n/).find(Boolean) || `候选提示词 ${index + 1}`;
  return firstLine.replace(/^提示词[:：]\s*/i, "").slice(0, 32) || `候选提示词 ${index + 1}`;
}

function extractParams(text) {
  const params = text.match(/--[a-z]+(?:\s+[\w:.+-]+)?/gi);
  return params ? params.join(" ") : "";
}

function guessCategory(text) {
  const rules = [
    ["人像摄影", /portrait|人像|写真|模特|街拍|头像|摄影/i],
    ["商品商业", /product|商品|商业|静物|包装|brand/i],
    ["室内建筑", /interior|室内|建筑|空间|家居|房间/i],
    ["国风插画", /国风|古风|水墨|工笔|仙侠|庭院/i],
    ["电影分镜", /storyboard|分镜|镜头|电影|cinematic|shot/i],
    ["IP/角色", /character|角色|吉祥物|mascot|IP/i],
    ["Logo/海报", /poster|海报|logo|标志|活动/i],
    ["电商海报", /banner|电商|主图|详情页|促销/i],
    ["纹理材质", /texture|材质|纹理|seamless|tile/i],
    ["信息图", /infographic|信息图|等距|isometric|科普/i]
  ];
  return rules.find(([, rule]) => rule.test(text))?.[0] || "待整理";
}

function guessModel(text) {
  if (/midjourney|--ar|--stylize|--sref/i.test(text)) return "Midjourney";
  if (/sdxl|stable diffusion|cfg|sampler|steps/i.test(text)) return "SDXL";
  if (/dall|gpt-image|openai/i.test(text)) return "DALL·E / OpenAI";
  return "未指定模型";
}
