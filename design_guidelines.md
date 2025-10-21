# Design Guidelines: Dual-Factor Authentication System

## Design Approach

**System Selection**: Modern SaaS Dashboard Design (inspired by Linear, Vercel, and Stripe dashboards)

**Rationale**: This utility-focused security application requires clear information hierarchy, professional credibility, and efficient data visualization. The design emphasizes functionality, trustworthiness, and real-time monitoring capabilities over decorative elements.

**Core Design Principles**:
- Clarity over complexity - information should be immediately scannable
- Security-focused professionalism with subtle technical aesthetics
- Role-based visual hierarchy (Admin vs User interfaces)
- Real-time data prominence with clear status indicators

## Color Palette

### Dark Mode (Primary)
**Background Layers**:
- Primary Background: 220 15% 8%
- Secondary Background: 220 15% 12%
- Tertiary Background: 220 15% 16%
- Border: 220 10% 24%

**Brand Colors**:
- Primary Blue: 217 91% 60% (trust, security, technology)
- Primary Hover: 217 91% 55%

**Accent Colors**:
- Success Green: 142 76% 45% (access granted, verified)
- Danger Red: 0 84% 60% (access denied, errors)
- Warning Amber: 38 92% 50% (pending states, caution)

**Text Colors**:
- Primary Text: 220 10% 95%
- Secondary Text: 220 8% 70%
- Muted Text: 220 6% 50%

### Light Mode
**Background Layers**:
- Primary Background: 0 0% 100%
- Secondary Background: 220 15% 98%
- Tertiary Background: 220 15% 95%
- Border: 220 10% 88%

**Brand Colors**: Same hue with adjusted lightness
- Primary Blue: 217 91% 55%
- Primary Hover: 217 91% 50%

## Typography

**Font Families**:
- Primary: Inter (via Google Fonts CDN) - clean, professional, excellent readability
- Monospace: JetBrains Mono - for IDs, fingerprint IDs, technical data

**Type Scale**:
- Heading 1: text-4xl font-bold (dashboard titles)
- Heading 2: text-2xl font-semibold (section headers)
- Heading 3: text-xl font-semibold (card titles)
- Body Large: text-base (primary content)
- Body: text-sm (default text, table data)
- Caption: text-xs (metadata, timestamps)

**Font Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Tight spacing: p-2, gap-2 (compact data tables)
- Standard spacing: p-4, gap-4 (cards, form fields)
- Generous spacing: p-6, p-8 (page padding, section separation)
- Extra spacing: p-12, p-16 (page containers)

**Grid System**:
- Dashboard: 12-column grid with max-w-7xl container
- Stats Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Tables: Full-width with horizontal scroll on mobile
- Forms: max-w-md centered

## Component Library

### Authentication Pages
**Login/Register Forms**:
- Centered layout with max-w-md width
- Dark card (secondary background) with subtle border
- Input fields with clear labels, focus states with primary blue ring
- Large, full-width primary buttons
- Role selection for admin/user with radio buttons or toggle
- Hardware ID input field with monospace font
- Form validation messages in danger red

### Navigation
**Header/Navbar**:
- Fixed top position with backdrop blur
- Logo/app name on left (with fingerprint icon from Lucide)
- User profile dropdown on right
- Hardware status indicator (green dot for connected, red for disconnected)
- Theme toggle (sun/moon icons)

**Sidebar** (Admin Dashboard only):
- Collapsible on mobile
- Icon + label navigation items
- Active state with primary blue accent bar and background
- Grouped sections: Dashboard, Users, Logs, Settings

### Dashboard Components

**Stats Cards**:
- 4-column grid on desktop, stacked on mobile
- Dark tertiary background with border
- Large numeric value (text-3xl font-bold)
- Label below (text-sm text-secondary)
- Icon in corner (Lucide icons: Users, Shield, Activity, Clock)
- Subtle hover effect (border color change)

