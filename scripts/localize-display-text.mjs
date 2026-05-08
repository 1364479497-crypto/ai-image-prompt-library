import fs from "node:fs";

const dataPath = "data/prompts.json";

const protectedWords = [
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
  "iPhone",
  "Nike",
  "Sony",
  "Rolex",
  "Hermes",
  "Crocs",
  "Apple",
  "Minecraft",
  "GTA"
];

const phraseTranslations = [
  ["E-commerce Main Image", "电商主图"],
  ["Premium product studio shot template", "高级产品棚拍模板"],
  ["Premium food photography template", "高级美食摄影模板"],
  ["Burger hero image plus 9-cell ad storyboard", "汉堡主视觉与九宫格广告分镜"],
  ["4-Panel Japanese Digital Ad Banner Grid", "四宫格日式数字广告横幅"],
  ["Anime Character Brand Identity & Merch Board", "动漫角色品牌识别与周边设计板"],
  ["Dark Mode Marketing Case Study UI", "深色模式营销案例 UI"],
  ["18-Panel Mascot Brand Identity Document", "18 格吉祥物品牌识别文档"],
  ["Japanese Chinese Food Delivery Flyer", "日式中餐外卖传单"],
  ["Pastel Jellyfish Room Goods Poster", "粉彩水母房间周边海报"],
  ["Magical Seed Packet Diorama", "魔法种子包装微缩场景"],
  ["Luxury Chronograph Watch Ad", "奢华计时腕表广告"],
  ["Streetwear Sneaker Poster Ad", "街头潮鞋海报广告"],
  ["Editorial Osaka Six Sweatshirt Ad", "大阪 SIX 卫衣杂志风广告"],
  ["Editorial Perfume Shot on Moss", "苔藓上的杂志风香水大片"],
  ["Editorial Perfume Bottle in Golden Fur", "金色皮草中的杂志风香水瓶"],
  ["Luxury Miniature Dubai City Model", "奢华迪拜城市微缩模型"],
  ["Parody Luxury Product Advertisement", "仿奢华风产品广告"],
  ["VR Headset Exploded View Poster", "VR 头显爆炸图海报"],
  ["Luxury poster for fictional AI ad printer", "虚构 AI 广告打印机奢华海报"],
  ["Luxury chocolate campaign system", "奢华巧克力广告系统"],
  ["Urban fruit juice ad poster", "都市果汁广告海报"],
  ["Convenience Store Neon Portrait", "便利店霓虹人像"],
  ["Cinematic Minimal Portrait", "电影感极简人像"],
  ["Japanese Onsen Ryokan Portrait", "日式温泉旅馆人像"],
  ["Flash Editorial Portrait", "闪光灯杂志风人像"],
  ["Mirror Selfie Bedroom Portrait", "卧室镜前自拍人像"],
  ["Luxury Glam Beauty Portrait", "奢华美妆人像"],
  ["Cosplayer Portrait Screenshot", "角色扮演者人像截图"],
  ["Urban Turn-Back Street Portrait", "都市回眸街拍人像"],
  ["Skatepark Snapshot", "滑板场抓拍"],
  ["Korean Idol 3x3 Grid Portrait", "韩国偶像九宫格人像"],
  ["Korean Idol 3x3 Collage Portrait", "韩国偶像九宫格拼贴人像"],
  ["Soft Black Mist Editorial Portrait", "柔黑雾感杂志人像"],
  ["Fujifilm Strawberry School Portrait", "富士胶片草莓校园人像"],
  ["Soft Black Mist Idol Portrait", "柔黑雾感偶像人像"],
  ["Fujifilm Couple Portrait", "富士胶片情侣人像"],
  ["AI Self-Perception Portrait", "AI 自我感知人像"],
  ["Magazine Travel Guide Feature Article", "杂志旅行指南专题"],
  ["Candid Bedroom Selfie Photorealistic Portrait", "卧室随手自拍写真人像"],
  ["Musician Leaving Bodega Night Cinematic Portrait", "音乐人夜晚离开街角店的电影感人像"],
  ["Old Delhi Sweet Shop Storefront Documentary Photo", "老德里甜品店门头纪实照片"],
  ["Realistic Candid Bedroom Recording Portrait", "卧室录音场景写真人像"],
  ["Toddler Crayon Scribble Art Style Portrait", "幼儿蜡笔涂鸦风人像"],
  ["Restored Vintage Mother and Child Portrait", "修复后的复古母子人像"],
  ["Damaged Vintage Mother and Child Photo", "破损复古母子照片"],
  ["Ink-Etched Family Portrait", "墨线蚀刻家庭人像"],
  ["Vintage Engraved Hoodie Portrait", "复古雕版连帽衫人像"],
  ["Dreamy Backlit Editorial Portrait", "梦幻逆光杂志人像"],
  ["Cartoon Character Render", "卡通角色渲染"],
  ["Young Woman in Sequin Dress on Stairs", "楼梯上亮片裙女性人像"],
  ["Luxury Studio Outfit Transformation", "奢华棚拍造型转换"],
  ["Blonde Maid in Warm Cafe", "暖色咖啡馆金发女仆"],
  ["Dreamy Oriental female portrait prompt", "梦幻东方女性人像提示词"],
  ["Monochrome Hermes-Inspired Avatar", "爱马仕灵感黑白头像"],
  ["Cyber Crystal Anime Girl Portrait", "赛博水晶动漫少女人像"],
  ["Pastel Lavender Anime Girl Portrait", "粉彩薰衣草动漫少女人像"],
  ["Lavender AI Girl in Memory Space", "记忆空间里的薰衣草 AI 少女"],
  ["Pastel AI Assistant Anime Portrait", "粉彩 AI 助手动漫人像"],
  ["Dark Gatorade-Style Portrait", "深色运动饮料风人像"],
  ["Portrait of a Gentle Woman with Glasses", "戴眼镜温柔女性人像"],
  ["Dreamy Underwater Woman With Translucent Fish", "梦幻水下女性与半透明鱼"],
  ["Japanese Classroom Long Hair Snapshot", "日式教室长发抓拍"],
  ["Cozy Catgirl Pajama Night Portrait", "温馨猫耳少女睡衣夜景人像"],
  ["Collectible Figure Workspace Photo", "收藏手办工作台照片"],
  ["Rainy Bus Stop Portrait", "雨中公交站人像"],
  ["CCD flash beauty portrait template", "CCD 闪光美人人像模板"],
  ["Black-and-red streetwear campaign portrait", "黑红街头服饰广告人像"],
  ["Boston Spring 2026 City Poster", "波士顿 2026 春季城市海报"],
  ["Vintage Amalfi Travel Poster", "复古阿马尔菲旅行海报"],
  ["Spring Guangzhou City Poster", "广州春季城市海报"],
  ["Doodle Sketch AI Builder", "涂鸦草图 AI 构建器"],
  ["Futuristic Mandala Illustration", "未来感曼陀罗插画"],
  ["Super Famicom Poster Style", "超级任天堂海报风格"],
  ["Browser Game Ad Creative Poster", "浏览器游戏广告创意海报"],
  ["Surreal Koi Nebula Illustration", "超现实锦鲤星云插画"],
  ["Ink-Curve Guangzhou Aesthetics Poster", "水墨曲线广州美学海报"],
  ["Guangdong Super League Invitation Poster", "广东超级联赛邀请海报"],
  ["Epic Silhouette World Poster", "史诗剪影世界海报"],
  ["Science Encyclopedia Vertical Poster", "科学百科竖版海报"],
  ["Journey to the West Chinese Comic", "西游记中国漫画风"],
  ["New Chinese Ink Landscape Poster", "新中式水墨山水海报"],
  ["Character Visual Vertical Poster", "角色视觉竖版海报"],
  ["Fictional Anime Movie Poster", "虚构动漫电影海报"],
  ["Product Ad Redesign", "产品广告重设计"],
  ["Dark-Fantasy Guangzhou City Poster", "暗黑幻想广州城市海报"],
  ["Science Fiction Movie Poster", "科幻电影海报"],
  ["Refreshing Summer Udon Ad", "清爽夏日乌冬广告"],
  ["Handwritten Medical Prescription Sheet", "手写医疗处方单"],
  ["Silicon Valley 2026 Promo Poster", "硅谷 2026 宣传海报"],
  ["Japanese Supermarket Sale Flyer", "日本超市促销传单"],
  ["Dark Epic Concept Poster", "暗黑史诗概念海报"],
  ["Pilates Studio Ad Poster", "普拉提工作室广告海报"],
  ["Fashion Campaign Prompt Formula", "时尚广告提示词公式"],
  ["Exploded View Breakdown Prompt", "爆炸图拆解提示词"],
  ["Istiklal Street Panorama Prompt", "独立大街全景提示词"],
  ["Chili Pork Cooking Flowchart", "辣椒炒肉烹饪流程图"],
  ["Equirectangular Panorama Image", "等距柱状全景图"],
  ["Hangzhou West Lake Travel Poster", "杭州西湖旅行海报"],
  ["Dongfang Bubai Wuxia Character Poster", "东方不败武侠角色海报"],
  ["A Chinese Odyssey 90s Hong Kong Poster", "大话西游 90 年代港风海报"],
  ["Journey to the West Daughter Kingdom Poster", "西游记女儿国海报"],
  ["Royal Tramp Character Poster", "鹿鼎记角色海报"],
  ["racing car poster with its spec and pricing", "赛车参数与价格海报"],
  ["Charlie Chaplin Product Poster Redesign", "卓别林产品海报重设计"],
  ["Luxury Sportswear Basketball Athlete Campaign Poster", "奢华运动服篮球运动员广告海报"],
  ["Streetwear Fashion Campaign Asian Apparel Poster", "亚洲服饰街头时尚广告海报"],
  ["Epic Career Moments Cinematic Poster Template", "职业生涯高光时刻电影海报模板"],
  ["Avant-Garde Basketball Sculpture Sports Fashion Ad", "前卫篮球雕塑运动时尚广告"],
  ["Avant-Garde Tennis Racket Sculpture Sports Fashion Ad", "前卫网球拍雕塑运动时尚广告"],
  ["Surrealist Liquor Brand High Fashion Poster", "超现实酒类品牌高级时尚海报"],
  ["Premium Food Recipe Poster Elegant Layout", "高级食谱海报优雅版式"],
  ["Luxury Fashion Magazine Cover Black and White", "黑白奢华时尚杂志封面"],
  ["Surrealist Rolex Luxury Watch Fashion Poster", "超现实劳力士奢华腕表时尚海报"],
  ["Peacock Botanical Vintage Symmetrical Art Print", "孔雀植物复古对称艺术版画"],
  ["SPLASH Fashion Brand Hyper-Realistic Campaign Poster", "SPLASH 时尚品牌超写实广告海报"],
  ["Avant-Garde Guitar Sculpture Fashion Advertisement", "前卫吉他雕塑时尚广告"],
  ["Illustrated City Food Map", "插画城市美食地图"],
  ["Stone Staircase Evolution Infographic", "石阶演化信息图"],
  ["Biomimetic Skyray Aircraft Poster", "仿生鳐鱼飞行器海报"],
  ["Taoist Three Souls Seven Po Poster", "道教三魂七魄海报"],
  ["Vintage Claude Shannon Infographic Poster", "克劳德·香农复古信息图海报"],
  ["Ink-Wash Tribute Poster for Chen Uen", "郑问水墨致敬海报"],
  ["Water Signs Zodiac Character Poster", "水象星座角色海报"],
  ["Earth Signs Zodiac Character Poster", "土象星座角色海报"],
  ["Fire Sign Zodiac Character Poster", "火象星座角色海报"],
  ["Air Sign Zodiac Character Poster", "风象星座角色海报"],
  ["Ethnographic Plate for Tibetan Ceremonial Hat", "藏族礼帽民族志图版"],
  ["Luxury Amber Perfume Ad", "奢华琥珀香水广告"],
  ["Skincare Product Studio Shot", "护肤品棚拍"],
  ["Tropical Citrus Soda Ad Poster", "热带柑橘苏打广告海报"],
  ["Industrial Design Presentation Sheet", "工业设计展示板"],
  ["Luxury Fur-Lined Loafer Lifestyle Photo", "奢华毛绒乐福鞋生活方式照片"],
  ["Luxury Perfume Ad on Marble Vanity", "大理石梳妆台上的奢华香水广告"],
  ["Miniature Diorama Skincare Advertisement", "护肤品微缩场景广告"],
  ["Traditional Chinese Art and Porcelain Vases", "中国传统艺术与瓷瓶"],
  ["Premium Gaming Motherboard Studio Shot", "高级游戏主板棚拍"],
  ["Premium Grain Powder Ad Board", "高级谷物粉广告板"],
  ["Earbuds E-commerce Infographic", "耳机电商信息图"],
  ["Sustainable T-Shirt Plantable Tag Ad", "可种植吊牌环保 T 恤广告"],
  ["Elegant Cosmetic Poster Prompt", "优雅化妆品海报提示词"],
  ["Minimalist Product Ad", "极简产品广告"],
  ["Pastel Blue Crocs Fashion Ad", "粉蓝洞洞鞋时尚广告"],
  ["E-commerce Live Stream UI Mockup", "电商直播界面样机"]
];

