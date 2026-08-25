# CreatorVault

A production-ready full-stack digital asset management platform. Organize, search, and collaborate on all your creative files - images, videos, documents, and more.

## Features

### Core Features
- **Project Management**: Create, edit, archive, and delete projects with cover images and descriptions
- **Asset Library**: Upload, preview, download, and organize digital assets (images, videos, audio, PDFs, documents, archives)
- **Smart Search**: Global search across projects, assets, tags, and descriptions with advanced filters
- **Favorites**: Star important assets for quick access
- **Trash & Recovery**: Soft-delete assets with restore and permanent delete options
- **Tags**: Color-coded tags for asset organization

### Collaboration
- **Role-Based Access**: Owner, Editor, Viewer permissions per project
- **Team Invitations**: Invite members via email with role assignment
- **Activity Logs**: Track all user actions across projects and assets
- **Notifications**: Real-time notifications for invitations, uploads, and changes

### Administration
- **Admin Dashboard**: System statistics, user management, activity monitoring
- **User Management**: Search, filter, activate/deactivate, change roles, delete users
- **System Stats**: Storage usage, upload trends, user activity

### User Experience
- **Dark/Light/System Mode**: Full theme support with persistence
- **Responsive Design**: Mobile-first approach with sidebar navigation
- **Drag & Drop Upload**: Multiple file upload with progress indicators
- **Keyboard Shortcuts**: Power user features like ⌘K for search
- **Loading & Error States**: Comprehensive UX for all async operations

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **Zustand** for state management
- **Axios** for API communication
- **React Hook Form** for form handling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Recharts** for analytics charts

### Backend
- **Node.js** with Express and TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** with access/refresh tokens
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Zod** for validation
- **Express Rate Limit** for API protection

### Database
- **PostgreSQL** with Prisma schema
- Comprehensive models: Users, Projects, Assets, Tags, Favorites, Notifications, ActivityLogs, Sessions, PasswordResetTokens

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

2. **Configure environment variables**
```bash
# Backend
cd server
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/creatorvault
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=http://localhost:5173
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
EMAIL_FROM=noreply@creatorvault.app
```

3. **Set up database**
```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

4. **Start development servers**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Demo Credentials
After running the seed script:
- **Admin**: admin@creatorvault.app / password123
- **Manager**: manager@creatorvault.app / password123
- **User**: user@creatorvault.app / password123

## Project Structure

```
CreatorVault/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Base components (Button, Input, Card, etc.)
│   │   │   └── layout/     # Layout components (Sidebar, Header, etc.)
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts (Auth, Theme, Notifications)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── api/            # API client and endpoints
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── validation/     # Zod schemas
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Entry point
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Seed script
└── shared/                 # Shared types (optional)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `POST /api/auth/change-password` - Change password

### Projects
- `GET /api/projects` - List projects (with pagination, search, filters)
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/members` - Invite member
- `PATCH /api/projects/:id/members/:userId` - Update member role
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Assets
- `POST /api/projects/:projectId/assets` - Upload assets (multipart)
- `GET /api/projects/:projectId/assets` - List assets (with filters, pagination)
- `GET /api/projects/:projectId/assets/:id` - Get asset details
- `PATCH /api/projects/:projectId/assets/:id` - Update asset
- `DELETE /api/projects/:projectId/assets/:id` - Delete asset (soft/hard)
- `POST /api/projects/:projectId/assets/:id/restore` - Restore deleted asset
- `POST /api/projects/:projectId/assets/:id/favorite` - Toggle favorite
- `POST /api/projects/:projectId/assets/:id/move` - Move asset between projects
- `GET /api/projects/:projectId/assets/:id/download` - Download asset
- `GET /api/assets/favorites` - Get user's favorites

### Search
- `GET /api/search` - Global search with filters
- `GET /api/search/suggestions` - Search suggestions

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

### Admin
- `GET /api/admin/users` - List users (with pagination, search, filters)
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id` - Update user (role, status)
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/activity` - System activity logs

## Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Short-lived access tokens (15min) + refresh tokens (7 days)
- **Secure Cookies**: HttpOnly, Secure, SameSite
- **Rate Limiting**: API rate limiting (100 req/15min)
- **Input Validation**: Zod schemas on all endpoints
- **File Validation**: MIME type checking, size limits, safe filename generation
- **Role-Based Access Control**: Backend-enforced permissions
- **IDOR Protection**: Ownership checks on all resources
- **CORS Configuration**: Restricted to frontend origin
- **Environment Variables**: No secrets in code

## Deployment

### Docker (Recommended)
```dockerfile
# Build frontend
FROM node:18-alpine AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build backend
FROM node:18-alpine AS backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app
COPY --from=backend /app/server/dist ./dist
COPY --from=backend /app/server/node_modules ./node_modules
COPY --from=backend /app/server/prisma ./prisma
COPY --from=frontend /app/client/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment-Specific Configs
- Use `.env.production` for production secrets
- Set `NODE_ENV=production`
- Configure PostgreSQL connection pooling
- Use managed database (RDS, Cloud SQL)
- Use object storage (S3, GCS) for files in production
- Set up reverse proxy (nginx) with SSL
- Configure logging and monitoring

## Testing

```bash
# Backend tests
cd server
npm run test

# Frontend tests
cd client
npm run test
```

## Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Run production build
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Real-time collaboration with WebSockets
- [ ] Advanced asset preview (video scrubbing, PDF rendering)
- [ ] Collections/albums within projects
- [ ] Batch operations (bulk tag, move, delete)
- [ ] API keys for programmatic access
- [ ] Webhooks for integrations
- [ ] Custom metadata fields
- [ ] Version history for assets
- [ ] AI-powered tagging and search
- [ ] Mobile app (React Native)

## Support

For issues and feature requests, please create a GitHub issue.