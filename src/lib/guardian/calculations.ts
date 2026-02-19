/**
 * Guardian Calculation Utilities
 * 
 * Pure functions for financial calculations in Guardian components.
 * Extracted for reliable unit testing without React/DOM dependencies.
 */

// ===========================================
// VARIATION INTERFACES
// ===========================================

export interface Variation {
    id: string;
    title: string;
    additional_cost: number | null;
    status: string;
    reason_category?: string;
}

// ===========================================
// PAYMENT INTERFACES
// ===========================================

export interface PaymentStage {
    stage: string;
    percentage: number;
    certificates_required: string[];
}

export interface PaymentMilestone {
    id: string;
    stage: string;
    percentage: number;
    amount: number;
    status: 'pending' | 'due' | 'paid';
}

// ===========================================
// VARIATION CALCULATIONS
// ===========================================

/**
 * Calculate total cost of all variations.
 * Handles null/undefined costs safely.
 */
export function calculateVariationTotal(variations: Variation[]): number {
    if (!variations || !Array.isArray(variations)) return 0;
    return variations.reduce((sum, v) => sum + (v.additional_cost || 0), 0);
}

/**
 * Calculate variation percentage of contract value.
 * Returns 0 if contract value is 0 or negative (prevents division by zero).
 */
export function calculateVariationPercent(totalVariations: number, contractValue: number): number {
    if (contractValue <= 0) return 0;
    return (totalVariations / contractValue) * 100;
}

/**
 * Filter only approved variations.
 */
export function filterApprovedVariations(variations: Variation[]): Variation[] {
    if (!variations || !Array.isArray(variations)) return [];
    return variations.filter(v => v.status === 'approved');
}

/**
 * Calculate total of approved variations only.
 */
export function calculateApprovedTotal(variations: Variation[]): number {
    return calculateVariationTotal(filterApprovedVariations(variations));
}

/**
 * Determine warning level based on variation percentage.
 * Returns: 'none' | 'warning' | 'critical'
 * 
 * Business Rules:
 * - < 10%: No warning
 * - >= 10% and < 15%: Warning
 * - >= 15%: Critical
 */
export function getVariationWarningLevel(percent: number): 'none' | 'warning' | 'critical' {
    if (percent >= 15) return 'critical';
    if (percent >= 10) return 'warning';
    return 'none';
}

// ===========================================
// PAYMENT CALCULATIONS
// ===========================================

/**
 * Calculate payment amount for a stage percentage.
 */
export function calculatePaymentAmount(contractValue: number, percentage: number): number {
    if (contractValue <= 0 || percentage <= 0) return 0;
    return (contractValue * percentage) / 100;
}

/**
 * Calculate total paid from milestones.
 */
export function calculateTotalPaid(milestones: PaymentMilestone[]): number {
    if (!milestones || !Array.isArray(milestones)) return 0;
    return milestones
        .filter(m => m.status === 'paid')
        .reduce((sum, m) => sum + m.amount, 0);
}

/**
 * Calculate remaining balance.
 */
export function calculateRemainingBalance(contractValue: number, totalPaid: number): number {
    return Math.max(0, contractValue - totalPaid);
}

/**
 * Find next payment due.
 */
export function findNextPaymentDue(milestones: PaymentMilestone[]): PaymentMilestone | null {
    if (!milestones || !Array.isArray(milestones)) return null;
    return milestones.find(m => m.status === 'due') || null;
}

/**
 * Validate that percentages sum to 100%.
 */
export function validatePercentagesSum(stages: PaymentStage[]): boolean {
    if (!stages || !Array.isArray(stages)) return false;
    const sum = stages.reduce((acc, s) => acc + s.percentage, 0);
    return sum === 100;
}

/**
 * Generate payment milestones from stages and contract value.
 */
