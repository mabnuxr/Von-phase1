import React, { useState } from 'react';
import { TabSwitcher } from '../TabSwitcher/TabSwitcher';

/** Call result from SQL or TurboPuffer search */
interface CallResult {
  call_id: string;
  call_title?: string;
  call_start_time?: string;
  external_speaker_names?: string | string[];
  provider?: string;
  match_sources?: string[];
}

/** Email result from SQL or TurboPuffer search */
interface EmailResult {
  conversation_id: string;
  type?: string;
  start_time?: string;
  crm_object_type?: string;
  crm_object_id?: string;
  match_sources?: string[];
}

/** Query results structure containing both queries and results */
interface QueryResults {
  calls?: {
    sql?: {
      query: string | null;
      results: CallResult[];
    };
    turbopuffer?: {
      query: string | null;
      results: CallResult[];
    };
  };
  emails?: {
    sql?: {
      query: string | null;
      results: EmailResult[];
    };
    turbopuffer?: {
      query: string | null;
      results: EmailResult[];
    };
  };
}

/** Complete conversation search result from backend */
interface ConversationSearchResult {
  calls: {
    results: CallResult[];
    total_count: number;
    sources_breakdown: Record<string, number>;
  };
  emails: {
    results: EmailResult[];
    total_count: number;
    sources_breakdown: Record<string, number>;
  };
  summary: {
    total_calls: number;
    total_emails: number;
    execution_time_ms?: number;
  };
  query_results: QueryResults;
}

export interface ConversationSearchRendererProps {
  /** The conversation search result to render */
  result: ConversationSearchResult;
}

/**
 * Query display component with simple gray background
 */
const QuerySection: React.FC<{
  title: string;
  query: string | null;
  metadata?: string;
}> = ({ title, query, metadata }) => {
  if (!query) {
    return (
      <div className="p-3 bg-gray-100 rounded text-sm text-gray-500">
        No {title.toLowerCase()} executed
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        {metadata && <span className="text-xs text-gray-500">{metadata}</span>}
      </div>
      <pre className="font-mono bg-gray-100 text-gray-800 p-3 rounded overflow-x-auto text-xs whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
        {query}
      </pre>
    </div>
  );
};

/**
 * Call Query Tab - Shows SQL query + TurboPuffer query
 */
const CallQueryTab: React.FC<{ queryResults: QueryResults }> = ({ queryResults }) => {
  const sqlData = queryResults?.calls?.sql;
  const turbopufferData = queryResults?.calls?.turbopuffer;

  return (
    <div className="space-y-4">
      <QuerySection
        title="SQL Query"
        query={sqlData?.query ?? null}
        metadata={sqlData?.results ? `${sqlData.results.length} results` : undefined}
      />
      <QuerySection
        title="TurboPuffer Full-Text Query"
        query={turbopufferData?.query ?? null}
        metadata={
          turbopufferData?.results ? `${turbopufferData.results.length} results` : undefined
        }
      />
    </div>
  );
};

/**
 * Email Query Tab - Shows SQL query + TurboPuffer query
 */
const EmailQueryTab: React.FC<{ queryResults: QueryResults }> = ({ queryResults }) => {
  const sqlData = queryResults?.emails?.sql;
  const turbopufferData = queryResults?.emails?.turbopuffer;

  return (
    <div className="space-y-4">
      <QuerySection
        title="SQL Query"
        query={sqlData?.query ?? null}
        metadata={sqlData?.results ? `${sqlData.results.length} results` : undefined}
      />
      <QuerySection
        title="TurboPuffer Full-Text Query"
        query={turbopufferData?.query ?? null}
        metadata={
          turbopufferData?.results ? `${turbopufferData.results.length} results` : undefined
        }
      />
    </div>
  );
};

/**
 * Call Results Section - Tabular display of call results
 */
const CallResultsSection: React.FC<{ calls: CallResult[] }> = ({ calls }) => {
  if (!calls || calls.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Call Results</h3>
        <div className="text-center py-8 text-gray-500 text-sm">No call results found</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900">Call Results</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Call Title
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Speakers
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Match Sources
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calls.map((call, idx) => {
              const startTime = call.call_start_time
                ? new Date(call.call_start_time).toLocaleDateString()
                : '';
              const speakers = Array.isArray(call.external_speaker_names)
                ? call.external_speaker_names.join(', ')
                : call.external_speaker_names || '';

              return (
                <tr key={call.call_id || idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {call.call_title || 'Untitled'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">{startTime}</td>
                  <td
                    className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate"
                    title={speakers}
                  >
                    {speakers}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 capitalize">
                    {call.provider || ''}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {call.match_sources && Array.isArray(call.match_sources) ? (
                        call.match_sources.map((source: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full"
                          >
                            {source}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Email Results Section - Tabular display of email results
 */
const EmailResultsSection: React.FC<{ emails: EmailResult[] }> = ({ emails }) => {
  if (!emails || emails.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Email Results</h3>
        <div className="text-center py-8 text-gray-500 text-sm">No email results found</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900">Email Results</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Conversation ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                CRM Object
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Match Sources
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {emails.map((email, idx) => {
              const startTime = email.start_time
                ? new Date(email.start_time).toLocaleDateString()
                : '';
              const crmObject =
                email.crm_object_type && email.crm_object_id
                  ? `${email.crm_object_type}: ${email.crm_object_id}`
                  : email.crm_object_id || '-';

              return (
                <tr key={email.conversation_id || idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900 font-mono text-xs">
                    {email.conversation_id || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">{email.type || 'Email'}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{startTime}</td>
                  <td
                    className="px-3 py-2 text-gray-600 font-mono text-xs max-w-xs truncate"
                    title={crmObject}
                  >
                    {crmObject}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {email.match_sources && Array.isArray(email.match_sources) ? (
                        email.match_sources.map((source: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full"
                          >
                            {source}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * ConversationSearchRenderer Component
 *
 * Displays conversation search results with 4 simple tabs:
 * 1. Call Query - SQL UNION ALL + TurboPuffer query for calls
 * 2. Email Query - Conversation activities SQL + TurboPuffer query for emails
 * 3. Call Results - Tabular display of call results
 * 4. Email Results - Tabular display of email results
 */
export const ConversationSearchRenderer: React.FC<ConversationSearchRendererProps> = ({
  result,
}) => {
  const [activeTab, setActiveTab] = useState('call-query');

  const tabs = [
    { id: 'call-query', label: 'Call Query' },
    { id: 'email-query', label: 'Email Query' },
    { id: 'call-results', label: 'Call Results' },
    { id: 'email-results', label: 'Email Results' },
  ];

  const callsData = result?.calls?.results || [];
  const emailsData = result?.emails?.results || [];
  const queryResults = result?.query_results || {};

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="text-sm text-gray-600">
        {callsData.length} call{callsData.length !== 1 ? 's' : ''}, {emailsData.length} email
        {emailsData.length !== 1 ? 's' : ''}
        {result?.summary?.execution_time_ms && (
          <span> • Executed in {result.summary.execution_time_ms}ms</span>
        )}
      </div>

      {/* Tab Switcher */}
      <TabSwitcher tabs={tabs} activeTabId={activeTab} onTabClick={setActiveTab} />

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'call-query' && <CallQueryTab queryResults={queryResults} />}
        {activeTab === 'email-query' && <EmailQueryTab queryResults={queryResults} />}
        {activeTab === 'call-results' && <CallResultsSection calls={callsData} />}
        {activeTab === 'email-results' && <EmailResultsSection emails={emailsData} />}
      </div>
    </div>
  );
};

export default ConversationSearchRenderer;
