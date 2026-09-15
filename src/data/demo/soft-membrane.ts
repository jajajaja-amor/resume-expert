import type {
  CompareAnalysisResult,
  ComplianceAnalysisResult,
  ComplianceCheck,
  DocumentFile,
  NormalizedParameter,
  Parameter,
  Product,
  ProductScore,
  Requirement,
  SelectionResult,
  Supplier,
} from "@/types/workspace";

const now = () => new Date().toISOString();

export const DEMO_PROJECT = {
  id: "proj-demo-soft-membrane",
  name: "中东某酒店大堂软膜天花选型",
  region: "UAE / GCC",
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: now(),
};

export const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: "sup-a",
    name: "供应商 A · LuminaCeil",
    qualifications: ["ISO 9001", "ISO 14001", "出口资质"],
    overseasExperience: true,
    scale: "年产能 120 万㎡",
    notes: "欧洲与中东项目经验丰富",
  },
  {
    id: "sup-b",
    name: "供应商 B · SkyStretch",
    qualifications: ["ISO 9001"],
    overseasExperience: false,
    scale: "年产能 60 万㎡",
    notes: "国内项目为主，海外交付经验有限",
  },
  {
    id: "sup-c",
    name: "供应商 C · AeroFilm Intl",
    qualifications: ["ISO 9001", "ISO 45001", "UL 工厂认证"],
    overseasExperience: true,
    scale: "年产能 200 万㎡",
    notes: "北美与海湾地区供应能力强",
  },
];

export const DEMO_PRODUCT_DOCS: DocumentFile[] = [
  {
    id: "doc-a",
    name: "Supplier_A_LuminaCeil_Datasheet.pdf",
    type: "application/pdf",
    size: 2_450_000,
    supplierId: "sup-a",
    supplierName: "供应商 A · LuminaCeil",
    category: "product",
    parseStatus: "done",
    uploadedAt: now(),
  },
  {
    id: "doc-b",
    name: "Supplier_B_SkyStretch_Catalog.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 890_000,
    supplierId: "sup-b",
    supplierName: "供应商 B · SkyStretch",
    category: "product",
    parseStatus: "done",
    uploadedAt: now(),
  },
  {
    id: "doc-c",
    name: "Supplier_C_AeroFilm_Technical_Sheet.pdf",
    type: "application/pdf",
    size: 3_120_000,
    supplierId: "sup-c",
    supplierName: "供应商 C · AeroFilm Intl",
    category: "product",
    parseStatus: "done",
    uploadedAt: now(),
  },
];

export const DEMO_SPEC_DOCS: DocumentFile[] = [
  {
    id: "spec-1",
    name: "Project_Specification_Interior_Finishes.pdf",
    type: "application/pdf",
    size: 4_200_000,
    category: "specification",
    parseStatus: "done",
    uploadedAt: now(),
  },
  {
    id: "spec-2",
    name: "Client_Technical_Requirements.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 640_000,
    category: "specification",
    parseStatus: "done",
    uploadedAt: now(),
  },
];

function ev(
  doc: string,
  page: number,
  originalText: string,
  extractedValue: string,
  confidence: number,
  section?: string
) {
  return { sourceDocument: doc, page, section, originalText, extractedValue, confidence };
}

const productsBase: Omit<Product, "parameters">[] = [
  {
    id: "prod-a",
    supplierId: "sup-a",
    supplierName: "供应商 A · LuminaCeil",
    name: "软膜天花系统",
    model: "LC-SM-220",
    category: "建筑装饰材料 / 软膜天花",
    documentIds: ["doc-a"],
  },
  {
    id: "prod-b",
    supplierId: "sup-b",
    supplierName: "供应商 B · SkyStretch",
    name: "软膜天花系统",
    model: "SS-TX-180",
    category: "建筑装饰材料 / 软膜天花",
    documentIds: ["doc-b"],
  },
  {
    id: "prod-c",
    supplierId: "sup-c",
    supplierName: "供应商 C · AeroFilm Intl",
    name: "软膜天花系统",
    model: "AF-PRO-310",
    category: "建筑装饰材料 / 软膜天花",
    documentIds: ["doc-c"],
  },
];

