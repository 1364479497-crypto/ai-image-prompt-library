const state = {
  prompts: [],
  favorites: new Set(readStoredArray("promptVault:favorites")),
  userPrompts: readStoredArray("promptVault:userPrompts"),
  selectedCategory: "全部",
  quickFilter: "all",
  query: "",
  model: "all",
  sort: "recent",
  focusedId: null,
  listView: false,
  candidates: []
};

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn(`Ignored invalid local storage value for ${key}.`, error);
    return [];
  }
}

const categoryIcons = {
  全部: "library",
  人像摄影: "camera",
  商品商业: "package",
  室内建筑: "lamp-desk",
  国风插画: "brush",
  电影分镜: "clapperboard",
  "IP/角色": "smile",
  "品牌/VI": "palette",
  "UI/界面": "panels-top-left",
  "图标/贴纸": "sticker",
  "工业/产品": "drafting-compass",
  "PPT/版式": "presentation",
  提示词方法: "book-open-text",
  "Logo/海报": "gallery-vertical-end",
  电商海报: "shopping-bag",
  纹理材质: "swatch-book",
  信息图: "chart-no-axes-combined",
  待整理: "inbox"
};

const els = {
  categoryList: document.querySelector("#categoryList"),
  promptGrid: document.querySelector("#promptGrid"),
  searchInput: document.querySelector("#searchInput"),
  modelFilter: document.querySelector("#modelFilter"),
  sortMode: document.querySelector("#sortMode"),
  quickFilters: document.querySelector("#quickFilters"),
  statTotal: document.querySelector("#statTotal"),
  statFav: document.querySelector("#statFav"),
  focusTitle: document.querySelector("#focusTitle"),
  focusSummary: document.querySelector("#focusSummary"),
  focusTags: document.querySelector("#focusTags"),
  focusPreview: document.querySelector("#focusPreview"),
  copyFocus: document.querySelector("#copyFocus"),
  favoriteFocus: document.querySelector("#favoriteFocus"),
  detailDialog: document.querySelector("#detailDialog"),
  detailContent: document.querySelector("#detailContent"),
  imageDialog: document.querySelector("#imageDialog"),
  imageDialogImg: document.querySelector("#imageDialogImg"),
  imageDialogTitle: document.querySelector("#imageDialogTitle"),
  closeImageDialog: document.querySelector("#closeImageDialog"),
  promptDialog: document.querySelector("#promptDialog"),
  promptForm: document.querySelector("#promptForm"),
  newPrompt: document.querySelector("#newPrompt"),
  exportJson: document.querySelector("#exportJson"),
  toggleView: document.querySelector("#toggleView"),
  categoryOptions: document.querySelector("#categoryOptions"),
  toast: document.querySelector("#toast"),
  importDialog: document.querySelector("#importDialog"),
  openImport: document.querySelector("#openImport"),
  importText: document.querySelector("#importText"),
  importSource: document.querySelector("#importSource"),
  parseImport: document.querySelector("#parseImport"),
  saveImportCandidates: document.querySelector("#saveImportCandidates"),
  candidateList: document.querySelector("#candidateList")
};

async function init() {
  const response = await fetch("./data/prompts.json");
  const basePrompts = await response.json();
  state.prompts = normalizePrompts([...basePrompts, ...state.userPrompts]);
  state.focusedId = filteredPrompts()[0]?.id || state.prompts[0]?.id;
  bindEvents();
  render();
}