const wordTranslations = [
  ["e-commerce", "电商"],
  ["poster", "海报"],
  ["anime", "动漫"],
  ["screenshot", "截图"],
  ["prompt", "提示词"],
  ["infographic", "信息图"],
  ["character", "角色"],
  ["fashion", "时尚"],
  ["sheet", "表"],
  ["city", "城市"],
  ["livestream", "直播"],
  ["live stream", "直播"],
  ["design", "设计"],
  ["image", "图像"],
  ["japanese", "日式"],
  ["portrait", "人像"],
  ["editorial", "杂志风"],
  ["campaign", "广告战役"],
  ["girl", "少女"],
  ["reference", "参考"],
  ["chinese", "中式"],
  ["vintage", "复古"],
  ["game", "游戏"],
  ["illustration", "插画"],
  ["scene", "场景"],
  ["art", "艺术"],
  ["pastel", "粉彩"],
  ["banner", "横幅"],
  ["guide", "指南"],
  ["cinematic", "电影感"],
  ["fantasy", "幻想"],
  ["photo", "照片"],
  ["board", "设计板"],
  ["panel", "面板"],
  ["grid", "网格"],
  ["promo", "宣传"],
  ["product", "产品"],
  ["generate", "生成"],
  ["dance", "舞蹈"],
  ["douyin", "抖音"],
  ["thumbnail", "缩略图"],
  ["engineering", "工程"],
  ["dark", "暗黑"],
  ["snapshot", "抓拍"],
  ["soft", "柔和"],
  ["realistic", "写实"],
  ["guangzhou", "广州"],
  ["vertical", "竖版"],
  ["concept", "概念"],
  ["luxury", "奢华"],
  ["neon", "霓虹"],
  ["urban", "都市"],
  ["beauty", "美妆"],
  ["dreamy", "梦幻"],
  ["spring", "春季"],
  ["food", "美食"],
  ["zodiac", "星座"],
  ["pose", "姿势"],
  ["battle", "战斗"],
  ["comparison", "对比"],
  ["logo", "标志"],
  ["advertisement", "广告"],
  ["photography", "摄影"],
  ["shot", "拍摄"],
  ["idol", "偶像"],
  ["page", "页面"],
  ["tropical", "热带"],
  ["streetwear", "街头服饰"],
  ["system", "系统"],
  ["collage", "拼贴"],
  ["black", "黑色"],
  ["night", "夜景"],
  ["style", "风格"],
  ["female", "女性"],
  ["surreal", "超现实"],
  ["epic", "史诗"],
  ["silhouette", "剪影"],
  ["movie", "电影"],
  ["panorama", "全景"],
  ["travel", "旅行"],
  ["avant-garde", "前卫"],
  ["sculpture", "雕塑"],
  ["cover", "封面"],
  ["event", "事件"],
  ["cyberpunk", "赛博朋克"],
  ["test", "测试"],
  ["slide", "幻灯片"],
  ["screen", "屏幕"],
  ["based", "基于"],
  ["social", "社交"],
  ["frame", "画框"],
  ["video", "视频"],
  ["sales", "销售"],
  ["glamour", "华丽"],
  ["eastern", "东方"],
  ["pov", "主观视角"],
  ["diorama", "微缩场景"],
  ["marketing", "营销"],
  ["mascot", "吉祥物"],
  ["minimal", "极简"],
  ["strawberry", "草莓"],
  ["magazine", "杂志"],
  ["hyper-realistic", "超写实"],
  ["photograph", "照片"],
  ["science", "科学"],
  ["landscape", "风景"],
  ["premium", "高级"],
  ["storyboard", "分镜"],
  ["app", "应用"],
  ["film", "胶片"],
  ["amber", "琥珀"],
  ["citrus", "柑橘"],
  ["soda", "苏打"],
  ["industrial", "工业"],
  ["presentation", "展示"],
  ["fur-lined", "毛绒内衬"],
  ["loafer", "乐福鞋"],
  ["marble", "大理石"],
  ["vanity", "梳妆台"],
  ["traditional", "传统"],
  ["porcelain", "瓷器"],
  ["vases", "花瓶"],
  ["gaming", "游戏"],
  ["motherboard", "主板"],
  ["grain", "谷物"],
  ["powder", "粉"],
  ["sustainable", "可持续"],
  ["t-shirt", "T 恤"],
  ["plantable", "可种植"],
  ["tag", "吊牌"],
  ["cosmetic", "化妆品"],
  ["crunch", "脆片"],
  ["burger", "汉堡"],
  ["hero", "主视觉"],
  ["cell", "宫格"],
  ["digital", "数字"],
  ["merch", "周边"],
  ["document", "文档"],
  ["flyer", "传单"],
  ["jellyfish", "水母"],
  ["room", "房间"],
  ["goods", "商品"],
  ["chronograph", "计时腕表"],
  ["sneaker", "运动鞋"],
  ["sweatshirt", "卫衣"],
  ["dubai", "迪拜"],
  ["model", "模型"],
  ["parody", "仿作"],
  ["headset", "头显"],
  ["printer", "打印机"],
  ["chocolate", "巧克力"],
  ["fruit", "水果"],
  ["juice", "果汁"]
];

