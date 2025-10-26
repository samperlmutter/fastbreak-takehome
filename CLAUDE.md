# Fastbreak Event Dashboard - Architecture Guide

## 🏗️ Project Architecture Overview

This is a **full-stack Next.js 15 application** using the App Router with a strong emphasis on **server-side operations** and **type safety**.

---

## 📁 Project Structure

```
fastbreak-takehome/
├── app/                          # Next.js App Router (all routes)
│   ├── auth/                     # Authentication routes
│   │   ├── login/page.tsx        # Login page (client component with form)
│   │   ├── signup/page.tsx       # Signup page (client component with form)
│   │   └── callback/route.ts     # OAuth callback handler (route handler)
│   ├── dashboard/                # Protected dashboard area
│   │   ├── page.tsx              # Main dashboard (server component)
│   │   └── events/
│   │       ├── new/page.tsx      # Create event page
│   │       └── [id]/edit/page.tsx # Edit event page (dynamic route)
│   ├── layout.tsx                # Root layout with Toaster
│   ├── page.tsx                  # Root redirect (server component)
│   └── globals.css               # Global styles with CSS variables
│
├── components/                   # React components
│   ├── auth/
│   │   └── logout-button.tsx     # Client component for logout
│   ├── events/                   # Event-related components
│   │   ├── event-list.tsx        # Server component - fetches data
│   │   ├── event-card.tsx        # Server component - displays event
│   │   ├── event-filters.tsx     # Client component - search/filter UI
│   │   ├── event-form.tsx        # Client component - create/edit form
│   │   ├── delete-event-button.tsx # Client component - delete modal
│   │   └── event-list-skeleton.tsx # Loading state
│   └── ui/                       # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx              # React Hook Form integration
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── sonner.tsx            # Toast notifications
│       └── textarea.tsx
│
├── lib/                          # Core business logic
│   ├── actions/                  # Server Actions (THE HEART OF THE APP)
│   │   ├── action-wrapper.ts     # Generic type-safe action creator
│   │   ├── auth.actions.ts       # Auth: login, signup, logout, OAuth
│   │   ├── event.actions.ts      # Events: CRUD + search/filter
│   │   └── types.ts              # ActionResponse types
│   ├── supabase/                 # Database clients
│   │   ├── server.ts             # Server Component client
│   │   ├── middleware.ts         # Middleware client
│   │   └── types.ts              # Database schema types
│   └── utils.ts                  # Utility functions (cn for Tailwind)
│
├── middleware.ts                 # Route protection & session refresh
├── supabase/
│   └── schema.sql                # Complete database schema with RLS
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Docker orchestration
└── .env                          # Environment variables
```

---

## 🎯 Key Architectural Decisions

### 1. **Server Actions Over API Routes**
This was the primary requirement, and it's the core pattern throughout:

**Why Server Actions?**
- Type-safe end-to-end (TypeScript from client to database)
- No need to define API routes
- Automatic request deduplication
- Built-in CSRF protection
- Progressive enhancement ready

**Implementation:**
```typescript
// lib/actions/action-wrapper.ts - Generic wrapper
export function createAction<TInput, TOutput>(options: {
  schema?: ZodSchema<TInput>      // Validation
  requireAuth?: boolean            // Auth check
  handler: (input, userId?) => Promise<TOutput>
})
```

Every action follows this pattern:
1. Validates input with Zod
2. Checks authentication if required
3. Executes handler with user context
4. Returns consistent response format

**Example Usage:**
```typescript
// lib/actions/event.actions.ts
export async function createEventAction(input) {
  // Validation happens automatically
  // Auth check happens automatically
  // Returns: { success: true, data: event } or { success: false, error: "..." }
}
```

### 2. **Server Components by Default**
Most components are Server Components:

**Server Components:**
- `app/dashboard/page.tsx` - Fetches user data
- `components/events/event-list.tsx` - Calls `getEventsAction()`
- `components/events/event-card.tsx` - Pure presentation

**Client Components** (only when needed):
- Forms (need `useForm` hook)
- Interactive elements (buttons with `onClick`)
- Components using browser APIs

### 3. **Authentication Architecture**

**Three-Layer Auth System:**

**Layer 1: Middleware** (`middleware.ts`)
```typescript
// Runs on EVERY request
export async function middleware(request) {
  return await updateSession(request)  // Refreshes session
}
```
- Refreshes Supabase session automatically
- Redirects unauthenticated users from `/dashboard/*` to `/auth/login`
- Redirects authenticated users from `/auth/*` to `/dashboard`

