# Contributing to @khannara/next-rbac

Thank you for your interest in contributing to next-rbac! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (Next.js version, Node version, database, etc.)
- **Code samples** or test cases if applicable

**Bug Report Template:**

```markdown
**Description:**
A clear description of the bug.

**Steps to Reproduce:**
1. Setup adapter with...
2. Call function...
3. See error...

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Environment:**
- next-rbac version:
- Next.js version:
- Node version:
- Database:
- OS:
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title** describing the enhancement
- **Provide detailed description** of the suggested enhancement
- **Explain why this would be useful** to most users
- **List examples** of how it would be used

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** for any new functionality
5. **Ensure tests pass**: `npm test`
6. **Ensure linter passes**: `npm run lint`
7. **Build the package**: `npm run build`
8. **Update documentation** if needed
9. **Commit with clear messages** following our commit guidelines
10. **Push to your fork** and submit a pull request

**Pull Request Checklist:**

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing (116+ tests, 96%+ coverage)
- [ ] Linter passes with no errors
- [ ] Build succeeds
- [ ] Documentation updated (README, JSDoc comments)
- [ ] Commit messages follow conventional commits
- [ ] PR description explains what/why/how

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/next-rbac.git
cd next-rbac

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Build package
npm run build
```

### Project Structure

```
next-rbac/
├── src/
│   ├── adapters/         # Database adapters
│   │   ├── base.ts       # Base adapter with caching
│   │   ├── mongodb.ts    # MongoDB adapter
│   │   ├── prisma.ts     # Prisma adapter (10+ databases)
│   │   ├── memory.ts     # In-memory adapter (testing)
│   │   └── __tests__/    # Adapter tests
│   ├── server/           # Server-side functions
│   │   ├── permissions.ts    # Permission checking
│   │   ├── middleware.ts     # Next.js middleware helpers
│   │   ├── inheritance.ts    # Role hierarchy utilities
│   │   └── __tests__/        # Server tests
│   ├── react/            # React components
│   │   └── gates.tsx     # PermissionGate, RoleGate
│   └── types/            # TypeScript types
│       └── index.ts      # Core types + module augmentation
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── dist/                 # Build output (generated)
└── coverage/             # Test coverage (generated)
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

**Test Requirements:**
- All new features must have tests
- Maintain 90%+ code coverage
- Tests must pass before PR is merged

### Code Style

We use ESLint and TypeScript for code quality:

```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Style Guidelines:**
- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use descriptive variable/function names
- Prefer async/await over promises

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(adapters): add Supabase adapter
fix(middleware): handle undefined user role
docs(readme): add Prisma PostgreSQL example
test(inheritance): add circular dependency tests
```

## Adding New Features

### Adding a New Adapter

1. Create adapter file: `src/adapters/your-adapter.ts`
2. Extend `BaseAdapter` for caching support
3. Implement `RBACAdapter` interface:
   - `findRole(roleName)`
   - `getUserRole(userId)`
   - `getRolePermissions(roleName)`
4. Add comprehensive tests: `src/adapters/__tests__/your-adapter.test.ts`
5. Export from `src/adapters/index.ts`
6. Document in README with examples
7. Update TypeScript types if needed

**Example:**

```typescript
import { BaseAdapter, type CacheConfig } from './base';
import type { Role, Permission, RoleDocument } from '../types';

export interface YourAdapterConfig extends CacheConfig {
  // Your config options
}

export class YourAdapter extends BaseAdapter {
  constructor(config: YourAdapterConfig) {
    super(config);
    // Initialize
  }

  async findRole(roleName: Role): Promise<RoleDocument | null> {
    return this.withCache(`role:${roleName}`, async () => {
      // Your implementation
    });
  }

  async getUserRole(userId: string): Promise<Role | null> {
    return this.withCache(`user-role:${userId}`, async () => {
      // Your implementation
    });
  }

  async getRolePermissions(roleName: Role): Promise<Permission[]> {
    const role = await this.findRole(roleName);
    return role?.permissions || [];
  }
}
```

### Adding Server Functions

1. Add function to `src/server/permissions.ts` (or appropriate file)
2. Export from `src/server/index.ts`
3. Add comprehensive tests
4. Document with JSDoc comments
5. Add examples to README

### Adding React Components

1. Add component to `src/react/gates.tsx`
2. Export from `src/react/index.tsx`
3. Add tests (if applicable)
4. Document props with TypeScript
5. Add usage examples to README

## Documentation

- **Code Comments**: Use JSDoc for all public APIs
- **README**: Update with new features, examples
- **Type Definitions**: Keep TypeScript types accurate
- **Examples**: Provide working code samples

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. Publish to npm (automated via GitHub Actions)

## Questions?

- Open a [GitHub Discussion](https://github.com/khannara/next-rbac/discussions)
- Check existing [Issues](https://github.com/khannara/next-rbac/issues)
- Read the [README](README.md)

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project README (for significant contributions)

Thank you for contributing to next-rbac! 🎉
