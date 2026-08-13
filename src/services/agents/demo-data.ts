/**
 * Demo Mode 内置演示数据：软膜天花（建筑装饰材料）× 3 供应商。
 * 数据结构与真实 Agent 输出完全一致，未来可直接替换。
 */
import {
  ComparisonMetric,
  ComplianceCheck,
  Evidence,
  NormalizedParameter,
  Parameter,
  Specification,
  Supplier,
  SupplierScore,
  WorkspaceDocument,
} from "@/types/domain";

export const DEMO_PROJECT_NAME = "中东商业中庭软膜天花项目（Demo）";
export const DEMO_PRODUCT_CATEGORY = "软膜天花 / 建筑装饰材料";

/* ---------------- 供应商 ---------------- */

export const DEMO_SUPPLIERS: Supplier[] = [
  { id: "sup-a", name: "诺华建材 NovaCeil Materials", shortName: "供应商 A", country: "中国 · 广州", model: "NC-A240" },
  { id: "sup-b", name: "晟辉膜业 BrightSpan Membrane", shortName: "供应商 B", country: "中国 · 佛山", model: "BS-F200" },
  { id: "sup-c", name: "宝丽特 PolyTex Europe", shortName: "供应商 C", country: "土耳其 · 伊斯坦布尔", model: "PT-U260" },
];

/* ---------------- 演示文件 ---------------- */

export const DEMO_SUPPLIER_DOCUMENTS: WorkspaceDocument[] = [
  { id: "doc-a1", name: "Supplier_A_Datasheet.pdf", fileType: "PDF", sizeKB: 2380, kind: "supplier", supplierId: "sup-a", supplierName: "诺华建材 NovaCeil", status: "pending", isDemo: true },
  { id: "doc-a2", name: "Supplier_A_Certificates.pdf", fileType: "PDF", sizeKB: 4120, kind: "supplier", supplierId: "sup-a", supplierName: "诺华建材 NovaCeil", status: "pending", isDemo: true },
  { id: "doc-b1", name: "Supplier_B_Datasheet.pdf", fileType: "PDF", sizeKB: 1860, kind: "supplier", supplierId: "sup-b", supplierName: "晟辉膜业 BrightSpan", status: "pending", isDemo: true },
  { id: "doc-b2", name: "Supplier_B_Quotation.xlsx", fileType: "Excel", sizeKB: 96, kind: "supplier", supplierId: "sup-b", supplierName: "晟辉膜业 BrightSpan", status: "pending", isDemo: true },
  { id: "doc-c1", name: "Supplier_C_TechSpec.docx", fileType: "Word", sizeKB: 742, kind: "supplier", supplierId: "sup-c", supplierName: "宝丽特 PolyTex", status: "pending", isDemo: true },
  { id: "doc-c2", name: "Supplier_C_Company_Profile.pdf", fileType: "PDF", sizeKB: 3540, kind: "supplier", supplierId: "sup-c", supplierName: "宝丽特 PolyTex", status: "pending", isDemo: true },
];

export const DEMO_SPEC_DOCUMENTS: WorkspaceDocument[] = [
  { id: "spec-1", name: "Project_Specification.pdf", fileType: "PDF", sizeKB: 5620, kind: "specification", status: "pending", isDemo: true },
  { id: "spec-2", name: "EN_13501-1_Extract.pdf", fileType: "PDF", sizeKB: 880, kind: "specification", status: "pending", isDemo: true },
  { id: "spec-3", name: "Client_Requirements.docx", fileType: "Word", sizeKB: 214, kind: "specification", status: "pending", isDemo: true },
  { id: "spec-4", name: "Tender_Addendum_02.pdf", fileType: "PDF", sizeKB: 460, kind: "specification", status: "pending", isDemo: true },
];

export const DEMO_SPECIFICATIONS: Specification[] = [
  { id: "sp-1", documentName: "Project_Specification.pdf", title: "项目技术规范（Interior Finishes）", type: "项目规范" },
  { id: "sp-2", documentName: "EN_13501-1_Extract.pdf", title: "EN 13501-1 建筑制品燃烧性能分级（摘录）", type: "国际标准" },
  { id: "sp-3", documentName: "Client_Requirements.docx", title: "业主补充技术要求", type: "客户要求" },
  { id: "sp-4", documentName: "Tender_Addendum_02.pdf", title: "招标补充文件 02", type: "招标文件" },
];

/* ---------------- Evidence 快捷构造 ---------------- */

function ev(
  sourceDocument: string,
  page: number | null,
  section: string,
  originalText: string,
  extractedValue: string,
  confidence: number
): Evidence {
  return { sourceDocument, page, section, originalText, extractedValue, confidence };
}

/* ---------------- 参数提取结果 ---------------- */

