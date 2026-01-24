'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from 'echarts-for-react';
import { useTheme } from "next-themes";

export function AnalyticsCharts({ analytics }: { analytics: any }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#9ca3af' : '#4b5563';
  const axisLineColor = isDark ? '#374151' : '#e5e7eb';
  const splitLineColor = isDark ? '#374151' : '#e5e7eb';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#1f2937';

  // Common chart options
  const commonOption = {
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Inter, sans-serif',
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: {
        color: tooltipText,
      },
      padding: [10, 15],
      borderRadius: 8,
      shadowBlur: 10,
      shadowColor: 'rgba(0,0,0,0.1)',
    },
    grid: {
      top: 40,
      right: 20,
      bottom: 24,
      left: 20,
      containLabel: true,
    },
  };

  const getBurnDownOption = () => ({
    ...commonOption,
    color: ['#10B981', '#F97316', '#6366f1'],
    legend: {
      data: ['Completed', 'Remaining', 'Total'],
      textStyle: { color: textColor },
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: analytics.burnDownData.map((d: any) => d.date),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: 'Completed',
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.1 },
        data: analytics.burnDownData.map((d: any) => d.completed),
      },
      {
        name: 'Remaining',
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.1 },
        data: analytics.burnDownData.map((d: any) => d.remaining),
      },
      {
        name: 'Total',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { type: 'dashed' },
        data: analytics.burnDownData.map((d: any) => d.total),
      },
    ],
  });

  const getVelocityOption = () => ({
    ...commonOption,
    color: ['#10B981', '#6366f1'],
    tooltip: { ...commonOption.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['Completed', 'Total'],
      textStyle: { color: textColor },
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: analytics.velocityData.map((d: any) => d.name),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: 'Completed',
        type: 'bar',
        barMaxWidth: 40,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: analytics.velocityData.map((d: any) => d.completed),
      },
      {
        name: 'Total',
        type: 'bar',
        barMaxWidth: 40,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: analytics.velocityData.map((d: any) => d.total),
      },
    ],
  });

  const getPieOption = (data: any[], name: string) => ({
    ...commonOption,
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: textColor },
    },
    series: [
      {
        name: name,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#1f2937' : '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c} ({d}%)',
          },
        },
        data: data,
      },
    ],
  });

  const getTeamWorkloadOption = () => ({
    ...commonOption,
    color: ['#6366f1'],
    tooltip: { ...commonOption.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: analytics.teamWorkload.map((d: any) => d.name),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: 'Issues',
        type: 'bar',
        barMaxWidth: 40,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: analytics.teamWorkload.map((d: any) => d.value),
      },
    ],
  });
  
  const getStatusOption = () => ({
    ...commonOption,
    color: ['#8b5cf6'],
    tooltip: { ...commonOption.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { ...commonOption.grid, left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'category',
      data: analytics.statusDistribution.map((d: any) => d.name),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor },
    },
    series: [
      {
        name: 'Issues',
        type: 'bar',
        barMaxWidth: 30,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        data: analytics.statusDistribution.map((d: any) => d.value),
      },
    ],
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Burn-down Chart */}
      <Card className="col-span-2 shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle>Burn-down Chart</CardTitle>
          <CardDescription>Issues completed over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts option={getBurnDownOption()} style={{ height: 350 }} />
        </CardContent>
      </Card>

      {/* Velocity Chart */}
      {analytics.velocityData.length > 0 && (
        <Card className="col-span-2 shadow-sm border-muted/40">
          <CardHeader>
            <CardTitle>Sprint Velocity</CardTitle>
            <CardDescription>Issues completed per sprint</CardDescription>
          </CardHeader>
          <CardContent>
             <ReactECharts option={getVelocityOption()} style={{ height: 350 }} />
          </CardContent>
        </Card>
      )}

      {/* Issue Type Distribution */}
      <Card className="shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle>Issue Types</CardTitle>
          <CardDescription>Distribution by type</CardDescription>
        </CardHeader>
        <CardContent>
           <ReactECharts option={getPieOption(analytics.typeDistribution, 'Issue Types')} style={{ height: 300 }} />
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle>Priority Levels</CardTitle>
          <CardDescription>Distribution by priority</CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts option={getPieOption(analytics.priorityDistribution, 'Priority')} style={{ height: 300 }} />
        </CardContent>
      </Card>

      {/* Team Workload */}
      <Card className="col-span-2 shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
          <CardDescription>Issues assigned per team member</CardDescription>
        </CardHeader>
        <CardContent>
           <ReactECharts option={getTeamWorkloadOption()} style={{ height: 350 }} />
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="col-span-2 shadow-sm border-muted/40">
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
          <CardDescription>Issues by status category</CardDescription>
        </CardHeader>
        <CardContent>
          <ReactECharts option={getStatusOption()} style={{ height: 350 }} />
        </CardContent>
      </Card>
    </div>
  );
}

