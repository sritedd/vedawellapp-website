/**
 * Unit Tests for BuildJourneyTimeline Component
 * NOTE: This component has NO props
 */

import { render } from '@testing-library/react';
import BuildJourneyTimeline from '@/components/guardian/BuildJourneyTimeline';

describe('BuildJourneyTimeline', () => {
    it('renders without crashing', () => {
        const { container } = render(<BuildJourneyTimeline />);
        expect(container.firstChild).toBeTruthy();
    });
});