export const DEMO_PARAMETERS: Parameter[] = [
  {
    key: "model",
    label: "产品型号",
    group: "基础",
    values: {
      "sup-a": { result: "NC-A240", status: "ok", confidence: 99, evidence: [ev("Supplier_A_Datasheet.pdf", 1, "1. Product Overview", "Model: NC-A240 Premium Stretch Ceiling Membrane", "NC-A240", 99)] },
      "sup-b": { result: "BS-F200", status: "ok", confidence: 99, evidence: [ev("Supplier_B_Datasheet.pdf", 1, "封面", "BS-F200 柔性软膜天花系列", "BS-F200", 99)] },
      "sup-c": { result: "PT-U260", status: "ok", confidence: 98, evidence: [ev("Supplier_C_TechSpec.docx", 1, "Product Identification", "Product Code: PT-U260 UltraFlex Membrane", "PT-U260", 98)] },
    },
  },
  {
    key: "price",
    label: "价格（单价）",
    group: "基础",
    values: {
      "sup-a": { result: "USD 12.5 / ㎡", status: "ok", confidence: 97, evidence: [ev("Supplier_A_Datasheet.pdf", 11, "8. Commercial Terms", "Unit Price: USD 12.50 per square meter (FOB Guangzhou)", "USD 12.5 / ㎡", 97)] },
      "sup-b": { result: "¥68 / ㎡", status: "ok", confidence: 96, evidence: [ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "单价：￥68.00/平方米（出厂价）", "¥68 / ㎡", 96)] },
      "sup-c": { result: "€11.8 / ㎡", status: "ok", confidence: 95, evidence: [ev("Supplier_C_TechSpec.docx", 6, "Pricing", "EUR 11.80 / m² (EXW Istanbul)", "€11.8 / ㎡", 95)] },
    },
  },
  {
    key: "weight",
    label: "单卷重量",
    group: "基础",
    values: {
      "sup-a": { result: "18 kg", status: "ok", confidence: 96, evidence: [ev("Supplier_A_Datasheet.pdf", 8, "6. Packing & Logistics", "Net Weight: 18 kg per roll", "18 kg", 96)] },
      "sup-b": {
        result: "20 kg / 22 kg（冲突）",
        status: "conflict",
        confidence: 55,
        note: "PDF 与 Excel 中的重量不一致，需要人工确认，AI 不自动选择。",
        evidence: [
          ev("Supplier_B_Datasheet.pdf", 5, "包装参数", "单卷净重：20kg", "20 kg", 94),
          ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "净重 22kg/卷（含内衬管）", "22 kg", 92),
        ],
      },
      "sup-c": { result: "17 kg", status: "ok", confidence: 95, evidence: [ev("Supplier_C_TechSpec.docx", 4, "Packaging", "Roll net weight: 17 kg", "17 kg", 95)] },
    },
  },
  {
    key: "width",
    label: "幅宽",
    group: "基础",
    values: {
      "sup-a": { result: "2000 mm", status: "ok", confidence: 97, evidence: [ev("Supplier_A_Datasheet.pdf", 3, "2. Technical Data", "Standard Width: 2000 mm", "2000 mm", 97)] },
      "sup-b": { result: "2 m", status: "ok", confidence: 97, evidence: [ev("Supplier_B_Datasheet.pdf", 2, "技术参数表", "标准幅宽：2米", "2 m", 97)] },
      "sup-c": { result: "200 cm", status: "ok", confidence: 96, evidence: [ev("Supplier_C_TechSpec.docx", 2, "Technical Data", "Width: 200 cm", "200 cm", 96)] },
    },
  },
  {
    key: "arealWeight",
    label: "面密度",
    group: "性能",
    values: {
      "sup-a": { result: "320 g/㎡", status: "ok", confidence: 95, evidence: [ev("Supplier_A_Datasheet.pdf", 3, "2. Technical Data", "Surface density: 320 g/m²", "320 g/㎡", 95)] },
      "sup-b": { result: "0.35 kg/㎡", status: "ok", confidence: 94, evidence: [ev("Supplier_B_Datasheet.pdf", 2, "技术参数表", "面密度 0.35kg/m2", "0.35 kg/㎡", 94)] },
      "sup-c": {
        result: "0.30（单位缺失）",
        status: "review",
        confidence: 48,
        note: "原文未标注单位，无法确定是 kg/㎡ 还是 g/c㎡，AI 不进行猜测。",
        evidence: [ev("Supplier_C_TechSpec.docx", 2, "Technical Data", "Areal weight: 0.30", "0.30", 48)],
      },
    },
  },
  {
    key: "thickness",
    label: "厚度",
    group: "性能",
    values: {
      "sup-a": { result: "0.25 mm", status: "ok", confidence: 96, evidence: [ev("Supplier_A_Datasheet.pdf", 3, "2. Technical Data", "Thickness: 0.25 mm (±0.02)", "0.25 mm", 96)] },
      "sup-b": { result: "0.22 mm", status: "ok", confidence: 95, evidence: [ev("Supplier_B_Datasheet.pdf", 2, "技术参数表", "膜厚 0.22mm", "0.22 mm", 95)] },
      "sup-c": { result: "0.26 mm", status: "ok", confidence: 94, evidence: [ev("Supplier_C_TechSpec.docx", 2, "Technical Data", "Membrane thickness 0.26 mm", "0.26 mm", 94)] },
    },
  },
  {
    key: "material",
    label: "材质",
    group: "性能",
    values: {
      "sup-a": { result: "PVC 软膜（无镉配方）", status: "ok", confidence: 95, evidence: [ev("Supplier_A_Datasheet.pdf", 2, "1. Product Overview", "Material: cadmium-free PVC membrane", "PVC 软膜（无镉配方）", 95)] },
      "sup-b": { result: "PVC 软膜", status: "ok", confidence: 95, evidence: [ev("Supplier_B_Datasheet.pdf", 1, "产品说明", "材质：聚氯乙烯（PVC）软膜", "PVC 软膜", 95)] },
      "sup-c": { result: "PVC 软膜（B 类回收料声明）", status: "review", confidence: 70, note: "原文提及部分回收料，成分比例未披露。", evidence: [ev("Supplier_C_TechSpec.docx", 3, "Material", "PVC membrane, partially recycled content (grade B)", "PVC 软膜（含回收料）", 70)] },
    },
  },
  {
    key: "fireRating",
    label: "防火等级",
    group: "合规",
    values: {
      "sup-a": { result: "A1（EN 13501-1）", status: "ok", confidence: 98, evidence: [ev("Supplier_A_Certificates.pdf", 12, "Fire Test Report", "Classification: A1 according to EN 13501-1", "A1", 98)] },
      "sup-b": { result: "B1（GB 8624）", status: "ok", confidence: 96, evidence: [ev("Supplier_B_Datasheet.pdf", 3, "检测信息", "燃烧性能等级：B1 级（GB 8624-2012）", "B1", 96)] },
      "sup-c": { result: "A1（EN 13501-1）", status: "ok", confidence: 97, evidence: [ev("Supplier_C_TechSpec.docx", 3, "Certificates", "Fire Rating: A1 (EN 13501-1)", "A1", 97)] },
    },
  },
  {
    key: "voc",
    label: "VOC 排放",
    group: "合规",
    values: {
      "sup-a": { result: "28 µg/m³（28 天）", status: "ok", confidence: 95, evidence: [ev("Supplier_A_Certificates.pdf", 18, "VOC Emission Test", "TVOC after 28 days: 28 µg/m³", "28 µg/m³", 95)] },
      "sup-b": { result: "未提供", status: "missing", confidence: 90, note: "资料中未找到 VOC 检测数据。", evidence: [] },
      "sup-c": { result: "35 µg/m³（28 天）", status: "ok", confidence: 93, evidence: [ev("Supplier_C_TechSpec.docx", 3, "Emissions", "TVOC (28d): 35 µg/m³", "35 µg/m³", 93)] },
    },
  },
  {
    key: "certification",
    label: "产品认证",
    group: "合规",
    values: {
      "sup-a": { result: "CE（公告机构）+ EN 14716", status: "ok", confidence: 97, evidence: [ev("Supplier_A_Certificates.pdf", 2, "CE Certificate", "CE Certificate No. 0086-CPR-2024-1187, EN 14716", "CE + EN 14716", 97)] },
      "sup-b": { result: "CE（自我声明）", status: "review", confidence: 74, note: "仅提供自我声明 DoC，未见公告机构证书。", evidence: [ev("Supplier_B_Datasheet.pdf", 4, "认证信息", "本产品符合 CE 要求（企业自我声明）", "CE 自我声明", 74)] },
      "sup-c": { result: "UL（GREENGUARD）+ CE", status: "ok", confidence: 95, evidence: [ev("Supplier_C_TechSpec.docx", 3, "Certificates", "UL GREENGUARD Gold; CE marking per EN 14716", "UL + CE", 95)] },
    },
  },
  {
    key: "warranty",
    label: "质保期",
    group: "合规",
    values: {
      "sup-a": { result: "10 年", status: "ok", confidence: 96, evidence: [ev("Supplier_A_Datasheet.pdf", 10, "7. Warranty", "Warranty period: 10 years", "10 年", 96)] },
      "sup-b": { result: "8 年", status: "ok", confidence: 95, evidence: [ev("Supplier_B_Datasheet.pdf", 6, "质保", "提供 8 年质量保证", "8 年", 95)] },
      "sup-c": { result: "12 年", status: "ok", confidence: 95, evidence: [ev("Supplier_C_TechSpec.docx", 5, "Warranty", "12-year limited warranty", "12 年", 95)] },
    },
  },
  {
    key: "companyQualification",
    label: "企业资质",
    group: "企业",
    values: {
      "sup-a": { result: "ISO 9001 / ISO 14001", status: "ok", confidence: 96, evidence: [ev("Supplier_A_Certificates.pdf", 25, "Company Certificates", "ISO 9001:2015, ISO 14001:2015 certified", "ISO 9001 / 14001", 96)] },
      "sup-b": { result: "ISO 9001", status: "ok", confidence: 94, evidence: [ev("Supplier_B_Datasheet.pdf", 7, "企业介绍", "已通过 ISO 9001 质量管理体系认证", "ISO 9001", 94)] },
      "sup-c": { result: "ISO 9001 / ISO 45001", status: "ok", confidence: 95, evidence: [ev("Supplier_C_Company_Profile.pdf", 4, "Certifications", "ISO 9001, ISO 45001", "ISO 9001 / 45001", 95)] },
    },
  },
  {
    key: "overseasExperience",
    label: "海外项目经验",
    group: "企业",
    values: {
      "sup-a": { result: "有（迪拜、新加坡商业项目）", status: "ok", confidence: 93, evidence: [ev("Supplier_A_Datasheet.pdf", 9, "Reference Projects", "Dubai Marina Mall (2022), Singapore Jewel Annex (2023)", "有", 93)] },
      "sup-b": { result: "无", status: "ok", confidence: 91, evidence: [ev("Supplier_B_Datasheet.pdf", 7, "企业介绍", "项目案例均为国内商业与酒店项目", "无", 91)] },
      "sup-c": { result: "有（欧洲、中东多个项目）", status: "ok", confidence: 94, evidence: [ev("Supplier_C_Company_Profile.pdf", 8, "References", "Projects delivered in Germany, UAE, Qatar", "有", 94)] },
    },
  },
  {
    key: "leadTime",
    label: "交付周期",
    group: "供应",
    values: {
      "sup-a": { result: "25 天", status: "ok", confidence: 94, evidence: [ev("Supplier_A_Datasheet.pdf", 11, "8. Commercial Terms", "Lead time: 25 days after order confirmation", "25 天", 94)] },
      "sup-b": { result: "15 天", status: "ok", confidence: 95, evidence: [ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "交期：15 天", "15 天", 95)] },
      "sup-c": { result: "35 天", status: "ok", confidence: 93, evidence: [ev("Supplier_C_TechSpec.docx", 6, "Delivery", "Lead time 35 days EXW", "35 天", 93)] },
    },
  },
  {
    key: "moq",
    label: "MOQ（最小起订量）",
    group: "供应",
    values: {
      "sup-a": { result: "500 ㎡", status: "ok", confidence: 94, evidence: [ev("Supplier_A_Datasheet.pdf", 11, "8. Commercial Terms", "MOQ: 500 m²", "500 ㎡", 94)] },
      "sup-b": { result: "300 ㎡", status: "ok", confidence: 94, evidence: [ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "最小起订量 300 平方米", "300 ㎡", 94)] },
      "sup-c": { result: "1000 ㎡", status: "ok", confidence: 93, evidence: [ev("Supplier_C_TechSpec.docx", 6, "Commercial", "Minimum order quantity: 1,000 m²", "1000 ㎡", 93)] },
    },
  },
];

