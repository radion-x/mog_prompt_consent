export type Bindings = {
  DB: D1Database;
}

export interface Patient {
  id?: number;
  name: string;
  date_of_birth: string;
  hospital?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id?: number;
  patient_id: number;
  session_token: string;
  current_step: number;
  completed_steps: number[];
  status: 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface ODIResponse {
  session_id: number;
  pain_intensity: number;
  personal_care: number;
  lifting: number;
  walking: number;
  sitting: number;
  standing: number;
  sleeping: number;
  sex_life: number;
  social_life: number;
  travelling: number;
  total_score: number;
}

export interface VASResponse {
  session_id: number;
  neck_pain: number;
  right_arm: number;
  left_arm: number;
  back_pain: number;
  right_leg: number;
  left_leg: number;
}

export interface EQ5DResponse {
  session_id: number;
  mobility: number;
  personal_care: number;
  usual_activities: number;
  pain_discomfort: number;
  anxiety_depression: number;
  health_scale: number;
}

export interface SurgicalConsent {
  session_id: number;
  procedure_name: string;
  consent_items: Record<string, boolean>;
  patient_signature?: string;
  witness_signature?: string;
  signed_at?: string;
}

export interface IFCResponse {
  session_id: number;
  quote_number: string;
  item_number: string;
  description: string;
  fee: number;
  rebate: number;
  gap: number;
  patient_signature?: string;
  signed_at?: string;
}
