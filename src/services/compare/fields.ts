/** Canonical product-comparison extraction fields (阶段一) */

export const COMPARE_FIELD_DEFS = [
  { key: "company_name", label: "公司名称", aliases: ["公司", "供应商", "manufacturer", "supplier", "company"] },
  { key: "product_name", label: "产品名称", aliases: ["产品", "品名", "product name", "product"] },
  { key: "unit_price", label: "产品单价", aliases: ["单价", "价格", "price", "unit price"] },
  { key: "quantity", label: "产品数量", aliases: ["数量", "qty", "quantity", "供货量"] },
  { key: "thickness", label: "产品厚度", aliases: ["厚度", "thickness"] },
  { key: "width", label: "产品幅宽", aliases: ["幅宽", "宽度", "width"] },
  { key: "material", label: "材质", aliases: ["材料", "material"] },
  { key: "fire_rating", label: "防火等级", aliases: ["防火", "fire", "fire rating", "reaction to fire"] },
  { key: "certification", label: "产品认证", aliases: ["认证", "certification", "ce", "ul", "reach"] },
  { key: "voc", label: "VOC", aliases: ["voc", "甲醛", "emissions"] },
  { key: "enterprise_qual", label: "企业资质", aliases: ["资质", "iso", "qualification", "企业认证"] },
  { key: "overseas_exp", label: "海外项目经验", aliases: ["海外", "overseas", "国际项目", "export"] },
  { key: "lead_time", label: "交付周期", aliases: ["交付", "交期", "lead time", "delivery"] },
  { key: "moq", label: "MOQ", aliases: ["起订量", "最小起订", "moq", "minimum order"] },
  { key: "weight", label: "重量", aliases: ["重量", "weight", "克重"] },
] as const;

export type CompareFieldKey = (typeof COMPARE_FIELD_DEFS)[number]["key"];

export type ExtractedFieldMap = Partial<
  Record<CompareFieldKey, { value: string; evidence?: string; confidence?: number }>
>;

export const MISSING_VALUE = "资料中未提供";

export function fieldLabel(key: string): string {
  return COMPARE_FIELD_DEFS.find((f) => f.key === key)?.label ?? key;
}
