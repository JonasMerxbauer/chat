# Chat App

A modern chat application built for the [T3 Chat Cloneathon](https://cloneathon.t3.chat/) competition.

## Deployment

The app is available at [ZeroChat](https://zerochat.dev/)

## Tech Stack

- [Tanstack Start](https://tanstack.com/start) - Full-stack React framework
- [Zero](https://zero.rocicorp.dev/) - Real-time sync
- [Better Auth](https://better-auth.com/) - Authentication
- [AI SDK](https://ai-sdk.dev/) - AI integration
- [Neobrutalism Shadcn/ui](https://www.neobrutalism.dev/) - UI components

## Development

```bash
# Install dependencies
pnpm install

# Update .env with your database configuration
# Setup PostgreSQL database

# Initialize Zero
pnpm dev:zero

# Update database tables based on schema
# Run Zero again to sync schema
pnpm dev:zero

# Start development server
pnpm dev
```

## GitHub

[View on GitHub](https://github.com/JonasMerxbauer/chat)