const paramDefs: Array<{
  key: string;
  label: string;
  values: [string, string, string];
  units?: [string | undefined, string | undefined, string | undefined];
  pages: [number, number, number];
  originals: [string, string, string];
  confidences: [number, number, number];
  conflictOn?: "b";
}> = [
  {
    key: "model",
    label: "产品型号",
    values: ["LC-SM-220", "SS-TX-180", "AF-PRO-310"],
    pages: [2, 1, 3],
    originals: ["Model: LC-SM-220", "型号：SS-TX-180", "Product Code: AF-PRO-310"],
    confidences: [99, 98, 99],
  },
  {
    key: "price",
    label: "单价",
    values: ["¥186 /㎡", "¥142 /㎡", "$28 /㎡"],
    pages: [12, 1, 15],
    originals: [
      "Unit Price: CNY 186 per sqm",
      "报价：142 元/㎡",
      "FOB Price: USD 28 / sqm",
    ],
    confidences: [94, 96, 93],
  },
  {
    key: "weight",
    label: "重量",
    values: ["18 kg / 卷", "20 kg / 卷", "17 kg / 卷"],
    pages: [8, 1, 7],
    originals: ["Net Weight: 18 kg/roll", "重量：20kg/卷", "Weight: 17 kg per roll"],
    confidences: [96, 91, 95],
    conflictOn: "b",
  },
  {
    key: "thickness",
    label: "厚度",
    values: ["0.18 mm", "0.20 mm", "0.18 mm"],
    pages: [5, 1, 6],
    originals: ["Thickness: 0.18 mm", "厚度 0.2mm", "Film Thickness: 0.18mm"],
    confidences: [97, 95, 97],
  },
  {
    key: "width",
    label: "幅宽",
    values: ["2000 mm", "2 m", "200 cm"],
    units: ["mm", "m", "cm"],
    pages: [5, 1, 6],
    originals: ["Width: 2000 mm", "幅宽：2m", "Roll Width: 200 cm"],
    confidences: [98, 97, 96],
  },
  {
    key: "material",
    label: "材质",
    values: ["PVC + Polyester", "PVC", "PVC + Polyester FR"],
    pages: [4, 1, 4],
    originals: [
      "Material: PVC coated polyester",
      "材质：PVC",
      "Base Material: PVC + Polyester FR",
    ],
    confidences: [95, 94, 96],
  },
  {
    key: "fire_rating",
    label: "防火等级",
    values: ["A1", "B1", "A2-s1,d0"],
    pages: [9, 1, 10],
    originals: [
      "Fire Rating: A1 (EN 13501-1)",
      "防火等级：B1",
      "Reaction to Fire: A2-s1,d0",
    ],
    confidences: [97, 98, 96],
  },
  {
    key: "certification",
    label: "产品认证",
    values: ["CE, REACH", "CE", "CE, UL, REACH"],
    pages: [14, 1, 16],
    originals: [
      "Certifications: CE, REACH",
      "认证：CE",
      "Approvals: CE / UL / REACH",
    ],
    confidences: [96, 95, 97],
  },
  {
    key: "voc",
    label: "VOC",
    values: ["≤ 50 μg/m³", "未提供", "≤ 35 μg/m³"],
    pages: [11, 1, 12],
    originals: [
      "VOC Emission: ≤ 50 μg/m³",
      "（资料中未找到 VOC 指标）",
      "VOC: ≤ 35 μg/m³ (ISO 16000)",
    ],
    confidences: [93, 40, 94],
  },
  {
    key: "enterprise",
    label: "企业资质",
    values: ["ISO 9001 / 14001", "ISO 9001", "ISO 9001 / 45001 / UL Factory"],
    pages: [1, 1, 2],
    originals: [
      "Company Certs: ISO 9001, ISO 14001",
      "企业认证：ISO9001",
      "Factory: ISO 9001, ISO 45001, UL",
    ],
    confidences: [95, 94, 96],
  },
  {
    key: "overseas",
    label: "海外项目经验",
    values: ["有（中东 / 欧洲）", "无明确记录", "有（北美 / 海湾）"],
    pages: [18, 1, 20],
    originals: [
      "Overseas Projects: UAE, Qatar, Germany",
      "（未提供海外项目清单）",
      "Reference Projects: USA, KSA, UAE",
    ],
    confidences: [92, 55, 93],
  },
  {
    key: "lead_time",
    label: "交付周期",
    values: ["4–5 周", "3 周", "5–6 周"],
    pages: [16, 1, 18],
    originals: [
      "Lead Time: 4-5 weeks",
      "交期：3周",
      "Production Lead Time: 5-6 weeks",
    ],
    confidences: [90, 92, 91],
  },
  {
    key: "moq",
    label: "MOQ",
    values: ["500 ㎡", "300 ㎡", "800 ㎡"],
    pages: [16, 1, 18],
    originals: ["MOQ: 500 sqm", "起订量：300㎡", "Minimum Order: 800 sqm"],
    confidences: [94, 95, 94],
  },
];

function buildParameters(): Parameter[] {
  const docs = [
    "Supplier_A_LuminaCeil_Datasheet.pdf",
    "Supplier_B_SkyStretch_Catalog.xlsx",
    "Supplier_C_AeroFilm_Technical_Sheet.pdf",
  ];
  const productIds = ["prod-a", "prod-b", "prod-c"];
  const supplierIds = ["sup-a", "sup-b", "sup-c"];
  const params: Parameter[] = [];

  paramDefs.forEach((def) => {
    def.values.forEach((value, idx) => {
      const evidence = ev(
        docs[idx],
        def.pages[idx],
        def.originals[idx],
        value,
        def.confidences[idx]
      );
      const param: Parameter = {
        id: `param-${def.key}-${supplierIds[idx]}`,
        key: def.key,
        label: def.label,
        rawValue: value,
        unit: def.units?.[idx],
        supplierId: supplierIds[idx],
        productId: productIds[idx],
        evidence: [evidence],
        confidence: def.confidences[idx],
        needsReview: def.confidences[idx] < 70 || value.includes("未提供") || value.includes("无明确"),
      };

      if (def.conflictOn === "b" && idx === 1) {
        param.conflict = {
          message: "⚠️ 参数冲突，需要人工确认",
          values: [
            {
              rawValue: "20 kg / 卷",
              evidence: ev(docs[1], 1, "重量：20kg/卷", "20 kg / 卷", 91),
            },
            {
              rawValue: "18 kg / 卷",
              evidence: ev(
                "Supplier_B_Packing_List.pdf",
                2,
                "Gross weight per roll: 18kg",
                "18 kg / 卷",
                88
              ),
            },
          ],
        };
        param.needsReview = true;
      }

      params.push(param);
    });
  });

  return params;
}