**Layer 2: Server-Side Client** (`lib/supabase/server.ts`)
```typescript
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(...)  // Handles cookies securely
}

export async function getUser() {
  const supabase = await createClient()
  return await supabase.auth.getUser()
}
```
- Only runs on server
- Manages cookies securely
- Used in Server Components and Server Actions

**Layer 3: Server Actions** (`lib/actions/auth.actions.ts`)
- `signUpAction()` - Creates user account
- `loginAction()` - Authenticates user
- `logoutAction()` - Clears session
- `signInWithGoogleAction()` - OAuth flow

### 4. **Database Schema & RLS**

**Row Level Security (RLS) is CRITICAL:**

```sql
-- supabase/schema.sql

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),  -- Links to Supabase auth
  name VARCHAR(255),
  sport_type VARCHAR(100),
  date_time TIMESTAMPTZ,
  description TEXT,
  ...
);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);

-- Only owner can modify
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);
```

**Why RLS?**
- Security enforced at database level
- Even if someone bypasses your app, they can't access other users' data
- Works seamlessly with Supabase Auth

**Schema Structure:**
- `events` - Main events table
- `venues` - Reusable venue locations
- `event_venues` - Junction table (many-to-many)

### 5. **Form Handling Pattern**

All forms use the **same pattern** (`components/events/event-form.tsx`):

```typescript
// 1. Define schema
const eventFormSchema = z.object({
  name: z.string().min(1),
  sport_type: z.string().min(1),
  venues: z.array(...).min(1),
})

// 2. Initialize form
const form = useForm({
  resolver: zodResolver(eventFormSchema),
  defaultValues: { ... }
})

// 3. Handle submission
const onSubmit = async (data) => {
  const result = await createEventAction(data)
  if (result.success) {
    toast.success(result.message)
    router.push('/dashboard')
  } else {
    toast.error(result.error)
    // Set field errors if validation failed
  }
}

// 4. Render with Shadcn Form components
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="name" ... />
  </form>
</Form>
```

**Key Features:**
- Type-safe validation (Zod)
- Field-level error messages
- Loading states
- Toast notifications
- Shadcn Form component (as required)

---

## 🔥 Key Features Implementation

### **1. Event CRUD Operations**

**Create Event** (`lib/actions/event.actions.ts:56-147`):
```typescript
export async function createEventAction(input) {
  // 1. Validate input (Zod)
  // 2. Check authentication
  // 3. Insert event into database
  // 4. Create/link venues
  // 5. Revalidate dashboard cache
  // 6. Return success/error
}
```

**Read Events** with Search/Filter (`lib/actions/event.actions.ts:306-362`):
```typescript
export async function getEventsAction({ search, sportType }) {
  let query = supabase.from('events').select('*')

  if (search) query = query.ilike('name', `%${search}%`)
  if (sportType) query = query.eq('sport_type', sportType)

  // Fetch venues for each event (N+1 handled server-side)
  // Returns EventWithVenues[]
}
```

**Update Event** (`lib/actions/event.actions.ts:152-265`):
- Checks ownership (`user_id = auth.uid()`)
- Updates event
- Replaces venue associations

**Delete Event** (`lib/actions/event.actions.ts:270-301`):
- Cascade deletes venue associations
- RLS ensures only owner can delete

### **2. Real-Time Search & Filtering**

**Client-Side UI** (`components/events/event-filters.tsx`):
```typescript
const updateFilters = (newSearch, newSportType) => {
  const params = new URLSearchParams()
  if (newSearch) params.set('search', newSearch)
  if (newSportType) params.set('sportType', newSportType)

  startTransition(() => {
    router.push(`/dashboard?${params.toString()}`)
  })
}
```

**Server-Side Execution** (`app/dashboard/page.tsx`):
```typescript
export default async function DashboardPage({ searchParams }) {
  const params = await searchParams

  return (
    <Suspense fallback={<EventListSkeleton />}>
      <EventList
        searchQuery={params.search}
        sportTypeFilter={params.sportType}
      />
    </Suspense>
  )
}
```

**Why This Pattern?**
- Search params in URL (shareable, bookmarkable)
- Server-side filtering (secure, fast)
- Streaming with Suspense (progressive rendering)
- Loading states automatically handled

### **3. Protected Routes**

**Middleware Approach** (`middleware.ts`):
```typescript
export async function middleware(request) {
  const supabaseResponse = await updateSession(request)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isDashboard) {
    return NextResponse.redirect('/auth/login')
  }

  if (user && isAuthPage) {
    return NextResponse.redirect('/dashboard')
  }

  return supabaseResponse  // Must return this!
}
```

