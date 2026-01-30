# Client Job Manager

## Overview

Client Job Manager is a cross-platform mobile application built with Expo and React Native that helps small service business owners manage their clients and jobs. The app provides a clean, professional interface for tracking job status, managing client information, and viewing business statistics. It supports iOS, Android, and web platforms with a unified codebase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with native stack navigator and bottom tab navigator
- **State Management**: React Context API for auth and data, TanStack React Query for server state
- **UI Components**: Custom themed components with Reanimated 4 for animations
- **Styling**: StyleSheet-based with a centralized theme system supporting light/dark modes

### Directory Structure
- `client/` - React Native frontend application
  - `components/` - Reusable UI components (Cards, Buttons, Inputs, etc.)
  - `screens/` - Screen components for each route
  - `navigation/` - Navigation configuration (tabs and stack)
  - `context/` - Auth and Data context providers
  - `hooks/` - Custom hooks for theme, screen options, etc.
  - `lib/` - Utilities for storage and API queries
  - `constants/` - Theme colors, typography, spacing
- `server/` - Express backend API
- `shared/` - Shared types and database schema
- `assets/` - Images and static resources

### Backend Architecture
- **Framework**: Express 5 with TypeScript
- **Database Schema**: Drizzle ORM with PostgreSQL (schema defined, storage currently in-memory)
- **API Design**: RESTful endpoints prefixed with `/api`
- **CORS**: Dynamic origin handling for Replit domains and localhost development

### Data Storage
- **Client-side**: AsyncStorage for local persistence of clients, jobs, and user data
- **Server-side**: In-memory storage (`MemStorage` class) with Drizzle schema ready for PostgreSQL migration
- **Schema**: Users table with UUID primary keys, defined in `shared/schema.ts`

### Authentication
- **Method**: 4-digit PIN-based local authentication
- **Storage**: PIN stored locally via AsyncStorage
- **Flow**: Setup PIN on first launch, then PIN entry for subsequent sessions
- **State**: Managed via AuthContext with isAuthenticated flag
- **Logout**: Clears isAuthenticated flag, returns to PIN screen (PIN remains saved)
- **Platform Alerts**: Uses window.confirm() on web, Alert.alert() on native for confirmation dialogs

### Design Principles
- **Status-First Design**: Job status prominently displayed with color-coded indicators
- **Refined Professional**: Clean layouts with generous whitespace and clear visual hierarchy
- **Platform Adaptation**: Native feel on iOS/Android with web fallbacks where needed

## External Dependencies

### Core Framework
- **Expo**: Managed workflow with SDK 54
- **React Native**: 0.81.5 with new architecture enabled

### Navigation & UI
- **@react-navigation/native-stack**: Native navigation stack
- **@react-navigation/bottom-tabs**: Tab-based navigation
- **react-native-reanimated**: Animation library for smooth UI transitions
- **react-native-gesture-handler**: Gesture recognition
- **expo-haptics**: Haptic feedback for touch interactions
- **expo-blur**: Blur effects for headers and modals

### Data & State
- **@tanstack/react-query**: Server state management and caching
- **@react-native-async-storage/async-storage**: Local data persistence
- **drizzle-orm**: SQL ORM for database operations
- **drizzle-zod**: Schema validation with Zod integration

### Backend
- **Express**: Web server framework
- **pg**: PostgreSQL client (DATABASE_URL required for production)
- **http-proxy-middleware**: Request proxying for development

### Development
- **tsx**: TypeScript execution for server
- **esbuild**: Bundling for production server build
- **drizzle-kit**: Database migrations and schema management

## Features Completed

### Core Features (MVP)
1. **Client Management**: Create, edit, delete clients with contact info
2. **Job Management**: Create, edit, delete jobs with status tracking (not started, in progress, completed)
3. **Dashboard**: Shows active jobs, total clients, pending revenue with stat cards
4. **PIN Authentication**: 4-digit PIN setup and login

### Enhanced Features (January 2026)
5. **Invoicing System**: Full CRUD for invoices with line items, tax calculation, auto-incrementing invoice numbers (INV-0001), share/send functionality
6. **File Attachments**: Photo and document picker for jobs with thumbnail display, max 10 attachments per job
7. **Calendar View**: Custom calendar component with month navigation, day selection, job markers by status (colored dots by start/due dates)
8. **Client Notes & History**: Add/delete notes with 4 types (note, call, email, meeting), modal interface, chronological timeline with type icons
9. **Job Cost Tracking**: Labor hours x rate calculation, materials cost, other expenses list, total cost display, profit calculation when invoices are paid
12. **Quotes System**: Full CRUD for quotes with auto-incrementing quote numbers (QTE-0001), status tracking (draft/sent/accepted/rejected), valid until date, send/share functionality, convert accepted quotes to invoices; accessible from client details "Billing" tab and job details screen
10. **Country & Currency Settings**: 30+ countries supported, automatic currency symbol and formatting based on country selection, persisted in AsyncStorage, used throughout invoices, jobs, and dashboard
11. **Clear Data Confirmation**: Two-step confirmation flow (warning + PIN verification), shows deletion counts for clients/jobs/invoices/notes, requires correct PIN to proceed, handles incorrect PIN with error messages

### UI/UX Design
- Status-first design with color-coded indicators (gray=not started, blue=in progress, green=completed/paid, red=overdue)
- Tab navigation: Dashboard (Home), Clients, Jobs, Calendar, Profile
- Client details uses tabs for Jobs/Notes/Billing sections (Billing shows both quotes and invoices)
- Platform-specific dialogs (window.confirm on web, Alert.alert on native)

### Data Model
- **Clients**: name, company, email, phone, address, notes
- **Jobs**: title, description, status, startDate, dueDate, laborHours, laborRate, materialsCost, expenses[], attachments[]
- **Invoices**: invoiceNumber, lineItems[], subtotal, taxRate, taxAmount, total, status (draft/sent/paid/overdue)
- **Quotes**: quoteNumber, clientId, jobId?, lineItems[], subtotal, taxRate, taxAmount, total, status (draft/sent/accepted/rejected), validUntil, sentDate?, respondedDate?
- **ClientNotes**: content, type (note/call/email/meeting), timestamp
- **Expenses**: description, amount, date
- **Attachments**: uri, name, type (image/document)
- **UserSettings**: country, currency, locale (for regional formatting)

### Supported Currencies
USD, GBP, EUR, CAD, AUD, NZD, JPY, CNY, INR, BRL, MXN, CHF, SEK, NOK, DKK, SGD, HKD, KRW, ZAR, AED, SAR, PLN, THB, MYR, PHP, IDR, VND, TRY, RUB, ILS