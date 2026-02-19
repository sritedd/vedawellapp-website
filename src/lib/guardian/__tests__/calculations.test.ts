/**
 * Business Logic Tests for Guardian Calculations
 * 
 * These tests verify ACTUAL CALCULATIONS with exact expected values.
 * They will catch real bugs like:
 * - Division by zero
 * - Off-by-one errors
 * - Threshold boundary issues
 * - Null/undefined handling
 */

import {
    // Variation functions
    calculateVariationTotal,
    calculateVariationPercent,
    filterApprovedVariations,
    calculateApprovedTotal,
    getVariationWarningLevel,
    // Payment functions
    calculatePaymentAmount,
    calculateTotalPaid,
    calculateRemainingBalance,
    findNextPaymentDue,
    validatePercentagesSum,
    generateMilestones,
    // Defect functions
    countDefectsByStatus,
    getOpenDefects,
    countDefectsBySeverity,
    calculateTotalReminders,
    isValidStatusTransition,
    createDefectStatusUpdate,
    countDefectsNeedingAttention,
    filterDefectsBySeverity,
    getCriticalDefects,
    // StageGate functions
    getBlockingItems,
    getOverridableItems,
    getHardBlockingItems,
    calculateStageProgress,
    canProceedToNextStage,
    canOverrideToNextStage,
    countRequirementsByCategory,
    // Budget functions
    calculateTotalBudgeted,
    calculateTotalActual,
    calculateBudgetVariance,
    getBudgetWarningLevel,
    calculateContingencyPercent,
    // Warranty functions
    calculateWarrantyExpiry,
    isWarrantyExpired,
    getWarrantyUrgencyLevel,
    // Inspection functions
    getInspectionStatusColor,
    getInspectionStatusLabel,
    countPassedInspections,
    countRequiredInspections,
    countCertificatesReceived,
    calculateInspectionProgress,
    isStageComplete,
    // Types
    Variation,
    PaymentStage,
    PaymentMilestone,
    Defect,
    StageRequirement,
    BudgetCategory,
    Inspection as InspectionType,
} from '../calculations';

// ==================================================
// VARIATION CALCULATION TESTS
// ==================================================

