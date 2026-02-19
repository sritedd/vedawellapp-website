/**
 * Unit Tests for NotificationCenter Component
 */

import { render, waitFor } from '@testing-library/react';
import NotificationCenter from '@/components/guardian/NotificationCenter';

const defaultProps = {
    projectId: 'proj-1',
    projectName: 'Test Project',
};

describe('NotificationCenter', () => {
    it('renders without crashing', async () => {
        const { container } = render(<NotificationCenter {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles optional builderEmail', async () => {
        const { container } = render(
            <NotificationCenter
                projectId="proj-1"
                projectName="Test Project"
                builderEmail="builder@test.com"
            />
        );
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
