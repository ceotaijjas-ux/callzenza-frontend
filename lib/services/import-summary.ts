export interface ImportSummary {
  total_rows: number;
  successfully_imported?: number;
  duplicate_rows?: number;
  invalid_rows?: number;
  final_lead_count?: number;
  leads_created: number;
  calls_queued: number;
  skipped_rows: number;
  errors: string[];
}
