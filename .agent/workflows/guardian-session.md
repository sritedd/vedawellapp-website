---
description: How to continue working on HomeOwner Guardian across sessions
---

# Guardian Session Continuity

## Before Starting Any Work

1. **Read the app memory first**:
   ```
   guide/00-APP-MEMORY.md
   ```
   This is the single source of truth. It contains:
   - Current app state (architecture, DB, storage, tiers)
   - All completed work (with file references)
   - Gap analysis findings (what's missing)
   - Prioritized roadmap (what to work on next)
   - Key files reference (which files to read for context)

// turbo
2. Check the current component status:
   ```
   guide/05-COMPONENT-STATUS.md
   ```

3. **Pick the next item** from the roadmap (Section 4 of app memory)

## After Completing Work

// turbo-all

4. Update `guide/00-APP-MEMORY.md`:
   - Move completed items from Section 4 (Roadmap) → Section 2 (Completed Work)
   - Add files modified with notes
   - Update any component status changes
   - Add any new gaps discovered → Section 3

5. Run build verification:
   ```bash
   npx next build
   ```

6. Commit changes with a descriptive message referencing the gap/item addressed.

## Key Rules
- Do NOT fix M1 (Stripe yearly) until user says to proceed
- Always run `npx next build` after changes
- The gap analysis scores (Section 3) should be updated as features are built
- Priority order: Tier 1 → Tier 2 → Tier 3 → Tier 4
