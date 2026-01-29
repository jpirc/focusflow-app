/**
 * Breakpoint Detection Hook
 * Detects device size for responsive layouts
 */

import { useMediaQuery } from 'react-responsive';

export function useBreakpoint() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Convenience flags
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}

export function useMobileBreakpoint() {
  return useMediaQuery({ maxWidth: 767 });
}

export function useDesktopBreakpoint() {
  return useMediaQuery({ minWidth: 1024 });
}
