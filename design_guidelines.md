# Client Job Manager - Design Guidelines

## Brand Identity

**Purpose**: Empower small service business owners to manage clients and jobs confidently without complexity.

**Aesthetic Direction**: **Refined Professional** - A calm, trustworthy tool that feels capable, not chaotic. Clean layouts with generous whitespace, clear visual hierarchy, and subtle sophistication. Think: organized desk, not cluttered workshop.

**Memorable Element**: **Status-First Design** - Job status is always visible at a glance through bold color-coded indicators. Every list item shows status via a distinctive colored accent bar on the left edge.

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs) with Floating Action Button
- **Dashboard** (Home icon) - Overview of active jobs and quick stats
- **Clients** (Users icon) - Client directory
- **Jobs** (Briefcase icon) - All jobs list
- **Profile** (User icon) - Settings and account

**Floating Action Button**: Create new job (positioned above tab bar, center-right)

## Screen Specifications

### Authentication Flow
**Login Screen** (Stack-only, no header)
- Logo centered at top (1/3 of screen)
- "Sign in to continue" subheading
- Apple Sign In button
- Google Sign In button
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

### Dashboard (Tab 1)
**Purpose**: At-a-glance view of business health
**Header**: Transparent, title "Dashboard", no buttons
**Content**: Scrollable view
- Stats cards (3 metrics: Active Jobs, Total Clients, Jobs This Month)
- "Active Jobs" section with job cards (show top 5, "View All" link)
- Empty state: "No active jobs" with illustration
**Safe area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Clients Screen (Tab 2)
**Purpose**: Browse and manage client directory
**Header**: Transparent, title "Clients", right button "Add" (opens Add Client modal)
**Content**: Searchable list
- Search bar (sticky below header)
- Alphabetical list of client cards (name, company, phone, job count)
- Empty state: "No clients yet" with illustration
**Safe area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Jobs Screen (Tab 3)
**Purpose**: View and filter all jobs
**Header**: Transparent, title "Jobs", right button "Filter" (shows status filter sheet)
**Content**: Scrollable list
- Segmented control (All / Active / Completed)
- Job cards with left-edge status indicator (client name, job title, dates, status)
- Empty state: "No jobs found" with illustration
**Safe area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Profile Screen (Tab 4)
**Purpose**: User settings and account management
**Header**: Transparent, title "Profile"
**Content**: Scrollable view
- Avatar (centered, editable)
- Display name
- Settings sections: Preferences, Account (logout, delete account nested)
**Safe area**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Add/Edit Client (Modal)
**Header**: Default navigation, title "Add Client" / "Edit Client", left "Cancel", right "Save"
**Content**: Scrollable form
- Fields: Name*, Company, Email, Phone, Address (optional)
- Delete button (edit mode only, at bottom in red)
**Safe area**: bottom = insets.bottom + Spacing.xl

### Create/Edit Job (Modal or FAB action)
**Header**: Default navigation, title "New Job" / "Edit Job", left "Cancel", right "Save"
**Content**: Scrollable form
- Client picker (required)
- Job title*, Description
- Status dropdown (Not Started, In Progress, Completed)
- Start date, Due date
- Delete button (edit mode only)
**Safe area**: bottom = insets.bottom + Spacing.xl

### Job Details (Push navigation)
**Header**: Default navigation, title = job title, right "Edit"
**Content**: Scrollable view
- Status badge at top
- Job details (client link, dates, description)
- Action buttons: Mark Complete, Contact Client
**Safe area**: top = Spacing.xl, bottom = insets.bottom + Spacing.xl

## Color Palette

**Primary**: #2D5F8D (Professional blue - trustworthy, not generic)
**Accent**: #E67E22 (Warm orange - highlights status, CTAs)

**Backgrounds**:
- Background: #F8F9FA (Soft off-white)
- Surface: #FFFFFF (Pure white for cards)

**Text**:
- Primary: #1A1A1A (Near black)
- Secondary: #6B7280 (Medium gray)

**Status Colors**:
- Not Started: #94A3B8 (Gray)
- In Progress: #3B82F6 (Blue)
- Completed: #10B981 (Green)
- Error/Delete: #EF4444 (Red)

## Typography

**Font**: System default (SF Pro on iOS, Roboto on Android) for maximum legibility

**Type Scale**:
- Title (screen headers): 28pt, Bold
- Heading: 20pt, Semibold
- Subheading: 16pt, Semibold
- Body: 16pt, Regular
- Caption: 14pt, Regular
- Small: 12pt, Regular

## Visual Design

**Touchable Feedback**: All buttons/cards have 60% opacity on press

**Cards**: White background, 12pt corner radius, no shadow (rely on background contrast)

**Floating Action Button**: 
- 56pt diameter circle, Accent color
- Briefcase icon in white
- Shadow: offset {0, 2}, opacity 0.10, radius 2
- Position: 16pt from bottom (above tab bar), 16pt from right edge

**Status Indicator**: 4pt width vertical bar on left edge of job cards, colored by status

**Icons**: Use Feather icon set (@expo/vector-icons), 20-24pt size

## Assets to Generate

**icon.png** - App icon featuring a briefcase with checkmark, gradient from Primary to Accent
**WHERE USED**: Device home screen

**splash-icon.png** - Same as icon.png but optimized for splash screen
**WHERE USED**: App launch screen

**empty-jobs.png** - Illustration of empty clipboard/checklist, light gray, minimal
**WHERE USED**: Dashboard and Jobs screen when no jobs exist

**empty-clients.png** - Illustration of single outlined person silhouette, light gray
**WHERE USED**: Clients screen when no clients exist

**avatar-default.png** - Circular avatar with initials "ME" on Primary background
**WHERE USED**: Profile screen default avatar