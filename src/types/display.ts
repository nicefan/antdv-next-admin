export type StatusMode = 'dot' | 'tag' | 'badge';

export interface StatusMap {
  [key: string]: {
    text: string;
    color: string;
    icon?: unknown;
  };
}

// 图表
export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'radar';

export interface ChartProps {
  type: ChartType;
  data: Record<string, unknown>[];
  height?: number | string;
  title?: string;
  subTitle?: string;
  loading?: boolean;
  option?: Record<string, unknown>;
}

// 统计卡片
export type StatCardTone = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon?: unknown;
  tone?: StatCardTone;
}

// 分步布局
export interface StepFlowStep {
  title: string;
  description?: string;
  icon?: unknown;
}

// 分栏布局
export interface SplitLayoutProps {
  sideWidth?: number | string;
  sidePosition?: 'left' | 'right';
  gap?: number | string;
}

// 详情标签页
export interface DetailTab {
  key: string;
  label: string;
}
