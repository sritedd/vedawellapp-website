/**
 * Shared TypeScript interfaces for Guardian data models.
 * These mirror the Supabase database schema and are used across components.
 */

// ===========================================
// PROJECT
// ===========================================

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused';

export interface Project {
    id: string;
    user_id: string;
    name: string;
    builder_name: string;
    builder_license_number?: string;
    builder_abn?: string;
    builder_email?: string;
    hbcf_policy_number?: string;
    insurance_expiry_date?: string;
    contract_value: number;
    address: string;
    start_date: string;
    status: ProjectStatus;
    created_at: string;
}

// ===========================================
// VARIATION
// ===========================================

export type VariationStatus = 'draft' | 'sent' | 'approved' | 'rejected';
export type VariationReasonCategory = 'design_change' | 'site_condition' | 'regulatory' | 'builder_error';

export interface Variation {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    additional_cost: number;
    labour_cost?: number;
    material_cost?: number;
    status: VariationStatus;
    reason_category?: VariationReasonCategory;
    homeowner_signature_url?: string;
    builder_signature_url?: string;
    signed_at?: string;
    created_at: string;
}

// ===========================================
// DEFECT
// ===========================================

export type DefectSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';
export type DefectStatus = 'open' | 'reported' | 'in_progress' | 'rectified' | 'verified' | 'disputed';

export interface Defect {
    id: string;
    project_id: string;
    title: string;
    description: string;
    location: string;
    stage: string;
    severity: DefectSeverity;
    status: DefectStatus;
    reportedDate: string;
    dueDate?: string;
    rectifiedDate?: string;
    verifiedDate?: string;
    photos: string[];
    rectificationPhotos: string[];
    builderNotes?: string;
    homeownerNotes?: string;
    reminderCount: number;
    image_url?: string;
    created_at?: string;
}

// ===========================================
// STAGE
// ===========================================

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

export interface Stage {
    id: string;
    project_id: string;
    name: string;
    status: StageStatus;
    completion_date?: string;
    checklist_items?: ChecklistItem[];
    created_at: string;
}

// ===========================================
// CHECKLIST ITEM
// ===========================================

export interface ChecklistItem {
    id: string;
    stage_id: string;
    description: string;
    is_completed: boolean;
    is_critical?: boolean;
    requires_photo?: boolean;
    completed_at?: string;
    evidence_url?: string;
    created_at: string;
}

// ===========================================
// DOCUMENT
// ===========================================

export interface Document {
    id: string;
    project_id: string;
    type: string;
    name: string;
    file_url: string;
    uploaded_at: string;
}

// ===========================================
// CERTIFICATION
// ===========================================

export type CertificationStatus = 'pending' | 'uploaded' | 'verified' | 'expired';

export interface Certification {
    id: string;
    project_id: string;
    type: string;
    status: CertificationStatus;
    file_url?: string;
    expiry_date?: string;
    required_for_stage?: string;
    uploaded_at?: string;
    created_at: string;
}

// ===========================================
// INSPECTION
// ===========================================

export type InspectionStage = 'footing' | 'frame' | 'waterproof' | 'pre_plaster' | 'final';
export type InspectionResult = 'not_booked' | 'booked' | 'passed' | 'failed';

export interface InspectionRecord {
    id: string;
    project_id: string;
    stage: InspectionStage;
    scheduled_date?: string;
    result: InspectionResult;
    inspector_name?: string;
    notes?: string;
    report_url?: string;
    created_at: string;
}

// ===========================================
// WEEKLY CHECK-IN
// ===========================================

export interface WeeklyCheckInRecord {
    id: string;
    project_id: string;
    week_start: string;
    builder_responsive?: boolean;
    received_update?: boolean;
    notes?: string;
    created_at: string;
}
