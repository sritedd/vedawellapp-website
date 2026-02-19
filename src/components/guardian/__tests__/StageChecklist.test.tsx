/**
 * Unit Tests for StageChecklist Component
 */

import { render } from '@testing-library/react';
import StageChecklist from '@/components/guardian/StageChecklist';

const defaultProps = {
    projectId: 'proj-1',
};

describe('StageChecklist', () => {
    it('renders without crashing', () => {
        const { container } = render(<StageChecklist {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles currentStage prop', () => {
        const { container } = render(<StageChecklist projectId="proj-1" currentStage="slab" />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles different stages', () => {
        const stages = ['slab', 'frame', 'lockup', 'fixing', 'completion'];
        stages.forEach(stage => {
            const { container, unmount } = render(<StageChecklist projectId="proj-1" currentStage={stage} />);
            expect(container.firstChild).toBeTruthy();
            unmount();
        });
    });
});