/* ---------------- 参数归一化 ---------------- */

export const DEMO_NORMALIZED: NormalizedParameter[] = [
  {
    key: "width",
    label: "幅宽",
    rule: "长度单位统一换算为米（mm ÷ 1000，cm ÷ 100）",
    targetUnit: "m",
    entries: [
      { supplierId: "sup-a", originalValue: "2000 mm", normalizedValue: "2 m", status: "ok" },
      { supplierId: "sup-b", originalValue: "2 m", normalizedValue: "2 m", status: "ok" },
      { supplierId: "sup-c", originalValue: "200 cm", normalizedValue: "2 m", status: "ok" },
    ],
  },
  {
    key: "price",
    label: "价格（单价）",
    rule: "货币统一换算为 USD（演示汇率：1 USD = 7.23 CNY，1 EUR = 1.09 USD）",
    targetUnit: "USD/㎡",
    entries: [
      { supplierId: "sup-a", originalValue: "USD 12.5 / ㎡", normalizedValue: "12.50 USD/㎡", status: "ok" },
      { supplierId: "sup-b", originalValue: "¥68 / ㎡", normalizedValue: "9.41 USD/㎡", status: "ok" },
      { supplierId: "sup-c", originalValue: "€11.8 / ㎡", normalizedValue: "12.86 USD/㎡", status: "ok" },
    ],
  },
  {
    key: "arealWeight",
    label: "面密度",
    rule: "重量单位统一换算为 g/㎡（kg × 1000）",
    targetUnit: "g/㎡",
    entries: [
      { supplierId: "sup-a", originalValue: "320 g/㎡", normalizedValue: "320 g/㎡", status: "ok" },
      { supplierId: "sup-b", originalValue: "0.35 kg/㎡", normalizedValue: "350 g/㎡", status: "ok" },
      {
        supplierId: "sup-c",
        originalValue: "0.30（单位缺失）",
        normalizedValue: "待确认",
        status: "review",
        note: "无法确定参数单位，不进行自动猜测，已列入待确认事项。",
      },
    ],
  },
  {
    key: "weight",
    label: "单卷重量",
    rule: "重量单位统一为 kg",
    targetUnit: "kg",
    entries: [
      { supplierId: "sup-a", originalValue: "18 kg", normalizedValue: "18 kg", status: "ok" },
      {
        supplierId: "sup-b",
        originalValue: "20 kg（PDF）/ 22 kg（Excel）",
        normalizedValue: "待确认",
        status: "conflict",
        note: "参数冲突：两个来源数值不一致，需要人工确认，AI 不自动选择。",
      },
      { supplierId: "sup-c", originalValue: "17 kg", normalizedValue: "17 kg", status: "ok" },
    ],
  },
];