const fallbackByCategory = {
  电商海报: "电商主图视觉案例",
  商品商业: "商业产品广告案例",
  "品牌/VI": "品牌视觉设计案例",
  信息图: "信息图设计案例",
  "Logo/海报": "海报视觉设计案例",
  人像摄影: "人像摄影案例",
  "UI/界面": "界面设计案例",
  "IP/角色": "角色设定案例",
  电影分镜: "分镜脚本案例",
  "图标/贴纸": "图标贴纸设计案例",
  "PPT/版式": "版式设计案例",
  国风插画: "国风插画案例",
  室内建筑: "室内建筑视觉案例",
  纹理材质: "纹理材质案例",
  "工业/产品": "工业产品设计案例",
  提示词方法: "提示词方法案例"
};

function replaceAllCaseInsensitive(text, search, replacement) {
  return text.replace(new RegExp(escapeRegExp(search), "gi"), replacement);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function remainingEnglish(text) {
  let value = text;
  for (const word of protectedWords) {
    value = replaceAllCaseInsensitive(value, word, "");
  }
  value = value.replace(/@[A-Za-z0-9_]+|https?:\/\/\S+/g, "");
  return /[A-Za-z]{4,}/.test(value);
}

function cleanup(text) {
  return text
    .replace(/^Case\s+(\d+)\s*·\s*/i, "案例 $1 · ")
    .replace(/\s+-\s+/g, "：")
    .replace(/\s*&\s*/g, "与")
    .replace(/\s+and\s+/gi, "与")
    .replace(/\s+with\s+/gi, "与")
    .replace(/\s+for\s+/gi, "用于")
    .replace(/\s+on\s+/gi, "在")
    .replace(/\s+of\s+/gi, "的")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。；：！？])/g, "$1")
    .trim();
}

