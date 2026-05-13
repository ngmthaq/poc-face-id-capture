---
name: clean-code
description: "Clean Code — Unified reference for all clean code principles: SOLID, DRY, KISS, Separation of Concerns, and Atomic Design. Organized by development context: OOP, Functional, UI/Component, Backend/API, and Code Review. Use when writing, reviewing, or refactoring code in any language or paradigm."
---

# Clean Code

## How to Use This Skill

Find your development context below and apply the listed principles. Multiple sections may apply to a single task.

---

## Five categories with explicit load order:

- OOP Languages → SOLID → SoC → DRY
- Functional / General-Purpose → SoC → DRY → KISS
- UI / Component Development → Atomic Design → SoC → DRY → KISS
- Backend / API → SOLID → SoC → DRY → KISS
- Code Review → all applicable sub-skills + a checklist

---

## SOLID

**S — Single Responsibility Principle**
Every class, module, or function has **one and only one reason to change**.

```javascript
// Bad — validates, saves, emails, and logs in one class
class UserService {
  createUser(data) { /* validates + saves to DB + sends email + logs audit */ }
}

// Good — each class owns one concern
class UserValidator { validate(data) { ... } }
class UserRepository { save(user) { ... } }
class UserNotifier { sendWelcomeEmail(user) { ... } }
class UserService {
  constructor(validator, repository, notifier) { ... }
  createUser(data) { /* orchestrates the above */ }
}
```

**O — Open/Closed Principle**
Open for extension, closed for modification. Add behavior without editing existing code.

```javascript
// Bad — must edit this function for every new discount type
function calculateDiscount(type) {
  if (type === 'student') return 0.2;
  if (type === 'senior') return 0.3;
}

// Good — new discount = new class, no existing code touched
interface DiscountStrategy { calculate(): number }
class StudentDiscount implements DiscountStrategy { calculate() { return 0.2; } }
class SeniorDiscount implements DiscountStrategy { calculate() { return 0.3; } }
```

**L — Liskov Substitution Principle**
Subtypes must be substitutable for their base types without breaking correctness.

```javascript
// Bad — Penguin breaks the Bird contract
class Bird { fly() { ... } }
class Penguin extends Bird { fly() { throw new Error('Cannot fly'); } }

// Good — redesign the hierarchy to match reality
class Bird { move() { ... } }
class FlyingBird extends Bird { fly() { ... } }
class Penguin extends Bird { swim() { ... } }
```

**I — Interface Segregation Principle**
Clients should not be forced to depend on interfaces they don't use.

```javascript
// Bad — Robot must implement eat() and sleep()
interface Worker { work(): void; eat(): void; sleep(): void; }

// Good — split into focused interfaces
interface Workable { work(): void; }
interface Feedable { eat(): void; }
interface Restable { sleep(): void; }
// Robot implements only Workable
```

**D — Dependency Inversion Principle**
High-level modules depend on abstractions, not concrete implementations.

```javascript
// Bad — tightly coupled to MySQL and SMTP
class OrderService {
  private db = new MySQLDatabase();
  private mailer = new SmtpMailer();
}

// Good — depends on abstractions, injected externally
class OrderService {
  constructor(private db: Database, private mailer: Mailer) {}
}
```

**SOLID Enforcement Rules**

1. Before writing a class, identify its single responsibility and name it accordingly.
2. Before adding a conditional branch for a new variant, consider abstraction + extension.
3. Verify every subtype passes the substitutability test before merging.
4. Ask "will every implementor use every method?" — if not, split the interface.
5. High-level modules must reference abstractions, not concrete implementations.
6. Flag violations by principle name: "SRP violation: this class handles both X and Y."

---

## DRY — Don't Repeat Yourself

Every piece of knowledge has a **single, authoritative representation** in the system.

```javascript
// Bad — tax logic duplicated in three places
const tax = price * 0.08; // checkout
const tax = subtotal * 0.08; // order summary
const tax = amount * 0.08; // invoice

// Good — single source of truth
const TAX_RATE = 0.08;
function calculateTax(amount) {
  return amount * TAX_RATE;
}
```

```typescript
// Bad — same shape defined in three layers
type User = { id: string; email: string; role: string }; // API handler
type UserRecord = { id: string; email: string; role: string }; // DB layer
const mockUser = { id: "1", email: "a@b.com", role: "admin" }; // tests

// Good — import from one definition
// types/user.ts
export type User = { id: string; email: string; role: string };
```

**DRY Enforcement Rules**

