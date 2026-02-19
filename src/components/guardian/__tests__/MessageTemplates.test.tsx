/**
 * Unit Tests for MessageTemplates Component
 */

import { render } from '@testing-library/react';
import MessageTemplates from '@/components/guardian/MessageTemplates';

describe('MessageTemplates', () => {
    it('renders without crashing', () => {
        const { container } = render(<MessageTemplates />);
        expect(container.firstChild).toBeTruthy();
    });
});
