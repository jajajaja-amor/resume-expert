# SpecLens · 海外工程产品合规审查工作台

面向海外工程 EPC 设计师、采购与审核人员的 **AI Agent 工作台**：将「产品比选」与「合规审核」串联为一条可演示、可追溯的完整业务流程。

> SpecLens · AI Product Compliance Workspace

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand（本地持久化选型结果与历史）
- Mock Agent（可替换为真实 Agent API）

## 快速开始

```bash
npm install
pip3 install --user -r requirements-docs.txt   # 真实 PDF/DOCX/XLSX 解析（biaoshu-writer-pro）
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

> 文档解析使用 `scripts/parse_document.py`（源自 SkillHub `@user_509b3ac1/biaoshu-writer-pro`），经 `/api/documents/parse` 服务端提取文本后再做参数抽取。扫描版 PDF 无文字层时需 OCR 或粘贴原文。

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 工作台首页、工作流说明、最近项目 |
| `/compare` | 产品资料上传 → 参数提取/归一化 → 六维评分 → 人工确认选型 |
| `/compliance` | 导入选型结果 → 规范上传 → 逐条合规核查 → MAS → 最终报告导出 |

## 演示流程（无需配置 API）

1. 打开首页，进入 **产品比选**
2. 点击 **载入 Demo 资料（3 个供应商）**
3. 点击 **开始 AI 产品比选**，观察 Agent 步骤
4. 查看参数表、点击单元格查看来源；查看归一化与六维评分
5. 修改一个评分后 **确认产品选型**
6. 进入 **合规审核**（选型结果自动导入）
7. 使用 **Demo 项目规范** → **开始合规核查**
8. 筛选 PASS / FAIL / REVIEW / MISSING，点击 **查看依据**
9. 在人工审核区处理 REVIEW/MISSING 后确认
10. 生成 MAS 材料与最终报告，导出 Markdown / HTML

页面会明确提示：**当前为演示模式，以下数据为模拟数据。**

## Demo 数据

内置场景：**软膜天花 / 建筑装饰材料**（中东酒店大堂选型）

- 3 个供应商（价格、重量、防火、认证、企业能力不同）
- 参数冲突、单位归一化、待确认项
- 合规结果覆盖 PASS / FAIL / REVIEW / MISSING / NOT_APPLICABLE

## 真实 Agent / 扣子接入

密钥只能放在服务端环境变量或 Secrets，不要写入前端或仓库。

```bash
cp .env.example .env.local
```

```env
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

# 扣子工作流（合同合规审查，服务端调用）
COZE_PAT=your_pat_here
COZE_WORKFLOW_ID=7673528525253820442
COZE_API_BASE=https://api.coze.cn
```

相关接口：

- `POST /api/coze/review`：上传合同并调用扣子工作流
- `GET /api/coze/status`：仅返回是否已配置（不暴露密钥）
- `/api/compare/analyze`、`/api/compliance/check`：产品比选 / 规范核查

未配置密钥时自动使用演示结果，并标注「当前为演示结果」。若扣子工作流因飞书插件授权中断，页面会显示明确错误并支持重试。

## 项目结构

```
src/
├── app/                 # /, /compare, /compliance + API Routes
├── components/
│   ├── layout/          # AppShell
│   ├── shared/          # 上传、Evidence 侧栏、Agent 步骤等
│   └── ui/              # shadcn/ui
├── data/demo/           # 软膜天花演示数据
├── services/agents/     # Mock / Server Agent 封装
├── store/               # Zustand 工作台状态
└── types/               # 结构化领域模型
```

## 设计原则

- 所有 AI 判断必须可追溯（Evidence：文件 / 页码 / 原文 / 置信度）
- AI 不确定 → `REVIEW`；缺资料 → `MISSING`（不等于 FAIL）
- AI 结果必须经过人工确认
- 阶段一 `SelectionResult` 自动作为阶段二输入