function normalizePrompts(prompts) {
  return prompts.map((prompt, index) => ({
    scenario: "个人收藏",
    style: "",
    tags: [],
    negative: "",
    params: "",
    source: "未标注",
    sourceType: "local",
    dateAdded: new Date().toISOString().slice(0, 10),
    rating: 3,
    status: "ready",
    colors: pickTone(index),
    notes: "",
    ...prompt
  }));
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderGrid();
  });

  els.modelFilter.addEventListener("change", (event) => {
    state.model = event.target.value;
    renderGrid();
  });

  els.sortMode.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderGrid();
  });

  els.quickFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.quickFilter = button.dataset.filter;
    document.querySelectorAll("#quickFilters button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderGrid();
  });

  els.copyFocus.addEventListener("click", () => {
    const prompt = getFocusedPrompt();
    if (prompt) copyPrompt(prompt);
  });

  els.favoriteFocus.addEventListener("click", () => {
    const prompt = getFocusedPrompt();
    if (prompt) toggleFavorite(prompt.id);
  });

  els.newPrompt.addEventListener("click", () => {
    els.promptForm.reset();
    els.promptDialog.showModal();
    refreshIcons();
  });

  els.promptForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(els.promptForm);
    addUserPrompt({
      title: form.get("title"),
      category: form.get("category"),
      model: form.get("model") || "未指定模型",
      tags: splitTags(form.get("tags")),
      prompt: form.get("prompt"),
      negative: form.get("negative"),
      source: form.get("source") || "手动新增",
      sourceType: "local",
      status: "ready",
      rating: 3
    });
    els.promptDialog.close();
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  els.detailDialog.addEventListener("click", (event) => {
    if (event.target === els.detailDialog) els.detailDialog.close();
  });

  els.imageDialog.addEventListener("click", (event) => {
    if (event.target === els.imageDialog) els.imageDialog.close();
  });

  els.closeImageDialog.addEventListener("click", () => {
    els.imageDialog.close();
  });

  els.exportJson.addEventListener("click", exportJson);
  els.toggleView.addEventListener("click", () => {
    state.listView = !state.listView;
    els.promptGrid.classList.toggle("list-view", state.listView);
    els.toggleView.innerHTML = `<i data-lucide="${state.listView ? "rows-3" : "layout-grid"}"></i>`;
    refreshIcons();
  });

  els.openImport.addEventListener("click", () => {
    els.importDialog.showModal();
    refreshIcons();
  });

  els.parseImport.addEventListener("click", () => {
    state.candidates = parseImportText(els.importText.value, els.importSource.value);
    renderCandidates();
  });

  els.saveImportCandidates.addEventListener("click", () => {
    if (!state.candidates.length) {
      state.candidates = parseImportText(els.importText.value, els.importSource.value);
    }
    if (!state.candidates.length) {
      toast("还没有可存入的候选提示词。");
      return;
    }
    state.candidates.forEach(addUserPrompt);
    state.candidates = [];
    els.importText.value = "";
    renderCandidates();
    els.importDialog.close();
    toast("已存入待整理分类，可以继续编辑完善。");
  });
}

function render() {
  renderStats();
  renderModels();
  renderCategories();
  renderCategoryOptions();
  renderFocus();
  renderGrid();
  refreshIcons();
}

function renderStats() {
  els.statTotal.textContent = state.prompts.length;
  els.statFav.textContent = state.favorites.size;
}

function renderModels() {
  const models = unique(state.prompts.map((prompt) => prompt.model).filter(Boolean));
  els.modelFilter.innerHTML = [
    `<option value="all">全部模型</option>`,
    ...models.map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`)
  ].join("");
}

function renderCategories() {
  const counts = state.prompts.reduce(
    (acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1;
      acc["全部"] += 1;
      return acc;
    },
    { 全部: 0 }
  );
  const categories = ["全部", ...unique(state.prompts.map((prompt) => prompt.category))];
  els.categoryList.innerHTML = categories
    .map((category) => {
      const icon = categoryIcons[category] || "folder";
      const active = category === state.selectedCategory ? "active" : "";
      return `
        <button class="category-item ${active}" data-category="${escapeHtml(category)}" type="button">
          <i data-lucide="${icon}"></i>
          <span>${escapeHtml(category)}</span>
          <span class="category-count">${counts[category] || 0}</span>
        </button>
      `;
    })
    .join("");

  els.categoryList.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      renderCategories();
      renderGrid();
    });
  });
}

function renderCategoryOptions() {
  els.categoryOptions.innerHTML = unique(state.prompts.map((prompt) => prompt.category))
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");
}

function renderGrid() {
  const prompts = filteredPrompts();
  if (!prompts.length) {
    els.promptGrid.innerHTML = `
      <div class="empty-state">
        <h2>没有匹配的提示词</h2>
        <p>换一个关键词，或把这类提示词先新增到库里。</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  if (!prompts.some((prompt) => prompt.id === state.focusedId)) {
    state.focusedId = prompts[0].id;
    renderFocus();
  }

  els.promptGrid.innerHTML = prompts.map(renderCard).join("");
  els.promptGrid.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      copyPrompt(findPrompt(button.dataset.copy));
    });
  });
  els.promptGrid.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(button.dataset.favorite);
    });
  });
  els.promptGrid.querySelectorAll("[data-open]").forEach((card) => {
    card.addEventListener("click", () => openDetail(card.dataset.open));
  });
  refreshIcons();
}

