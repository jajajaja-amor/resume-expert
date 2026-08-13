# SpecLens · 海外工程产品合规审查工作台

面向海外工程项目采购与合规审核场景的 AI Agent 工作流，将「产品比选」与「合规审核」两段流程串联。

> AI Product Compliance Workspace — 从供应商产品资料，到产品选型，再到海外项目合规审核，一条工作流完成。

## 技术栈

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand（含 localStorage 持久化）
- lucide-react

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。默认运行 **Demo Mode**，内置「软膜天花 / 建筑装饰材料 × 3 供应商」演示数据，无需配置任何 API 即可完整体验全流程。

## 页面结构

| 路径 | 说明 |
|------|------|
| `/` | 工作台首页：工作流展示、两大入口、最近项目历史 |
| `/compare` | 阶段一 · 产品比选：上传资料 → 参数提取 → 归一化 → 横向比较 → 六维评分 → 人工确认 → 选型结果 |
| `/compliance` | 阶段二 · 合规审核：导入选型结果 → 上传规范 → 检查清单 → 逐条核查（PASS/FAIL/REVIEW/MISSING/N/A）→ 人工审核 → MAS 材料 → 最终报告与导出 |

**阶段一输出（SelectionResult）= 阶段二输入**，确认选型后自动传递，无需重复录入。

## 演示流程

1. 首页进入「产品比选」，点击「载入演示数据（3 个供应商）」
2. 点击「开始 AI 产品比选」，观察 Agent 步骤进度
3. 在参数表中点击任意参数查看来源（文件 / 页码 / 原文 / 置信度），可修改参数或标记错误
4. 查看归一化结果（单位换算、参数冲突、单位缺失待确认）
5. 查看六维评分，点击「查看评分依据」，可人工修改评分
6. 选择产品并「确认产品选型」，然后「进入合规审核」
7. 确认产品信息已自动导入，点击「载入演示规范（4 份）」并生成检查清单
8. 查看 PASS / FAIL / REVIEW / MISSING 统计与筛选，点击「查看依据」追溯 Evidence
9. 在人工审核区处理 FAIL / REVIEW / MISSING 项，点击「确认合规审核结果」
10. 审核并确认 AI 生成的 MAS 材料，生成最终合规审核报告
11. 导出 Markdown / HTML / PDF（飞书导出为预留按钮，未配置时提示演示模式）

## 核心原则

- **所有 AI 判断可追溯**：每个参数、评分、合规结论都携带 Evidence（来源文件、页码、章节、原文、提取值、置信度）
- **不猜测**：单位无法判断 → 待确认；参数冲突 → 人工确认；**缺少证据 ≠ 不合规**（判 MISSING 而非 FAIL）
- **人工审核**：AI 生成结果仅供审核确认，选型与合规结论必须经人工确认

## Agent 架构与真实 API 接入

Agent 逻辑封装在 `src/services/agents/`，每个 Agent 可独立替换：

```
Document Parser → Parameter Extractor → Normalizer → Product Comparator
→ Scoring Agent → Human Review → Selection Result
→ Specification Parser → Checklist Generator → Compliance Checker
→ Human Review → MAS Generator → Report Generator
```

当前为 Mock Agent（Demo Mode），输入输出结构与真实 Agent 一致。接入真实工作流（扣子 / OpenAI / 自建后端 / RAG）时：

1. 复制 `.env.example` 为 `.env.local`，配置 `AGENT_API_KEY`、`AGENT_API_URL`（仅服务端使用，切勿放入前端代码 / localStorage / Git）
2. 在 `src/app/api/agents/` 下的 API Route 中调用真实接口
3. 将 `src/services/agents/index.ts` 中的 Mock 实现替换为对服务端路由的 fetch，函数签名保持不变

## 项目结构

```
src/
├── app/                  # Next.js App Router（/、/compare、/compliance、/api/agents）
├── components/
│   ├── compare/          # 阶段一组件
│   ├── compliance/       # 阶段二组件
│   ├── layout/           # 页头
│   ├── shared/           # 上传区、Agent 步骤、Evidence、状态标签、侧边栏
│   └── ui/               # shadcn/ui 组件
├── services/agents/      # Agent 服务层（Mock / 未来真实接口）
├── store/                # Zustand 工作台状态（含持久化与历史记录）
├── lib/                  # 导出、工具
└── types/domain.ts       # 核心领域模型（Evidence / SelectionResult / ComplianceCheck 等）
```