function buildProducts(parameters: Parameter[]): Product[] {
  return productsBase.map((p) => ({
    ...p,
    parameters: parameters.filter((x) => x.productId === p.id),
  }));
}

function buildNormalized(parameters: Parameter[]): NormalizedParameter[] {
  const widthParams = parameters.filter((p) => p.key === "width");
  const priceParams = parameters.filter((p) => p.key === "price");
  const weightParams = parameters.filter((p) => p.key === "weight");

  const widthNorm: NormalizedParameter[] = widthParams.map((p) => {
    const map: Record<string, { value: number; rule: string }> = {
      "sup-a": { value: 2, rule: "2000 mm ÷ 1000 = 2 m" },
      "sup-b": { value: 2, rule: "已是米制单位，保持 2 m" },
      "sup-c": { value: 2, rule: "200 cm ÷ 100 = 2 m" },
    };
    const n = map[p.supplierId];
    return {
      id: `norm-width-${p.supplierId}`,
      parameterKey: "width",
      label: "幅宽",
      supplierId: p.supplierId,
      productId: p.productId,
      originalValue: p.rawValue,
      originalUnit: p.unit,
      normalizedValue: n.value,
      normalizedUnit: "m",
      conversionRule: n.rule,
      status: "normalized",
      evidence: p.evidence,
      confidence: p.confidence,
    };
  });

  const priceNorm: NormalizedParameter[] = priceParams.map((p) => {
    if (p.supplierId === "sup-c") {
      return {
        id: `norm-price-${p.supplierId}`,
        parameterKey: "price",
        label: "单价",
        supplierId: p.supplierId,
        productId: p.productId,
        originalValue: p.rawValue,
        originalUnit: "USD",
        normalizedValue: 200,
        normalizedUnit: "CNY/㎡",
        conversionRule: "USD → CNY（演示汇率 7.15）：28 × 7.15 ≈ 200",
        status: "normalized",
        evidence: p.evidence,
        confidence: 88,
      };
    }
    const value = p.supplierId === "sup-a" ? 186 : 142;
    return {
      id: `norm-price-${p.supplierId}`,
      parameterKey: "price",
      label: "单价",
      supplierId: p.supplierId,
      productId: p.productId,
      originalValue: p.rawValue,
      originalUnit: "CNY",
      normalizedValue: value,
      normalizedUnit: "CNY/㎡",
      conversionRule: "原币种为 CNY，无需转换",
      status: "normalized",
      evidence: p.evidence,
      confidence: p.confidence,
    };
  });

  const weightNorm: NormalizedParameter[] = weightParams.map((p) => ({
    id: `norm-weight-${p.supplierId}`,
    parameterKey: "weight",
    label: "重量",
    supplierId: p.supplierId,
    productId: p.productId,
    originalValue: p.rawValue,
    originalUnit: "kg",
    normalizedValue: p.supplierId === "sup-a" ? 18 : p.supplierId === "sup-b" ? null : 17,
    normalizedUnit: "kg/卷",
    conversionRule: p.conflict ? undefined : "单位一致，保持 kg/卷",
    status: p.conflict ? "conflict" : "normalized",
    evidence: p.evidence,
    confidence: p.confidence,
  }));

  // VOC unit uncertain for supplier B
  const vocB = parameters.find((p) => p.key === "voc" && p.supplierId === "sup-b")!;
  const vocReview: NormalizedParameter = {
    id: "norm-voc-sup-b",
    parameterKey: "voc",
    label: "VOC",
    supplierId: "sup-b",
    productId: "prod-b",
    originalValue: vocB.rawValue,
    normalizedValue: null,
    status: "review",
    evidence: vocB.evidence,
    confidence: 40,
  };

  return [...widthNorm, ...priceNorm, ...weightNorm, vocReview];
}