**Why Middleware?**
- Runs before page renders
- No flash of unauthorized content
- Session refresh happens automatically
- Single source of truth for auth

---

## 🎨 UI/UX Patterns

### **Shadcn UI Integration**
All components from `components/ui/` follow Shadcn's patterns:
- Composable primitives (Radix UI)
- Tailwind CSS styling
- Accessible by default
- Customizable with CSS variables

### **Toast Notifications**
```typescript
// Used throughout for user feedback
toast.success('Event created successfully')
toast.error(result.error)
```

### **Loading States**
- Skeleton components (`components/events/event-list-skeleton.tsx`)
- Button loading states (`disabled={isLoading}`)
- Suspense boundaries

---

## 🐳 Docker Architecture

**Multi-Stage Build** (`Dockerfile`):
1. **deps** - Install dependencies
2. **builder** - Build Next.js app (with build args for env vars)
3. **runner** - Minimal production image

**Key Points:**
- Build args pass `NEXT_PUBLIC_*` vars at build time
- Standalone output for smaller image
- Non-root user for security
- Only production dependencies

**Docker Compose** (`docker-compose.yml`):
- Reads `.env` file automatically
- Passes build args for Next.js public env vars
- Exposes port 3000
- Auto-restart on failure

---

## 🔐 Security Highlights

1. **No Client-Side Database Access** - All queries via Server Actions
2. **Row Level Security** - Database-enforced permissions
3. **Server-Only Secrets** - No API keys exposed to client
4. **CSRF Protection** - Built into Server Actions
5. **TypeScript** - Type safety throughout
6. **Middleware Auth** - Routes protected before rendering
7. **Input Validation** - Zod schemas on both client and server

---

## 📊 Data Flow Example

**Creating an Event:**
```
User fills form →
  Client component validates (Zod) →
    Server Action receives data →
      Validates again (server-side) →
        Checks auth (Supabase) →
          Inserts to DB (with RLS) →
            Revalidates cache →
              Returns response →
                Toast notification →
                  Router navigation →
                    Dashboard refreshes
```

---

## 🚀 Why This Architecture?

**Type Safety:**
- Zod schemas define contracts
- TypeScript enforces types
- No runtime surprises

**Performance:**
- Server Components = less JavaScript to client
- Streaming with Suspense
- Automatic code splitting

**Security:**
- Server-side operations
- RLS at database level
- No exposed credentials

**Developer Experience:**
- Clear patterns (every action follows same structure)
- Consistent error handling
- Self-documenting code

**User Experience:**
- Fast page loads (RSC)
- Immediate feedback (toasts)
- Progressive enhancement

---

## 📝 Common Patterns to Follow

### Adding a New Server Action

1. **Define Zod schema:**
```typescript
const myActionSchema = z.object({
  field: z.string().min(1, 'Required'),
})
```

2. **Create the action:**
```typescript
export async function myAction(input: MyInput): Promise<ActionResponse<MyOutput>> {
  const validation = myActionSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'Validation failed', fieldErrors: ... }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Auth required' }

  // Your logic here

  revalidatePath('/your-path')
  return { success: true, data: result }
}
```

3. **Use in component:**
```typescript
const result = await myAction(data)
if (result.success) {
  toast.success('Success!')
} else {
  toast.error(result.error)
}
```

### Adding a New Protected Route

1. Create page in `app/dashboard/`
2. Middleware automatically protects it
3. Use `getUser()` if you need user data:
```typescript
export default async function MyPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  // ...
}
```

### Adding a New Form

1. Define Zod schema
2. Create form with `useForm` and `zodResolver`
3. Use Shadcn Form components
4. Call Server Action on submit
5. Handle loading/error states

---

## 🐛 Common Gotchas

### Environment Variables
- `NEXT_PUBLIC_*` vars must be available at **build time**
- Docker needs build args for these
- Regular env vars only need to be at runtime

### Server vs Client Components
- If you see "useState/useEffect not defined", add `'use client'`
- If you need auth, prefer Server Components + Server Actions
- Client Components can't directly access database

### Supabase Auth
- Users are in `auth.users` table (managed by Supabase)
- Your tables reference `auth.users(id)` via foreign key
- RLS uses `auth.uid()` to get current user

### Middleware
- MUST return the supabaseResponse
- Runs on every request (keep it fast)
- Don't do heavy operations here

---

This architecture prioritizes **security and type safety** while maintaining **excellent performance** and **developer experience**. Every decision supports the core requirement: server-side operations with client-side interactivity only where necessary.
- i have the dev server running locally in another terminal tab, so you don't need to restart the server yourself. we have hot reloading active