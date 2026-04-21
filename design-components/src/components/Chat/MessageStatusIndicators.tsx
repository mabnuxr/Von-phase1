import { InfoIcon } from '@phosphor-icons/react';
import {
  DEFAULT_EXPIRED_APPROVAL_MESSAGE,
  DEFAULT_SKIPPED_APPROVAL_MESSAGE,
} from '../../utils/constants';
import type { MessageStatus } from './types';

interface MessageStatusIndicatorsProps {
  stoppedByUser?: boolean;
  status?: MessageStatus;
  errorMessage?: string;
}

export const MessageStatusIndicators: React.FC<MessageStatusIndicatorsProps> = ({
  stoppedByUser,
  status,
  errorMessage,
}) => {
  return (
    <>
      {/* Show stopped indicator */}
      {stoppedByUser && (
        <div className="mt-2 max-w-fit flex items-start gap-2 py-2 px-2 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <div className="shrink-0 mt-0.5">
            <InfoIcon size={20} className="text-indigo-600" />
          </div>
          <span className="text-sm text-gray-800 leading-relaxed flex-1">
            Response stopped by the user
          </span>
        </div>
      )}

      {/* Show timeout indicator */}
      {status === 'timeout' && (
        <div className="mt-2 max-w-fit flex items-start gap-2 py-2 px-2 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <div className="shrink-0 mt-0.5">
            <InfoIcon size={20} className="text-indigo-600" />
          </div>
          <span className="text-sm text-gray-800 leading-relaxed flex-1">Request timed out</span>
        </div>
      )}

      {(status === 'expired' || status === 'skipped') && (
        <div className="mt-2 max-w-fit flex items-start gap-2 py-2 px-2 bg-gray-50/50 border border-gray-200 rounded-xl">
          <div className="shrink-0 mt-0.5">
            <InfoIcon size={20} className="text-gray-500" />
          </div>
          <span className="text-sm text-gray-800 leading-relaxed flex-1">
            {errorMessage ||
              (status === 'expired'
                ? DEFAULT_EXPIRED_APPROVAL_MESSAGE
                : DEFAULT_SKIPPED_APPROVAL_MESSAGE)}
          </span>
        </div>
      )}
    </>
  );
};
