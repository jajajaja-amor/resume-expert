"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowRight, ChevronRight, Clipboard, FileText,
  FolderPlus, HelpCircle, LoaderCircle, Menu, Pencil, Plus, Save, Search, Settings,
  ShieldCheck, Trash2, X,
} from "lucide-react";

type TaskType = "智能识别" | "需求分析" | "AI 方案设计" | "PRD 草稿" | "竞品分析";
type RunState = "idle" | "running" | "done" | "needs_info" | "risk" | "error" | "cancelled";
type Project = { id: string; name: string; business: string; users: string; phase: string; scope: string; constraints: string; openItems: string; tasks: Task[] };
type Task = { id: string; type: TaskType; input: string; state: RunState; createdAt: string; result?: Result };
type Result = { id: string; body: string; createdAt: string; demo?: boolean; evidence: Evidence };
type Evidence = { facts: string[]; sources: string[]; suggestions: string[]; assumptions: string[]; risks: string[] };

const types: TaskType[] = ["智能识别", "需求分析", "AI 方案设计", "PRD 草稿", "竞品分析"];
const descriptions: Record<TaskType, string> = {
  "智能识别": "描述当前问题，工作流会判断更适合的交付物类型。",
  "需求分析": "梳理用户、场景、范围、需求与待确认事项。",
  "AI 方案设计": "明确 AI 能力边界、流程、人工协作和验收方式。",
  "PRD 草稿": "生成可评审的产品需求草稿与验收口径。",
  "竞品分析": "对比公开资料中的产品能力、差异与验证重点。",
};
const examples = [
  ["售后流程需求分析", "需求分析", "请分析零售电商售后咨询流程：用户需要查询退款进度、修改收货信息，并在异常时快速转人工。请梳理核心用户、关键场景、需求范围、风险和待确认事项。"],
  ["AI 客服 MVP 方案", "AI 方案设计", "为零售电商设计 AI 客服 MVP：覆盖商品问答和订单状态查询，订单变更必须先完成身份与权限确认，无法处理时转人工。请给出能力边界、流程和验收建议。"],
  ["订单查询 PRD", "PRD 草稿", "请撰写订单查询能力的 PRD 草稿，包含目标、用户故事、功能流程、异常处理、埋点建议及验收标准。"],
  ["AI 客服竞品分析", "竞品分析", "请围绕 AI 客服的商品问答、订单查询、人工接管和知识库运营能力，给出竞品分析框架、公开资料核验清单和差异化建议。"],
] as const;

const demoBody = `# 零售 AI 客服 MVP｜需求分析 v1

## 1. 目标与范围
本交付物用于体验工作台文档样式。项目拟在零售电商服务场景中，优先支持**商品问答**与**订单状态查询**，帮助消费者获得基础自助服务，并为客服坐席提供更清晰的转人工上下文。

## 2. 核心用户与场景
| 用户 | 典型场景 | 需要完成的事 |
| --- | --- | --- |
| 线上消费者 | 购买前咨询 | 理解商品规格、配送与售后规则 |
| 线上消费者 | 购买后查询 | 查看订单状态、物流节点与退款进度 |
| 客服坐席 | 系统无法处理 | 接收完整上下文，继续处理复杂问题 |

## 3. 建议的 MVP 能力
- 基于已授权的知识资料回答商品与规则问题，并说明资料来源范围。
- 在身份与权限校验通过后，提供订单状态查询；订单变更不由系统直接执行。
- 对低置信度、敏感操作和异常订单，清晰提示并转接人工。

## 4. 验收与待确认
验收应覆盖：问题可追溯、订单查询的权限拦截、失败后的人工接管，以及用户能理解的异常提示。高峰咨询量、资料覆盖情况和人工接管时限尚未确认，应在进入方案设计前补充。`;

const demoEvidence: Evidence = {
  facts: ["项目已确认优先覆盖商品问答与订单状态查询。", "订单变更需要身份和权限确认，处理失败后转人工。"],
  sources: ["项目背景中的已确认范围与关键约束。"],
  suggestions: ["先以可追溯的知识问答和只读订单查询验证流程。"],
  assumptions: ["当前知识资料可被授权接入并定期维护。", "现有订单系统可提供受控的只读查询能力。"],
  risks: ["演示内容不代表真实企业数据、效果或工作流返回。", "涉及订单信息时仍需由业务与安全负责人确认权限规则。"],
};

