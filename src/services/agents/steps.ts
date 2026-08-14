import type { AgentStep } from "@/types/workspace";

export const COMPARE_AGENT_STEPS: AgentStep[] = [
  { id: "upload", label: "文件已上传", status: "pending" },
  { id: "parse", label: "正在解析供应商资料", status: "pending" },
  { id: "extract", label: "正在提取产品参数", status: "pending" },
  { id: "certs", label: "正在识别认证和企业信息", status: "pending" },
  { id: "normalize", label: "正在统一参数单位", status: "pending" },
  { id: "compare", label: "正在进行产品横向比较", status: "pending" },
  { id: "score", label: "正在计算六维评分", status: "pending" },
];

export const COMPLIANCE_AGENT_STEPS: AgentStep[] = [
  { id: "import", label: "已导入选型结果", status: "pending" },
  { id: "parse_spec", label: "正在解析项目规范", status: "pending" },
  { id: "checklist", label: "正在生成检查清单", status: "pending" },
  { id: "check", label: "正在逐条合规核查", status: "pending" },
  { id: "evidence", label: "正在关联 Evidence 来源", status: "pending" },
  { id: "risk", label: "正在汇总风险项", status: "pending" },
];
