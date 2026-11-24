# Project Change & Preservation Rules

> **STATUS:** IMMUTABLE / ENFORCED  
> **AUTHORITY:** Master Instruction from User  
> **ROLE:** Operating Protocol for All Future Development Tasks

---

## 1. The Master Source of Truth Principle

The existing codebase, assets, configurations, schemas, and design styles represent the **Master Source of Truth**.

1. **Zero Unilateral Changes:** Nothing changes automatically.
2. **Preservation Over Personal Preference:** Never rewrite working code, re-architect components, or replace libraries simply because another implementation pattern exists.
3. **Execution Agent Mandate:** The assistant does not determine *what* changes. The user controls *what* changes. The assistant determines *how* to implement those changes while strictly preserving everything else.

---

## 2. Prohibited Actions (Strictly Forbidden Without Explicit Permission)

The following actions are strictly forbidden unless the user gives direct, unambiguous authorization:
- ❌ Complete or partial UI redesigns.
- ❌ UI "modernization" or theme replacements.
- ❌ Global CSS modifications or variable overrides.
- ❌ Font, typography, or font-weight replacements.
- ❌ Color palette or gradient alterations.
- ❌ Sizing, margin, padding, or spacing changes.
- ❌ Component structural reorganizations.
- ❌ Icon library replacements or modifications.
- ❌ Animation or transition alterations.
- ❌ Responsive breakpoint changes.
- ❌ Framework or library migrations.
- ❌ Replacing dependencies or upgrading major versions.
- ❌ Modifying database schemas or API contracts without authorization.
- ❌ Deleting or removing existing functionality.
- ❌ Folder or file restructuring.
- ❌ Unsolicited refactoring or code cleanup.

---

## 3. The 10-Step Change Protocol

For every subsequent request from the user, follow this strict protocol:

1. **Understand the Requested Change:** Analyze the exact request, identifying core requirements and clear boundaries.
2. **Locate the Relevant Files:** Trace and isolate only the specific files directly responsible for the feature or fix.
3. **Analyze Dependencies:** Identify upstream and downstream dependencies (APIs, state, parent components, routes).
4. **Identify What Must Change:** Define the minimal surgical diff necessary to satisfy the instruction.
5. **Identify What Must Remain Untouched:** Explicitly delineate sibling components, unrelated routes, and parent layouts that must stay completely unaltered.
6. **Implement ONLY the Requested Modification:** Apply targeted changes without collateral edits.
7. **Preserve All Unrelated Functionality:** Ensure untouched pages, components, and services continue to operate identically.
8. **Follow the Existing Design System:** Apply existing tokens, classes, and styling rules verbatim (refer to `DESIGN_SYSTEM_LOCK.md`).
9. **Check for Regressions:** Execute regression tests, TypeScript checks, and build validations.
10. **Report Exactly What Changed:** Provide an itemized, file-by-file summary of edits with zero ambiguity.

---

## 4. Scope Boundary Rules

- **Component Scope:** If a change is requested for one component, do not redesign or alter the parent page or sibling components.
- **Page Scope:** If a change is requested for one page, do not modify other pages.
- **Backend Scope:** If a backend or API change is requested, do not modify frontend code unless strictly required and explicitly justified to the user.
- **Unclear Instructions:** If a request is ambiguous or vague, do NOT assume permission to make broad changes. STOP and ask for clarification.
- **Out-of-Scope Dependencies:** If fulfilling a request requires touching a file outside the original scope, STOP and explain why before making any edits.

---

## 5. Verification Checklist (Required After Every Change)

Before reporting a task as complete, perform these verification steps:

- [ ] **Run Relevant Tests:** Execute the relevant test scripts (e.g., `node scripts/test-route-content.cjs`, `node scripts/test-public-reviews-api.cjs`).
- [ ] **TypeScript Check:** Run `tsc -b` or verify TypeScript produces no compilation errors.
- [ ] **Integration Verification:** Run `node scripts/generate-runtime-env.cjs; node scripts/verify-integration.cjs`.
- [ ] **Production Build Check:** Run `npm run build` when practical to guarantee production bundler and pre-renderers succeed.
- [ ] **Route Verification:** Verify existing routes still resolve and serve expected assets.
- [ ] **Visual / Responsive Verification:** Verify mobile and desktop views preserve styling, alignments, and padding.
- [ ] **Console Inspection:** Ensure no runtime JavaScript errors, syntax warnings, or temporal dead zone crashes occur.
- [ ] **Git Diff Review:** Inspect `git diff` to ensure only the authorized lines in authorized files were touched.
