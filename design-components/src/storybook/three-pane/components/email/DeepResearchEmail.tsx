import React from 'react';
import {
  generateDeepResearchEmail,
  type DeepResearchEmailProps,
} from './deepResearchEmailTemplate';

interface DeepResearchEmailPreviewProps extends DeepResearchEmailProps {
  /** Width of the preview container */
  previewWidth?: number | 'mobile' | 'desktop';
}

/**
 * DeepResearchEmail - React component for previewing the email template in Storybook
 *
 * This component renders the email HTML inside an iframe to accurately preview
 * how it will appear in email clients.
 */
export const DeepResearchEmail: React.FC<DeepResearchEmailPreviewProps> = ({
  querySummary,
  conversationUrl,
  pdfDownloadUrl,
  unsubscribeUrl,
  currentYear,
  previewWidth = 'desktop',
}) => {
  const emailHtml = generateDeepResearchEmail({
    querySummary,
    conversationUrl,
    pdfDownloadUrl,
    unsubscribeUrl,
    currentYear,
  });

  const width =
    previewWidth === 'mobile'
      ? 375
      : previewWidth === 'desktop'
        ? 700
        : previewWidth;

  return (
    <iframe
      srcDoc={emailHtml}
      title="Deep Research Email Preview"
      style={{
        width: `${width}px`,
        height: '800px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f5f5f7',
      }}
    />
  );
};

export default DeepResearchEmail;