describe('Variation Calculations', () => {
    // -----------------------------------------
    // calculateVariationTotal
    // -----------------------------------------
    describe('calculateVariationTotal', () => {
        it('calculates single variation correctly', () => {
            const variations: Variation[] = [
                { id: '1', title: 'Test', additional_cost: 50000, status: 'pending' }
            ];
            expect(calculateVariationTotal(variations)).toBe(50000);
        });

        it('calculates multiple variations correctly', () => {
            const variations: Variation[] = [
                { id: '1', title: 'A', additional_cost: 10000, status: 'pending' },
                { id: '2', title: 'B', additional_cost: 20000, status: 'pending' },
                { id: '3', title: 'C', additional_cost: 30000, status: 'pending' },
            ];
            expect(calculateVariationTotal(variations)).toBe(60000);
        });

        it('handles null costs safely', () => {
            const variations: Variation[] = [
                { id: '1', title: 'A', additional_cost: null, status: 'pending' },
                { id: '2', title: 'B', additional_cost: 10000, status: 'pending' },
                { id: '3', title: 'C', additional_cost: null, status: 'pending' },
            ];
            expect(calculateVariationTotal(variations)).toBe(10000);
        });

        it('handles all null costs', () => {
            const variations: Variation[] = [
                { id: '1', title: 'A', additional_cost: null, status: 'pending' },
                { id: '2', title: 'B', additional_cost: null, status: 'pending' },
            ];
            expect(calculateVariationTotal(variations)).toBe(0);
        });

        it('returns 0 for empty array', () => {
            expect(calculateVariationTotal([])).toBe(0);
        });

        it('returns 0 for null/undefined input', () => {
            expect(calculateVariationTotal(null as any)).toBe(0);
            expect(calculateVariationTotal(undefined as any)).toBe(0);
        });

        it('handles negative costs (edge case)', () => {
            const variations: Variation[] = [
                { id: '1', title: 'Credit', additional_cost: -5000, status: 'approved' },
                { id: '2', title: 'Cost', additional_cost: 10000, status: 'pending' },
            ];
            expect(calculateVariationTotal(variations)).toBe(5000);
        });
    });

    // -----------------------------------------
    // calculateVariationPercent
    // -----------------------------------------
    describe('calculateVariationPercent', () => {
        it('calculates 10% correctly', () => {
            expect(calculateVariationPercent(50000, 500000)).toBe(10);
        });

        it('calculates 15% correctly', () => {
            expect(calculateVariationPercent(75000, 500000)).toBe(15);
        });

        it('calculates 5% correctly', () => {
            expect(calculateVariationPercent(25000, 500000)).toBe(5);
        });

        it('calculates fractional percentage', () => {
            expect(calculateVariationPercent(50001, 500000)).toBeCloseTo(10.0002, 4);
        });

        it('returns 0 when contract value is 0', () => {
            expect(calculateVariationPercent(50000, 0)).toBe(0);
        });

        it('returns 0 when contract value is negative', () => {
            expect(calculateVariationPercent(50000, -100000)).toBe(0);
        });

        it('handles 0% (no variations)', () => {
            expect(calculateVariationPercent(0, 500000)).toBe(0);
        });

        it('handles 100% (variations equal contract)', () => {
            expect(calculateVariationPercent(500000, 500000)).toBe(100);
        });

        it('handles over 100% (edge case)', () => {
            expect(calculateVariationPercent(600000, 500000)).toBe(120);
        });
    });

    // -----------------------------------------
    // getVariationWarningLevel - THRESHOLD TESTS
    // -----------------------------------------
    describe('getVariationWarningLevel', () => {
        // No warning tests
        it('returns "none" for 0%', () => {
            expect(getVariationWarningLevel(0)).toBe('none');
        });

        it('returns "none" for 5%', () => {
            expect(getVariationWarningLevel(5)).toBe('none');
        });

        it('returns "none" for 9.99%', () => {
            expect(getVariationWarningLevel(9.99)).toBe('none');
        });

        // Boundary: exactly 10%
        it('returns "warning" for exactly 10%', () => {
            expect(getVariationWarningLevel(10)).toBe('warning');
        });

        it('returns "warning" for 10.01%', () => {
            expect(getVariationWarningLevel(10.01)).toBe('warning');
        });

        it('returns "warning" for 12%', () => {
            expect(getVariationWarningLevel(12)).toBe('warning');
        });

        it('returns "warning" for 14.99%', () => {
            expect(getVariationWarningLevel(14.99)).toBe('warning');
        });

        // Boundary: exactly 15%
        it('returns "critical" for exactly 15%', () => {
            expect(getVariationWarningLevel(15)).toBe('critical');
        });

        it('returns "critical" for 15.01%', () => {
            expect(getVariationWarningLevel(15.01)).toBe('critical');
        });

        it('returns "critical" for 20%', () => {
            expect(getVariationWarningLevel(20)).toBe('critical');
        });

        it('returns "critical" for 100%', () => {
            expect(getVariationWarningLevel(100)).toBe('critical');
        });
    });

    // -----------------------------------------
    // filterApprovedVariations
    // -----------------------------------------
    describe('filterApprovedVariations', () => {
        it('filters only approved variations', () => {
            const variations: Variation[] = [
                { id: '1', title: 'A', additional_cost: 10000, status: 'approved' },
                { id: '2', title: 'B', additional_cost: 20000, status: 'pending' },
                { id: '3', title: 'C', additional_cost: 30000, status: 'approved' },
            ];
            const approved = filterApprovedVariations(variations);
            expect(approved.length).toBe(2);
            expect(approved.map(v => v.id)).toEqual(['1', '3']);
        });

        it('returns empty array when none approved', () => {
            const variations: Variation[] = [
                { id: '1', title: 'A', additional_cost: 10000, status: 'pending' },
                { id: '2', title: 'B', additional_cost: 20000, status: 'rejected' },
            ];
            expect(filterApprovedVariations(variations)).toEqual([]);
        });

        it('handles null input', () => {
            expect(filterApprovedVariations(null as any)).toEqual([]);
        });
    });

    // -----------------------------------------
    // calculateApprovedTotal
    // -----------------------------------------
    describe('calculateApprovedTotal', () => {
        it('calculates only approved totals', () => {
            const variations: Variation[] = [
                { id: '1', title: 'A', additional_cost: 10000, status: 'approved' },
                { id: '2', title: 'B', additional_cost: 20000, status: 'pending' },
                { id: '3', title: 'C', additional_cost: 30000, status: 'approved' },
            ];
            expect(calculateApprovedTotal(variations)).toBe(40000);
        });
    });
});