**Live Status Panel**:
- Prominent placement at top of dashboard
- Real-time access logs with auto-scroll
- Color-coded entries: green for GRANTED, red for DENIED, blue for REGISTERED
- Timestamp + User ID + Result + Note in structured layout
- Pulsing animation on new entries
- WebSocket connection indicator

**Data Tables** (Users, Logs):
- Striped rows with hover states
- Sticky header on scroll
- Sortable columns with arrow indicators
- Action buttons (Edit, Delete) in last column
- Pagination controls at bottom
- Search/filter bar above table
- Empty state with icon and message

**Analytics Charts**:
- Using Recharts library
- Line chart for access trends over time
- Bar chart for success/denial rates
- Pie chart for user role distribution
- Dark-mode compatible color schemes
- Tooltips on hover with detailed data

### Forms & Inputs

**Input Fields**:
- Background: tertiary background
- Border: standard border color
- Focus: primary blue ring (ring-2 ring-primary)
- Padding: px-4 py-3
- Rounded: rounded-lg
- Full width with proper labels above

**Buttons**:
- Primary: Primary blue background, white text, hover state darker
- Secondary: Transparent with border, hover with background
- Danger: Red background for delete actions
- Sizes: Small (px-3 py-2 text-sm), Default (px-4 py-3), Large (px-6 py-4 text-lg)
- Disabled state: opacity-50 cursor-not-allowed

**Status Badges**:
- Small rounded-full pills
- Success: green background with darker green text
- Error: red background with darker red text
- Pending: amber background with darker amber text
- Inline with flex items-center gap-2

### Modals & Overlays

**Modal Dialog** (Headless UI):
- Semi-transparent dark backdrop
- Centered card with secondary background
- Max width: max-w-lg
- Close button (X icon) in top-right
- Title, content area, action buttons at bottom
- Smooth fade-in animation

**Loading States**:
- Skeleton loaders for tables and cards (animate-pulse)
- Spinner for button loading states
- Full-page loader for initial data fetch
- Use Lucide Loader2 icon with spin animation

## Icons

**Icon Library**: Lucide React (already in dependencies)

**Common Icons**:
- Fingerprint: Hardware/biometric features
- Shield: Security, access control
- Users: User management
- Activity: Live monitoring, logs
- Lock/Unlock: Authentication status
- AlertCircle: Warnings, errors
- CheckCircle: Success states
- XCircle: Denied access
- Settings: Configuration
- LogOut: Sign out action

**Usage**: Consistent size (w-5 h-5 for inline, w-6 h-6 for headers), stroke-width of 2

## Real-time Features

**Live Indicators**:
- Pulsing green dot for active connections (animate-pulse)
- Connection status badge in header
- Auto-updating timestamp displays
- Smooth fade-in for new log entries

**WebSocket Status**:
- Connected: Green indicator with "Live"
- Disconnected: Red indicator with "Offline"
- Reconnecting: Amber indicator with spinner

## Role-Based UI Differentiation

**Admin Dashboard**:
- Full sidebar navigation
- All statistics visible
- User management access
- System-wide logs
- Advanced settings

**User Dashboard**:
- Simplified header navigation
- Personal statistics only
- Own access history
- Profile management
- No administrative features

## Responsive Design

**Breakpoints**:
- Mobile: < 768px (single column, collapsible navigation)
- Tablet: 768px - 1024px (2-column layouts)
- Desktop: > 1024px (full multi-column)

**Mobile Optimizations**:
- Bottom navigation for key actions
- Swipe gestures for table actions
- Collapsible sections
- Touch-friendly button sizes (min h-11)

## Animations

**Use Sparingly**:
- Fade-in for page transitions (transition-opacity duration-200)
- Slide-in for modals (transition-transform)
- Pulse for live status indicators
- Smooth color transitions on hover (transition-colors)

**No animations** for:
- Data updates (instant for accuracy)
- Critical security alerts
- Form validation errors

## Images

**No hero images required** - This is a utility dashboard application focused on data and functionality. All visual elements should be icon-based and data-driven.