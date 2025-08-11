import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from 'ai';

/**
 * Hook to manage chat UI layout state and handlers
 */
export function useChatLayout(
  displayedMessages: Message[],
  shouldScrollToBottom: boolean,
  externalSidebarState?: boolean
) {
  // Layout state
  const [showSidebar, setShowSidebar] = useState<boolean>(externalSidebarState !== undefined ? externalSidebarState : true);
  const [showExternalContent, setShowExternalContent] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(false);
  
  // Update sidebar state if external state changes
  useEffect(() => {
    if (externalSidebarState !== undefined) {
      setShowSidebar(externalSidebarState);
    }
  }, [externalSidebarState]);
  
  // Refs for DOM elements
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  /**
   * Toggle sidebar visibility
   */
  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  /**
   * Toggle external content visibility
   */
  const toggleExternalContent = useCallback(() => {
    setShowExternalContent((prev) => !prev);
  }, []);

  /**
   * Toggle controls visibility
   */
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  /**
   * Scroll to bottom of chat
   */
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [scrollAreaRef]);

  /**
   * Check if device is mobile based on window width
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileLayout(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  /**
   * Auto-scroll to bottom when messages change or shouldScrollToBottom is set
   */
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [displayedMessages, shouldScrollToBottom, scrollToBottom]);

  return {
    // Layout state
    showSidebar,
    showExternalContent,
    showControls,
    isMobileLayout,
    
    // Refs
    scrollAreaRef,
    formRef,
    
    // Handlers
    toggleSidebar,
    toggleExternalContent,
    toggleControls,
    scrollToBottom,
    
    // Setters
    setShowSidebar,
    setShowExternalContent,
    setShowControls
  };
} 