/**
 * Unit Tests for ChecklistItemCard Component
 */

import { render, fireEvent } from '@testing-library/react';
import ChecklistItemCard from '@/components/guardian/ChecklistItemCard';

const defaultProps = {
    item: {
        id: '1',
        title: 'Test Item',
        completed: false,
        category: 'general',
    },
    onToggle: jest.fn(),
};

describe('ChecklistItemCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<ChecklistItemCard {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles item with minimal fields', () => {
        const item = { id: '1', title: 'Test', completed: false };
        const { container } = render(<ChecklistItemCard item={item as any} onToggle={jest.fn()} />);
        expect(container.firstChild).toBeTruthy();
    });
});