/* ---------------- 横向比较 ---------------- */

export const DEMO_COMPARISON: ComparisonMetric[] = [
  {
    key: "price",
    label: "价格",
    direction: "lower-better",
    directionLabel: "越低越好",
    values: { "sup-a": 75, "sup-b": 100, "sup-c": 73 },
    displayValues: { "sup-a": "12.50 USD/㎡", "sup-b": "9.41 USD/㎡", "sup-c": "12.86 USD/㎡" },
  },
  {
    key: "compliance",
    label: "合规性",
    direction: "higher-better",
    directionLabel: "越高越好",
    values: { "sup-a": 95, "sup-b": 58, "sup-c": 88 },
    displayValues: { "sup-a": "A1 + CE(公告机构) + VOC 报告", "sup-b": "B1 + CE 自我声明，VOC 缺失", "sup-c": "A1 + UL + CE" },
  },
  {
    key: "company",
    label: "企业特性",
    direction: "higher-better",
    directionLabel: "越高越好",
    values: { "sup-a": 90, "sup-b": 62, "sup-c": 92 },
    displayValues: { "sup-a": "双体系认证 + 海外经验", "sup-b": "ISO 9001，无海外经验", "sup-c": "双体系认证 + 欧洲中东经验" },
  },
  {
    key: "performance",
    label: "产品性能",
    direction: "higher-better",
    directionLabel: "越高越好",
    values: { "sup-a": 93, "sup-b": 80, "sup-c": 84 },
    displayValues: { "sup-a": "0.25mm / 无镉配方", "sup-b": "0.22mm / 常规配方", "sup-c": "0.26mm / 含回收料待确认" },
  },
  {
    key: "logistics",
    label: "重量 / 运输",
    direction: "project-dependent",
    directionLabel: "结合项目需求判断",
    values: { "sup-a": 85, "sup-b": 60, "sup-c": 88 },
    displayValues: { "sup-a": "18 kg/卷，海运包装成熟", "sup-b": "20/22 kg 冲突待确认", "sup-c": "17 kg/卷，欧线运输经验" },
  },
  {
    key: "supply",
    label: "供应能力",
    direction: "higher-better",
    directionLabel: "越高越好",
    values: { "sup-a": 91, "sup-b": 84, "sup-c": 72 },
    displayValues: { "sup-a": "25 天 / MOQ 500㎡", "sup-b": "15 天 / MOQ 300㎡", "sup-c": "35 天 / MOQ 1000㎡" },
  },
];

/* ---------------- 六维评分 ---------------- */