function buildScores(): ProductScore[] {
  const mk = (
    productId: string,
    supplierId: string,
    supplierName: string,
    productName: string,
    model: string,
    overall: number,
    dims: Array<{
      dimension: ProductScore["dimensions"][0]["dimension"];
      label: string;
      score: number;
      reasons: ProductScore["dimensions"][0]["reasons"];
      evidence: ProductScore["dimensions"][0]["evidence"];
      confidence: number;
    }>
  ): ProductScore => ({
    productId,
    supplierId,
    supplierName,
    productName,
    model,
    overall,
    dimensions: dims.map((d) => ({ ...d, maxScore: 100, editable: true })),
  });

  return [
    mk("prod-a", "sup-a", "供应商 A · LuminaCeil", "软膜天花系统", "LC-SM-220", 91, [
      {
        dimension: "price",
        label: "价格",
        score: 78,
        reasons: [
          { type: "positive", text: "价格处于中位，综合成本可控" },
          { type: "warning", text: "高于供应商 B，需结合合规溢价评估" },
        ],
        evidence: [
          ev("Supplier_A_LuminaCeil_Datasheet.pdf", 12, "Unit Price: CNY 186 per sqm", "¥186/㎡", 94),
        ],
        confidence: 90,
      },
      {
        dimension: "compliance",
        label: "合规性",
        score: 95,
        reasons: [
          { type: "positive", text: "提供 CE 认证" },
          { type: "positive", text: "防火等级 A1，满足高标准场所" },
          { type: "positive", text: "提供 VOC 与测试报告" },
          { type: "warning", text: "缺少项目当地消防局额外备案证明" },
        ],
        evidence: [
          ev("Supplier_A_LuminaCeil_Datasheet.pdf", 9, "Fire Rating: A1 (EN 13501-1)", "A1", 97),
          ev("Supplier_A_LuminaCeil_Datasheet.pdf", 14, "Certifications: CE, REACH", "CE, REACH", 96),
        ],
        confidence: 94,
      },
      {
        dimension: "enterprise",
        label: "企业特性",
        score: 90,
        reasons: [
          { type: "positive", text: "ISO 双体系齐全" },
          { type: "positive", text: "具备中东与欧洲项目经验" },
        ],
        evidence: [
          ev(
            "Supplier_A_LuminaCeil_Datasheet.pdf",
            18,
            "Overseas Projects: UAE, Qatar, Germany",
            "有海外经验",
            92
          ),
        ],
        confidence: 91,
      },
      {
        dimension: "performance",
        label: "产品性能",
        score: 93,
        reasons: [
          { type: "positive", text: "PVC+Polyester 结构稳定" },
          { type: "positive", text: "厚度与幅宽适配大堂大跨度安装" },
        ],
        evidence: [
          ev(
            "Supplier_A_LuminaCeil_Datasheet.pdf",
            4,
            "Material: PVC coated polyester",
            "PVC + Polyester",
            95
          ),
        ],
        confidence: 92,
      },
      {
        dimension: "weight",
        label: "重量 / 运输",
        score: 88,
        reasons: [
          { type: "positive", text: "单卷 18kg，海外空运/海运适配性较好" },
          { type: "warning", text: "需确认包装毛重与托盘方案" },
        ],
        evidence: [
          ev("Supplier_A_LuminaCeil_Datasheet.pdf", 8, "Net Weight: 18 kg/roll", "18 kg", 96),
        ],
        confidence: 89,
      },
      {
        dimension: "supply",
        label: "供应能力",
        score: 91,
        reasons: [
          { type: "positive", text: "交期 4–5 周，匹配项目节奏" },
          { type: "positive", text: "MOQ 适中，便于分批供货" },
        ],
        evidence: [
          ev("Supplier_A_LuminaCeil_Datasheet.pdf", 16, "Lead Time: 4-5 weeks", "4–5 周", 90),
        ],
        confidence: 90,
      },
    ]),
    mk("prod-b", "sup-b", "供应商 B · SkyStretch", "软膜天花系统", "SS-TX-180", 72, [
      {
        dimension: "price",
        label: "价格",
        score: 92,
        reasons: [{ type: "positive", text: "单价最低，短期采购成本优势明显" }],
        evidence: [ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "报价：142 元/㎡", "¥142/㎡", 96)],
        confidence: 93,
      },
      {
        dimension: "compliance",
        label: "合规性",
        score: 58,
        reasons: [
          { type: "negative", text: "防火等级仅为 B1，低于项目 A1/A2 要求风险高" },
          { type: "warning", text: "VOC 与测试报告缺失" },
          { type: "positive", text: "具备 CE 认证" },
        ],
        evidence: [ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "防火等级：B1", "B1", 98)],
        confidence: 95,
      },
      {
        dimension: "enterprise",
        label: "企业特性",
        score: 62,
        reasons: [
          { type: "warning", text: "海外项目经验无明确记录" },
          { type: "positive", text: "具备 ISO 9001" },
        ],
        evidence: [
          ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "（未提供海外项目清单）", "无明确记录", 55),
        ],
        confidence: 70,
      },
      {
        dimension: "performance",
        label: "产品性能",
        score: 74,
        reasons: [
          { type: "warning", text: "材质描述较简单，缺少增强层说明" },
          { type: "positive", text: "厚度满足常规室内装饰" },
        ],
        evidence: [ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "材质：PVC", "PVC", 94)],
        confidence: 84,
      },
      {
        dimension: "weight",
        label: "重量 / 运输",
        score: 70,
        reasons: [
          { type: "warning", text: "重量数据存在冲突，需人工确认" },
          { type: "negative", text: "相对更重，运输成本可能上升" },
        ],
        evidence: [ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "重量：20kg/卷", "20 kg", 91)],
        confidence: 68,
      },
      {
        dimension: "supply",
        label: "供应能力",
        score: 85,
        reasons: [
          { type: "positive", text: "交期最短（3 周）" },
          { type: "positive", text: "MOQ 较低，利于样板阶段" },
        ],
        evidence: [ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "交期：3周", "3 周", 92)],
        confidence: 88,
      },
    ]),
    mk("prod-c", "sup-c", "供应商 C · AeroFilm Intl", "软膜天花系统", "AF-PRO-310", 89, [
      {
        dimension: "price",
        label: "价格",
        score: 70,
        reasons: [
          { type: "warning", text: "折合人民币后单价偏高" },
          { type: "positive", text: "含更完整认证体系，溢价可解释" },
        ],
        evidence: [
          ev("Supplier_C_AeroFilm_Technical_Sheet.pdf", 15, "FOB Price: USD 28 / sqm", "$28/㎡", 93),
        ],
        confidence: 87,
      },
      {
        dimension: "compliance",
        label: "合规性",
        score: 96,
        reasons: [
          { type: "positive", text: "CE + UL + REACH 齐全" },
          { type: "positive", text: "防火 A2-s1,d0，适配高要求场所" },
          { type: "positive", text: "VOC 指标优秀" },
        ],
        evidence: [
          ev(
            "Supplier_C_AeroFilm_Technical_Sheet.pdf",
            16,
            "Approvals: CE / UL / REACH",
            "CE, UL, REACH",
            97
          ),
        ],
        confidence: 95,
      },
      {
        dimension: "enterprise",
        label: "企业特性",
        score: 94,
        reasons: [
          { type: "positive", text: "UL 工厂认证 + 多体系资质" },
          { type: "positive", text: "北美与海湾地区参考项目充分" },
        ],
        evidence: [
          ev(
            "Supplier_C_AeroFilm_Technical_Sheet.pdf",
            20,
            "Reference Projects: USA, KSA, UAE",
            "有海外经验",
            93
          ),
        ],
        confidence: 93,
      },
      {
        dimension: "performance",
        label: "产品性能",
        score: 94,
        reasons: [
          { type: "positive", text: "FR 增强材料，性能指标完整" },
          { type: "positive", text: "幅宽归一化后与项目需求匹配" },
        ],
        evidence: [
          ev(
            "Supplier_C_AeroFilm_Technical_Sheet.pdf",
            4,
            "Base Material: PVC + Polyester FR",
            "PVC + Polyester FR",
            96
          ),
        ],
        confidence: 93,
      },
      {
        dimension: "weight",
        label: "重量 / 运输",
        score: 92,
        reasons: [{ type: "positive", text: "单卷最轻（17kg），利于海外运输" }],
        evidence: [
          ev("Supplier_C_AeroFilm_Technical_Sheet.pdf", 7, "Weight: 17 kg per roll", "17 kg", 95),
        ],
        confidence: 94,
      },
      {
        dimension: "supply",
        label: "供应能力",
        score: 86,
        reasons: [
          { type: "positive", text: "产能规模最大" },
          { type: "warning", text: "交期与 MOQ 偏高，需对齐项目排期" },
        ],
        evidence: [
          ev(
            "Supplier_C_AeroFilm_Technical_Sheet.pdf",
            18,
            "Production Lead Time: 5-6 weeks",
            "5–6 周",
            91
          ),
        ],
        confidence: 90,
      },
    ]),
  ];
}

