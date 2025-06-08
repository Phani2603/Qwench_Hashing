# QUENCH - Role-Based Access Control

A comprehensive Role-Based Access Control system built with Next.js 15, Node.js/Express, and MongoDB Atlas.

## Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role Management**: Admin and User roles with granular permissions
- **Protected Routes**: Client and server-side route protection
- **Admin Dashboard**: Comprehensive user management interface
- **One-time Admin Setup**: Secure initial administrator account creation
- **Dark/Light Mode**: Theme switching with system preference detection
- **Modern Sidebar Navigation**: Aceternity UI sidebar component with collapsible functionality
- **QR Code Generation**: Admin can generate and assign QR codes to users
- **Category Management**: Create and manage categories for organizing QR codes
- **QR Code Analytics**: View category distribution and usage statistics
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components

## Technology Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4.1
- shadcn/ui Components
- Aceternity UI Sidebar
- Lucide React Icons
- QR Code Generation and Verification

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose ODM
- JWT Authentication
- bcrypt Password Hashing
- QR Code Generation with qrcode package

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Git

### Backend Setup

1. Navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a `.env` file with your configuration:
\`\`\`env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/rbac-system
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
\`\`\`

4. Start the backend server:
\`\`\`bash
npm run dev
\`\`\`

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create a `.env.local` file:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will run on `http://localhost:3000`

## Initial Setup

### Creating the First Admin Account

1. Visit `http://localhost:3000/initial-admin-setup`
2. Fill in the admin details
3. Submit the form to create the first administrator
4. This route becomes inaccessible after the first admin is created

### User Registration

Regular users can sign up at `http://localhost:3000/signup` and will be assigned the "User" role by default.

## API Endpoints

### Authentication Routes
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/initial-admin-signup` - One-time admin creation
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/check-initial-setup` - Check if admin setup is needed

### User Routes
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/change-password` - Change user password
- `GET /api/user/dashboard` - User dashboard data

### Admin Routes
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:userId/role` - Update user role (admin only)
- `DELETE /api/admin/users/:userId` - Delete user (admin only)

### QR Code Management Routes
- `POST /api/qrcodes/generate` - Generate a new QR code and assign to a user (admin only)
- `GET /api/qrcodes` - Get all QR codes (admin only)
- `GET /api/qrcodes/user/:userId` - Get QR codes for a specific user
- `DELETE /api/qrcodes/:codeId` - Delete a QR code (admin only)

### Category Management Routes
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category (admin only)
- `PUT /api/categories/:categoryId` - Update a category (admin only)
- `DELETE /api/categories/:categoryId` - Delete a category (admin only)
- `GET /api/categories/analytics` - Get category usage analytics (admin only)

## User Roles

### Admin
- Full system access
- User management capabilities
- Access to admin dashboard
- Can view all users
- Can promote/demote users
- Can delete users (except themselves)

### User
- Standard application access
- Personal dashboard
- Profile management
- Cannot access admin features

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token authentication
- Role-based route protection
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Prevention of self-modification for admins

## UI Features

### Theme System
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Dark theme for low-light environments
- **System Mode**: Automatically follows system preference
- **Theme Persistence**: Remembers user's theme choice

### Navigation
- **Collapsible Sidebar**: Space-efficient navigation using Aceternity UI
- **Role-based Menu Items**: Different navigation options based on user role
- **Breadcrumb Navigation**: Clear page hierarchy indication
- **User Profile Dropdown**: Quick access to profile and settings

### Responsive Design
- **Mobile-first Approach**: Optimized for all screen sizes
- **Adaptive Layouts**: Components adjust to different viewports
- **Touch-friendly**: Optimized for mobile interactions

## Recent Updates (v2.1)

### QR Code Management System
- Added QR code generation and assignment functionality for admins
- Implemented QR code verification system
- Created QR code listing and management interface
- Added ability to categorize QR codes
- Integrated with MongoDB for QR code storage

### Theme System Implementation
- Added comprehensive dark/light mode support
- Implemented theme context with system preference detection
- Added theme toggle component with dropdown selection
- Updated all components to support theme variables

### Navigation Overhaul
- Replaced traditional navbar with Aceternity UI sidebar component
- Implemented collapsible sidebar with icon mode
- Added role-based navigation items
- Integrated breadcrumb navigation for better UX

### Enhanced User Experience
- Improved visual consistency across all pages
- Better color contrast in both light and dark modes
- Enhanced accessibility with proper ARIA labels
- Smoother transitions and animations

### Component Updates
- Updated all dashboard pages to use sidebar layout
- Enhanced profile and settings pages with new navigation
- Improved admin user management interface
- Better responsive behavior across all components

## Project Structure

\`\`\`
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── QRCode.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── admin.js
│   │   └── qrcode.js
│   ├── middleware/
│   │   └── auth.js
│   ├── public/
│   │   └── qrcodes/
│   ├── server.js
│   └── package.json
├── contexts/
│   ├── auth-context.tsx
│   └── theme-context.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── initial-admin-setup.tsx
│   │   └── route-guard.tsx
│   ├── layout/
│   │   └── app-sidebar.tsx
│   ├── profile/
│   │   └── profile-form.tsx
│   ├── admin/
│   │   ├── user-management.tsx
│   │   └── qr-code-generator.tsx
│   └── ui/
│       ├── theme-toggle.tsx
│       └── sidebar.tsx
├── app/
│   ├── login/
│   ├── signup/
│   ├── dashboard/
│   ├── profile/
│   ├── settings/
│   ├── admin/
│   ├── verify/
│   │   └── [codeId]/
│   │       └── page.tsx
│   └── initial-admin-setup/
└── README.md
\`\`\`

## Deployment

### Backend Deployment
1. Deploy to your preferred platform (Vercel, Railway, Heroku)
2. Set environment variables
3. Ensure MongoDB Atlas is accessible

### Frontend Deployment
1. Update `NEXT_PUBLIC_API_URL` to your backend URL
2. Deploy to Vercel or your preferred platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
\`\`\`

## Summary of Changes Made:

### 🎨 **Theme System Implementation**
- Added comprehensive dark/light mode support with system preference detection
- Created theme context and toggle component
- Updated all CSS variables for proper theme switching
- Enhanced visual consistency across both themes

### 🧭 **Navigation Overhaul** 
- Replaced traditional navbar with Aceternity UI sidebar component
- Implemented collapsible sidebar with icon mode
- Added role-based navigation items and breadcrumb navigation
- Integrated theme toggle directly into sidebar

### 📱 **Enhanced User Experience**
- Improved responsive design and mobile optimization
- Better color contrast and accessibility
- Smoother transitions and modern UI patterns
- Enhanced visual feedback and loading states

### 🔧 **Component Updates**
- Updated all dashboard pages to use new sidebar layout
- Enhanced profile and settings pages with improved navigation
- Better admin user management interface with dark mode support
- Consistent styling across all components

The system now features a modern, accessible interface with comprehensive theme support and intuitive navigation using the Aceternity UI sidebar component. All changes maintain backward compatibility while significantly improving the user experience.
