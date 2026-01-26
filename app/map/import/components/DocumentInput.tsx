'use client';

import { MAX_DOCUMENT_SIZE } from '../../constants';

interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DocumentInput({ value, onChange, disabled }: DocumentInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="document-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Document Text
      </label>
      <textarea
        id="document-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste article or document text here. The parser will extract historical events with dates..."
        className="w-full h-48 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {value.length.toLocaleString()} characters
        {value.length > MAX_DOCUMENT_SIZE && (
          <span className="text-amber-600 dark:text-amber-400 ml-2">
            (Document is large, consider splitting)
          </span>
        )}
      </p>
    </div>
  );
}