export function getDemoCompareResult(): CompareAnalysisResult {
  const parameters = buildParameters();
  const products = buildProducts(parameters);
  const normalized = buildNormalized(parameters);
  const scores = buildScores();

  return {
    products,
    suppliers: DEMO_SUPPLIERS,
    parameters,
    normalized,
    comparisons: [
      {
        key: "price",
        label: "价格（越低越好）",
        direction: "lower_better",
        values: [
          { productId: "prod-a", supplierName: "供应商 A", raw: "¥186/㎡", score: 72 },
          { productId: "prod-b", supplierName: "供应商 B", raw: "¥142/㎡", score: 95 },
          { productId: "prod-c", supplierName: "供应商 C", raw: "≈¥200/㎡", score: 62 },
        ],
      },
      {
        key: "compliance",
        label: "合规性（越高越好）",
        direction: "higher_better",
        values: [
          { productId: "prod-a", supplierName: "供应商 A", raw: "95", score: 95 },
          { productId: "prod-b", supplierName: "供应商 B", raw: "58", score: 58 },
          { productId: "prod-c", supplierName: "供应商 C", raw: "96", score: 96 },
        ],
      },
      {
        key: "enterprise",
        label: "企业特性（越高越好）",
        direction: "higher_better",
        values: [
          { productId: "prod-a", supplierName: "供应商 A", raw: "90", score: 90 },
          { productId: "prod-b", supplierName: "供应商 B", raw: "62", score: 62 },
          { productId: "prod-c", supplierName: "供应商 C", raw: "94", score: 94 },
        ],
      },
      {
        key: "performance",
        label: "产品性能（越高越好）",
        direction: "higher_better",
        values: [
          { productId: "prod-a", supplierName: "供应商 A", raw: "93", score: 93 },
          { productId: "prod-b", supplierName: "供应商 B", raw: "74", score: 74 },
          { productId: "prod-c", supplierName: "供应商 C", raw: "94", score: 94 },
        ],
      },
      {
        key: "weight",
        label: "重量 / 运输（结合项目需求）",
        direction: "context",
        values: [
          { productId: "prod-a", supplierName: "供应商 A", raw: "18kg", score: 88 },
          { productId: "prod-b", supplierName: "供应商 B", raw: "冲突待确认", score: 70 },
          { productId: "prod-c", supplierName: "供应商 C", raw: "17kg", score: 92 },
        ],
      },
      {
        key: "supply",
        label: "供应能力（越高越好）",
        direction: "higher_better",
        values: [
          { productId: "prod-a", supplierName: "供应商 A", raw: "91", score: 91 },
          { productId: "prod-b", supplierName: "供应商 B", raw: "85", score: 85 },
          { productId: "prod-c", supplierName: "供应商 C", raw: "86", score: 86 },
        ],
      },
    ],
    scores,
    pendingItems: [
      "供应商 B 重量参数冲突（Excel 20kg vs 装箱单 18kg）",
      "供应商 B VOC 指标缺失，单位无法确认",
      "供应商 A 缺少项目当地消防备案证明",
    ],
    demoMode: true,
  };
}

