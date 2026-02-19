/**
 * Unit Tests for InspectionTimeline Component
 */

import { render, waitFor } from '@testing-library/react';
import InspectionTimeline from '@/components/guardian/InspectionTimeline';

const defaultProps = {
    projectId: 'proj-1',
    currentStage: 'frame',
};

describe('InspectionTimeline', () => {
    it('renders without crashing', async () => {
        const { container } = render(<InspectionTimeline {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles different stages', async () => {
        const { container } = render(<InspectionTimeline projectId="proj-1" currentStage="slab" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
