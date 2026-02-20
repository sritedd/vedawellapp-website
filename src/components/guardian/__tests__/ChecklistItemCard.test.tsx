/**
 * Unit Tests for ChecklistItemCard Component
 */

import { render } from '@testing-library/react';
import ChecklistItemCard from '@/components/guardian/ChecklistItemCard';

const defaultProps = {
    item: {
        id: '1',
        description: 'Test Item',
        is_completed: false,
    },
};

describe('ChecklistItemCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<ChecklistItemCard {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles item with all fields', () => {
        const item = { id: '1', description: 'Test', is_completed: false, is_critical: true, requires_photo: true };
        const { container } = render(<ChecklistItemCard item={item} />);
        expect(container.firstChild).toBeTruthy();
    });
});