function localizeText(text) {
  let value = cleanup(String(text || ""));
  const phrases = [...phraseTranslations].sort((a, b) => b[0].length - a[0].length);
  for (const [source, target] of phrases) {
    value = replaceAllCaseInsensitive(value, source, target);
  }
  for (const [source, target] of wordTranslations) {
    value = value.replace(new RegExp(`\\b${escapeRegExp(source)}\\b`, "gi"), target);
  }
  return cleanup(value);
}

function fallbackTitle(prompt, current) {
  const caseNo = current.match(/案例\s+(\d+)/)?.[1] || prompt.source?.match(/Case\s+(\d+)/i)?.[1];
  const label = fallbackByCategory[prompt.category] || "创作案例";
  return caseNo ? `案例 ${caseNo} · ${label}` : label;
}

const prompts = JSON.parse(fs.readFileSync(dataPath, "utf8"));
let localized = 0;
let fallback = 0;

for (const prompt of prompts) {
  for (const field of ["title", "style"]) {
    const next = localizeText(prompt[field]);
    prompt[field] = next;
    localized += 1;
    if (remainingEnglish(prompt[field])) {
      prompt[field] = fallbackTitle(prompt, prompt.title);
      fallback += 1;
    }
  }

  if (prompt.notes?.includes("GitHub")) {
    prompt.notes = prompt.notes.replace("GitHub 官方案例库", "GitHub 官方案例库");
  }

  prompt.tags = (prompt.tags || []).map((tag) => {
    if (tag === "Campaign") return "广告战役";
    if (tag === "UI") return "界面";
    return tag;
  });
}

fs.writeFileSync(dataPath, JSON.stringify(prompts, null, 2) + "\n");
console.log(`localized display fields=${localized}; fallback titles/styles=${fallback}`);