function renderCard(prompt) {
  const favorite = state.favorites.has(prompt.id);
  const style = toneStyle(prompt);
  const preview = previewImage(prompt);
  return `
    <article class="prompt-card ${preview ? "has-preview" : ""}" data-open="${escapeHtml(prompt.id)}" style="${style}">
      <div class="card-art" aria-hidden="true">
        ${renderPreviewImage(preview, prompt.title)}
      </div>
      <div class="card-body">
        <div class="meta-row">
          <span>${escapeHtml(prompt.category)}</span>
          <span class="model-pill">${escapeHtml(prompt.model)}</span>
        </div>
        <h3>${escapeHtml(prompt.title)}</h3>
        <p class="card-credit">${escapeHtml(creditLine(prompt))}</p>
        <div class="card-tags">
          ${prompt.tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="card-actions">
          <button class="button secondary" data-copy="${escapeHtml(prompt.id)}" type="button">
            <i data-lucide="copy"></i>
            <span>复制</span>
          </button>
          <button class="icon-button ${favorite ? "favorite-on" : ""}" data-favorite="${escapeHtml(prompt.id)}" type="button" aria-label="收藏">
            <i data-lucide="star"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderFocus() {
  const prompt = getFocusedPrompt() || state.prompts[0];
  if (!prompt) return;
  const preview = previewImage(prompt);
  els.focusTitle.textContent = prompt.title;
  els.focusSummary.textContent = prompt.notes || prompt.scenario || prompt.prompt.slice(0, 120);
  els.focusTags.innerHTML = [prompt.category, prompt.model, ...prompt.tags.slice(0, 4)]
    .filter(Boolean)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");
  els.focusPreview.setAttribute("style", toneStyle(prompt));
  els.focusPreview.classList.toggle("has-preview", Boolean(preview));
  els.focusPreview.innerHTML = renderPreviewImage(preview, prompt.title);
  els.favoriteFocus.classList.toggle("favorite-on", state.favorites.has(prompt.id));
  refreshIcons();
}

function openDetail(id) {
  const prompt = findPrompt(id);
  if (!prompt) return;
  state.focusedId = id;
  renderFocus();
  const preview = previewImage(prompt);
  els.detailContent.innerHTML = `
    <div class="detail-hero ${preview ? "has-preview" : ""}" style="${toneStyle(prompt)}">
      <button class="detail-preview-button card-art" data-preview-image type="button" aria-label="查看预览图" title="查看大图">
        ${renderPreviewImage(preview, prompt.title)}
      </button>
      <div>
        <p class="eyebrow">${escapeHtml(prompt.category)}</p>
        <h2>${escapeHtml(prompt.title)}</h2>
        <div class="detail-meta">
          <span class="tag">${escapeHtml(prompt.model)}</span>
          <span class="tag">${escapeHtml(prompt.source)}</span>
          ${prompt.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </div>
    <div class="prompt-block">
      <h3>正向提示词</h3>
      <div class="prompt-text">${escapeHtml(prompt.prompt)}</div>
    </div>
    ${
      prompt.negative
        ? `<div class="prompt-block"><h3>负向提示词</h3><div class="prompt-text">${escapeHtml(prompt.negative)}</div></div>`
        : ""
    }
    ${
      prompt.params
        ? `<div class="prompt-block"><h3>参数</h3><div class="prompt-text">${escapeHtml(prompt.params)}</div></div>`
        : ""
    }
    ${
      prompt.notes
        ? `<div class="prompt-block"><h3>使用备注</h3><div class="prompt-text">${escapeHtml(prompt.notes)}</div></div>`
        : ""
    }
    <div class="form-actions">
      <button class="button secondary" data-detail-copy="${escapeHtml(prompt.id)}" type="button">
        <i data-lucide="copy"></i>
        <span>复制正向提示词</span>
      </button>
      <button class="button primary" data-detail-copy-all="${escapeHtml(prompt.id)}" type="button">
        <i data-lucide="copy-check"></i>
        <span>复制完整信息</span>
      </button>
    </div>
  `;
  els.detailContent
    .querySelector("[data-preview-image]")
    ?.addEventListener("click", () => openImagePreview(preview, prompt.title));
  els.detailContent.querySelector("[data-detail-copy]")?.addEventListener("click", () => copyPrompt(prompt));
  els.detailContent.querySelector("[data-detail-copy-all]")?.addEventListener("click", () => copyPrompt(prompt, true));
  els.detailDialog.showModal();
  refreshIcons();
}

function filteredPrompts() {
  const query = state.query;
  return state.prompts
    .filter((prompt) => state.selectedCategory === "全部" || prompt.category === state.selectedCategory)
    .filter((prompt) => state.model === "all" || prompt.model === state.model)
    .filter((prompt) => {
      if (state.quickFilter === "favorite") return state.favorites.has(prompt.id);
      if (state.quickFilter === "ready") return prompt.status === "ready";
      if (state.quickFilter === "wechat") return prompt.sourceType === "wechat";
      if (state.quickFilter === "github") return prompt.sourceType === "github";
      if (state.quickFilter === "local") return prompt.sourceType === "local";
      return true;
    })
    .filter((prompt) => {
      if (!query) return true;
      return [
        prompt.title,
        prompt.category,
        prompt.model,
        prompt.scenario,
        prompt.style,
        prompt.prompt,
        prompt.negative,
        prompt.params,
        prompt.source,
        prompt.notes,
        ...prompt.tags
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort(sortPrompts);
}

function sortPrompts(a, b) {
  if (state.sort === "rating") return (b.rating || 0) - (a.rating || 0);
  if (state.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
  return new Date(b.dateAdded) - new Date(a.dateAdded);
}

function addUserPrompt(prompt) {
  const newPrompt = normalizePrompts([
    {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      dateAdded: new Date().toISOString().slice(0, 10),
      category: prompt.category || "待整理",
      colors: pickTone(state.prompts.length),
      ...prompt
    }
  ])[0];
  state.userPrompts = [newPrompt, ...state.userPrompts];
  state.prompts = normalizePrompts([newPrompt, ...state.prompts]);
  localStorage.setItem("promptVault:userPrompts", JSON.stringify(state.userPrompts));
  state.focusedId = newPrompt.id;
  render();
  toast("已保存到本地浏览器，并会包含在导出 JSON 中。");
}

function parseImportText(text, source) {
  const clean = text.trim();
  if (!clean) return [];
  const blocks = clean
    .split(/\n{2,}|(?=提示词[:：])|(?=Prompt[:：])/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 28);

  const candidates = blocks
    .filter((block) => /prompt|提示词|--ar|镜头|风格|photography|illustration|cinematic/i.test(block))
    .slice(0, 12)
    .map((block, index) => {
      const firstLine = block.split(/\n/).find(Boolean) || `候选提示词 ${index + 1}`;
      const title = firstLine.replace(/^提示词[:：]\s*/i, "").slice(0, 32);
      return {
        title: title || `候选提示词 ${index + 1}`,
        category: guessCategory(block),
        model: guessModel(block),
        tags: ["待整理", "微信导入"],
        prompt: block.replace(/^提示词[:：]\s*/i, ""),
        source: source || "微信文章暂存",
        sourceType: "wechat",
        status: "draft",
        rating: 3,
        notes: "由暂存区初步生成，建议再补充模型、参数和负向提示词。"
      };
    });
  return candidates;
}

function renderCandidates() {
  if (!state.candidates.length) {
    els.candidateList.innerHTML = "";
    toast("没有识别到候选。可以多粘贴一些正文，或直接把文章发给我整理。");
    return;
  }
  els.candidateList.innerHTML = state.candidates
    .map(
      (candidate, index) => `
        <div class="candidate">
          <strong>${index + 1}. ${escapeHtml(candidate.title)}</strong>
          <p>${escapeHtml(candidate.category)} · ${escapeHtml(candidate.model)}</p>
          <p>${escapeHtml(candidate.prompt.slice(0, 180))}${candidate.prompt.length > 180 ? "..." : ""}</p>
        </div>
      `
    )
    .join("");
  toast(`识别到 ${state.candidates.length} 条候选。`);
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

async function copyPrompt(prompt, includeAll = false) {
  const text = includeAll
    ? [
        `标题：${prompt.title}`,
        `分类：${prompt.category}`,
        `模型：${prompt.model}`,
        `正向：${prompt.prompt}`,
        prompt.negative ? `负向：${prompt.negative}` : "",
        prompt.params ? `参数：${prompt.params}` : "",
        prompt.notes ? `备注：${prompt.notes}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    : `${prompt.prompt}${prompt.params ? `\n${prompt.params}` : ""}`;
  await navigator.clipboard.writeText(text);
  toast("提示词已复制。");
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  localStorage.setItem("promptVault:favorites", JSON.stringify([...state.favorites]));
  renderStats();
  renderFocus();
  renderGrid();
}

function exportJson() {
  const payload = JSON.stringify(state.prompts, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ai-image-prompts-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast("已导出当前提示词 JSON。");
}

function findPrompt(id) {
  return state.prompts.find((prompt) => prompt.id === id);
}

function getFocusedPrompt() {
  return findPrompt(state.focusedId);
}

function toneStyle(prompt) {
  const [a, b] = prompt.colors?.length ? prompt.colors : pickTone(prompt.id.length);
  return `--tone-a: ${a}; --tone-b: ${b};`;
}

function previewImage(prompt) {
  return prompt.previewUrl || prompt.generatedImageUrl || prompt.imageUrl || prompt.thumbnailUrl || "";
}

function creditLine(prompt) {
  if (prompt.author) return `作者 ${prompt.author}`;
  if (prompt.source) return prompt.source;
  return prompt.scenario || "来源未标注";
}

function renderPreviewImage(src, title) {
  if (!src) return "";
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)} 预览图" loading="lazy" />`;
}

function openImagePreview(src, title) {
  if (!src) return;
  els.imageDialogImg.src = src;
  els.imageDialogImg.alt = `${title} 预览图`;
  els.imageDialogTitle.textContent = title;
  els.imageDialog.showModal();
  refreshIcons();
}

function pickTone(index) {
  const tones = [
    ["#833f2e", "#d6a23d"],
    ["#315f78", "#d7eff2"],
    ["#546b45", "#e5d3ad"],
    ["#282828", "#b98125"],
    ["#3d4f5d", "#cf7664"],
    ["#7d5137", "#f0dcc0"]
  ];
  return tones[Math.abs(Number(index) || 0) % tones.length];
}

function splitTags(value) {
  return String(value || "")
    .split(/[,，、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

init().catch((error) => {
  console.error(error);
  els.promptGrid.innerHTML = `
    <div class="empty-state">
      <h2>数据载入失败</h2>
      <p>请确认 data/prompts.json 存在，并通过本地服务器打开页面。</p>
    </div>
  `;
});