// ==================================================
// PAYMENT CALCULATION TESTS
// ==================================================

describe('Payment Calculations', () => {
    // -----------------------------------------
    // calculatePaymentAmount
    // -----------------------------------------
    describe('calculatePaymentAmount', () => {
        it('calculates 5% deposit correctly', () => {
            expect(calculatePaymentAmount(500000, 5)).toBe(25000);
        });

        it('calculates 15% base/slab correctly', () => {
            expect(calculatePaymentAmount(500000, 15)).toBe(75000);
        });

        it('calculates 20% frame correctly', () => {
            expect(calculatePaymentAmount(500000, 20)).toBe(100000);
        });

        it('handles 0% percentage', () => {
            expect(calculatePaymentAmount(500000, 0)).toBe(0);
        });

        it('handles 0 contract value', () => {
            expect(calculatePaymentAmount(0, 20)).toBe(0);
        });

        it('handles negative contract value', () => {
            expect(calculatePaymentAmount(-500000, 20)).toBe(0);
        });

        it('calculates fractional amounts correctly', () => {
            // 333333 * 5 / 100 = 16666.65
            expect(calculatePaymentAmount(333333, 5)).toBeCloseTo(16666.65, 2);
        });
    });

    // -----------------------------------------
    // validatePercentagesSum
    // -----------------------------------------
    describe('validatePercentagesSum', () => {
        it('returns true when percentages sum to 100', () => {
            const stages: PaymentStage[] = [
                { stage: 'Deposit', percentage: 5, certificates_required: [] },
                { stage: 'Slab', percentage: 15, certificates_required: [] },
                { stage: 'Frame', percentage: 20, certificates_required: [] },
                { stage: 'Lockup', percentage: 20, certificates_required: [] },
                { stage: 'Fixing', percentage: 15, certificates_required: [] },
                { stage: 'PC', percentage: 20, certificates_required: [] },
                { stage: 'Final', percentage: 5, certificates_required: [] },
            ];
            expect(validatePercentagesSum(stages)).toBe(true);
        });

        it('returns false when under 100', () => {
            const stages: PaymentStage[] = [
                { stage: 'Deposit', percentage: 5, certificates_required: [] },
                { stage: 'Slab', percentage: 15, certificates_required: [] },
            ];
            expect(validatePercentagesSum(stages)).toBe(false);
        });

        it('returns false when over 100', () => {
            const stages: PaymentStage[] = [
                { stage: 'Deposit', percentage: 60, certificates_required: [] },
                { stage: 'Slab', percentage: 60, certificates_required: [] },
            ];
            expect(validatePercentagesSum(stages)).toBe(false);
        });
    });

    // -----------------------------------------
    // calculateTotalPaid
    // -----------------------------------------
    describe('calculateTotalPaid', () => {
        it('sums only paid milestones', () => {
            const milestones: PaymentMilestone[] = [
                { id: '1', stage: 'Deposit', percentage: 5, amount: 25000, status: 'paid' },
                { id: '2', stage: 'Slab', percentage: 15, amount: 75000, status: 'paid' },
                { id: '3', stage: 'Frame', percentage: 20, amount: 100000, status: 'due' },
            ];
            expect(calculateTotalPaid(milestones)).toBe(100000);
        });

        it('returns 0 when nothing paid', () => {
            const milestones: PaymentMilestone[] = [
                { id: '1', stage: 'Deposit', percentage: 5, amount: 25000, status: 'pending' },
            ];
            expect(calculateTotalPaid(milestones)).toBe(0);
        });
    });

    // -----------------------------------------
    // calculateRemainingBalance
    // -----------------------------------------
    describe('calculateRemainingBalance', () => {
        it('calculates correct remaining balance', () => {
            expect(calculateRemainingBalance(500000, 100000)).toBe(400000);
        });

        it('returns 0 when fully paid', () => {
            expect(calculateRemainingBalance(500000, 500000)).toBe(0);
        });

        it('returns 0 when overpaid (edge case)', () => {
            expect(calculateRemainingBalance(500000, 600000)).toBe(0);
        });
    });

    // -----------------------------------------
    // findNextPaymentDue
    // -----------------------------------------
    describe('findNextPaymentDue', () => {
        it('finds the due milestone', () => {
            const milestones: PaymentMilestone[] = [
                { id: '1', stage: 'Deposit', percentage: 5, amount: 25000, status: 'paid' },
                { id: '2', stage: 'Slab', percentage: 15, amount: 75000, status: 'due' },
                { id: '3', stage: 'Frame', percentage: 20, amount: 100000, status: 'pending' },
            ];
            const next = findNextPaymentDue(milestones);
            expect(next?.stage).toBe('Slab');
            expect(next?.amount).toBe(75000);
        });

        it('returns null when none due', () => {
            const milestones: PaymentMilestone[] = [
                { id: '1', stage: 'Deposit', percentage: 5, amount: 25000, status: 'paid' },
                { id: '2', stage: 'Slab', percentage: 15, amount: 75000, status: 'pending' },
            ];
            expect(findNextPaymentDue(milestones)).toBeNull();
        });
    });

    // -----------------------------------------
    // generateMilestones
    // -----------------------------------------
    describe('generateMilestones', () => {
        const stages: PaymentStage[] = [
            { stage: 'Deposit', percentage: 5, certificates_required: [] },
            { stage: 'Slab', percentage: 15, certificates_required: [] },
            { stage: 'Frame', percentage: 20, certificates_required: [] },
        ];

        it('generates correct amounts', () => {
            const milestones = generateMilestones(stages, 500000);
            expect(milestones[0].amount).toBe(25000);  // 5% of 500k
            expect(milestones[1].amount).toBe(75000);  // 15% of 500k
            expect(milestones[2].amount).toBe(100000); // 20% of 500k
        });

        it('sets first milestone as paid', () => {
            const milestones = generateMilestones(stages, 500000);
            expect(milestones[0].status).toBe('paid');
        });

        it('sets second milestone as due', () => {
            const milestones = generateMilestones(stages, 500000);
            expect(milestones[1].status).toBe('due');
        });

        it('sets remaining milestones as pending', () => {
            const milestones = generateMilestones(stages, 500000);
            expect(milestones[2].status).toBe('pending');
        });

        it('handles 0 contract value', () => {
            expect(generateMilestones(stages, 0)).toEqual([]);
        });
    });
});

