---
name: review-pull-request
description: "Review a pull request by fetching its description and code changes via MCP, then applying clean-code, security-scanner, and aaa-testing (when tests are present) checks. Use when: reviewing a PR, code review, pull request review, MR review, analyzing PR changes, checking code quality of PR, auditing a PR for security, reviewing test coverage or test quality. Requires MCP integration — will not run without it."
---

# Review Pull Request

Produces a structured code review by fetching a PR's description and diff via **MCP**.

---

## Procedure

### Step 1 — Verify MCP Availability

Search the available tools for any MCP integration that can:

- Fetch a PR/MR by number or URL
- Retrieve the currently active or in-viewport PR
- Read PR diff or file changes

If **no such tool is found** → reply to the user:

> "This skill requires an MCP integration with GitHub, GitLab, or Bitbucket to fetch PR data. No compatible MCP tool was found. Please configure one and retry."

Then **end the session**.

---

### Step 2 — Identify the Target PR

Resolve the PR to review using this priority order:

1. **Argument provided** (PR number or URL) → use the MCP tool that fetches a PR by number or URL.
2. **Active PR** → use the MCP tool that returns the currently active PR.
3. **PR in viewport** → use the MCP tool that returns the PR open in the editor viewport.
4. **No PR found** → ask the user: _"Which PR should I review? Please provide a PR number or URL."_

Collect from the resolved PR:

- Title and description (body)
- Author, base branch, head branch
- Labels and linked issues (if any)

---

### Step 3 — Fetch the Code Diff

Use the available MCP tool to retrieve the full diff / file-level changes for the PR.

**Large diffs (>400 changed lines):** Summarize by file/module instead of line-by-line.

Identify from the diff:

- Which files are modified/added/deleted
- Whether any test files are present (e.g., `*.test.*`, `*.spec.*`, `*_test.*`, files under `tests/`, `__tests__/`, `spec/`)
- Language(s) and framework(s) in use

---

### Step 4 — Check Requirements Conformance

Using the PR title, description (body), and linked issues collected in Step 2, cross-reference the diff to answer:

| Question                                                                          | How to check                                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Does every requirement stated in the description have corresponding code changes? | Map each stated goal / acceptance criterion to at least one changed file or function. |
| Are there code changes that are not explained by the description?                 | Flag unexplained changes — they may be unrelated or risky.                            |
| Does the PR description match what the code actually does?                        | Note any mismatch between the stated intent and the implementation.                   |
| Are linked issues / tickets addressed?                                            | If issue references are present, verify the related behavior is implemented.          |

For each gap or mismatch found, record:

- **Requirement** (quoted from the description or issue)
- **Status**: `Missing` / `Partial` / `Mismatch` / `Unexplained change`
- **Details** (which files or logic are involved)

---

### Step 5 — Load Sub-Skills

Load each sub-skill in full before applying it. Follow every rule and phase defined in the skill — do not summarize or skip steps.

| Sub-skill                                        | Load condition                             |
| ------------------------------------------------ | ------------------------------------------ |
| [clean-code](../clean-code/SKILL.md)             | Always                                     |
| [security-scanner](../security-scanner/SKILL.md) | Always                                     |
| [aaa-testing](../aaa-testing/SKILL.md)           | Only if test files are present in the diff |

> `security-scanner` runs inline against the diff — no external tool execution required. Apply its SAST patterns and AppSec deep audit phases manually.

---

### Step 6 — Apply Clean Code Review

Follow the **[clean-code](../clean-code/SKILL.md)** skill against the diff.

For each violation found, record:

- **File and line range** (from the diff)
- **Principle violated**
- **Explanation** (one sentence)
- **Suggested fix**

---

### Step 7 — Apply Security Scanner Review

Follow the **[security-scanner](../security-scanner/SKILL.md)** skill against the diff (inline static audit — do not execute external tools).

For each finding, record:

- **File and line range**
- **Severity**: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
- **CWE / OWASP category**
- **Explanation**
- **Remediation** (with code example)

---

