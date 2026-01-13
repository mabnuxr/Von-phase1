# Dashboard Action Popovers - Updated Implementation

## Changes Made

### 1. Converted Modals to Popovers

Both the Filter and Share components have been converted from centered modals to popovers that appear below their respective buttons.

#### Key Changes:
- **No backdrop blur**: Invisible backdrop for click-outside detection only
- **Positioned relative to button**: Opens directly below the button that triggered it
- **Smooth animations**: Slides down with fade-in effect
- **Fixed width**: Consistent sizing (560px for Filter, 600px for Share)

### 2. Redesigned Share Component (Google Docs Style)

The Share popover now follows Google Docs sharing patterns:

#### New Features:
- **Clean button styling**: Simple Cancel and Share buttons (no complex button components)
- **Better layout**: More spacious and organized
- **Globe icon**: Added to public link display
- **Improved copy button**: Shows "Copied" state with green checkmark
- **Better recipient management**: Cleaner email tag display with remove buttons

#### Button Styling (Google Docs Style):
```tsx
// Cancel button - simple gray hover
<button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
  Cancel
</button>

// Share button - dark primary action
<button className="px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">
  Share
</button>
```

### 3. Updated Component APIs

#### DashboardFilterModal (now a popover)
```tsx
<DashboardFilterModal
  isOpen={showFilterPopover}
  position={{ top: 60, right: 20 }}  // NEW: Position prop
  currentFilters={dashboardFilters}
  onApply={handleFilterApply}
  onClose={() => setShowFilterPopover(false)}
/>
```

#### DashboardSharePopover (new component)
```tsx
<DashboardSharePopover
  isOpen={showSharePopover}
  position={{ top: 60, right: 20 }}  // Position prop
  currentConfig={{
    updateFrequency: 'daily',
    recipients: [],
  }}
  onShare={handleShare}
  onClose={() => setShowSharePopover(false)}
/>
```

### 4. Pane2 Button Integration

Buttons now pass their bounding rect to callbacks for proper positioning:

```tsx
// Filter button with ref
<button
  ref={filterButtonRef}
  onClick={() => {
    if (filterButtonRef.current) {
      onFilterClick(filterButtonRef.current.getBoundingClientRect());
    }
  }}
>
  <FunnelIcon size={14} />
  <span>Filter</span>
</button>

// Share button with ref
<button
  ref={shareButtonRef}
  onClick={() => {
    if (shareButtonRef.current) {
      onShareClick(shareButtonRef.current.getBoundingClientRect());
    }
  }}
>
  <ShareNetworkIcon size={14} />
  <span>Share</span>
</button>
```

### 5. ManualDashboard Story Integration

```tsx
// State for popovers
const [showFilterPopover, setShowFilterPopover] = useState(false);
const [filterPopoverPosition, setFilterPopoverPosition] = useState({ top: 60, right: 20 });
const [showSharePopover, setShowSharePopover] = useState(false);
const [sharePopoverPosition, setSharePopoverPosition] = useState({ top: 60, right: 20 });

// Callbacks calculate position from button rect
onFilterClick={(rect) => {
  setFilterPopoverPosition({
    top: rect.bottom + 8,
    right: window.innerWidth - rect.right,
  });
  setShowFilterPopover(true);
}}

onShareClick={(rect) => {
  setSharePopoverPosition({
    top: rect.bottom + 8,
    right: window.innerWidth - rect.right,
  });
  setShowSharePopover(true);
}}
```

## Files Modified

### New Files
1. `src/components/popups/DashboardSharePopover.tsx` - New Google Docs-style share popover

### Modified Files
1. `src/components/popups/DashboardFilterModal.tsx`
   - Converted to popover positioning
   - Removed backdrop blur
   - Added position prop

2. `src/components/popups/index.ts`
   - Updated exports to use DashboardSharePopover instead of DashboardShareModal

3. `src/components/layouts/Pane2/Pane2.tsx`
   - Added refs for Filter and Share buttons
   - Updated callback signatures to pass DOMRect
   - Buttons now calculate and pass their position

4. `src/storybook/three-pane/Jan30/ManualDashboard.stories.tsx`
   - Updated imports to use DashboardSharePopover
   - Added position state for both popovers
   - Updated callbacks to calculate position from button rect

### Removed Files
- `src/components/popups/DashboardShareModal.tsx` (replaced by DashboardSharePopover)

## Visual Changes

### Before (Modal)
- Centered on screen
- Dark backdrop with blur
- Disconnected from trigger button

### After (Popover)
- Appears directly below button
- No backdrop blur (transparent backdrop for click detection)
- Visually connected to trigger button
- Smooth slide-down animation

### Share Popover Improvements
- **Simpler buttons**: No complex button components, just clean styled buttons
- **Better spacing**: More breathing room between sections
- **Globe icon**: Visual indicator for public link
- **Green checkmark**: Clear feedback when link is copied
- **Cleaner recipient tags**: Better visual hierarchy

## Testing

1. **Open Storybook**: Navigate to `3-Pane/Jan30/Manual Dashboard`

2. **Test Filter Popover**:
   - Click "Filter" button
   - Popover appears below the button
   - Select filters
   - Click "Apply" or click outside to close

3. **Test Share Popover**:
   - Click "Share" button
   - Popover appears below the button
   - Select update frequency
   - Generate public link
   - Copy link (see green "Copied" feedback)
   - Add email recipients
   - Click "Share" or "Cancel"

## Design Compliance

✅ **Popover positioning**: Opens below button, not centered
✅ **No backdrop blur**: Transparent backdrop only
✅ **Google Docs style**: Simple, clean button styling
✅ **Proper spacing**: Better layout and visual hierarchy
✅ **Icon usage**: Globe icon for public link
✅ **Feedback states**: Green checkmark for copied link
✅ **Email management**: Clean recipient tags with remove buttons

---

**All requested changes implemented!** Both Filter and Share now open as popovers, and Share follows Google Docs styling patterns.
