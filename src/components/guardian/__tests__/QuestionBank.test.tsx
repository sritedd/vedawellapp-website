/**
 * Unit Tests for QuestionBank Component
 */

import { render } from '@testing-library/react';
import QuestionBank from '@/components/guardian/QuestionBank';

describe('QuestionBank', () => {
    it('renders without crashing', () => {
        const { container } = render(<QuestionBank />);
        expect(container.firstChild).toBeTruthy();
    });
});
