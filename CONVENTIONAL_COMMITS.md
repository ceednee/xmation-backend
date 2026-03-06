# Conventional Commits Standard

> This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

---

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `feat` | Features | A new feature or capability |
| `fix` | Bug Fixes | A bug fix |
| `docs` | Documentation | Documentation only changes |
| `style` | Styles | Code style (formatting, missing semi colons, etc) |
| `refactor` | Refactoring | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance | Performance improvements |
| `test` | Tests | Adding or correcting tests |
| `chore` | Chores | Changes to build process, dependencies, etc |
| `ci` | CI/CD | Changes to CI configuration |
| `build` | Build | Changes to build system or external dependencies |
| `revert` | Reverts | Revert a previous commit |

---

## Scopes (Optional)

Common scopes for this project:

| Scope | Description |
|-------|-------------|
| `auth` | Authentication & authorization |
| `workflow` | Workflow features |
| `trigger` | Trigger implementations |
| `action` | Action implementations |
| `api` | API routes |
| `middleware` | Middleware |
| `db` | Database/Convex |
| `test` | Test files |
| `deps` | Dependencies |
| `config` | Configuration |

---

## Examples

### Features
```
feat: add NEW_FOLLOWER trigger

- Detect new followers via RapidAPI polling
- Trigger workflow actions when follower count increases
- Store follower data in Convex

feat(workflow): add dry-run mode

- Simulate workflow execution without affecting X
- Log actions that would be taken
- Return simulation results to user
```

### Bug Fixes
```
fix(auth): resolve token refresh issue

- Auto-refresh X tokens 5 minutes before expiry
- Update encrypted tokens in Convex
- Handle refresh failures gracefully

fix(api): correct rate limit headers

- Set correct X-RateLimit-Remaining value
- Add X-RateLimit-Reset timestamp
```

### Tests
```
test(trigger): add tests for HIGH_ENGAGEMENT trigger

- Test viral post detection
- Test engagement threshold calculation
- Test trigger firing conditions

test: add integration tests for workflow execution

- Test full workflow run from trigger to action
- Test dry-run mode accuracy
- Test error handling
```

### Documentation
```
docs: update CONVEX_AUTH_SETUP with troubleshooting

- Add section for common OAuth errors
- Document token refresh process
- Add environment variable reference

docs(api): document workflow endpoints

- Add request/response examples
- Document error codes
- Add Swagger annotations
```

### Refactoring
```
refactor(middleware): extract auth logic

- Move auth checks to separate functions
- Improve error message consistency
- Add type safety

refactor: simplify encryption service

- Remove duplicate code
- Add better error handling
```

### Chores
```
chore(deps): update Elysia to v1.0

- Update package.json
- Fix breaking changes
- Update tests

chore(config): add production environment variables

- Add RAPIDAPI_KEY validation
- Add Redis connection config
```

### CI/CD
```
ci: add GitHub Actions workflow

- Run tests on PR
- Deploy to Convex on merge
- Generate coverage reports
```

---

## Rules

1. **Use present tense**: "add feature" not "added feature"
2. **Use imperative mood**: "move cursor to..." not "moves cursor to..."
3. **Don't capitalize first letter**
4. **No period (.) at the end** of subject line
5. **Subject line max 72 characters**
6. **Body max 100 characters per line**
7. **Separate subject from body with blank line**
8. **Reference issues in footer**: `Closes #123`

---

## Breaking Changes

Add `!` after type/scope or use `BREAKING CHANGE:` in footer:

```
feat(api)!: change workflow response format

BREAKING CHANGE: workflow object now returns 'triggers' instead of 'triggerConfigs'

feat!: drop support for Node 18

BREAKING CHANGE: minimum Node version is now 20
```

---

## Commit Checklist

Before committing, check:

- [ ] Type is correct (`feat`, `fix`, `test`, etc.)
- [ ] Scope is appropriate (optional but recommended)
- [ ] Subject is clear and concise
- [ ] Subject is in imperative mood
- [ ] Subject is not capitalized
- [ ] No period at end of subject
- [ ] Body explains WHAT and WHY (not HOW)
- [ ] Tests pass (`bun test`)
- [ ] Lint passes (`bun run lint`)

---

## Quick Reference

```bash
# Feature
git commit -m "feat: add user authentication"

# Feature with scope
git commit -m "feat(auth): implement X OAuth flow"

# Feature with body
git commit -m "feat(workflow): add scheduling support" -m "- Support cron expressions" -m "- Add timezone handling"

# Fix
git commit -m "fix: correct rate limit calculation"

# Test
git commit -m "test(trigger): add NEW_MENTION tests"

# Docs
git commit -m "docs: update API documentation"

# Chore
git commit -m "chore(deps): update Convex to v1.12"
```

---

*Always follow this standard for consistent git history!*
