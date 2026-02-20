/**
 * Unit Tests for StateWorkflowTimeline Component
 */

import { render } from '@testing-library/react';
import StateWorkflowTimeline from '@/components/guardian/StateWorkflowTimeline';

const defaultProps = {
    buildCategory: 'new_build' as const,
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
            const { container, unmount } = render(<StateWorkflowTimeline buildCategory="new_build" state={state} />);
            expect(container.firstChild).toBeTruthy();
            unmount();
        });
    });

    it('handles empty state', () => {
        const { container } = render(<StateWorkflowTimeline buildCategory="new_build" state="" />);
        expect(container.firstChild).toBeTruthy();
    });
});
