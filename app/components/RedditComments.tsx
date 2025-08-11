'use client';

import React from 'react';
import { RedditComment } from '../types/externalSources';

interface RedditCommentsProps {
  comments?: RedditComment[];
}

/**
 * Component for displaying Reddit comments with condensed gray styling
 */
export default function RedditComments({ comments = [] }: RedditCommentsProps) {
  if (!comments.length) return null;

  return (
    <div className="reddit-comments overflow-hidden rounded-md border border-gray-300 bg-gray-100">
      <div className="reddit-header bg-gray-200 px-3 py-1.5 text-gray-700 flex items-center">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
          <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM16.75 11.25C16.75 11.88 16.62 12.5 16.38 13.09C16.13 13.68 15.77 14.21 15.32 14.66C14.86 15.12 14.33 15.47 13.75 15.72C13.16 15.97 12.54 16.09 11.91 16.09C10.89 16.09 9.93 15.79 9.12 15.19C8.31 15.79 7.35 16.09 6.34 16.09C5.71 16.09 5.09 15.97 4.5 15.72C3.92 15.47 3.39 15.12 2.93 14.66C2.48 14.21 2.12 13.68 1.87 13.09C1.63 12.5 1.5 11.88 1.5 11.25C1.5 10.24 1.8 9.29 2.4 8.47C1.8 7.66 1.5 6.71 1.5 5.69C1.5 5.06 1.63 4.44 1.87 3.85C2.12 3.27 2.48 2.74 2.93 2.28C3.39 1.83 3.92 1.47 4.5 1.22C5.09 0.97 5.71 0.85 6.34 0.85C7.35 0.85 8.31 1.15 9.12 1.75C9.93 1.15 10.89 0.85 11.91 0.85C12.54 0.85 13.16 0.97 13.75 1.22C14.33 1.47 14.86 1.83 15.32 2.28C15.77 2.74 16.13 3.27 16.38 3.85C16.62 4.44 16.75 5.06 16.75 5.69C16.75 6.71 16.45 7.66 15.85 8.47C16.45 9.29 16.75 10.24 16.75 11.25Z" fill="currentColor"/>
          <path d="M13.71 9.12C13.71 8.19 12.96 7.44 12.03 7.44C11.56 7.44 11.13 7.64 10.85 7.96C10.02 7.42 8.98 7.09 7.85 7.07L8.54 4.56L10.23 4.95C10.25 5.56 10.75 6.06 11.37 6.06C12 6.06 12.51 5.55 12.51 4.92C12.51 4.29 12 3.78 11.37 3.78C10.93 3.78 10.54 4.04 10.37 4.41L8.31 3.96C8.15 3.92 7.99 4.01 7.94 4.17L7.12 7.16C5.95 7.16 4.88 7.49 4.03 8.04C3.75 7.71 3.32 7.5 2.83 7.5C1.91 7.5 1.16 8.25 1.16 9.18C1.16 9.82 1.52 10.37 2.05 10.63C2.03 10.76 2.02 10.89 2.02 11.02C2.02 12.97 4.2 14.55 6.88 14.55C9.56 14.55 11.74 12.97 11.74 11.02C11.74 10.88 11.73 10.74 11.71 10.6C12.22 10.33 13.71 9.8 13.71 9.12ZM3.37 10.99C3.37 10.36 3.88 9.85 4.51 9.85C5.14 9.85 5.65 10.36 5.65 10.99C5.65 11.62 5.14 12.13 4.51 12.13C3.88 12.13 3.37 11.62 3.37 10.99ZM9.27 12.71C8.64 13.34 7.34 13.37 6.88 13.37C6.41 13.37 5.11 13.33 4.49 12.71C4.4 12.62 4.4 12.47 4.49 12.38C4.58 12.29 4.73 12.29 4.82 12.38C5.25 12.81 6.21 12.89 6.88 12.89C7.55 12.89 8.52 12.81 8.94 12.38C9.03 12.29 9.18 12.29 9.27 12.38C9.36 12.47 9.36 12.62 9.27 12.71ZM9.19 12.13C8.56 12.13 8.05 11.62 8.05 10.99C8.05 10.36 8.56 9.85 9.19 9.85C9.82 9.85 10.33 10.36 10.33 10.99C10.33 11.62 9.82 12.13 9.19 12.13Z" fill="currentColor"/>
        </svg>
        <span className="ml-1.5 font-medium text-xs">Reddit</span>
      </div>
      <div className="comments-container px-3 py-2 space-y-2 text-xs">
        {comments.map((comment, index) => (
          <div key={index} className="comment border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
            <div className="comment-header flex items-center">
              <span className="username font-medium text-gray-800 text-xs">{comment.user || 'Anonymous'}</span>
            </div>
            <div className="comment-content mt-1 text-gray-700 text-xs leading-tight">
              {comment.comment}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 