// ==================================================
// DEFECT CALCULATION TESTS
// ==================================================

describe('Defect Calculations', () => {
    const testDefects: Defect[] = [
        { id: '1', status: 'open', severity: 'critical', reminderCount: 2 },
        { id: '2', status: 'reported', severity: 'major', reminderCount: 1 },
        { id: '3', status: 'in_progress', severity: 'minor', reminderCount: 0 },
        { id: '4', status: 'rectified', severity: 'cosmetic', reminderCount: 3 },
        { id: '5', status: 'verified', severity: 'major', reminderCount: 1 },
    ];

    // -----------------------------------------
    // countDefectsByStatus
    // -----------------------------------------
    describe('countDefectsByStatus', () => {
        it('counts all statuses correctly', () => {
            const counts = countDefectsByStatus(testDefects);
            expect(counts.open).toBe(1);
            expect(counts.reported).toBe(1);
            expect(counts.in_progress).toBe(1);
            expect(counts.rectified).toBe(1);
            expect(counts.verified).toBe(1);
        });
    });

    // -----------------------------------------
    // getOpenDefects
    // -----------------------------------------
    describe('getOpenDefects', () => {
        it('excludes rectified and verified', () => {
            const open = getOpenDefects(testDefects);
            expect(open.length).toBe(3);
            expect(open.every(d => !['rectified', 'verified'].includes(d.status))).toBe(true);
        });
    });

    // -----------------------------------------
    // countDefectsBySeverity
    // -----------------------------------------
    describe('countDefectsBySeverity', () => {
        it('counts severities correctly', () => {
            const counts = countDefectsBySeverity(testDefects);
            expect(counts.critical).toBe(1);
            expect(counts.major).toBe(2);
            expect(counts.minor).toBe(1);
            expect(counts.cosmetic).toBe(1);
        });
    });

    // -----------------------------------------
    // calculateTotalReminders
    // -----------------------------------------
    describe('calculateTotalReminders', () => {
        it('sums all reminder counts', () => {
            expect(calculateTotalReminders(testDefects)).toBe(7); // 2+1+0+3+1
        });

        it('returns 0 for empty array', () => {
            expect(calculateTotalReminders([])).toBe(0);
        });
    });

    // -----------------------------------------
    // isValidStatusTransition
    // -----------------------------------------
    describe('isValidStatusTransition', () => {
        it('allows open -> reported', () => {
            expect(isValidStatusTransition('open', 'reported')).toBe(true);
        });

        it('allows reported -> in_progress', () => {
            expect(isValidStatusTransition('reported', 'in_progress')).toBe(true);
        });

        it('allows in_progress -> rectified', () => {
            expect(isValidStatusTransition('in_progress', 'rectified')).toBe(true);
        });

        it('allows rectified -> verified', () => {
            expect(isValidStatusTransition('rectified', 'verified')).toBe(true);
        });

        it('blocks verified -> any (terminal state)', () => {
            expect(isValidStatusTransition('verified', 'open')).toBe(false);
            expect(isValidStatusTransition('verified', 'rectified')).toBe(false);
        });

        it('allows disputed -> open (restart)', () => {
            expect(isValidStatusTransition('disputed', 'open')).toBe(true);
        });
    });

    // -----------------------------------------
    // createDefectStatusUpdate
    // -----------------------------------------
    describe('createDefectStatusUpdate', () => {
        it('creates basic status update', () => {
            const update = createDefectStatusUpdate('reported');
            expect(update.status).toBe('reported');
            expect(update.rectifiedDate).toBeUndefined();
            expect(update.verifiedDate).toBeUndefined();
        });

        it('adds rectifiedDate for rectified status', () => {
            const update = createDefectStatusUpdate('rectified');
            expect(update.status).toBe('rectified');
            expect(update.rectifiedDate).toBeDefined();
            expect(update.rectifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('adds verifiedDate for verified status', () => {
            const update = createDefectStatusUpdate('verified');
            expect(update.status).toBe('verified');
            expect(update.verifiedDate).toBeDefined();
            expect(update.verifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    // -----------------------------------------
    // countDefectsNeedingAttention
    // -----------------------------------------
    describe('countDefectsNeedingAttention', () => {
        it('counts defects not verified or rectified', () => {
            expect(countDefectsNeedingAttention(testDefects)).toBe(3);
        });

        it('returns 0 for empty array', () => {
            expect(countDefectsNeedingAttention([])).toBe(0);
        });
    });

    // -----------------------------------------
    // filterDefectsBySeverity
    // -----------------------------------------
    describe('filterDefectsBySeverity', () => {
        it('filters critical defects', () => {
            const critical = filterDefectsBySeverity(testDefects, 'critical');
            expect(critical.length).toBe(1);
        });

        it('filters major defects', () => {
            const major = filterDefectsBySeverity(testDefects, 'major');
            expect(major.length).toBe(2);
        });
    });

    // -----------------------------------------
    // getCriticalDefects
    // -----------------------------------------
    describe('getCriticalDefects', () => {
        it('returns only critical defects', () => {
            const critical = getCriticalDefects(testDefects);
            expect(critical.length).toBe(1);
            expect(critical[0].severity).toBe('critical');
        });
    });
});

// ==================================================
// STAGE GATE CALCULATION TESTS
// ==================================================

describe('Stage Gate Calculations', () => {
    const testRequirements: StageRequirement[] = [
        { id: '1', category: 'inspection', name: 'Inspection A', required: true, completed: true, blocksProgress: true },
        { id: '2', category: 'certificate', name: 'Certificate B', required: true, completed: false, blocksProgress: true },
        { id: '3', category: 'defect', name: 'Defects cleared', required: true, completed: false, blocksProgress: true, canOverride: true },
        { id: '4', category: 'variation', name: 'Variations signed', required: false, completed: true, blocksProgress: false },
    ];

    // -----------------------------------------
    // getBlockingItems
    // -----------------------------------------
    describe('getBlockingItems', () => {
        it('returns items that block progress', () => {
            const blocking = getBlockingItems(testRequirements);
            expect(blocking.length).toBe(2);
        });

        it('excludes completed items', () => {
            const blocking = getBlockingItems(testRequirements);
            expect(blocking.every(r => !r.completed)).toBe(true);
        });
    });

    // -----------------------------------------
    // getOverridableItems
    // -----------------------------------------
    describe('getOverridableItems', () => {
        it('returns only overridable blocking items', () => {
            const overridable = getOverridableItems(testRequirements);
            expect(overridable.length).toBe(1);
            expect(overridable[0].canOverride).toBe(true);
        });
    });

    // -----------------------------------------
    // getHardBlockingItems
    // -----------------------------------------
    describe('getHardBlockingItems', () => {
        it('returns non-overridable blocking items', () => {
            const hard = getHardBlockingItems(testRequirements);
            expect(hard.length).toBe(1);
            expect(hard[0].canOverride).toBeFalsy();
        });
    });

    // -----------------------------------------
    // calculateStageProgress
    // -----------------------------------------
    describe('calculateStageProgress', () => {
        it('calculates progress percentage', () => {
            expect(calculateStageProgress(testRequirements)).toBe(33); // 1 of 3 required
        });

        it('returns 100 for all completed', () => {
            const allDone = testRequirements.map(r => ({ ...r, completed: true }));
            expect(calculateStageProgress(allDone)).toBe(100);
        });

        it('returns 0 for none completed required', () => {
            const noneDone = testRequirements.map(r => ({ ...r, completed: false }));
            expect(calculateStageProgress(noneDone)).toBe(0);
        });
    });

    // -----------------------------------------
    // canProceedToNextStage
    // -----------------------------------------
    describe('canProceedToNextStage', () => {
        it('returns false when blocking items exist', () => {
            expect(canProceedToNextStage(testRequirements)).toBe(false);
        });

        it('returns true when no blocking items', () => {
            const allDone = testRequirements.map(r => ({ ...r, completed: true }));
            expect(canProceedToNextStage(allDone)).toBe(true);
        });
    });

    // -----------------------------------------
    // canOverrideToNextStage
    // -----------------------------------------
    describe('canOverrideToNextStage', () => {
        it('returns false when hard blocking items exist', () => {
            expect(canOverrideToNextStage(testRequirements)).toBe(false);
        });

        it('returns true when only soft blocks remain', () => {
            const onlySoft = testRequirements.map(r =>
                r.id === '2' ? { ...r, completed: true } : r
            );
            expect(canOverrideToNextStage(onlySoft)).toBe(true);
        });
    });

    // countRequirementsByCategory
    // -----------------------------------------
    describe('countRequirementsByCategory', () => {
        it('counts requirements by category', () => {
            const counts = countRequirementsByCategory(testRequirements);
            expect(counts.inspection.total).toBe(1);
            expect(counts.inspection.completed).toBe(1);
            expect(counts.certificate.total).toBe(1);
            expect(counts.certificate.completed).toBe(0);
        });
    });
});

// ==================================================
// BUDGET CALCULATION TESTS
// ==================================================

describe('Budget Calculations', () => {
    const testCategories: BudgetCategory[] = [
        { id: '1', name: 'Contract', budgeted: 500000, actual: 500000 },
        { id: '2', name: 'Variations', budgeted: 0, actual: 50000 },
        { id: '3', name: 'Contingency', budgeted: 50000, actual: 25000 },
    ];

    describe('calculateTotalBudgeted', () => {
        it('sums budgeted amounts', () => {
            expect(calculateTotalBudgeted(testCategories)).toBe(550000);
        });
    });

    describe('calculateTotalActual', () => {
        it('sums actual amounts', () => {
            expect(calculateTotalActual(testCategories)).toBe(575000);
        });
    });

    describe('calculateBudgetVariance', () => {
        it('calculates over budget variance', () => {
            expect(calculateBudgetVariance(575000, 550000)).toBe(25000);
        });

        it('calculates under budget variance', () => {
            expect(calculateBudgetVariance(500000, 550000)).toBe(-50000);
        });
    });

    describe('getBudgetWarningLevel', () => {
        it('returns none for 5% or less', () => {
            expect(getBudgetWarningLevel(5)).toBe('none');
        });

        it('returns warning for 5-10%', () => {
            expect(getBudgetWarningLevel(7)).toBe('warning');
        });

        it('returns critical for over 10%', () => {
            expect(getBudgetWarningLevel(15)).toBe('critical');
        });
    });

    describe('calculateContingencyPercent', () => {
        it('calculates percentage used', () => {
            expect(calculateContingencyPercent(25000, 50000)).toBe(50);
        });
    });
});

// ==================================================
// WARRANTY CALCULATION TESTS
// ==================================================

describe('Warranty Calculations', () => {
    describe('calculateWarrantyExpiry', () => {
        it('calculates days warranty expiry', () => {
            const warranty = { type: 'Test', duration: 90, unit: 'days' as const };
            const result = calculateWarrantyExpiry('2025-01-01', warranty);
            expect(result.toISOString().split('T')[0]).toBe('2025-04-01');
        });

        it('calculates years warranty expiry', () => {
            const warranty = { type: 'Test', duration: 2, unit: 'years' as const };
            const result = calculateWarrantyExpiry('2025-01-01', warranty);
            expect(result.getFullYear()).toBe(2027);
        });
    });

    describe('isWarrantyExpired', () => {
        it('returns false for future date', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            expect(isWarrantyExpired(futureDate)).toBe(false);
        });

        it('returns true for past date', () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);
            expect(isWarrantyExpired(pastDate)).toBe(true);
        });
    });

    describe('getWarrantyUrgencyLevel', () => {
        it('returns expired for null', () => {
            expect(getWarrantyUrgencyLevel(null)).toBe('expired');
        });

        it('returns urgent for under 30 days', () => {
            expect(getWarrantyUrgencyLevel(15)).toBe('urgent');
        });

        it('returns warning for under 90 days', () => {
            expect(getWarrantyUrgencyLevel(60)).toBe('warning');
        });

        it('returns ok for 90+ days', () => {
            expect(getWarrantyUrgencyLevel(120)).toBe('ok');
        });
    });
});

// ==================================================
// INSPECTION CALCULATION TESTS
// ==================================================

describe('Inspection Calculations', () => {
    const testInspections: InspectionType[] = [
        { id: '1', name: 'Slab', stage: 'Slab', status: 'passed', certificateRequired: true, certificateReceived: true },
        { id: '2', name: 'Frame', stage: 'Frame', status: 'passed', certificateRequired: true, certificateReceived: true },
        { id: '3', name: 'Lockup', stage: 'Lockup', status: 'scheduled', certificateRequired: true, certificateReceived: false },
        { id: '4', name: 'Final', stage: 'PC', status: 'pending', certificateRequired: true, certificateReceived: false },
        { id: '5', name: 'Optional', stage: 'PC', status: 'na', certificateRequired: false, certificateReceived: false },
    ];

    describe('getInspectionStatusColor', () => {
        it('returns correct color for passed', () => {
            expect(getInspectionStatusColor('passed')).toBe('bg-green-500');
        });

        it('returns correct color for failed', () => {
            expect(getInspectionStatusColor('failed')).toBe('bg-red-500');
        });
    });

    describe('getInspectionStatusLabel', () => {
        it('returns correct label for passed', () => {
            expect(getInspectionStatusLabel('passed')).toBe('✓ Passed');
        });

        it('returns correct label for pending', () => {
            expect(getInspectionStatusLabel('pending')).toBe('⏳ Pending');
        });
    });

    describe('countPassedInspections', () => {
        it('counts passed correctly', () => {
            expect(countPassedInspections(testInspections)).toBe(2);
        });
    });

    describe('countRequiredInspections', () => {
        it('excludes N/A from count', () => {
            expect(countRequiredInspections(testInspections)).toBe(4);
        });
    });

    describe('countCertificatesReceived', () => {
        it('counts received certificates', () => {
            expect(countCertificatesReceived(testInspections)).toBe(2);
        });
    });

    describe('calculateInspectionProgress', () => {
        it('calculates progress percentage', () => {
            expect(calculateInspectionProgress(testInspections)).toBe(50); // 2 of 4 required
        });
    });

    describe('isStageComplete', () => {
        it('returns true when all passed or N/A', () => {
            const complete = [
                { id: '1', name: 'A', stage: 'S', status: 'passed' as const, certificateRequired: true, certificateReceived: true },
                { id: '2', name: 'B', stage: 'S', status: 'na' as const, certificateRequired: false, certificateReceived: false },
            ];
            expect(isStageComplete(complete)).toBe(true);
        });

        it('returns false when pending exists', () => {
            expect(isStageComplete(testInspections)).toBe(false);
        });
    });
});