function initialProjects(): Project[] {
  return [{ id: "demo", name: "零售 AI 客服 MVP", business: "零售电商售前、订单与售后服务", users: "线上消费者、客服坐席、运营人员", phase: "需求分析", scope: "商品问答与订单状态查询", constraints: "订单变更必须确认身份和权限，处理失败后转人工", openItems: "高峰期咨询量、知识资料覆盖情况、人工接管时间", tasks: [{ id: "demo-task", type: "需求分析", input: "围绕零售 AI 客服 MVP，梳理商品问答和订单状态查询的需求边界。", state: "done", createdAt: new Date().toISOString(), result: { id: "demo-result", body: demoBody, createdAt: new Date().toISOString(), demo: true, evidence: demoEvidence } }] }];
}

export function AppShell() {
  const [projects, setProjects] = useState<Project[]>([]); const [activeId, setActiveId] = useState("demo");
  const [type, setType] = useState<TaskType>("需求分析"); const [input, setInput] = useState(""); const [state, setState] = useState<RunState>("idle");
  const [selectedTask, setSelectedTask] = useState<string | null>("demo-task"); const [drawer, setDrawer] = useState(false); const [modal, setModal] = useState<"project" | "edit" | "settings" | "help" | null>(null);
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(""); const [notice, setNotice] = useState(""); const [mobileNav, setMobileNav] = useState(false); const [connection, setConnection] = useState("正在检查");
  useEffect(() => { const stored = localStorage.getItem("pm-workbench-projects"); if (stored) { try { setProjects(JSON.parse(stored)); } catch { setProjects(initialProjects()); } } else setProjects(initialProjects()); }, []);
  useEffect(() => { if (projects.length) localStorage.setItem("pm-workbench-projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { fetch("/api/workflow/status").then(r => r.json()).then(x => setConnection(x.status || "未配置")).catch(() => setConnection("暂时无法使用")); }, []);
  const project = projects.find(p => p.id === activeId) || projects[0];
  const activeTask = project?.tasks.find(t => t.id === selectedTask); const result = activeTask?.result;
  const updateProject = (fn: (p: Project) => Project) => setProjects(ps => ps.map(p => p.id === activeId ? fn(p) : p));
  const openTask = (task: Task) => { setSelectedTask(task.id); setType(task.type); setInput(task.input); setState(task.state); setEditing(false); setMobileNav(false); };
  const run = async (override?: string) => {
    const taskInput = override ?? input; if (!taskInput.trim()) { setNotice("请先描述当前业务任务。"); return; } if (state === "running") return;
    setNotice(""); setState("running");
    try {
      const response = await fetch("/api/workflow/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskType: type, input: taskInput, project: project && { name: project.name, business: project.business, users: project.users, phase: project.phase, scope: project.scope, constraints: project.constraints, openItems: project.openItems } }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "连接失败");
      if (data.kind === "needs_info" || data.kind === "risk") { setState(data.kind); setNotice(data.body); return; }
      if (!data.body?.trim()) throw new Error("本次任务已经结束，但没有得到可展示的内容，请检查工作流输出后重试。");
      const task: Task = { id: crypto.randomUUID(), type, input: taskInput, state: "done", createdAt: new Date().toISOString(), result: { id: crypto.randomUUID(), body: data.body, createdAt: new Date().toISOString(), evidence: data.evidence || { facts: [], sources: [], suggestions: [], assumptions: [], risks: [] } } };
      updateProject(p => ({ ...p, tasks: [task, ...p.tasks] })); setSelectedTask(task.id); setState("done");
    } catch (e) { setState("error"); setNotice(e instanceof Error ? e.message : "暂时无法完成任务，请检查连接后重试。"); }
  };
  const saveEdited = () => { if (!activeTask?.result) return; updateProject(p => ({ ...p, tasks: p.tasks.map(t => t.id === activeTask.id && t.result ? { ...t, result: { ...t.result, body: draft, demo: false } } : t) })); setEditing(false); };
  const newProject = (form: Record<string, string>) => { const p: Project = { id: crypto.randomUUID(), name: form.name || "未命名项目", business: form.business, users: form.users, phase: form.phase, scope: form.scope, constraints: form.constraints, openItems: form.openItems, tasks: [] }; setProjects(x => [p, ...x]); setActiveId(p.id); setSelectedTask(null); setInput(""); setState("idle"); setModal(null); };
  if (!project) return null;
  return <div className="workbench">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}><div className="brand"><div className="brand-mark"><FileText size={18}/></div><div><b>AI 产品经理</b><span>工作台</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <label className="search"><Search size={15}/><input placeholder="搜索项目或任务" /></label><div className="side-title">项目</div>
      <div className="project-list">{projects.map(p => <button key={p.id} onClick={() => { setActiveId(p.id); setSelectedTask(p.tasks[0]?.id || null); setInput(p.tasks[0]?.input || ""); setState(p.tasks[0]?.state || "idle"); setMobileNav(false); }} className={`project-item ${p.id === activeId ? "active" : ""}`}><span>{p.name}</span><small>{p.tasks.length} 项交付物</small></button>)}</div>
      <button className="new-project" onClick={() => setModal("project")}><Plus size={16}/>新建项目</button><div className="side-title">当前项目历史</div>
      <div className="history">{project.tasks.map(t => <button key={t.id} onClick={() => openTask(t)} className={selectedTask === t.id ? "selected" : ""}><FileText size={14}/><span><b>{t.type}</b><small>{t.input.slice(0, 26)}{t.input.length > 26 ? "…" : ""}</small></span><i className={t.state}>{t.state === "done" ? "已完成" : t.state === "running" ? "进行中" : "待处理"}</i></button>)}</div>
      <div className="sidebar-bottom"><button onClick={() => setModal("settings")}><Settings size={16}/>连接设置</button><button onClick={() => setModal("help")}><HelpCircle size={16}/>帮助中心</button></div></aside>
    <main><header className="topbar"><button className="menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div><span className="eyebrow">当前项目</span><h1>{project.name}</h1></div><div className="top-actions"><span className={`connection ${connection === "已连接" ? "ok" : ""}`}><ShieldCheck size={15}/>{connection}</span><button onClick={() => setModal("settings")}><Settings size={16}/>连接设置</button><button onClick={() => setModal("project")}><Plus size={16}/>新建项目</button><button aria-label="帮助" onClick={() => setModal("help")}><HelpCircle size={17}/></button></div></header>
      <div className="content"><section className="paths"><span className="path-label">工作路径</span>{types.slice(1).map((x, i) => <div key={x} className="path-wrap"><button onClick={() => { setType(x); setSelectedTask(null); setState("idle"); }} className={type === x ? "current" : ""}>{x}</button>{i < 3 && <ChevronRight size={16}/>}</div>)}</section>
        <section className="background"><div className="section-head"><div><span className="eyebrow">项目背景</span><h2>{project.business || "补充项目背景，让分析更贴近实际"}</h2></div><button onClick={() => setModal("edit")}><Pencil size={15}/>编辑</button></div><dl><div><dt>目标用户</dt><dd>{project.users || "未填写"}</dd></div><div><dt>当前阶段</dt><dd>{project.phase || "未填写"}</dd></div><div><dt>已确认范围</dt><dd>{project.scope || "未填写"}</dd></div><div><dt>关键约束</dt><dd>{project.constraints || "未填写"}</dd></div></dl></section>
        <section className="task-card"><div className="task-tabs">{types.map(x => <button key={x} className={type === x ? "active" : ""} onClick={() => { setType(x); setSelectedTask(null); setState("idle"); }}>{x}</button>)}</div><div className="task-title"><div><span className="eyebrow">当前任务类型</span><h2>{type}</h2><p>{descriptions[type]}</p></div><span className="char-count">{input.length} 字</span></div><textarea value={input} onChange={e => setInput(e.target.value)} placeholder="请描述当前业务任务、已有资料和你希望得到的交付物…" rows={6} disabled={state === "running"}/><div className="task-footer"><span>请勿输入未经授权的个人信息、商业秘密或生产凭证。</span><div><button onClick={() => setInput("")} disabled={state === "running"}>清空</button>{state === "running" ? <button className="secondary" onClick={() => { setState("cancelled"); setNotice("任务已取消，已保留你的输入内容。"); }}>取消</button> : <button className="primary" onClick={() => run()}><ArrowRight size={16}/>开始分析</button>}</div></div>
          <div className="examples">{examples.map(([title, kind, text]) => <button key={title} onClick={() => { setType(kind as TaskType); setInput(text); setState("idle"); setSelectedTask(null); }}><span>{title}</span><small>{kind}</small></button>)}</div>
          {state === "running" && <div className="run-status"><LoaderCircle className="spin" size={18}/><div><b>任务正在进行</b><p>理解任务 <span>→</span> 整理资料 <span>→</span> 生成交付物 <span>→</span> 风险与事实检查</p></div></div>}
          {(notice || state === "needs_info" || state === "risk" || state === "error" || state === "cancelled") && state !== "running" && <div className={`notice ${state}`}><AlertTriangle size={17}/><div><b>{state === "needs_info" ? "还需要你确认" : state === "risk" ? "需要人工确认的风险" : state === "error" ? "任务未完成" : "提示"}</b><p>{notice}</p></div>{state === "error" && <div><button onClick={() => run()}>重新尝试</button><button onClick={() => setModal("settings")}>检查连接</button></div>}</div>}</section>
        {result && <section className="document"><div className="document-head"><div><span className="eyebrow">交付物 · {activeTask?.type}</span><h2>{project.name}</h2><p>{new Date(result.createdAt).toLocaleString("zh-CN")} · <b>{result.demo ? "演示内容" : "已完成"}</b></p></div><button onClick={() => setDrawer(true)}>查看证据</button></div>{result.demo && <div className="demo-note">当前内容为演示数据，用于体验页面能力，并非工作流真实运行结果。</div>}{editing ? <textarea className="document-editor" value={draft} onChange={e => setDraft(e.target.value)} rows={18}/> : <article>{result.body.split("\n").map((line, i) => line.startsWith("# ") ? <h1 key={i}>{line.slice(2)}</h1> : line.startsWith("## ") ? <h3 key={i}>{line.slice(3)}</h3> : line.startsWith("- ") ? <p key={i} className="doc-li">• {line.slice(2)}</p> : line.startsWith("|") ? <p className="table-line" key={i}>{line.replaceAll("|", " · ")}</p> : <p key={i}>{line}</p>)}</article>}<div className="document-actions">{editing ? <><button onClick={() => setEditing(false)}>取消</button><button className="primary" onClick={saveEdited}><Save size={15}/>保存修改</button></> : <><button onClick={() => navigator.clipboard.writeText(result.body).then(() => setNotice("已复制全文。"))}><Clipboard size={15}/>复制全文</button><button onClick={() => setNotice("交付物已保存在当前项目的历史任务中。") }><Save size={15}/>保存到项目</button><button onClick={() => { setDraft(result.body); setEditing(true); }}><Pencil size={15}/>继续编辑</button><button onClick={() => { setInput(activeTask?.input || ""); setSelectedTask(null); run(activeTask?.input); }}><LoaderCircle size={15}/>重新生成</button><button onClick={() => { const index = types.slice(1).indexOf(activeTask?.type as TaskType); const next = types.slice(1)[(index + 1) % 4]; setType(next); setInput(`基于「${activeTask?.type}」的结论，请继续完成${next}。`); setSelectedTask(null); setState("idle"); }}><ArrowRight size={15}/>继续下一项</button></>}</div></section>}
      </div></main>
    {drawer && result && <aside className="evidence"><div><h2>证据与假设</h2><button onClick={() => setDrawer(false)}><X size={18}/></button></div>{([ ["已确认事实", result.evidence.facts], ["资料支持", result.evidence.sources], ["分析建议", result.evidence.suggestions], ["待验证假设", result.evidence.assumptions], ["风险与人工确认点", result.evidence.risks] ] as const).map(([label, items]) => <section key={label}><h3>{label}</h3>{items.length ? <ul>{items.map((x,i) => <li key={i}>{x}</li>)}</ul> : <p>本次工作流未提供此项内容。</p>}</section>)}</aside>}
    {modal === "project" && <ProjectModal onClose={() => setModal(null)} onSave={newProject} onDelete={() => { if (projects.length > 1 && confirm(`确定删除「${project.name}」及其任务吗？`)) { const left = projects.filter(p => p.id !== activeId); setProjects(left); setActiveId(left[0].id); setModal(null); } }} />}
    {modal === "edit" && <ProjectModal project={project} onClose={() => setModal(null)} onSave={form => { updateProject(p => ({ ...p, ...form })); setModal(null); }} onDelete={() => { if (projects.length > 1 && confirm(`确定删除「${project.name}」及其任务吗？`)) { const left = projects.filter(p => p.id !== activeId); setProjects(left); setActiveId(left[0].id); setModal(null); } }} />}
    {modal === "settings" && <SettingsModal status={connection} onClose={() => setModal(null)} onCheck={() => { setConnection("正在连接"); fetch("/api/workflow/status").then(r=>r.json()).then(x=>setConnection(x.status || "未配置")).catch(()=>setConnection("暂时无法使用")); }} />}
    {modal === "help" && <HelpModal onClose={() => setModal(null)} />}
  </div>;
}

function ProjectModal({ project, onClose, onSave, onDelete }: { project?: Project; onClose: () => void; onSave: (x: Record<string,string>) => void; onDelete: () => void }) { const [form, setForm] = useState({ name: project?.name || "", business: project?.business || "", users: project?.users || "", phase: project?.phase || "", scope: project?.scope || "", constraints: project?.constraints || "", openItems: project?.openItems || "" }); return <div className="modal-back"><form className="modal" onSubmit={e => { e.preventDefault(); onSave(form); }}><div className="modal-head"><div><span className="eyebrow">项目管理</span><h2>{project ? "编辑项目背景" : "新建项目"}</h2></div><button type="button" onClick={onClose}><X size={18}/></button></div><p className="modal-copy">建立独立项目背景，任务和交付物会分别保留。</p>{([ ["name", "项目名称"], ["business", "业务对象"], ["users", "目标用户"], ["phase", "当前阶段"], ["scope", "已确认范围"], ["constraints", "关键约束"], ["openItems", "待确认事项"] ] as const).map(([key,label]) => <label key={key}>{label}<textarea value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} rows={key === "name" ? 1 : 2} required={key === "name"}/></label>)}<div className="modal-actions"><button type="button" className="danger" onClick={onDelete}><Trash2 size={15}/>删除当前项目</button><span/><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">{project ? <><Save size={15}/>保存项目</> : <><FolderPlus size={15}/>创建项目</>}</button></div></form></div> }
function SettingsModal({ status, onClose, onCheck }: { status:string; onClose:()=>void; onCheck:()=>void }) { return <div className="modal-back"><div className="modal narrow"><div className="modal-head"><div><span className="eyebrow">连接设置</span><h2>课堂工作流</h2></div><button onClick={onClose}><X size={18}/></button></div><p className="modal-copy">当前状态：<b>{status}</b></p><div className="secure"><ShieldCheck size={18}/><div><b>保密信息受保护</b><p>个人访问令牌仅由服务器安全配置读取，不会显示、保存到项目或写入交付物。</p></div></div><label>工作流 ID<input value="已由安全配置提供" disabled/></label><p className="hint">如需更换连接信息，请在部署环境的安全变量中更新后重新测试。</p><div className="modal-actions"><span/><button onClick={onClose}>关闭</button><button className="primary" onClick={onCheck}>测试连接</button></div></div></div> }
function HelpModal({onClose}:{onClose:()=>void}) { return <div className="modal-back"><div className="modal"><div className="modal-head"><div><span className="eyebrow">帮助中心</span><h2>开始使用工作台</h2></div><button onClick={onClose}><X size={18}/></button></div><ol className="help"><li><b>新建项目：</b>填写项目背景，所有任务和交付物将与其他项目分开保存。</li><li><b>选择任务：</b>在任务区选择智能识别、需求分析、AI 方案设计、PRD 草稿或竞品分析。</li><li><b>连接工作流：</b>打开连接设置并测试。状态为“已连接”后即可提交真实任务。</li><li><b>查看与保存：</b>完成后的交付物在页面下方展示，可查看证据、编辑并保存到项目历史。</li><li><b>演示与真实结果：</b>演示数据会明确标记；只有工作流真实返回的内容才会作为真实交付物保存。</li><li><b>保护信息：</b>请勿输入未经授权的个人信息、商业秘密或生产凭证。</li></ol></div></div> }