export const DEMO_SCORES: SupplierScore[] = [
  {
    supplierId: "sup-a",
    overall: 92,
    dimensions: [
      {
        dimension: "price",
        score: 88,
        confidence: 92,
        reasons: [
          { type: "positive", text: "单价 12.50 USD/㎡，处于三家中间水平" },
          { type: "positive", text: "FOB 报价包含出口包装，综合采购成本可控" },
          { type: "warning", text: "略高于供应商 B（9.41 USD/㎡）" },
        ],
        evidence: [ev("Supplier_A_Datasheet.pdf", 11, "8. Commercial Terms", "Unit Price: USD 12.50 per square meter (FOB Guangzhou)", "USD 12.5 / ㎡", 97)],
      },
      {
        dimension: "compliance",
        score: 95,
        confidence: 95,
        reasons: [
          { type: "positive", text: "提供 EN 13501-1 A1 级防火测试报告" },
          { type: "positive", text: "CE 证书由公告机构签发（EN 14716）" },
          { type: "positive", text: "提供 28 天 VOC 检测报告" },
          { type: "warning", text: "缺少声学测试报告（项目要求项）" },
        ],
        evidence: [
          ev("Supplier_A_Certificates.pdf", 12, "Fire Test Report", "Classification: A1 according to EN 13501-1", "A1", 98),
          ev("Supplier_A_Certificates.pdf", 2, "CE Certificate", "CE Certificate No. 0086-CPR-2024-1187, EN 14716", "CE + EN 14716", 97),
        ],
      },
      {
        dimension: "company",
        score: 90,
        confidence: 91,
        reasons: [
          { type: "positive", text: "ISO 9001 + ISO 14001 双体系认证" },
          { type: "positive", text: "有迪拜、新加坡商业项目交付记录" },
          { type: "warning", text: "海外项目数量少于供应商 C" },
        ],
        evidence: [ev("Supplier_A_Datasheet.pdf", 9, "Reference Projects", "Dubai Marina Mall (2022), Singapore Jewel Annex (2023)", "有", 93)],
      },
      {
        dimension: "performance",
        score: 93,
        confidence: 93,
        reasons: [
          { type: "positive", text: "0.25mm 膜厚，尺寸公差 ±0.02mm" },
          { type: "positive", text: "无镉配方，材料声明完整" },
          { type: "positive", text: "技术参数与项目场景匹配度高" },
        ],
        evidence: [ev("Supplier_A_Datasheet.pdf", 3, "2. Technical Data", "Thickness: 0.25 mm (±0.02)", "0.25 mm", 96)],
      },
      {
        dimension: "logistics",
        score: 85,
        confidence: 90,
        reasons: [
          { type: "positive", text: "18 kg/卷，装卸与吊运难度低" },
          { type: "positive", text: "出口海运包装方案成熟" },
          { type: "warning", text: "海运周期需与项目工期核对" },
        ],
        evidence: [ev("Supplier_A_Datasheet.pdf", 8, "6. Packing & Logistics", "Net Weight: 18 kg per roll", "18 kg", 96)],
      },
      {
        dimension: "supply",
        score: 91,
        confidence: 92,
        reasons: [
          { type: "positive", text: "交付周期 25 天，满足项目采购计划" },
          { type: "positive", text: "MOQ 500㎡，与项目用量匹配" },
          { type: "positive", text: "支持分批发货与驻场技术支持" },
        ],
        evidence: [ev("Supplier_A_Datasheet.pdf", 11, "8. Commercial Terms", "Lead time: 25 days after order confirmation", "25 天", 94)],
      },
    ],
  },
  {
    supplierId: "sup-b",
    overall: 74,
    dimensions: [
      {
        dimension: "price",
        score: 95,
        confidence: 93,
        reasons: [
          { type: "positive", text: "单价 9.41 USD/㎡，三家最低" },
          { type: "warning", text: "出厂价报价，需另计出口包装与运费" },
        ],
        evidence: [ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "单价：￥68.00/平方米（出厂价）", "¥68 / ㎡", 96)],
      },
      {
        dimension: "compliance",
        score: 58,
        confidence: 88,
        reasons: [
          { type: "warning", text: "防火等级 B1（GB 8624），未提供 EN 13501-1 报告" },
          { type: "warning", text: "CE 仅为企业自我声明，无公告机构证书" },
          { type: "warning", text: "未提供 VOC 检测数据" },
        ],
        evidence: [ev("Supplier_B_Datasheet.pdf", 3, "检测信息", "燃烧性能等级：B1 级（GB 8624-2012）", "B1", 96)],
      },
      {
        dimension: "company",
        score: 62,
        confidence: 86,
        reasons: [
          { type: "positive", text: "ISO 9001 认证" },
          { type: "warning", text: "无海外项目交付经验" },
        ],
        evidence: [ev("Supplier_B_Datasheet.pdf", 7, "企业介绍", "项目案例均为国内商业与酒店项目", "无", 91)],
      },
      {
        dimension: "performance",
        score: 80,
        confidence: 89,
        reasons: [
          { type: "positive", text: "0.22mm 膜厚，重量轻" },
          { type: "warning", text: "常规配方，未提供重金属检测" },
        ],
        evidence: [ev("Supplier_B_Datasheet.pdf", 2, "技术参数表", "膜厚 0.22mm", "0.22 mm", 95)],
      },
      {
        dimension: "logistics",
        score: 60,
        confidence: 70,
        reasons: [
          { type: "warning", text: "单卷重量存在 20/22 kg 数据冲突，待人工确认" },
          { type: "warning", text: "缺少海外运输包装说明" },
        ],
        evidence: [
          ev("Supplier_B_Datasheet.pdf", 5, "包装参数", "单卷净重：20kg", "20 kg", 94),
          ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "净重 22kg/卷（含内衬管）", "22 kg", 92),
        ],
      },
      {
        dimension: "supply",
        score: 84,
        confidence: 90,
        reasons: [
          { type: "positive", text: "交付周期 15 天，三家最快" },
          { type: "positive", text: "MOQ 300㎡，灵活度高" },
          { type: "warning", text: "未说明海外项目供货与售后配合方式" },
        ],
        evidence: [ev("Supplier_B_Quotation.xlsx", 1, "报价单 Sheet1", "交期：15 天", "15 天", 95)],
      },
    ],
  },
  {
    supplierId: "sup-c",
    overall: 85,
    dimensions: [
      {
        dimension: "price",
        score: 78,
        confidence: 91,
        reasons: [
          { type: "warning", text: "单价 12.86 USD/㎡，三家最高" },
          { type: "positive", text: "欧洲发货，至中东运输成本低" },
        ],
        evidence: [ev("Supplier_C_TechSpec.docx", 6, "Pricing", "EUR 11.80 / m² (EXW Istanbul)", "€11.8 / ㎡", 95)],
      },
      {
        dimension: "compliance",
        score: 88,
        confidence: 92,
        reasons: [
          { type: "positive", text: "EN 13501-1 A1 级防火" },
          { type: "positive", text: "UL GREENGUARD Gold + CE" },
          { type: "warning", text: "回收料成分声明不完整" },
        ],
        evidence: [ev("Supplier_C_TechSpec.docx", 3, "Certificates", "Fire Rating: A1 (EN 13501-1)", "A1", 97)],
      },
      {
        dimension: "company",
        score: 92,
        confidence: 93,
        reasons: [
          { type: "positive", text: "ISO 9001 + ISO 45001" },
          { type: "positive", text: "德国、阿联酋、卡塔尔项目经验丰富" },
        ],
        evidence: [ev("Supplier_C_Company_Profile.pdf", 8, "References", "Projects delivered in Germany, UAE, Qatar", "有", 94)],
      },
      {
        dimension: "performance",
        score: 84,
        confidence: 85,
        reasons: [
          { type: "positive", text: "0.26mm 膜厚，抗拉强度高" },
          { type: "warning", text: "面密度单位缺失，待人工确认" },
          { type: "warning", text: "含回收料，长期性能需评估" },
        ],
        evidence: [ev("Supplier_C_TechSpec.docx", 2, "Technical Data", "Areal weight: 0.30", "0.30", 48)],
      },
      {
        dimension: "logistics",
        score: 88,
        confidence: 91,
        reasons: [
          { type: "positive", text: "17 kg/卷，三家最轻" },
          { type: "positive", text: "伊斯坦布尔发货，中东项目运输周期短" },
        ],
        evidence: [ev("Supplier_C_TechSpec.docx", 4, "Packaging", "Roll net weight: 17 kg", "17 kg", 95)],
      },
      {
        dimension: "supply",
        score: 72,
        confidence: 89,
        reasons: [
          { type: "warning", text: "交付周期 35 天，三家最长" },
          { type: "warning", text: "MOQ 1000㎡，高于项目单批用量" },
        ],
        evidence: [ev("Supplier_C_TechSpec.docx", 6, "Commercial", "Minimum order quantity: 1,000 m²", "1000 ㎡", 93)],
      },
    ],
  },
];

