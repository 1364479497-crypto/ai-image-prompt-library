# AI 生图提示词库

一个面向个人长期积累的 AI 生图提示词网站。当前版本支持分类浏览、搜索、模型筛选、收藏、复制、新增、微信文章暂存和 JSON 导出。

## 本地运行

```bash
npm install
npm run dev
```

打开终端输出的本地地址即可使用。

## 数据放在哪里

核心数据在 `data/prompts.json`。每条提示词建议保留这些字段：

- `title`：方便检索的中文标题
- `category`：人像摄影、商品商业、室内建筑、国风插画、电影分镜、IP/角色、品牌/VI、UI/界面、图标/贴纸、工业/产品、PPT/版式、Logo/海报、电商海报、纹理材质、信息图、待整理
- `model`：Midjourney、SDXL、DALL·E 3、OpenAI 等
- `prompt`：正向提示词
- `negative`：负向提示词
- `params`：比例、风格、采样器、CFG 等参数
- `source` / `sourceType`：来源文章或手动整理
- `tags`：检索标签
- `notes`：使用提醒

## 微信文章导入流程

最省心的方式：把微信公众号文章链接、PDF 或正文直接发给我，我会帮你抽取提示词、去重、分类、补字段，然后写入 `data/prompts.json`。

如果你已经把文章保存成纯文本，也可以先跑一个粗筛脚本：

```bash
node scripts/import-wechat-text.mjs article.txt data/import-candidates.json
```

脚本产出的候选还需要复核。复杂文章建议交给我整理，准确率会高很多。

## 后续推 GitHub

等你确认站点结构和分类满意后，我可以继续帮你：

1. 绑定或创建 GitHub remote。
2. 提交当前代码。
3. 推送到你的 GitHub 仓库。
4. 配 GitHub Pages，让这个提示词库变成可访问的网站。
