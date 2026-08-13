import { NextResponse } from "next/server";
import { getPublicCozeStatus } from "@/services/coze/config";

export async function GET() {
  return NextResponse.json(getPublicCozeStatus());
}
