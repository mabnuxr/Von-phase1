import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeIcon, CaretDownIcon } from '@phosphor-icons/react';
import type { EmailTranscript } from '../types';
import { ChatMarkdown } from '../../Chat/ChatMarkdown';

interface EmailItemProps {
  email: EmailTranscript;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

export const EmailItem = React.memo<EmailItemProps>(({ email, isExpanded, onToggle, isLast }) => {
  const hasDetails = email.content || email.sender || email.recipients;

  return (
    <div className="relative flex gap-3 overflow-hidden">
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <button
          onClick={onToggle}
          className={`
            relative z-10 w-7 h-7 flex items-center justify-center rounded-full border bg-white
            cursor-pointer transition-colors duration-150
            ${
              isExpanded
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <EnvelopeIcon
            size={14}
            weight={isExpanded ? 'duotone' : 'regular'}
            className={isExpanded ? 'text-indigo-600' : 'text-gray-600'}
          />
        </button>
        {!isLast && <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
        {/* Header row */}
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 flex-1 min-w-0 group cursor-pointer"
          >
            <CaretDownIcon
              size={12}
              weight="bold"
              className={`text-gray-400 group-hover:text-indigo-600 flex-shrink-0 transition-transform duration-150 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
            <span className="text-sm font-medium text-gray-900 min-w-0 truncate text-left group-hover:text-indigo-600 transition-colors">
              {email.subject || 'No Subject'}
            </span>
          </button>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {new Date(email.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Preview (collapsed) */}
        {!isExpanded && email.preview && (
          <div className="mt-1 text-xs text-gray-600 truncate">{email.preview}</div>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && hasDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2 overflow-hidden">
                {/* Sender */}
                {email.sender && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">From:</span> {email.sender}
                  </div>
                )}

                {/* Recipients */}
                {email.recipients && email.recipients.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">To:</span> {email.recipients.join(', ')}
                  </div>
                )}

                {/* CRM Object Info */}
                {(email.crmObjectType || email.crmObjectId) && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Related to:</span>{' '}
                    {email.crmObjectType && (
                      <span className="capitalize">{email.crmObjectType}</span>
                    )}
                    {email.crmObjectType && email.crmObjectId && ' · '}
                    {email.crmObjectId && <span className="font-mono">{email.crmObjectId}</span>}
                  </div>
                )}

                {/* Full content */}
                {email.content && (
                  <div className="pt-2 mt-2 border-t border-gray-200 max-h-80 overflow-y-auto overflow-x-hidden">
                    <ChatMarkdown
                      content={email.content}
                      className="text-xs text-gray-700 leading-relaxed break-words [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

EmailItem.displayName = 'EmailItem';
