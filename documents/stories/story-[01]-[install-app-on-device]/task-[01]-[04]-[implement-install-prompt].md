# Task [01]-[04]: Implement install prompt component

## Parent Story

Story [01]: Install App on Device

## Task Description

Create UI component for custom PWA installation prompt that handles the beforeinstallprompt event
and provides users with a clear way to install the app on their devices. This component should work
across different platforms and browsers.

## Implementation Details

### Files to Modify

- Create `app/components/InstallPrompt.tsx` - Main install prompt component
- Create `app/hooks/useInstallPrompt.ts` - Custom hook for install logic
- Create `app/components/InstallButton.tsx` - Reusable install button
- Modify `app/layout.tsx` - Include install prompt in layout
- Create `lib/pwa-utils.ts` - PWA detection utilities
- Create `app/styles/install-prompt.module.css` - Component styles

### Required Components

- React component for install prompt UI
- Custom hook for managing install state
- Event handlers for beforeinstallprompt
- Cross-platform compatibility logic
- Install button with loading states

### Technical Considerations

- Handle beforeinstallprompt event properly
- Provide fallback for browsers that don't support the event
- Implement proper timing for showing install prompt
- Consider user experience and avoid being intrusive
- Handle different installation flows for iOS vs Android
- Ensure accessibility compliance for install UI

## Acceptance Criteria

- [ ] Custom install button component created and styled
- [ ] beforeinstallprompt event handled correctly
- [ ] Install prompt shows/hides appropriately based on criteria
- [ ] Cross-platform compatibility ensured (Chrome, Firefox, Safari, Edge)
- [ ] iOS-specific install instructions provided
- [ ] Install prompt can be dismissed and remembered
- [ ] Loading states implemented during installation
- [ ] Accessibility features included (ARIA labels, keyboard navigation)

## Testing Approach

- Test install prompt appearance on different browsers
- Verify beforeinstallprompt event handling
- Test installation flow on desktop and mobile
- Validate iOS-specific behavior and instructions
- Test prompt dismissal and state persistence
- Verify accessibility with screen readers

## Dependencies

- Task [01]-[02]: Manifest configuration required for install criteria
- Task [01]-[03]: Service worker needed for PWA requirements

## Estimated Completion Time

3 hours