1. Before copy-pasting, stop — extract a function, constant, or module first.
2. Before hardcoding a value, check if it appears elsewhere — if so, name it as a constant.
3. "Rule of Three": abstract on the third repetition, not the first.
4. Do not DRY prematurely — coincidentally similar code representing different concepts should stay separate.

---

## KISS — Keep It Simple, Stupid

Solutions should be **as simple as possible** to fulfill their requirements — no simpler, no more complex.

```javascript
// Bad — factory for something that only needs a function
class DataFetcherFactory {
  static create(type, config, middleware = [], plugins = []) { ... }
}

// Good
async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}
```

```python
# Bad — clever one-liner that requires study to understand
result = [x for x in data if x % 2 == 0 and x > 0 and x < 100 and x not in seen and not seen.add(x)]

# Good — readable loop
result = []
for x in data:
    if x % 2 == 0 and 0 < x < 100 and x not in seen:
        seen.add(x)
        result.append(x)
```

```javascript
// Bad — deep nesting
function processOrder(order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        if (order.status !== "cancelled") {
          /* logic */
        }
      }
    }
  }
}

// Good — guard clauses
function processOrder(order) {
  if (!order?.items?.length) return;
  if (order.status === "cancelled") return;
  // logic
}
```

**KISS Enforcement Rules**

1. Before adding an abstraction, ask: "What problem does this solve today?" If none, skip it.
2. When nesting more than 2 levels deep, use guard clauses or early returns.
3. Prefer language builtins over custom implementations.
4. Ask: "Would a competent developer unfamiliar with this codebase understand this in 30 seconds?" If no, simplify.
5. Flag complexity with: "KISS violation: can this be simplified to `[simpler form]`?"

---

## Atomic Design

Organize all UI components into five levels based on complexity and composition.

**Atoms** — smallest, indivisible elements. Context-agnostic, fully reusable.

```javascript
function Button({ label, variant, onClick, disabled }) {
  return (
    <button className={variant} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

**Molecules** — small groups of atoms functioning as a unit. Single clear purpose, minimal internal state.

```javascript
function SearchField({ onSearch }) {
  const [query, setQuery] = useState("");
  return (
    <div>
      <Input value={query} onChange={setQuery} />
      <Button label="Search" onClick={() => onSearch(query)} />
    </div>
  );
}
```

**Organisms** — complex UI sections composed of molecules and/or atoms. May contain business logic or state.

```javascript
function Header({ user, onSearch, onLogout }) {
  return (
    <header>
      <Logo />
      <NavBar items={mainNavItems} />
      <SearchField onSearch={onSearch} />
      <UserMenu user={user} onLogout={onLogout} />
    </header>
  );
}
```

**Templates** — page-level layout structures. Accept content via props/slots — no real data, no data fetching.

```javascript
function DashboardTemplate({ sidebar, header, mainContent, footer }) {
  return (
    <div className="dashboard-layout">
      <div className="sidebar">{sidebar}</div>
      <div className="main">
        {header}
        {mainContent}
        {footer}
      </div>
    </div>
  );
}
```

**Pages** — specific instances of templates with real data, API connections, routing, and side effects.

```javascript
function DashboardPage() {
  const user = useCurrentUser();
  const stats = useDashboardStats();
  return (
    <DashboardTemplate
      sidebar={<Sidebar user={user} />}
      header={<Header user={user} onSearch={handleSearch} />}
      mainContent={<StatsGrid stats={stats} />}
      footer={<Footer />}
    />
  );
}
```

**Folder Structure**

```
components/
├── atoms/         # Button, Input, Icon, Badge
├── molecules/     # SearchField, FormField, NavItem
├── organisms/     # Header, ProductCard, CommentSection
├── templates/     # DashboardTemplate, AuthTemplate
└── pages/         # HomePage, UserProfilePage
```

**Atomic Design Enforcement Rules**

1. Before creating a component, determine its level: "Does it compose other components? Which level are those?"
2. Atoms must never import other components from the same design system.
3. Molecules compose atoms — never duplicate atom logic inline.
4. Templates accept content via props/slots/children — never fetch data or hardcode organisms.
5. Pages are the **only** level that connects to routing, data fetching, and global state.
6. Flag misplacements: "This molecule imports an organism — hierarchy inversion."

---

## Separation of Concerns

Keep business logic out of components — the UI renders, the domain decides.

```javascript
// Bad — business rules inside a React component
function CheckoutPage({ cart }) {
  const tax = cart.total * 0.08;
  const discount = cart.items.length > 5 ? cart.total * 0.1 : 0;
  const finalPrice = cart.total + tax - discount;
  return <div>Total: {finalPrice}</div>;
}

