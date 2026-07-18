export type CellValue = string | number | Date | null; // null = system-missing
export type Measure = "nominal" | "ordinal" | "scale" | "unknown";

export type MissingSpec =
  | { kind: "none" }
  | { kind: "discrete"; values: number[] }
  | { hi: number; kind: "range"; lo: number }
  | { hi: number; kind: "range+discrete"; lo: number; value: number }
  | { kind: "strings"; values: string[] };

export type SpssFormat = { decimals: number; isDate: boolean; type: number; width: number };

export type Variable = {
  format: SpssFormat;
  label?: string;
  measure: Measure;
  missing: MissingSpec;
  name: string;
  type: "numeric" | "string";
  valueLabels?: Array<{ label: string; value: CellValue }>;
  width?: number;
};

export type Format = "csv" | "tsv" | "txt" | "xlsx" | "sav";
export type Sheet = { name: string; rows: CellValue[][]; variables: Variable[] };
export type ParsedFile = { encoding?: string; format: Format; sheets: Sheet[] };
