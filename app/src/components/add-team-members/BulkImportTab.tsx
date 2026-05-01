import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  CloudArrowUp,
  Download,
  FileCsv,
  Warning,
  X,
} from "@phosphor-icons/react";
import { Banner } from "@vonlabs/design-components";

import { config } from "../../config";
import { useUser } from "../../hooks/useUser";
import { useBulkImportTeamMembers } from "../../hooks/useTeam";
import { useBulkImportProgress } from "../../hooks/useBulkImportProgress";
import { useUserPusherChannel } from "../../hooks/useUserPusherChannel";
import type { BulkImportResponse } from "../../services/teamService";
import type { BulkImportRowResult } from "../../types/userChannelEvents";
import type { TabContentProps } from "./types";

/** Quote a CSV cell value: wrap in double quotes and escape internal quotes. */
function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildErrorReportCsv(errorRows: BulkImportRowResult[]): string {
  const lines = ["First Name,Last Name,Email,Role,Error"];
  for (const r of errorRows) {
    lines.push(
      [
        r.input.firstName,
        r.input.lastName,
        r.input.email,
        r.input.role,
        r.reason ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BulkImportTab({
  onClose,
  onRegisterFooter,
  registerCloseGuard,
}: TabContentProps) {
  const { user } = useUser();

  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [response, setResponse] = useState<BulkImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open a user-channel connection while this tab is mounted. The shell
  // unmounts this component on tab switch / pane close, so cleanup happens
  // automatically.
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  const { rowResults, completed, total, reset } = useBulkImportProgress({
    userChannel,
    jobId,
  });

  const importMutation = useBulkImportTeamMembers(
    user?.tenantId as string | undefined,
  );

  const isUploading = importMutation.isPending;
  const isDone = !!response;

  // Block close + tab switch while uploading.
  useEffect(() => {
    if (!registerCloseGuard) return;
    registerCloseGuard(() => !isUploading);
  }, [isUploading, registerCloseGuard]);

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Please select a .csv file.");
      return;
    }
    setFile(selected);
    setErrorMessage(null);
    setResponse(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleImport = async () => {
    if (!file) return;
    const newJobId = crypto.randomUUID();
    setJobId(newJobId);
    setResponse(null);
    setErrorMessage(null);
    reset();
    try {
      const result = await importMutation.mutateAsync({
        file,
        jobId: newJobId,
      });
      setResponse(result);
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : null;
      const message =
        detail || (err instanceof Error ? err.message : "Bulk import failed.");
      setErrorMessage(message);
    }
  };

  // Source of truth: HTTP response if present (canonical); otherwise the
  // accumulated Pusher events for the in-flight progress UI.
  const liveResults = useMemo<BulkImportRowResult[]>(() => {
    if (response) return response.results;
    return Array.from(rowResults.values()).sort((a, b) => a.row - b.row);
  }, [response, rowResults]);

  const summary = useMemo(() => {
    if (response) return response.summary;
    let created = 0;
    let skipped = 0;
    let errors = 0;
    for (const r of liveResults) {
      if (r.status === "created") created += 1;
      else if (r.status === "skipped") skipped += 1;
      else errors += 1;
    }
    return { created, skipped, errors };
  }, [response, liveResults]);

  const errorRows = useMemo(
    () => liveResults.filter((r) => r.status === "error"),
    [liveResults],
  );

  const handleDownloadErrors = () => {
    downloadCsv("team-members-errors.csv", buildErrorReportCsv(errorRows));
  };

  // Register footer with the shell. Re-registers on state transitions.
  useEffect(() => {
    const cancelButton = (
      <button
        onClick={onClose}
        disabled={isUploading}
        className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
    );

    const importButton = (
      <button
        onClick={handleImport}
        disabled={!file || isUploading}
        className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Importing…" : "Import users"}
      </button>
    );

    const doneButton = (
      <button
        onClick={onClose}
        className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
      >
        Done
      </button>
    );

    const downloadButton =
      isDone && summary.errors > 0 ? (
        <button
          onClick={handleDownloadErrors}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
        >
          <Download size={14} />
          Download error report
        </button>
      ) : null;

    onRegisterFooter(
      <div className="flex items-center justify-between gap-3 w-full">
        <div>{downloadButton}</div>
        <div className="flex items-center gap-3">
          {!isDone && cancelButton}
          {!isDone && importButton}
          {isDone && doneButton}
        </div>
      </div>,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploading, isDone, file, summary.errors, onClose]);

  return (
    <div className="space-y-5">
      {errorMessage && (
        <Banner variant="error" message={errorMessage} dismissible={false} />
      )}

      {!isUploading && !isDone && (
        <>
          <div className="text-sm text-gray-600">
            Upload a CSV with one row per member.{" "}
            <a
              href={config.teamMembersCsvTemplateUrl}
              download
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-700"
            >
              Download template
            </a>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />

          {!file && (
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-16 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                isDragging
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <CloudArrowUp
                size={40}
                className={isDragging ? "text-gray-700" : "text-gray-400"}
              />
              <span className="text-sm font-medium text-gray-900">
                {isDragging
                  ? "Drop CSV to upload"
                  : "Choose a CSV file or drop it here"}
              </span>
              <span className="text-xs text-gray-500">Up to 50 rows</span>
            </button>
          )}

          {file && (
            <div className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3 min-w-0">
                <FileCsv
                  size={24}
                  className="text-gray-700 shrink-0"
                  weight="duotone"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {isUploading && (
        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            {total > 0 ? `Processing ${completed} of ${total}…` : "Uploading…"}
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-all duration-300"
              style={{
                width: total > 0 ? `${(completed / total) * 100}%` : "10%",
              }}
            />
          </div>
          {liveResults.length > 0 && <ResultsTable rows={liveResults} />}
        </div>
      )}

      {isDone && response && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" weight="fill" />
            <div className="text-sm text-gray-900">
              Import complete.{" "}
              <span className="text-gray-600">
                {summary.created} created · {summary.skipped} skipped ·{" "}
                {summary.errors} {summary.errors === 1 ? "error" : "errors"}
              </span>
            </div>
          </div>

          {summary.errors > 0 && (
            <Banner
              variant="warning"
              message={`${summary.errors} row${summary.errors === 1 ? "" : "s"} failed. Download the error report, fix the rows, and re-upload — already-created users will be skipped.`}
              dismissible={false}
            />
          )}

          <ResultsTable rows={response.results} />
        </div>
      )}
    </div>
  );
}

function ResultsTable({ rows }: { rows: BulkImportRowResult[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-gray-700 tracking-wide w-10">
              #
            </th>
            <th className="px-3 py-2 text-left text-gray-700 tracking-wide">
              Email
            </th>
            <th className="px-3 py-2 text-left text-gray-700 tracking-wide w-24">
              Status
            </th>
            <th className="px-3 py-2 text-left text-gray-700 tracking-wide">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.row}>
              <td className="px-3 py-2 text-gray-500 tabular-nums">{r.row}</td>
              <td className="px-3 py-2 text-gray-900 truncate max-w-[16rem]">
                {r.input.email}
              </td>
              <td className="px-3 py-2">
                <StatusPill status={r.status} />
              </td>
              <td className="px-3 py-2 text-gray-600">{r.reason ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: BulkImportRowResult["status"] }) {
  if (status === "created") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
        <CheckCircle size={10} weight="fill" />
        Created
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
        Skipped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">
      <Warning size={10} weight="fill" />
      Error
    </span>
  );
}
