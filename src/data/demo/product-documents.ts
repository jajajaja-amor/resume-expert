import { DEMO_PRODUCT_DOCS } from "@/data/demo/soft-membrane";
import { DEMO_PRODUCT_TEXTS } from "@/data/demo/product-texts";
import type { DocumentFile } from "@/types/workspace";

export type DemoDocument = DocumentFile & {
  textContent?: string;
  demoSource?: boolean;
};

export function getDemoProductDocuments(): DemoDocument[] {
  return DEMO_PRODUCT_DOCS.map((d, idx) => ({
    ...d,
    parseStatus: "done" as const,
    uploadedAt: new Date().toISOString(),
    productLabel: d.supplierName || `产品 ${idx + 1}`,
    supplierName: d.supplierName || `产品 ${idx + 1}`,
    textContent: DEMO_PRODUCT_TEXTS[d.name] || "",
    demoSource: true,
  }));
}
