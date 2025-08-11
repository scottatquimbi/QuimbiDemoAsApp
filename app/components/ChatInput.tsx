'use client';

import { useRef, forwardRef, useEffect, useState } from 'react';

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  isResponseStreaming?: boolean;
  waitingForResponse?: boolean;
  isUserTyping?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ 
    onSendMessage, 
    isResponseStreaming = false,
    waitingForResponse = false,
    isUserTyping = false,
    placeholder = 'Type your message...', 
    inputRef: externalRef,
    value,
    onChange
  }, ref) => {
    const localInputRef = useRef<HTMLTextAreaElement>(null);
    
    // Track whether a submission is in progress to prevent double submissions
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submissionTimeRef = useRef<number | null>(null);
    
    // Use external ref if provided, otherwise use local ref
    const inputRef = externalRef || localInputRef;
    
    // Function to auto resize the textarea
    const autoResize = () => {
      const textarea = inputRef.current;
      if (!textarea) return;
      
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Set the height to scrollHeight (with a max height)
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
    };
    
    // Handle input changes
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      autoResize();
      
      // If onChange is provided, call it
      if (onChange && e.target) {
        onChange(e as React.ChangeEvent<HTMLTextAreaElement>);
      }
    };

    // Centralized submission handler to prevent duplication
    const handleSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      // Check if we recently submitted (within the last 1000ms)
      const now = Date.now();
      if (submissionTimeRef.current && now - submissionTimeRef.current < 1000) {
        console.log('Preventing duplicate submission (throttled)');
        return;
      }
      
      // Prevent submission if already submitting or disabled
      if (isSubmitting || isResponseStreaming) {
        console.log('Submission blocked: isSubmitting=', isSubmitting, 'isResponseStreaming=', isResponseStreaming);
        return;
      }
      
      const textarea = inputRef.current;
      if (!textarea) {
        console.warn('Cannot submit - textarea ref is null');
        return;
      }
      
      const message = textarea.value.trim();
      if (!message) {
        console.log('Empty message, not submitting');
        return;
      }
      
      // Set submitting flag to prevent double submissions
      setIsSubmitting(true);
      submissionTimeRef.current = now;
      
      // Pause briefly before actually sending to catch any rapid double clicks
      setTimeout(() => {
        if (onSendMessage) {
          console.log('ChatInput: Sending message:', message);
          onSendMessage(message);
          
          // Clear the input after sending if we're not controlled
          if (value === undefined) {
            textarea.value = '';
            autoResize();
          }
        }
        
        // Reset the submitting flag after a delay
        setTimeout(() => {
          setIsSubmitting(false);
        }, 500);
      }, 10);
    };
    
    // Handle key down events (for submitting with Enter)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };
    
    // Reset the submitting flag when streaming ends
    useEffect(() => {
      if (!isResponseStreaming) {
        setIsSubmitting(false);
      }
    }, [isResponseStreaming]);
    
    // Expose auto resize to the parent through the ref
    useEffect(() => {
      autoResize();
    }, [value]); // Auto-resize when value changes
    
    return (
        <div className="border-t border-slate-200 bg-white p-6">
          {/* Status indicator */}
          {(waitingForResponse || isResponseStreaming || isUserTyping) && (
            <div className="flex items-center px-3 py-2 mb-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-sm font-medium text-slate-700 font-inter">
                {isUserTyping ? 'User is typing...' : 'AI is processing...'}
              </span>
            </div>
          )}
          
          <div className="relative">
            <textarea
              ref={ref || inputRef}
              className="w-full p-4 pr-16 border border-slate-300 rounded-lg resize-none min-h-[80px] max-h-[200px] placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-inter"
              placeholder={placeholder}
              rows={1}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isResponseStreaming || isSubmitting}
              value={value || ''}
              onChange={onChange}
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="absolute right-3 bottom-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              disabled={isResponseStreaming || isSubmitting}
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput; 