### Step 8 — Apply AAA Testing Review _(skip if no test files in diff)_

Follow the **[aaa-testing](../aaa-testing/SKILL.md)** skill against the test files in the diff.

Also note:

- Missing test coverage for new logic introduced in the PR
- Shared setup that should be extracted to `beforeEach`/fixtures

---

### Step 9 — Produce the Review Report

Assemble a single structured Markdown report using the template below.

```markdown
## PR Review — [PR Title] (#[number])

**Author:** [author]  
**Base ← Head:** `[base-branch]` ← `[head-branch]`  
**Files changed:** [count]  
**Tests present:** Yes / No

---

### Summary

[2–4 sentence overview: overall quality, risk level, and whether the PR is ready to merge, needs minor changes, or needs major changes.]

---

### Requirements Conformance

| #   | Requirement | Status                                     | Details |
| --- | ----------- | ------------------------------------------ | ------- |
| 1   | ...         | Missing / Partial / Mismatch / Unexplained | ...     |

---

### Clean Code

#### Findings

| #   | File      | Line(s) | Principle | Description |
| --- | --------- | ------- | --------- | ----------- |
| 1   | `file.ts` | 42–55   | SRP       | ...         |

#### Suggestions

[List concrete refactors for the top 3–5 most impactful findings.]

---

### Security

#### Findings

| #   | Severity | File      | Line(s) | Category      | Description |
| --- | -------- | --------- | ------- | ------------- | ----------- |
| 1   | HIGH     | `file.ts` | 88      | SQLi (CWE-89) | ...         |

#### Remediations

[Provide code-level fixes for all CRITICAL and HIGH findings.]

---

### Testing _(omit section if no test files in diff)_

#### AAA Violations

| #   | File           | Test Name    | Violation                                                                 |
| --- | -------------- | ------------ | ------------------------------------------------------------------------- |
| 1   | `user.test.ts` | `test_login` | AAA violation: name describes implementation details rather than behavior |

#### Coverage Gaps

[List new logic from the diff that lacks test coverage.]

---

### Verdict

| Dimension    | Status                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| Requirements | ✅ Fully addressed / ⚠️ Partially addressed / ❌ Missing or mismatched           |
| Clean Code   | ✅ Approved / ⚠️ Minor issues / ❌ Major issues                                  |
| Security     | ✅ No findings / ⚠️ Low/Medium only / ❌ Critical/High findings                  |
| Testing      | ✅ Adequate / ⚠️ Gaps noted / ❌ Missing / ➖ N/A                                |
| **Overall**  | ✅ **Approve** / ⚠️ **Request Changes (minor)** / ❌ **Request Changes (major)** |
```

> - Use `✅` only when a dimension has zero findings or only cosmetic issues.
> - Use `⚠️` for findings that should be addressed but are not blockers.
> - Use `❌` when there is at least one CRITICAL/HIGH security finding, a major architectural violation, or tests are entirely absent for new logic.
> - Overall verdict is the **worst** of the three dimensions.

---

### Step 10 — Offer to Post Review via MCP

After displaying the report, ask:

```markdown
> _"Should I post this review as a comment on PR #[number] using MCP?"_

Review Comments:

| File           | Line | Comment                                                                                        |
| -------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `file.ts`      | 42   | "SRP violation: this function does too much. Need to refactor into smaller functions."         |
| `file.ts`      | 88   | "Avoid interpolating user input directly into SQL queries. Use parameterized queries instead." |
| `file.spec.ts` | 40   | "AAA violation: test name describes implementation details rather than behavior. "             |
```

If confirmed, use the appropriate MCP tool to submit the review comment. Prefer submitting as a **review** (not a plain comment) so line-level annotations are preserved where possible.

---

## Notes

- Never expose secrets, credentials, or internal environment values found in the diff in the review report — redact them as `[REDACTED]` and flag the finding.
- If the PR description is empty or very sparse, note this in the Summary as a process issue.
- This skill is read-only by default. It does not modify any files unless the user explicitly asks for auto-fixes.