export function generateMilestones(
    stages: PaymentStage[],
    contractValue: number
): PaymentMilestone[] {
    if (!stages || !Array.isArray(stages) || contractValue <= 0) return [];

    return stages.map((s, idx) => ({
        id: `milestone-${idx}`,
        stage: s.stage,
        percentage: s.percentage,
        amount: calculatePaymentAmount(contractValue, s.percentage),
        status: idx === 0 ? 'paid' as const : idx === 1 ? 'due' as const : 'pending' as const,
    }));
}

// ===========================================
// DEFECT CALCULATIONS
// ===========================================

export interface Defect {
    id: string;
    status: 'open' | 'reported' | 'in_progress' | 'rectified' | 'verified' | 'disputed';
    severity: 'critical' | 'major' | 'minor' | 'cosmetic';
    reminderCount: number;
}

/**
 * Count defects by status.
 */
export function countDefectsByStatus(defects: Defect[]): Record<string, number> {
    if (!defects || !Array.isArray(defects)) return {};
    return defects.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Get open defects (not verified or rectified).
 */
export function getOpenDefects(defects: Defect[]): Defect[] {
    if (!defects || !Array.isArray(defects)) return [];
    return defects.filter(d => !['verified', 'rectified'].includes(d.status));
}

/**
 * Count defects by severity.
 */
export function countDefectsBySeverity(defects: Defect[]): Record<string, number> {
    if (!defects || !Array.isArray(defects)) return {};
    return defects.reduce((acc, d) => {
        acc[d.severity] = (acc[d.severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Calculate total reminders sent.
 */
export function calculateTotalReminders(defects: Defect[]): number {
    if (!defects || !Array.isArray(defects)) return 0;
    return defects.reduce((sum, d) => sum + d.reminderCount, 0);
}

/**
 * Valid defect status transitions.
 * Returns true if the transition is allowed.
 */
export function isValidStatusTransition(
    currentStatus: Defect['status'],
    newStatus: Defect['status']
): boolean {
    const validTransitions: Record<Defect['status'], Defect['status'][]> = {
        'open': ['reported', 'disputed'],
        'reported': ['in_progress', 'rectified', 'disputed'],
        'in_progress': ['rectified', 'disputed'],
        'rectified': ['verified', 'disputed', 'open'], // Can reopen if not properly fixed
        'verified': [], // Terminal state
        'disputed': ['open', 'reported'], // Can restart the process
    };
    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Get the current date in YYYY-MM-DD format.
 */
export function getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Create status update object with appropriate date fields.
 */
export function createDefectStatusUpdate(
    newStatus: Defect['status']
): { status: Defect['status']; rectifiedDate?: string; verifiedDate?: string } {
    const update: { status: Defect['status']; rectifiedDate?: string; verifiedDate?: string } = {
        status: newStatus
    };

    if (newStatus === 'rectified') {
        update.rectifiedDate = getCurrentDateString();
    }
    if (newStatus === 'verified') {
        update.verifiedDate = getCurrentDateString();
    }

    return update;
}

/**
 * Count defects that need attention (not verified or rectified).
 */
export function countDefectsNeedingAttention(defects: Defect[]): number {
    return getOpenDefects(defects).length;
}

/**
 * Get defects by severity level.
 */
export function filterDefectsBySeverity(defects: Defect[], severity: Defect['severity']): Defect[] {
    if (!defects || !Array.isArray(defects)) return [];
    return defects.filter(d => d.severity === severity);
}

/**
 * Get critical defects.
 */
export function getCriticalDefects(defects: Defect[]): Defect[] {
    return filterDefectsBySeverity(defects, 'critical');
}

// ===========================================
// STAGE GATE CALCULATIONS
// ===========================================

export interface StageRequirement {
    id: string;
    category: 'inspection' | 'certificate' | 'defect' | 'variation' | 'payment';
    name: string;
    required: boolean;
    completed: boolean;
    blocksProgress: boolean;
    canOverride?: boolean;
}

/**
 * Get items that block stage progression.
 */
export function getBlockingItems(requirements: StageRequirement[]): StageRequirement[] {
    if (!requirements || !Array.isArray(requirements)) return [];
    return requirements.filter(r => r.required && r.blocksProgress && !r.completed);
}

/**
 * Get blocking items that can be overridden.
 */
export function getOverridableItems(requirements: StageRequirement[]): StageRequirement[] {
    return getBlockingItems(requirements).filter(r => r.canOverride);
}

/**
 * Get hard blocking items (cannot be overridden).
 */
export function getHardBlockingItems(requirements: StageRequirement[]): StageRequirement[] {
    return getBlockingItems(requirements).filter(r => !r.canOverride);
}

/**
 * Calculate stage completion progress percentage.
 */
export function calculateStageProgress(requirements: StageRequirement[]): number {
    if (!requirements || !Array.isArray(requirements)) return 0;
    const totalRequired = requirements.filter(r => r.required).length;
    if (totalRequired === 0) return 100;
    const completed = requirements.filter(r => r.required && r.completed).length;
    return Math.round((completed / totalRequired) * 100);
}

/**
 * Determine if stage can proceed (no blocking items).
 */
export function canProceedToNextStage(requirements: StageRequirement[]): boolean {
    return getBlockingItems(requirements).length === 0;
}

/**
 * Determine if override is possible (only soft blocks remain).
 */
export function canOverrideToNextStage(requirements: StageRequirement[]): boolean {
    const blocking = getBlockingItems(requirements);
    const hardBlocking = getHardBlockingItems(requirements);
    return hardBlocking.length === 0 && blocking.length > 0;
}

/**
 * Count requirements by category.
 */
export function countRequirementsByCategory(requirements: StageRequirement[]): Record<string, { total: number; completed: number }> {
    if (!requirements || !Array.isArray(requirements)) return {};
    return requirements.reduce((acc, r) => {
        if (!acc[r.category]) {
            acc[r.category] = { total: 0, completed: 0 };
        }
        acc[r.category].total++;
        if (r.completed) acc[r.category].completed++;
        return acc;
    }, {} as Record<string, { total: number; completed: number }>);
}

// ===========================================
// BUDGET CALCULATIONS
// ===========================================

export interface BudgetCategory {
    id: string;
    name: string;
    budgeted: number;
    actual: number;
}

/**
 * Calculate total budgeted amount.
 */
export function calculateTotalBudgeted(categories: BudgetCategory[]): number {
    if (!categories || !Array.isArray(categories)) return 0;
    return categories.reduce((acc, c) => acc + c.budgeted, 0);
}

/**
 * Calculate total actual spending.
 */
export function calculateTotalActual(categories: BudgetCategory[]): number {
    if (!categories || !Array.isArray(categories)) return 0;
    return categories.reduce((acc, c) => acc + c.actual, 0);
}

/**
 * Calculate budget variance (actual - budgeted).
 * Positive = over budget, Negative = under budget.
 */
export function calculateBudgetVariance(totalActual: number, totalBudgeted: number): number {
    return totalActual - totalBudgeted;
}

/**
 * Calculate variance as percentage of budget.
 */
export function calculateVariancePercent(variance: number, totalBudgeted: number): number {
    if (totalBudgeted <= 0) return 0;
    return (variance / totalBudgeted) * 100;
}

/**
 * Get budget warning level based on variance percent.
 */
export function getBudgetWarningLevel(variancePercent: number): 'none' | 'warning' | 'critical' {
    if (variancePercent > 10) return 'critical';
    if (variancePercent > 5) return 'warning';
    return 'none';
}

/**
 * Calculate contingency usage percentage.
 */
export function calculateContingencyPercent(contingencyActual: number, contingencyBudgeted: number): number {
    if (contingencyBudgeted <= 0) return 0;
    return (contingencyActual / contingencyBudgeted) * 100;
}

// ===========================================
// WARRANTY CALCULATIONS
// ===========================================

export interface WarrantyPeriod {
    type: string;
    duration: number;
    unit: 'days' | 'years';
}

/**
 * Calculate warranty expiry date from handover date.
 */
export function calculateWarrantyExpiry(handoverDate: Date | string, warranty: WarrantyPeriod): Date {
    const date = new Date(handoverDate);
    if (warranty.unit === 'days') {
        date.setDate(date.getDate() + warranty.duration);
    } else {
        date.setFullYear(date.getFullYear() + warranty.duration);
    }
    return date;
}

/**
 * Check if a warranty has expired.
 */
export function isWarrantyExpired(expiryDate: Date | string | null): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
}

/**
 * Calculate days until warranty expires.
 */
export function daysUntilWarrantyExpiry(expiryDate: Date | string | null): number | null {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get warranty status urgency level.
 */
export function getWarrantyUrgencyLevel(daysLeft: number | null): 'expired' | 'urgent' | 'warning' | 'ok' {
    if (daysLeft === null || daysLeft < 0) return 'expired';
    if (daysLeft < 30) return 'urgent';
    if (daysLeft < 90) return 'warning';
    return 'ok';
}

// ===========================================
// INSPECTION CALCULATIONS
// ===========================================

export interface Inspection {
    id: string;
    name: string;
    stage: string;
    status: 'pending' | 'scheduled' | 'passed' | 'failed' | 'na';
    certificateRequired: boolean;
    certificateReceived: boolean;
}

/**
 * Get CSS color class for inspection status.
 */
export function getInspectionStatusColor(status: Inspection['status']): string {
    switch (status) {
        case 'passed': return 'bg-green-500';
        case 'failed': return 'bg-red-500';
        case 'scheduled': return 'bg-blue-500';
        case 'pending': return 'bg-gray-300';
        case 'na': return 'bg-gray-200';
        default: return 'bg-gray-300';
    }
}

/**
 * Get display label for inspection status.
 */
export function getInspectionStatusLabel(status: Inspection['status']): string {
    switch (status) {
        case 'passed': return '✓ Passed';
        case 'failed': return '✗ Failed';
        case 'scheduled': return '📅 Scheduled';
        case 'pending': return '⏳ Pending';
        case 'na': return 'N/A';
        default: return 'Unknown';
    }
}

/**
 * Count passed inspections.
 */
export function countPassedInspections(inspections: Inspection[]): number {
    if (!inspections || !Array.isArray(inspections)) return 0;
    return inspections.filter(i => i.status === 'passed').length;
}

/**
 * Count total required inspections (excluding N/A).
 */
export function countRequiredInspections(inspections: Inspection[]): number {
    if (!inspections || !Array.isArray(inspections)) return 0;
    return inspections.filter(i => i.status !== 'na').length;
}

/**
 * Count certificates received.
 */
export function countCertificatesReceived(inspections: Inspection[]): number {
    if (!inspections || !Array.isArray(inspections)) return 0;
    return inspections.filter(i => i.certificateReceived).length;
}

/**
 * Count certificates required.
 */
export function countCertificatesRequired(inspections: Inspection[]): number {
    if (!inspections || !Array.isArray(inspections)) return 0;
    return inspections.filter(i => i.certificateRequired).length;
}

/**
 * Calculate inspection progress percentage.
 */
export function calculateInspectionProgress(inspections: Inspection[]): number {
    const passed = countPassedInspections(inspections);
    const required = countRequiredInspections(inspections);
    if (required === 0) return 100;
    return Math.round((passed / required) * 100);
}

/**
 * Check if all inspections for a stage are complete.
 */
export function isStageComplete(inspections: Inspection[]): boolean {
    if (!inspections || !Array.isArray(inspections) || inspections.length === 0) return true;
    return inspections.every(i => i.status === 'passed' || i.status === 'na');
}
