export interface HeaderFilter {
  type: 'keyword' | 'select';
  mode?: 'client' | 'server' | 'hybrid';
  paramKey?: string;
  placeholder?: string;
  multiple?: boolean;
  options?: { label: string; value: string | number | boolean }[];
  caseSensitive?: boolean;
  matchAllKeywords?: boolean;
  clientFilter?: (value: unknown, record: Record<string, unknown>, column: unknown) => boolean;
  transformRequestValue?: (value: unknown, selectedValues: unknown[]) => unknown;
}

export type ValueType =
  | 'text'
  | 'date'
  | 'dateTime'
  | 'dateRange'
  | 'time'
  | 'tag'
  | 'badge'
  | 'money'
  | 'percent'
  | 'avatar'
  | 'image'
  | 'link'
  | 'progress';
export type StatusMap = Record<string, { text: string; color: string }>;
