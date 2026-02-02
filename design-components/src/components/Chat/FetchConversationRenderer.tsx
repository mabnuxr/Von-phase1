import React, { useState } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  UsersIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import type { ToolResult } from './types';

interface FetchConversationRendererProps {
  result: ToolResult;
}

export const FetchConversationRenderer: React.FC<FetchConversationRendererProps> = ({ result }) => {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  if (!result.fetchConversation) return null;

  const conversation = result.fetchConversation;
  const {
    success,
    conversation_type,
    call_metadata,
    call_content,
    email_metadata,
    email_content,
    warnings,
    error_message,
  } = conversation;

  if (!success && error_message) {
    return (
      <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <XCircleIcon size={16} weight="fill" />
          <span className="text-sm font-medium">Failed to fetch conversation</span>
        </div>
        <div className="mt-2 text-sm text-red-600">{error_message}</div>
      </div>
    );
  }

  const isCall = conversation_type === 'call';
  const Icon = isCall ? PhoneIcon : EnvelopeIcon;
  const iconColor = isCall ? 'text-blue-600' : 'text-purple-600';

  return (
    <div className="mb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={iconColor} size={18} weight="duotone" />
        <span className="text-sm font-medium text-gray-700">
          {isCall ? 'Call' : 'Email'} Content
        </span>
        {success && <CheckCircleIcon className="text-gray-500" size={14} weight="fill" />}
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="pl-6 space-y-1">
          {warnings.map((warning, idx) => (
            <div key={idx} className="text-xs text-amber-600 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Call Content */}
      {isCall && call_metadata && (
        <div className="pl-6 space-y-4">
          {/* Title */}
          {call_metadata.call_title && (
            <div>
              <h3 className="text-base font-semibold text-gray-900">{call_metadata.call_title}</h3>
            </div>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* Time */}
            {call_metadata.call_start_time && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={14} weight="regular" />
                <span>{new Date(call_metadata.call_start_time).toLocaleString()}</span>
              </div>
            )}

            {/* Duration */}
            {call_metadata.call_duration_seconds && (
              <div>{Math.floor(call_metadata.call_duration_seconds / 60)} min</div>
            )}

            {/* Provider */}
            {call_metadata.provider && (
              <div className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium">
                {call_metadata.provider}
              </div>
            )}

            {/* Engagement Score */}
            {call_metadata.engagement_score !== undefined && (
              <div className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                {Math.round(call_metadata.engagement_score * 100)}% engaged
              </div>
            )}
          </div>

          {/* Speakers */}
          {call_metadata.speakers && call_metadata.speakers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                <UsersIcon size={14} weight="regular" />
                <span>Speakers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {call_metadata.speakers.map((speaker, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded text-xs ${
                      speaker.type === 'internal'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    <span className="font-medium">{speaker.name || speaker.email}</span>
                    {speaker.title && <span className="ml-1.5 opacity-75">· {speaker.title}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRM Associations */}
          {call_metadata.crm_associations && call_metadata.crm_associations.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">CRM Links</div>
              <div className="flex flex-wrap gap-2">
                {call_metadata.crm_associations.map((assoc, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-mono"
                  >
                    {assoc.crm_object_type}: {assoc.crm_object_id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords & Topics */}
          {(call_metadata.keywords && call_metadata.keywords.length > 0) ||
          (call_metadata.topics && call_metadata.topics.length > 0) ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                <TagIcon size={14} weight="regular" />
                <span>Keywords & Topics</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {call_metadata.keywords?.map((keyword, idx) => (
                  <span
                    key={`kw-${idx}`}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
                {call_metadata.topics?.map((topic, idx) => (
                  <span
                    key={`topic-${idx}`}
                    className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Action Items */}
          {call_metadata.action_items && call_metadata.action_items.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Action Items</div>
              <ul className="space-y-1 text-sm text-gray-700">
                {call_metadata.action_items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          {call_content?.summary && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Summary</div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="prose-sm markdown-body max-w-none text-sm">
                  <Streamdown parseIncompleteMarkdown={false} controls={{ table: true }}>
                    {call_content.summary}
                  </Streamdown>
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          {call_content?.transcript && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-700">
                  Full Transcript
                  {call_content.transcript_word_count && (
                    <span className="ml-2 text-gray-500 font-normal">
                      ({call_content.transcript_word_count.toLocaleString()} words)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFullTranscript(!showFullTranscript)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showFullTranscript ? 'Hide' : 'Show'}
                </button>
              </div>
              {showFullTranscript && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="prose-sm markdown-body max-w-none text-sm whitespace-pre-wrap font-mono">
                    {call_content.transcript}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Email Content */}
      {!isCall && email_content && (
        <div className="pl-6 space-y-4">
          {/* Metadata */}
          {email_metadata?.start_time && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <CalendarIcon size={14} weight="regular" />
              <span>{new Date(email_metadata.start_time).toLocaleString()}</span>
            </div>
          )}

          {/* CRM Associations */}
          {email_metadata?.crm_associations && email_metadata.crm_associations.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">CRM Links</div>
              <div className="flex flex-wrap gap-2">
                {email_metadata.crm_associations.map((assoc, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-mono"
                  >
                    {assoc.crm_object_type}: {assoc.crm_object_id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Body */}
          {email_content.body && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Email Body</div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="prose-sm markdown-body max-w-none text-sm whitespace-pre-wrap">
                  <Streamdown parseIncompleteMarkdown={false} controls={{ table: true }}>
                    {email_content.body}
                  </Streamdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FetchConversationRenderer;
