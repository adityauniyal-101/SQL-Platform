export interface Question {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dataset_name: string;
  expected_columns: string[] | null;
  order_matters: boolean;
  created_at: string;
}

export interface Attempt {
  id: number;
  question_id: number;
  student_id: string;
  submitted_sql: string;
  is_correct: boolean;
  error_message: string | null;
  executed_at: string;
}

export interface ExecuteRequest {
  question_id: number;
  sql: string;
}

export interface ExecuteResponse {
  success: boolean;
  is_correct?: boolean;
  student_result?: Record<string, unknown>[];
  student_columns?: string[];
  error?: string;
  message?: string;
}

export interface AdminQuestion {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dataset_name: string;
  solution_sql: string;
  expected_columns: string | null;
  order_matters: number;
  created_at: string;
  attempt_count: number;
  correct_count: number;
}

export interface AttemptRow {
  id: number;
  question_id: number;
  question_title: string;
  student_id: string;
  submitted_sql: string;
  is_correct: number;
  error_message: string | null;
  executed_at: string;
}

export interface DashboardStats {
  total_questions: number;
  total_attempts: number;
  correct_attempts: number;
  hardest_question: string | null;
}

export interface Assessment {
  id: number;
  title: string;
  access_code: string;
  time_limit_mins: number;
  is_active: number;
  created_at: string;
  question_count?: number;
  submission_count?: number;
}

export interface AssessmentQuestion {
  id: number;
  assessment_id: number;
  question_id: number;
  order_index: number;
  title: string;
  description: string;
  difficulty: string;
  dataset_name: string;
}

export interface AssessmentSubmission {
  id: number;
  assessment_id: number;
  student_name: string;
  started_at: string;
  submitted_at: string | null;
  is_submitted: number;
  score: number | null;
  total: number | null;
}

export interface AssessmentAnswer {
  id: number;
  submission_id: number;
  question_id: number;
  submitted_sql: string | null;
  is_correct: number | null;
  executed_at: string | null;
}

export interface Dataset {
  id: number;
  name: string;
  display_name: string;
  filename: string;
  table_summary: string | null;
  created_at: string;
}
