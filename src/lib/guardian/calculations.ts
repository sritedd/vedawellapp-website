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
    certificates_required?: string[];
    certificates_received?: string[];
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
// INSURANCE VALIDATION
// ===========================================

interface StateInsuranceConfig {
    scheme: string;
    threshold: number;
    label: string;
    verifyUrl: string;
}

const STATE_INSURANCE: Record<string, StateInsuranceConfig> = {
    NSW: {
        scheme: 'HBCF (Home Building Compensation Fund)',
        threshold: 20000,
        label: 'HBCF Policy #',
        verifyUrl: 'https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing-and-registrations/public-register',
    },
    VIC: {
        scheme: 'Domestic Building Insurance (DBI)',
        threshold: 16000,
        label: 'DBI Policy #',
        verifyUrl: 'https://www.vba.vic.gov.au/consumers/home-building-insurance',
    },
    QLD: {
        scheme: 'QBCC Home Warranty Insurance',
        threshold: 3300,
        label: 'QBCC Insurance #',
        verifyUrl: 'https://www.qbcc.qld.gov.au/licence-search',
    },
    WA: {
        scheme: 'Home Indemnity Insurance',
        threshold: 20000,
        label: 'Home Indemnity Policy #',
        verifyUrl: 'https://www.commerce.wa.gov.au/building-commission/search-registered-building-service-providers',
    },
    SA: {
        scheme: "Builder's Indemnity Insurance",
        threshold: 12000,
        label: 'Indemnity Policy #',
        verifyUrl: 'https://plan.sa.gov.au',
    },
    TAS: {
        scheme: 'Building Practitioner Accreditation (voluntary insurance)',
        threshold: 20000,
        label: 'Accreditation #',
        verifyUrl: 'https://www.cbos.tas.gov.au/topics/housing-building/building-practitioners',
    },
    ACT: {
        scheme: 'ACT Fidelity Fund Certificate',
        threshold: 12000,
        label: 'Fidelity Certificate #',
        verifyUrl: 'https://www.accesscanberra.act.gov.au/s/building-and-construction',
    },
    NT: {
        scheme: 'Home Building Certification Fund (HBCF)',
        threshold: 12000,
        label: 'HBCF Policy #',
        verifyUrl: 'https://nt.gov.au/property/building-and-development/find-a-licensed-builder',
    },
};

/**
 * Get insurance config for a state.
 */
export function getStateInsuranceConfig(stateCode: string): StateInsuranceConfig | null {
    return STATE_INSURANCE[stateCode] || null;
}

/**
 * Check if insurance is required based on contract value and state threshold.
 */
export function isInsuranceRequired(contractValue: number, stateCode: string): boolean {
    const config = STATE_INSURANCE[stateCode];
    if (!config) return false;
    return contractValue >= config.threshold;
}

/**
 * Validate insurance status for a project.
 * Returns alerts that should be shown to the user.
 */
export interface InsuranceAlert {
    level: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
}

export function getInsuranceAlerts(
    contractValue: number,
    stateCode: string,
    policyNumber: string | undefined,
    insuranceExpiryDate: string | undefined,
): InsuranceAlert[] {
    const alerts: InsuranceAlert[] = [];
    const config = STATE_INSURANCE[stateCode];
    if (!config) return alerts;

    const required = contractValue >= config.threshold;

    if (required && !policyNumber) {
        alerts.push({
            level: 'critical',
            title: `${config.scheme} Required`,
            message: `Your contract value ($${contractValue.toLocaleString()}) exceeds the $${config.threshold.toLocaleString()} threshold. Your builder MUST have valid ${config.scheme} before work begins. Do NOT make any payments without this.`,
        });
    }

    if (policyNumber && insuranceExpiryDate) {
        const daysLeft = Math.ceil(
            (new Date(insuranceExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft < 0) {
            alerts.push({
                level: 'critical',
                title: 'Builder Insurance EXPIRED',
                message: `Your builder's ${config.scheme} expired ${Math.abs(daysLeft)} days ago. STOP all payments immediately and request an updated certificate.`,
            });
        } else if (daysLeft <= 30) {
            alerts.push({
                level: 'warning',
                title: 'Insurance Expiring Soon',
                message: `Your builder's ${config.scheme} expires in ${daysLeft} days. Request an updated certificate now.`,
            });
        }
    }

    return alerts;
}

// ===========================================
// COOLING-OFF PERIOD
// ===========================================

const STATE_COOLING_OFF: Record<string, { days: number; type: 'business' | 'calendar'; note: string }> = {
    NSW: { days: 5, type: 'business', note: 'Under Home Building Act 1989 s.7BA' },
    VIC: { days: 5, type: 'business', note: 'Under Domestic Building Contracts Act 1995' },
    QLD: { days: 5, type: 'business', note: 'Under QBCC Act 1991' },
    WA: { days: 0, type: 'business', note: 'No statutory cooling-off period for building contracts in WA' },
    SA: { days: 5, type: 'business', note: 'Under Building Work Contractors Act 1995' },
    TAS: { days: 5, type: 'business', note: 'Under Building Act 2016' },
    ACT: { days: 5, type: 'business', note: 'Under Building Act 2004' },
    NT: { days: 0, type: 'business', note: 'No statutory cooling-off period for building contracts in NT' },
};

/**
 * Get cooling-off period config for a state.
 */
export function getCoolingOffConfig(stateCode: string): { days: number; type: 'business' | 'calendar'; note: string } | null {
    return STATE_COOLING_OFF[stateCode] || null;
}

/**
 * Add business days to a date (skips weekends).
 */
export function addBusinessDays(startDate: Date | string, businessDays: number): Date {
    const date = new Date(startDate);
    let added = 0;
    while (added < businessDays) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++;
        }
    }
    return date;
}

