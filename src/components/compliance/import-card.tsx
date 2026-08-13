"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceStore } from "@/store/workspace-store";

export function ImportCard() {
  const selection = useWorkspaceStore((s) => s.selection);

  if (!selection) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <PackageSearch className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            当前暂无已确认的产品选型结果，请先完成产品比选。
          </p>
          <Button asChild>
            <Link href="/compare">
              前往产品比选 <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">1. 当前审核产品</CardTitle>
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> 已从产品比选阶段导入
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">产品</p>
            <p className="mt-1 font-medium">{selection.productName}</p>
            <p className="text-xs text-muted-foreground">{selection.productCategory}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">供应商</p>
            <p className="mt-1 font-medium">{selection.supplierName}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">型号</p>
            <p className="mt-1 font-medium">{selection.model}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">综合评分</p>
            <p className="mt-1 text-xl font-bold text-primary">{selection.overallScore}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 rounded-md border p-3 text-sm">
          <span className="text-xs font-medium text-muted-foreground">六维评分：</span>
          {selection.dimensionScores.map((d) => (
            <span key={d.dimension} className="text-xs">
              {d.label} <span className="font-semibold">{d.score}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
