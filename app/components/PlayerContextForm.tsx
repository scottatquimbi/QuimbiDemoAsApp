'use client';

import React from 'react';
import { PlayerContext } from '../types/player';

interface PlayerContextFormProps {
  playerContext: PlayerContext;
  onUpdatePlayerName: (name: string) => void;
  onUpdatePreferredName?: (name: string) => void;
  onUpdateSessionDays?: (days: number) => void;
  onUpdateGameLevel: (level: number) => void;
  onUpdateVipLevel: (level: number) => void;
  onUpdateTotalSpend: (amount: number) => void;
  onUpdateFreeformContext: (context: string) => void;
  onUpdateLikelinessToChurn: (rate: number) => void;
}

/**
 * Component for editing player context information
 */
export default function PlayerContextForm({
  playerContext,
  onUpdatePlayerName,
  onUpdatePreferredName,
  onUpdateSessionDays,
  onUpdateGameLevel,
  onUpdateVipLevel,
  onUpdateTotalSpend,
  onUpdateFreeformContext,
  onUpdateLikelinessToChurn
}: PlayerContextFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
          Profile Name
        </label>
        <input
          type="text"
          id="playerName"
          value={playerContext.playerName || ''}
          onChange={(e) => onUpdatePlayerName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="likelinessToChurn" className="block text-sm font-medium text-gray-700">
          Likeliness To Churn (%)
        </label>
        <div className="flex items-center">
          <input
            type="range"
            id="likelinessToChurn"
            min="5"
            max="40"
            value={playerContext.likelinessToChurn || 15}
            onChange={(e) => onUpdateLikelinessToChurn(Number(e.target.value))}
            className="mt-1 block w-full"
          />
          <span className="ml-2 text-sm text-gray-700">
            {playerContext.likelinessToChurn || 15}%
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 italic">
          {playerContext.likelinessToChurn && playerContext.likelinessToChurn <= 10
            ? "Low churn risk, standard compensation sufficient"
            : playerContext.likelinessToChurn && playerContext.likelinessToChurn <= 25
            ? "Moderate churn risk, consider small bonus"
            : "Higher churn risk, additional compensation recommended"}
        </p>
      </div>

      <div>
        <label htmlFor="preferredName" className="block text-sm font-medium text-gray-700">
          Preferred Name
        </label>
        <input
          type="text"
          id="preferredName"
          value={playerContext.preferredName || ''}
          onChange={(e) => onUpdatePreferredName?.(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="sessionDays" className="block text-sm font-medium text-gray-700">
          Session Days
        </label>
        <input
          type="number"
          id="sessionDays"
          min="0"
          value={playerContext.sessionDays || 0}
          onChange={(e) => onUpdateSessionDays?.(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="gameLevel" className="block text-sm font-medium text-gray-700">
          Game Level
        </label>
        <input
          type="number"
          id="gameLevel"
          min="1"
          max="100"
          value={playerContext.gameLevel}
          onChange={(e) => onUpdateGameLevel(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="vipLevel" className="block text-sm font-medium text-gray-700">
          VIP Level
        </label>
        <input
          type="number"
          id="vipLevel"
          min="0"
          max="10"
          value={playerContext.vipLevel || 0}
          onChange={(e) => onUpdateVipLevel(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="totalSpend" className="block text-sm font-medium text-gray-700">
          Total Spend ($)
        </label>
        <input
          type="number"
          id="totalSpend"
          min="0"
          value={playerContext.totalSpend || 0}
          onChange={(e) => onUpdateTotalSpend(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="freeformContext" className="block text-sm font-medium text-gray-700">
          Additional Context
        </label>
        <textarea
          id="freeformContext"
          rows={4}
          value={playerContext.freeformContext || ''}
          onChange={(e) => onUpdateFreeformContext(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Add any additional player context here..."
        />
      </div>
    </div>
  );
} 