export const DEMO_REQUIREMENTS: Requirement[] = [
  {
    id: "req-fire",
    code: "FIN-FIRE-01",
    title: "防火等级",
    description: "大堂公共区域天花饰面防火性能",
    requiredValue: "A1 或 A2-s1,d0（EN 13501-1）",
    category: "防火安全",
    sourceDocument: "Project_Specification_Interior_Finishes.pdf",
    page: 23,
    originalText:
      "Ceiling stretch membranes in public lobby areas shall achieve Reaction to Fire Class A1 or A2-s1,d0 per EN 13501-1.",
  },
  {
    id: "req-voc",
    code: "FIN-IAQ-02",
    title: "VOC 限值",
    description: "室内空气质量",
    requiredValue: "≤ 50 μg/m³",
    category: "室内空气",
    sourceDocument: "Client_Technical_Requirements.docx",
    page: 8,
    originalText: "VOC emission of decorative membranes shall not exceed 50 μg/m³.",
  },
  {
    id: "req-ce",
    code: "FIN-CERT-03",
    title: "CE 认证",
    description: "产品进入目标市场的基础认证",
    requiredValue: "Required",
    category: "认证",
    sourceDocument: "Project_Specification_Interior_Finishes.pdf",
    page: 25,
    originalText: "Products shall carry valid CE marking and DoP documentation.",
  },
  {
    id: "req-material",
    code: "FIN-MAT-04",
    title: "材料要求",
    description: "基材与增强层",
    requiredValue: "PVC coated polyester（或等效）",
    category: "材料",
    sourceDocument: "Client_Technical_Requirements.docx",
    page: 6,
    originalText: "Membrane shall be PVC coated polyester or equivalent engineered fabric.",
  },
  {
    id: "req-test",
    code: "FIN-TEST-05",
    title: "测试报告",
    description: "第三方防火与 VOC 测试报告",
    requiredValue: "Required（近 3 年）",
    category: "测试",
    sourceDocument: "Project_Specification_Interior_Finishes.pdf",
    page: 26,
    originalText:
      "Supplier shall submit third-party fire and VOC test reports issued within the last 3 years.",
  },
  {
    id: "req-thickness",
    code: "FIN-DIM-06",
    title: "厚度",
    description: "膜材厚度",
    requiredValue: "≥ 0.18 mm",
    category: "尺寸",
    sourceDocument: "Client_Technical_Requirements.docx",
    page: 7,
    originalText: "Nominal thickness shall be no less than 0.18 mm.",
  },
  {
    id: "req-width",
    code: "FIN-DIM-07",
    title: "幅宽",
    description: "卷材幅宽以减少接缝",
    requiredValue: "≥ 2.0 m",
    category: "尺寸",
    sourceDocument: "Project_Specification_Interior_Finishes.pdf",
    page: 24,
    originalText: "Preferred roll width shall be 2.0 m or greater to minimize joints.",
  },
  {
    id: "req-ul",
    code: "FIN-CERT-08",
    title: "UL 认证（如适用）",
    description: "部分业主附加要求",
    requiredValue: "Preferred / if specified by client addendum",
    category: "认证",
    sourceDocument: "Client_Technical_Requirements.docx",
    page: 11,
    originalText: "UL listing is preferred where the client addendum requires North-American equivalency.",
    conflictsWith: ["req-ce"],
  },
  {
    id: "req-reach",
    code: "FIN-CHEM-09",
    title: "REACH",
    description: "有害物质合规",
    requiredValue: "Required",
    category: "化学合规",
    sourceDocument: "Project_Specification_Interior_Finishes.pdf",
    page: 27,
    originalText: "Materials shall comply with REACH SVHC restrictions.",
  },
  {
    id: "req-overseas",
    code: "FIN-SUP-10",
    title: "海外供货经验",
    description: "供应商海外交付能力",
    requiredValue: "至少 1 个同类海外项目",
    category: "供应",
    sourceDocument: "Client_Technical_Requirements.docx",
    page: 12,
    originalText: "Supplier shall demonstrate at least one comparable overseas project reference.",
  },
];