export const DEMO_RECOMMENDED_SUPPLIER_ID = "sup-a";

export const DEMO_SELECTION_ADVANTAGES = [
  "EN 13501-1 A1 级防火 + 公告机构 CE 证书，合规资料在三家中最完整",
  "提供 28 天 VOC 检测报告，满足室内环境要求",
  "有迪拜、新加坡海外商业项目交付经验",
  "交付周期 25 天、MOQ 500㎡，与项目采购计划匹配",
];

export const DEMO_SELECTION_RISKS = [
  "缺少声学测试报告，需在合规审核阶段重点核查",
  "单价高于供应商 B 约 33%，需结合总成本评估",
];

export const DEMO_SELECTION_PENDING = [
  "供应商 A 声学测试报告待补充",
  "供应商 B 单卷重量 20/22 kg 冲突未影响选型，但记录备查",
  "供应商 C 面密度单位缺失（未选用，记录备查）",
];

/* ---------------- 合规检查清单 ---------------- */

export const DEMO_COMPLIANCE_CHECKS: ComplianceCheck[] = [
  {
    id: "chk-01",
    requirementId: "req-01",
    name: "防火等级",
    category: "消防安全",
    requiredValue: "A1（EN 13501-1）",
    actualValue: "A1（EN 13501-1）",
    aiStatus: "PASS",
    confidence: 98,
    risk: "low",
    aiJudgement: "产品防火测试报告显示 A1 级，满足规范第 6.2.1 条要求。",
    specEvidence: [ev("Project_Specification.pdf", 23, "6.2.1 Fire Performance", "Stretch ceiling membranes shall achieve Class A1 reaction to fire in accordance with EN 13501-1.", "A1", 98)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 12, "Fire Test Report", "Classification: A1 according to EN 13501-1", "A1", 98)],
    resolved: false,
  },
  {
    id: "chk-02",
    requirementId: "req-02",
    name: "VOC 排放限值",
    category: "环境健康",
    requiredValue: "TVOC ≤ 50 µg/m³（28 天）",
    actualValue: "28 µg/m³（28 天）",
    aiStatus: "PASS",
    confidence: 95,
    risk: "low",
    aiJudgement: "实测 28 µg/m³ 低于限值 50 µg/m³，满足要求。",
    specEvidence: [ev("Client_Requirements.docx", 3, "2.4 Indoor Air Quality", "TVOC emission after 28 days shall not exceed 50 µg/m³.", "≤ 50 µg/m³", 96)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 18, "VOC Emission Test", "TVOC after 28 days: 28 µg/m³", "28 µg/m³", 95)],
    resolved: false,
  },
  {
    id: "chk-03",
    requirementId: "req-03",
    name: "CE 认证",
    category: "认证要求",
    requiredValue: "Required（公告机构签发）",
    actualValue: "CE Certificate No. 0086-CPR-2024-1187",
    aiStatus: "PASS",
    confidence: 96,
    risk: "low",
    aiJudgement: "提供公告机构（NB 0086）签发的 CE 证书，满足要求。",
    specEvidence: [ev("Project_Specification.pdf", 25, "6.3 Certification", "Products shall bear CE marking issued through a notified body.", "CE Required", 96)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 2, "CE Certificate", "CE Certificate No. 0086-CPR-2024-1187, EN 14716", "CE 证书", 97)],
    resolved: false,
  },
  {
    id: "chk-04",
    requirementId: "req-04",
    name: "EN 14716 产品标准符合性",
    category: "产品标准",
    requiredValue: "符合 EN 14716（软膜天花）",
    actualValue: "CE 证书注明依据 EN 14716",
    aiStatus: "PASS",
    confidence: 93,
    risk: "low",
    aiJudgement: "CE 证书引用 EN 14716，判定符合产品标准要求。",
    specEvidence: [ev("Project_Specification.pdf", 24, "6.2.3 Product Standard", "Stretched ceilings shall conform to EN 14716.", "EN 14716", 95)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 2, "CE Certificate", "CE Certificate No. 0086-CPR-2024-1187, EN 14716", "EN 14716", 93)],
    resolved: false,
  },
  {
    id: "chk-05",
    requirementId: "req-05",
    name: "声学吸声测试报告",
    category: "声学性能",
    requiredValue: "Required（EN ISO 354 吸声系数报告）",
    actualValue: "缺失",
    aiStatus: "MISSING",
    confidence: 99,
    risk: "medium",
    aiJudgement: "供应商资料中未找到吸声测试报告。缺少证据 ≠ 不合规，判定为 MISSING，需补充资料后复核。",
    specEvidence: [ev("Project_Specification.pdf", 27, "6.4 Acoustic Performance", "Sound absorption test report per EN ISO 354 shall be submitted.", "EN ISO 354 报告 Required", 97)],
    productEvidence: [],
    suggestion: "要求供应商 A 补充 EN ISO 354 吸声测试报告，或安排第三方检测。",
    resolved: false,
  },
  {
    id: "chk-06",
    requirementId: "req-06",
    name: "REACH 高关注物质（SVHC）声明",
    category: "环境健康",
    requiredValue: "SVHC 含量 < 0.1% 并提供声明",
    actualValue: "材料声明未覆盖最新 SVHC 清单",
    aiStatus: "REVIEW",
    confidence: 72,
    risk: "medium",
    aiJudgement: "供应商提供了无镉声明，但声明日期早于最新 SVHC 清单更新，AI 无法确定是否覆盖全部物质，需人工审核。",
    specEvidence: [ev("Client_Requirements.docx", 4, "2.6 Chemical Compliance", "Materials shall comply with EU REACH; SVHC declaration required.", "REACH SVHC 声明", 94)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 20, "Material Declaration", "Cadmium-free formulation, declaration dated 2023-05.", "无镉声明（2023-05）", 72)],
    suggestion: "要求供应商更新 SVHC 声明至最新清单版本。",
    resolved: false,
  },
  {
    id: "chk-07",
    requirementId: "req-07",
    name: "质保期",
    category: "商务要求",
    requiredValue: "≥ 10 年",
    actualValue: "10 年",
    aiStatus: "PASS",
    confidence: 94,
    risk: "low",
    aiJudgement: "质保期 10 年，满足不低于 10 年的要求。",
    specEvidence: [ev("Client_Requirements.docx", 5, "3.1 Warranty", "Minimum warranty period: 10 years.", "≥ 10 年", 95)],
    productEvidence: [ev("Supplier_A_Datasheet.pdf", 10, "7. Warranty", "Warranty period: 10 years", "10 年", 96)],
    resolved: false,
  },
  {
    id: "chk-08",
    requirementId: "req-08",
    name: "防火等级适用规范确认",
    category: "消防安全",
    requiredValue: "规范 A：A1 / 招标补充文件：B1-s1,d0 可接受",
    actualValue: "产品为 A1",
    aiStatus: "REVIEW",
    confidence: 60,
    risk: "medium",
    aiJudgement: "检测到规范要求冲突：项目规范要求 A1，招标补充文件 02 注明 B1-s1,d0 可接受。AI 不自行判断优先级，请人工确认适用规范。产品本身为 A1，两种口径下均可满足。",
    specEvidence: [
      ev("Project_Specification.pdf", 23, "6.2.1 Fire Performance", "Stretch ceiling membranes shall achieve Class A1.", "A1", 98),
      ev("Tender_Addendum_02.pdf", 2, "Clarification 5", "Class B1-s1,d0 membranes are acceptable subject to engineer approval.", "B1-s1,d0 可接受", 90),
    ],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 12, "Fire Test Report", "Classification: A1 according to EN 13501-1", "A1", 98)],
    suggestion: "与业主/工程师确认招标补充文件 02 是否取代项目规范第 6.2.1 条。",
    resolved: false,
  },
  {
    id: "chk-09",
    requirementId: "req-09",
    name: "安装环境温度范围",
    category: "使用性能",
    requiredValue: "-10℃ ~ 50℃",
    actualValue: "0℃ ~ 45℃",
    aiStatus: "FAIL",
    confidence: 97,
    risk: "high",
    aiJudgement: "产品标称使用温度 0℃~45℃，无法覆盖规范要求的 -10℃~50℃ 范围，明确不满足要求。",
    specEvidence: [ev("Project_Specification.pdf", 26, "6.3.5 Service Conditions", "Membrane shall be suitable for service temperature from -10°C to +50°C.", "-10℃ ~ 50℃", 96)],
    productEvidence: [ev("Supplier_A_Datasheet.pdf", 4, "3. Service Conditions", "Operating temperature: 0°C to +45°C", "0℃ ~ 45℃", 97)],
    suggestion: "与供应商确认是否有低温配方型号，或向业主申请偏差（Deviation Request）说明中庭为恒温空调环境。",
    resolved: false,
  },
  {
    id: "chk-10",
    requirementId: "req-10",
    name: "抗 UV 老化性能",
    category: "使用性能",
    requiredValue: "氙灯老化 ≥ 2000 小时无明显变色",
    actualValue: "报告仅覆盖 1000 小时",
    aiStatus: "FAIL",
    confidence: 95,
    risk: "high",
    aiJudgement: "供应商提供的老化测试报告仅覆盖 1000 小时，低于规范要求的 2000 小时，明确不满足要求。",
    specEvidence: [ev("Client_Requirements.docx", 4, "2.5 Durability", "Xenon-arc weathering test: no significant discoloration after 2000 hours.", "≥ 2000 h", 94)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 22, "Weathering Test", "Xenon-arc exposure 1000 h: Grey scale rating 4-5.", "1000 h", 95)],
    suggestion: "要求供应商补做 2000 小时老化测试，或提供同配方产品的历史测试数据并经业主认可。",
    resolved: false,
  },
  {
    id: "chk-11",
    requirementId: "req-11",
    name: "甲醛释放等级",
    category: "环境健康",
    requiredValue: "E1 级",
    actualValue: "E1 级",
    aiStatus: "PASS",
    confidence: 96,
    risk: "low",
    aiJudgement: "检测报告显示甲醛释放满足 E1 级要求。",
    specEvidence: [ev("Client_Requirements.docx", 3, "2.4 Indoor Air Quality", "Formaldehyde emission class E1 or better.", "E1", 95)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 18, "VOC Emission Test", "Formaldehyde: class E1", "E1", 96)],
    resolved: false,
  },
  {
    id: "chk-12",
    requirementId: "req-12",
    name: "透光率（透光膜区域）",
    category: "光学性能",
    requiredValue: "≥ 75%",
    actualValue: "75%（标称值，测试条件未注明）",
    aiStatus: "REVIEW",
    confidence: 68,
    risk: "medium",
    aiJudgement: "标称透光率 75% 处于临界值，且未注明测试标准与光源条件，AI 无法确定是否满足，需人工审核。",
    specEvidence: [ev("Project_Specification.pdf", 28, "6.5 Translucent Zones", "Light transmittance of translucent membrane shall be no less than 75%.", "≥ 75%", 95)],
    productEvidence: [ev("Supplier_A_Datasheet.pdf", 5, "4. Optical Properties", "Light transmittance: 75% (typical)", "75%（标称）", 68)],
    suggestion: "要求供应商提供按 ASTM D1003 或等效标准的透光率检测报告。",
    resolved: false,
  },
  {
    id: "chk-13",
    requirementId: "req-13",
    name: "抗菌涂层要求",
    category: "特殊要求",
    requiredValue: "医疗功能区域需抗菌涂层（ISO 22196）",
    actualValue: "本项目为商业中庭，无医疗功能区域",
    aiStatus: "NOT_APPLICABLE",
    confidence: 90,
    risk: "low",
    aiJudgement: "该要求仅适用于医疗功能区域，当前项目范围为商业中庭，判定为不适用。",
    specEvidence: [ev("Client_Requirements.docx", 6, "4.2 Healthcare Zones", "Membranes in healthcare zones shall have antibacterial coating tested per ISO 22196.", "抗菌涂层（医疗区域）", 92)],
    productEvidence: [],
    resolved: false,
  },
  {
    id: "chk-14",
    requirementId: "req-14",
    name: "包装与 CE 标识",
    category: "认证要求",
    requiredValue: "包装与产品应带 CE 标识及批次信息",
    actualValue: "包装印刷 CE 标识与批次号",
    aiStatus: "PASS",
    confidence: 92,
    risk: "low",
    aiJudgement: "包装说明显示带 CE 标识与批次追溯信息，满足要求。",
    specEvidence: [ev("Project_Specification.pdf", 25, "6.3 Certification", "CE marking shall appear on product packaging with batch traceability.", "包装 CE 标识", 93)],
    productEvidence: [ev("Supplier_A_Datasheet.pdf", 8, "6. Packing & Logistics", "Each roll labelled with CE mark, batch number and production date.", "CE + 批次号", 92)],
    resolved: false,
  },
  {
    id: "chk-15",
    requirementId: "req-15",
    name: "防火测试报告（认可实验室）",
    category: "消防安全",
    requiredValue: "Required（ILAC/EA 认可实验室出具）",
    actualValue: "报告由认可实验室出具",
    aiStatus: "PASS",
    confidence: 97,
    risk: "low",
    aiJudgement: "防火测试报告由 EA 认可实验室出具，满足要求。",
    specEvidence: [ev("Project_Specification.pdf", 23, "6.2.2 Test Evidence", "Fire test reports shall be issued by an ILAC/EA accredited laboratory.", "认可实验室报告", 96)],
    productEvidence: [ev("Supplier_A_Certificates.pdf", 12, "Fire Test Report", "Issued by Warringtonfire (UKAS accredited lab No. 0249)", "认可实验室", 97)],
    resolved: false,
  },
  {
    id: "chk-16",
    requirementId: "req-16",
    name: "尺寸稳定性数据",
    category: "使用性能",
    requiredValue: "热循环后尺寸变化 ≤ 0.3%",
    actualValue: "缺失",
    aiStatus: "MISSING",
    confidence: 88,
    risk: "medium",
    aiJudgement: "供应商资料中未找到尺寸稳定性测试数据。缺少证据 ≠ 不合规，判定为 MISSING。",
    specEvidence: [ev("Project_Specification.pdf", 26, "6.3.6 Dimensional Stability", "Dimensional change after thermal cycling shall not exceed 0.3%.", "≤ 0.3%", 94)],
    productEvidence: [],
    suggestion: "要求供应商补充热循环尺寸稳定性测试数据。",
    resolved: false,
  },
];