// Good — domain logic extracted, UI only renders
function calculateOrderTotal(cart) {
  const tax = cart.total * TAX_RATE;
  const discount = cart.items.length > 5 ? cart.total * DISCOUNT_RATE : 0;
  return cart.total + tax - discount;
}

function CheckoutPage({ cart }) {
  const total = calculateOrderTotal(cart);
  return <div>Total: {total}</div>;
}
```

Divide the system into layers, each owning exactly one concern.

```python
# Bad — data access, business logic, and side effects all in one function
def process_refund(order_id):
    order = db.query("SELECT * FROM orders WHERE id = ?", order_id)
    if order.status != 'completed':
        raise ValueError("Only completed orders can be refunded")
    if (datetime.now() - order.created_at).days > 30:
        raise ValueError("Refund window expired")
    db.execute("UPDATE orders SET status='refunded'...")
    stripe.refund(order.payment_id)
    email.send(order.customer_email, "Refund processing")

# Good — each layer owns its concern
class OrderRepository:
    def find(self, order_id): ...
    def update_status(self, order_id, status): ...

class RefundService:
    def __init__(self, order_repo, payment_gateway, notifier): ...
    def process_refund(self, order_id):
        order = self.order_repo.find(order_id)
        self._validate_eligibility(order)            # business rules only
        self.payment_gateway.refund(order.payment_id)
        self.order_repo.update_status(order_id, 'refunded')
        self.notifier.send_refund_confirmation(order)
```

```typescript
// Bad — cross-cutting concerns inline
async function createUser(data: UserInput) {
  if (!currentUser.hasPermission('create_user')) throw new ForbiddenError();
  if (!data.email.includes('@')) throw new ValidationError('Invalid email');
  logger.info(`Creating user: ${data.email}`);
  const user = new User(data);
  await userRepo.save(user);
  logger.info(`User created: ${user.id}`);
  return user;
}

// Good — cross-cutting handled by decorators
@RequirePermission('create_user')
@ValidateInput(CreateUserSchema)
@LogOperation('createUser')
async function createUser(data: UserInput) {
  const user = new User(data);
  await userRepo.save(user);
  return user;
}
```

---

**SoC Enforcement Rules**

1. Business logic must be testable in isolation — no DB, no HTTP, no UI framework.
2. Controllers must be thin: validate input → call domain → return output. No business rules.
3. Repositories must be dumb: only translate between domain objects and storage.
4. Cross-cutting concerns belong in middleware/decorators — not inline in business functions.
5. Ask: "What would cause this to change?" Multiple unrelated reasons = mixed concerns.
6. Flag with: "SoC violation: this function handles both `[concern A]` and `[concern B]`."

---

## 🔄 Code Review — Checklist

Apply to any PR regardless of language or paradigm.

**SOLID** _(OOP)_

- [ ] SRP: Does each class/module have exactly one reason to change?
- [ ] OCP: Are new variants added by extension, not by editing existing conditionals?
- [ ] LSP: Do all subtypes honor the base class contract?
- [ ] ISP: Are interfaces focused — no methods that implementors won't use?
- [ ] DIP: Do high-level modules depend on abstractions, not concrete classes?

**DRY** _(All)_

- [ ] No duplicated logic, magic numbers, or copy-pasted blocks
- [ ] Shared types/schemas defined in one place
- [ ] Test setup uses factory functions, not repeated literals

**KISS** _(All)_

- [ ] No abstraction added for hypothetical future needs
- [ ] Nesting depth ≤ 2 levels (use guard clauses otherwise)
- [ ] No clever one-liners that require study to decode

**Separation of Concerns** _(All)_

- [ ] Business logic is free of UI, DB, and HTTP dependencies
- [ ] Controllers/handlers are thin
- [ ] Auth, logging, validation handled by middleware — not inline

**Atomic Design** _(UI only)_

- [ ] No data fetching below the Page level
- [ ] No business logic inside components
- [ ] No hierarchy inversions (molecule importing organism, etc.)

---

## Universal Rules

These apply unconditionally across all categories and principles:

1. **Name things after what they do.** If a name requires "and" or "or", it's doing too much.
2. **Test business logic in isolation.** No DB, no HTTP, no UI framework required.
3. **Flag violations by principle name** in reviews: "SRP violation", "DRY violation", "KISS violation", etc.
4. **Don't abstract prematurely.** Duplication must appear at least twice before extracting.
5. **Cross-cutting concerns** (auth, logging, validation) belong in middleware/decorators — never inline.