/**
 * Calculate cooling-off end date and status.
 */
export interface CoolingOffStatus {
    endDate: Date;
    daysRemaining: number;
    isActive: boolean;
    stateNote: string;
    totalDays: number;
}

export function getCoolingOffStatus(
    contractSignedDate: string,
    stateCode: string,
): CoolingOffStatus | null {
    const config = STATE_COOLING_OFF[stateCode];
    if (!config || config.days === 0) return null;

    const endDate = config.type === 'business'
        ? addBusinessDays(contractSignedDate, config.days)
        : (() => { const d = new Date(contractSignedDate); d.setDate(d.getDate() + config.days); return d; })();

    const now = new Date();
    const msRemaining = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
        endDate,
        daysRemaining: Math.max(0, daysRemaining),
        isActive: daysRemaining > 0,
        stateNote: config.note,
        totalDays: config.days,
    };
}

// ===========================================
// STATE-SPECIFIC WARRANTY PERIODS
// ===========================================

const STATE_WARRANTY_PERIODS: Record<string, { structural: number; nonStructural: number }> = {
    NSW: { structural: 6, nonStructural: 2 },
    VIC: { structural: 6, nonStructural: 2 },
    QLD: { structural: 6.5, nonStructural: 0.5 },
    WA: { structural: 6, nonStructural: 2 },
    SA: { structural: 5, nonStructural: 1 },
    TAS: { structural: 6, nonStructural: 1 },
    ACT: { structural: 6, nonStructural: 2 },
    NT: { structural: 6, nonStructural: 1 },
};

/**
 * Get warranty periods for a state (in years).
 */
export function getStateWarrantyPeriods(stateCode: string): { structural: number; nonStructural: number } {
    return STATE_WARRANTY_PERIODS[stateCode] || STATE_WARRANTY_PERIODS['NSW'];
}

/**
 * Generate proactive warranty alerts based on handover date and state.
 */
export interface WarrantyAlert {
    level: 'critical' | 'warning' | 'info';
    type: string;
    title: string;
    message: string;
    daysLeft: number;
    expiryDate: Date;
}