/* ---------------- MAS 模板 ---------------- */

export const DEMO_MAS_TEMPLATE_NAME = "通用海外工程 MAS 模板 v1.0（可配置，不绑定特定国家法规体系）";

export function buildDemoMasSections(input: {
  projectName: string;
  productName: string;
  supplierName: string;
  model: string;
  overallScore: number;
  passCount: number;
  failCount: number;
  reviewCount: number;
  missingCount: number;
}) {
  return [
    {
      id: "mas-1",
      title: "1. 材料提交概述（Material Approval Submission）",
      content: `项目：${input.projectName}\n提交材料：${input.productName}\n供应商：${input.supplierName}\n型号：${input.model}\n提交目的：用于业主/顾问审批的材料合规性提交。`,
    },
    {
      id: "mas-2",
      title: "2. 产品与供应商信息",
      content: `产品类别：软膜天花 / 建筑装饰材料\n供应商：${input.supplierName}\n产品型号：${input.model}\n综合评分：${input.overallScore} / 100（六维评分详见附录）\n关键认证：CE（公告机构 NB 0086）、EN 14716、EN 13501-1 A1 防火测试报告。`,
    },
    {
      id: "mas-3",
      title: "3. 合规检查摘要",
      content: `检查项共 ${input.passCount + input.failCount + input.reviewCount + input.missingCount + 1} 条：PASS ${input.passCount}、FAIL ${input.failCount}、REVIEW ${input.reviewCount}、MISSING ${input.missingCount}、N/A 1。\n所有结论均附带规范来源与产品资料来源，可逐条追溯。`,
    },
    {
      id: "mas-4",
      title: "4. 风险与缓解措施",
      content: `1）安装环境温度范围不满足规范（FAIL）：建议申请偏差或更换低温配方型号。\n2）抗 UV 老化报告小时数不足（FAIL）：建议补做 2000 小时测试。\n3）声学测试报告与尺寸稳定性数据缺失（MISSING）：已要求供应商补充。\n4）REACH SVHC 声明版本较旧、透光率测试条件不明、防火规范口径冲突（REVIEW）：待人工确认。`,
    },
    {
      id: "mas-5",
      title: "5. 待人工确认事项",
      content: `1）招标补充文件 02 与项目规范防火等级口径冲突，需工程师确认适用规范。\n2）REACH SVHC 声明是否覆盖最新清单。\n3）透光率测试标准与条件。`,
    },
    {
      id: "mas-6",
      title: "6. 附件清单",
      content: `A. 产品技术资料（Supplier_A_Datasheet.pdf）\nB. 认证与测试报告（Supplier_A_Certificates.pdf）\nC. 产品参数对比表（阶段一输出）\nD. 合规检查清单（本工作台生成）\nE. 项目规范及客户要求文件索引。`,
    },
  ];
}