export function getDemoComplianceChecks(productId = "prod-a"): ComplianceCheck[] {
  // Default checks against recommended product A; still show a mix of statuses for demo.
  const productDoc = "Supplier_A_LuminaCeil_Datasheet.pdf";
  const checks: ComplianceCheck[] = [
    {
      id: "chk-fire",
      requirementId: "req-fire",
      checkItem: "防火等级",
      requirement: "A1 或 A2-s1,d0",
      actualValue: "A1",
      status: "PASS",
      riskLevel: "none",
      confidence: 98,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          23,
          "shall achieve Reaction to Fire Class A1 or A2-s1,d0",
          "A1 或 A2-s1,d0",
          99,
          "3.2 Fire Performance"
        ),
        ev(productDoc, 9, "Fire Rating: A1 (EN 13501-1)", "A1", 97, "Safety"),
      ],
      aiJudgment: "产品防火等级 A1，明确满足规范要求。",
      humanStatus: "pending",
    },
    {
      id: "chk-voc",
      requirementId: "req-voc",
      checkItem: "VOC",
      requirement: "≤ 50 μg/m³",
      actualValue: "≤ 50 μg/m³",
      status: "PASS",
      riskLevel: "none",
      confidence: 95,
      evidence: [
        ev(
          "Client_Technical_Requirements.docx",
          8,
          "shall not exceed 50 μg/m³",
          "≤ 50 μg/m³",
          98
        ),
        ev(productDoc, 11, "VOC Emission: ≤ 50 μg/m³", "≤ 50 μg/m³", 93),
      ],
      aiJudgment: "产品 VOC 指标等于限值上限，满足要求。",
      humanStatus: "pending",
    },
    {
      id: "chk-ce",
      requirementId: "req-ce",
      checkItem: "CE 认证",
      requirement: "Required",
      actualValue: "有（CE, REACH）",
      status: "PASS",
      riskLevel: "none",
      confidence: 96,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          25,
          "Products shall carry valid CE marking",
          "Required",
          99
        ),
        ev(productDoc, 14, "Certifications: CE, REACH", "CE, REACH", 96),
      ],
      aiJudgment: "资料中明确列出 CE 认证。",
      humanStatus: "pending",
    },
    {
      id: "chk-material",
      requirementId: "req-material",
      checkItem: "材料要求",
      requirement: "PVC coated polyester（或等效）",
      actualValue: "PVC + Polyester",
      status: "REVIEW",
      riskLevel: "medium",
      confidence: 72,
      evidence: [
        ev(
          "Client_Technical_Requirements.docx",
          6,
          "PVC coated polyester or equivalent engineered fabric",
          "PVC coated polyester",
          97
        ),
        ev(productDoc, 4, "Material: PVC coated polyester", "PVC + Polyester", 95),
      ],
      aiJudgment:
        "材料描述与规范接近，但“等效性”表述依赖人工确认涂层工艺细节。",
      humanStatus: "pending",
      suggestion: "请补充涂层工艺说明或厂家材料声明。",
    },
    {
      id: "chk-test",
      requirementId: "req-test",
      checkItem: "测试报告",
      requirement: "Required（近 3 年）",
      actualValue: "未在本次资料包中找到",
      status: "MISSING",
      riskLevel: "high",
      confidence: 99,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          26,
          "submit third-party fire and VOC test reports",
          "Required",
          99
        ),
      ],
      aiJudgment:
        "缺少必要资料。没有证据不等于不合规，当前判定为 MISSING，需供应商补交。",
      humanStatus: "pending",
      suggestion: "要求供应商提交近 3 年第三方防火与 VOC 测试报告。",
    },
    {
      id: "chk-thickness",
      requirementId: "req-thickness",
      checkItem: "厚度",
      requirement: "≥ 0.18 mm",
      actualValue: "0.18 mm",
      status: "PASS",
      riskLevel: "none",
      confidence: 97,
      evidence: [
        ev("Client_Technical_Requirements.docx", 7, "no less than 0.18 mm", "≥ 0.18 mm", 98),
        ev(productDoc, 5, "Thickness: 0.18 mm", "0.18 mm", 97),
      ],
      aiJudgment: "厚度等于下限要求，满足。",
      humanStatus: "pending",
    },
    {
      id: "chk-width",
      requirementId: "req-width",
      checkItem: "幅宽",
      requirement: "≥ 2.0 m",
      actualValue: "2.0 m（由 2000 mm 归一化）",
      status: "PASS",
      riskLevel: "none",
      confidence: 98,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          24,
          "roll width shall be 2.0 m or greater",
          "≥ 2.0 m",
          99
        ),
        ev(productDoc, 5, "Width: 2000 mm", "2.0 m", 98),
      ],
      aiJudgment: "幅宽归一化后为 2.0 m，满足要求。",
      humanStatus: "pending",
    },
    {
      id: "chk-ul",
      requirementId: "req-ul",
      checkItem: "UL 认证",
      requirement: "Preferred / if specified",
      actualValue: "未提供 UL",
      status: "NOT_APPLICABLE",
      riskLevel: "low",
      confidence: 80,
      evidence: [
        ev(
          "Client_Technical_Requirements.docx",
          11,
          "UL listing is preferred where the client addendum requires",
          "Preferred",
          90
        ),
      ],
      aiJudgment:
        "规范表述为“如业主附录要求则优先”，当前项目附录未强制，暂标 NOT APPLICABLE。",
      humanStatus: "pending",
      suggestion: "与业主确认是否强制 UL。",
    },
    {
      id: "chk-reach",
      requirementId: "req-reach",
      checkItem: "REACH",
      requirement: "Required",
      actualValue: "有 REACH 声明",
      status: "PASS",
      riskLevel: "none",
      confidence: 94,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          27,
          "comply with REACH SVHC restrictions",
          "Required",
          98
        ),
        ev(productDoc, 14, "Certifications: CE, REACH", "REACH", 96),
      ],
      aiJudgment: "产品资料包含 REACH 合规声明。",
      humanStatus: "pending",
    },
    {
      id: "chk-overseas",
      requirementId: "req-overseas",
      checkItem: "海外供货经验",
      requirement: "至少 1 个同类海外项目",
      actualValue: "UAE / Qatar / Germany",
      status: "PASS",
      riskLevel: "none",
      confidence: 92,
      evidence: [
        ev(
          "Client_Technical_Requirements.docx",
          12,
          "at least one comparable overseas project reference",
          "≥1 overseas project",
          97
        ),
        ev(productDoc, 18, "Overseas Projects: UAE, Qatar, Germany", "有", 92),
      ],
      aiJudgment: "提供多个海外项目参考，满足要求。",
      humanStatus: "pending",
    },
    {
      id: "chk-local-fire-permit",
      requirementId: "req-fire",
      checkItem: "当地消防备案证明",
      requirement: "项目所在地消防/市政备案（如适用）",
      actualValue: "未提供",
      status: "MISSING",
      riskLevel: "medium",
      confidence: 99,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          23,
          "local authority approvals where applicable",
          "local approvals",
          85,
          "3.2 Fire Performance"
        ),
      ],
      aiJudgment: "资料包中未找到当地备案证明，判定 MISSING，而非 FAIL。",
      humanStatus: "pending",
      suggestion: "向供应商索取目标国家/地区消防备案或等效文件。",
    },
    {
      id: "chk-conflict-demo",
      requirementId: "req-fire",
      checkItem: "规范冲突提示（演示）",
      requirement: "规范 A：A1；附录草稿曾写 B1",
      actualValue: "产品为 A1",
      status: "REVIEW",
      riskLevel: "high",
      confidence: 66,
      evidence: [
        ev(
          "Project_Specification_Interior_Finishes.pdf",
          23,
          "Class A1 or A2-s1,d0",
          "A1/A2",
          99
        ),
        ev(
          "Client_Technical_Requirements.docx",
          4,
          "Draft note: B1 acceptable for back-of-house only",
          "B1 (draft/limited)",
          70
        ),
      ],
      aiJudgment:
        "⚠️ 检测到规范要求冲突，请人工确认适用规范。AI 不自动裁定优先级。",
      humanStatus: "pending",
      suggestion: "以正式签发版 Project Specification 为准，并书面确认附录范围。",
    },
  ];

  // If somehow selecting B in future demos, fire would FAIL — keep helper for completeness
  if (productId === "prod-b") {
    return checks.map((c) =>
      c.id === "chk-fire"
        ? {
            ...c,
            actualValue: "B1",
            status: "FAIL" as const,
            riskLevel: "high" as const,
            confidence: 98,
            aiJudgment: "产品防火等级 B1，明确不满足 A1/A2 要求。",
            suggestion: "更换满足 A1/A2 的产品，或申请规范豁免（需业主书面批准）。",
            evidence: [
              ev(
                "Project_Specification_Interior_Finishes.pdf",
                23,
                "Class A1 or A2-s1,d0",
                "A1/A2",
                99
              ),
              ev("Supplier_B_SkyStretch_Catalog.xlsx", 1, "防火等级：B1", "B1", 98),
            ],
          }
        : c
    );
  }

  return checks;
}