export function getWarrantyAlerts(
    handoverDate: string,
    stateCode: string,
): WarrantyAlert[] {
    const alerts: WarrantyAlert[] = [];
    const periods = getStateWarrantyPeriods(stateCode);
    const handover = new Date(handoverDate);
    const now = new Date();

    // Non-structural warranty
    const nonStructExpiry = new Date(handover);
    nonStructExpiry.setFullYear(nonStructExpiry.getFullYear() + Math.floor(periods.nonStructural));
    nonStructExpiry.setMonth(nonStructExpiry.getMonth() + Math.round((periods.nonStructural % 1) * 12));
    const nonStructDays = Math.ceil((nonStructExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (nonStructDays <= 90 && nonStructDays > 0) {
        alerts.push({
            level: nonStructDays <= 14 ? 'critical' : nonStructDays <= 30 ? 'warning' : 'info',
            type: 'non-structural',
            title: `Non-Structural Warranty Expiring`,
            message: nonStructDays <= 14
                ? `Only ${nonStructDays} days left! Report ALL minor defects (paint, tiles, plumbing leaks) to your builder IN WRITING immediately.`
                : nonStructDays <= 30
                    ? `${nonStructDays} days remaining. Schedule a thorough inspection and document any cosmetic defects now.`
                    : `${nonStructDays} days remaining on your ${periods.nonStructural}-year non-structural warranty. Start inspecting for minor defects.`,
            daysLeft: nonStructDays,
            expiryDate: nonStructExpiry,
        });
    } else if (nonStructDays <= 0) {
        alerts.push({
            level: 'critical',
            type: 'non-structural',
            title: `Non-Structural Warranty Expired`,
            message: `Your ${periods.nonStructural}-year non-structural warranty expired ${Math.abs(nonStructDays)} days ago. You can no longer claim minor defects.`,
            daysLeft: nonStructDays,
            expiryDate: nonStructExpiry,
        });
    }

    // Structural warranty
    const structExpiry = new Date(handover);
    structExpiry.setFullYear(structExpiry.getFullYear() + Math.floor(periods.structural));
    structExpiry.setMonth(structExpiry.getMonth() + Math.round((periods.structural % 1) * 12));
    const structDays = Math.ceil((structExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (structDays <= 180 && structDays > 0) {
        alerts.push({
            level: structDays <= 30 ? 'critical' : structDays <= 90 ? 'warning' : 'info',
            type: 'structural',
            title: `Structural Warranty Expiring`,
            message: structDays <= 30
                ? `Only ${structDays} days left on your ${periods.structural}-year structural warranty! Get a professional building inspection NOW and report any structural issues in writing.`
                : structDays <= 90
                    ? `${structDays} days remaining. Schedule a professional structural inspection to identify any foundation, framing, or load-bearing defects.`
                    : `${structDays} days remaining on your ${periods.structural}-year structural warranty. Consider scheduling a professional inspection.`,
            daysLeft: structDays,
            expiryDate: structExpiry,
        });
    } else if (structDays <= 0) {
        alerts.push({
            level: 'critical',
            type: 'structural',
            title: `Structural Warranty Expired`,
            message: `Your ${periods.structural}-year structural warranty expired ${Math.abs(structDays)} days ago.`,
            daysLeft: structDays,
            expiryDate: structExpiry,
        });
    }

    // Defect liability period (90 days from handover — universal)
    const dlpExpiry = new Date(handover);
    dlpExpiry.setDate(dlpExpiry.getDate() + 90);
    const dlpDays = Math.ceil((dlpExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (dlpDays <= 90 && dlpDays > 0) {
        alerts.push({
            level: dlpDays <= 7 ? 'critical' : dlpDays <= 14 ? 'warning' : 'info',
            type: 'defect-liability',
            title: `Defect Liability Period`,
            message: dlpDays <= 7
                ? `Only ${dlpDays} days left in defect liability period! Builder MUST fix all reported defects within this window. Document everything with photos.`
                : `${dlpDays} days remaining. Your builder is obligated to fix all defects reported during this 90-day window.`,
            daysLeft: dlpDays,
            expiryDate: dlpExpiry,
        });
    }

    return alerts;
}

// ===========================================
// LICENSE VERIFICATION URLs
// ===========================================

export function getLicenseVerificationUrl(stateCode: string): string {
    const urls: Record<string, string> = {
        NSW: 'https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing-and-registrations/public-register',
        VIC: 'https://www.vba.vic.gov.au/consumers/check-a-builder-or-tradesperson',
        QLD: 'https://www.qbcc.qld.gov.au/licence-search',
        WA: 'https://www.commerce.wa.gov.au/building-commission/search-registered-building-service-providers',
        SA: 'https://plan.sa.gov.au',
        TAS: 'https://www.cbos.tas.gov.au/topics/housing-building/building-practitioners',
        ACT: 'https://www.accesscanberra.act.gov.au/s/building-and-construction',
        NT: 'https://nt.gov.au/property/building-and-development/find-a-licensed-builder',
    };
    return urls[stateCode] || urls['NSW'];
}

export function getLicenseVerificationLabel(stateCode: string): string {
    const labels: Record<string, string> = {
        NSW: 'Verify on Fair Trading',
        VIC: 'Verify on VBA',
        QLD: 'Verify on QBCC',
        WA: 'Verify on DMIRS',
        SA: 'Verify on PlanSA',
        TAS: 'Verify on CBOS',
        ACT: 'Verify on Access Canberra',
        NT: 'Verify on NT Gov',
    };
    return labels[stateCode] || 'Verify License';
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
