/**
 * Unit Tests for BuilderActionList Component
 */

import { render } from '@testing-library/react';
import BuilderActionList from '@/components/guardian/BuilderActionList';

const defaultProps = {
    projectId: 'proj-1',
    projectName: 'Test Project',
    builderName: 'Test Builder',
};

describe('BuilderActionList', () => {
    it('renders without crashing', () => {
        const { container } = render(<BuilderActionList {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles empty projectId', () => {
        const { container } = render(<BuilderActionList projectId="" projectName="" builderName="" />);
        expect(container.firstChild).toBeTruthy();
    });
});