export function getDemoComplianceResult(productId = "prod-a"): ComplianceAnalysisResult {
  const checks = getDemoComplianceChecks(productId);
  const summary = {
    total: checks.length,
    pass: checks.filter((c) => c.status === "PASS").length,
    fail: checks.filter((c) => c.status === "FAIL").length,
    review: checks.filter((c) => c.status === "REVIEW").length,
    missing: checks.filter((c) => c.status === "MISSING").length,
    notApplicable: checks.filter((c) => c.status === "NOT_APPLICABLE").length,
  };

  let overallState: ComplianceAnalysisResult["overallState"] = "compliant";
  if (summary.fail > 0) overallState = "at_risk";
  else if (summary.missing > 0) overallState = "incomplete";
  else if (summary.review > 0) overallState = "pending_review";

  return {
    requirements: DEMO_REQUIREMENTS,
    checks,
    summary,
    overallState,
    demoMode: true,
  };
}

export function buildDemoSelectionResult(
  score?: ProductScore,
  overrides?: Partial<SelectionResult>
): SelectionResult {
  const compare = getDemoCompareResult();
  const selected = score ?? compare.scores[0];
  return {
    id: `sel-${Date.now()}`,
    projectId: DEMO_PROJECT.id,
    projectName: DEMO_PROJECT.name,
    productId: selected.productId,
    productName: selected.productName,
    supplierId: selected.supplierId,
    supplierName: selected.supplierName,
    model: selected.model,
    overallScore: selected.overall,
    dimensions: selected.dimensions,
    coreParameters: [
      { label: "防火等级", value: "A1" },
      { label: "单价", value: "¥186 /㎡" },
      { label: "重量", value: "18 kg / 卷" },
      { label: "幅宽", value: "2 m" },
      { label: "认证", value: "CE, REACH" },
      { label: "材质", value: "PVC + Polyester" },
    ],
    advantages: [
      "防火 A1，契合公共区域高标准",
      "认证与 VOC 资料较完整",
      "具备中东项目经验，供应节奏匹配",
    ],
    risks: [
      "缺少当地消防备案证明",
      "单价高于最低价方案，需说明合规溢价",
    ],
    pendingItems: compare.pendingItems.filter((x) => x.includes("供应商 A") || x.includes("消防")),
    sourceDocuments: ["Supplier_A_LuminaCeil_Datasheet.pdf"],
    scoreEvidence: selected.dimensions.flatMap((d) => d.evidence),
    humanReviewStatus: "accepted",
    confirmedAt: now(),
    demoMode: true,
    ...overrides,
  };
}
