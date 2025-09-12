"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Key stats and quick insights</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">This is a lightweight placeholder for the Admin Overview panel.</p>
      </CardContent>
    </Card>
  );
}
