import { NextResponse } from "next/server";
import { getPublicCozeStatus } from "@/services/coze/config";
import { getPublicFeishuStatus } from "@/services/feishu/config";

export async function GET() {
  return NextResponse.json({
    ...getPublicCozeStatus(),
    feishu: getPublicFeishuStatus(),
  });
}
