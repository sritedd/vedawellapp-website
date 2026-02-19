/**
 * Unit Tests for ConstructionGlossary Component
 */

import { render } from '@testing-library/react';
import ConstructionGlossary from '@/components/guardian/ConstructionGlossary';

describe('ConstructionGlossary', () => {
    it('renders without crashing', () => {
        const { container } = render(<ConstructionGlossary />);
        expect(container.firstChild).toBeTruthy();
    });
});
