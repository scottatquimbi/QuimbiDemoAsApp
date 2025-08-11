'use client';

import React from 'react';
import { KnownIssueContent } from '../types/externalSources';

interface KnownIssueCardProps {
  issue: KnownIssueContent;
}

/**
 * Component for displaying a known issue card with Discord/Reddit-like styling
 */
export default function KnownIssueCard({ issue }: KnownIssueCardProps) {
  // Ensure issue exists
  if (!issue) return null;

  return (
    <div className="known-issue bg-gray-100 rounded-md border border-gray-300 overflow-hidden">
      <div className="issue-header bg-gray-200 px-3 py-1.5 flex items-center border-b border-gray-300">
        <div className="issue-icon mr-2">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V10C9 10.5523 9.44772 11 10 11C10.5523 11 11 10.5523 11 10V6ZM10 15C10.8284 15 11.5 14.3284 11.5 13.5C11.5 12.6716 10.8284 12 10 12C9.17157 12 8.5 12.6716 8.5 13.5C8.5 14.3284 9.17157 15 10 15Z" fill="#64748b"/>
          </svg>
        </div>
        <h3 className="text-xs font-medium text-gray-700">Known Issue</h3>
      </div>

      <div className="issue-content p-3">
        <h4 className="text-sm font-medium text-gray-800 mb-1">{issue.title}</h4>
        <div className="text-xs text-gray-700 mb-2 leading-tight">{issue.content}</div>
        
        {issue.affectedVersions && (
          <div className="text-xs text-gray-600 mb-1">
            <span className="font-medium">Affected Versions:</span> {issue.affectedVersions}
          </div>
        )}
        
        {issue.workaround && (
          <div className="bg-gray-200 p-2 rounded-md border border-gray-300 mt-2">
            <h5 className="text-xs font-medium text-gray-700 mb-1">Workaround</h5>
            <div className="text-xs text-gray-700 leading-tight">{issue.workaround}</div>
          </div>
        )}
        
        {issue.fixVersion && (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Fix Version:</span> {issue.fixVersion}
          </div>
        )}
      </div>
    </div>
  );
} 