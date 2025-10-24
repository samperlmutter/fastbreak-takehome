# Fastbreak Event Dashboard

A full-stack Sports Event Management application built with Next.js 15, TypeScript, Supabase, and Shadcn UI.

## Features

- **Authentication**
  - Email/password authentication
  - Google OAuth sign-in
  - Secure session management
  - Protected routes with middleware

- **Event Management**
  - Create, read, update, and delete events
  - Multiple venues per event
  - Rich event details (name, sport type, date/time, description)
  - Real-time search and filtering

- **Dashboard**
  - Responsive grid layout
  - Server-side rendering for optimal performance
  - Search by event name
  - Filter by sport type
  - Real-time updates

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Forms:** React Hook Form + Zod
- **Notifications:** Sonner

## Architecture Highlights

### Server Actions

All database interactions use Next.js Server Actions for type-safe, server-side data mutations:

- Type-safe with Zod validation
- Consistent error handling
- Automatic CSRF protection
- No client-side database calls

Key files:
- `lib/actions/auth.actions.ts` - Authentication actions
- `lib/actions/event.actions.ts` - Event CRUD operations
- `lib/actions/action-wrapper.ts` - Generic action wrapper for type safety

### Authentication Flow

1. **Middleware** (`middleware.ts`) - Refreshes sessions and protects routes
2. **Server-side clients** (`lib/supabase/server.ts`) - Secure database access
3. **Protected routes** - Automatic redirects for unauthenticated users

### Database Schema

- **events** - Main events table with RLS policies
- **venues** - Venues that can be reused across events
- **event_venues** - Many-to-many junction table

See `supabase/schema.sql` for the complete schema with Row Level Security policies.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fastbreak-takehome
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Supabase credentials to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Database Setup

1. Create a new Supabase project at https://supabase.com

2. Run the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL

3. (Optional) Configure Google OAuth:
   - In Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Using Docker Compose

1. Ensure your `.env.local` file has all required environment variables

2. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. The application will be available at http://localhost:3000

### Using Docker directly

1. Build the image:
   ```bash
   docker build -t fastbreak-dashboard .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your-url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
     fastbreak-dashboard
   ```

## Project Structure

```
├── app/
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── signup/        # Sign up page
│   │   └── callback/      # OAuth callback
│   ├── dashboard/         # Main dashboard
│   │   └── events/        # Event management pages
│   ├── layout.tsx         # Root layout with Toaster
│   └── page.tsx           # Root page (redirects)
├── components/
│   ├── auth/              # Auth components
│   ├── events/            # Event components
│   └── ui/                # Shadcn UI components
├── lib/
│   ├── actions/           # Server actions
│   │   ├── action-wrapper.ts    # Type-safe action helper
│   │   ├── auth.actions.ts      # Auth actions
│   │   └── event.actions.ts     # Event actions
│   ├── supabase/          # Supabase clients
│   │   ├── server.ts      # Server-side client
│   │   ├── middleware.ts  # Middleware client
│   │   └── types.ts       # Database types
│   └── utils.ts           # Utility functions
├── supabase/
│   └── schema.sql         # Database schema
├── middleware.ts          # Route protection
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Docker Compose config
```

## Key Features Implementation

### Type-Safe Server Actions

All server actions use a generic wrapper for consistent error handling:

```typescript
export const createEventAction = createAction({
  schema: createEventSchema,
  requireAuth: true,
  handler: async (input, userId) => {
    // Implementation
  }
})
```

### Form Handling

All forms use React Hook Form with Shadcn UI components:

```typescript
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {...}
})
```

### Loading States

- Skeleton loaders for data fetching
- Button loading states
- Disabled states during mutations
- Toast notifications for feedback

### Error Handling

- Field-level validation errors
- Global error messages
- Consistent error responses from server actions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel

3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy

### Other Platforms

The application uses Next.js standalone output mode and is compatible with any platform that supports Node.js or Docker.

## Security

- Row Level Security (RLS) enabled on all tables
- Server-side authentication checks
- Protected routes via middleware
- CSRF protection on all mutations
- No client-side database access

## Performance

- Server Components for optimal performance
- Server-side rendering for SEO
- Automatic code splitting
- Optimized images with Next.js Image
- Streaming with React Suspense

## Future Enhancements

- User profile management
- Event capacity and registration
- Email notifications
- Calendar integration
- Event categories and tags
- Advanced analytics

## License

This project is for demonstration purposes.

## Support

For issues or questions, please contact the development team.
