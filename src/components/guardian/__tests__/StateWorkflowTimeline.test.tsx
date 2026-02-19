/**
 * Unit Tests for StateWorkflowTimeline Component
 */

import { render } from '@testing-library/react';
import StateWorkflowTimeline from '@/components/guardian/StateWorkflowTimeline';

const defaultProps = {
    buildType: 'residential',
    state: 'NSW',
};

describe('StateWorkflowTimeline', () => {
    it('renders without crashing', () => {
        const { container } = render(<StateWorkflowTimeline {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles different states', () => {
        const states = ['NSW', 'VIC', 'QLD'];
        states.forEach(state => {
            const { container, unmount } = render(<StateWorkflowTimeline buildType="residential" state={state} />);
            expect(container.firstChild).toBeTruthy();
            unmount();
        });
    });

    it('handles empty state', () => {
        const { container } = render(<StateWorkflowTimeline buildType="residential" state="" />);
        expect(container.firstChild).toBeTruthy();
    });
});
