import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../AppProvider';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { VscTrash, VscRefresh, VscFolderOpened } from 'react-icons/vsc';

interface LogFileInfo {
  filename: string;
  filePath: string;
  size: number;
  startedAt: string;
  stoppedAt?: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function LogsTab() {
  const { activeProfile } = useApp();
  const profileId = activeProfile?.id ?? '';
  const color = activeProfile?.color ?? '#4ade80';

  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFileInfo | null>(null);
  const [logContent, setLogContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LogFileInfo | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    const files = await window.api.getLogFiles(profileId);
    setLogFiles(files);
  }, [profileId]);

  useEffect(() => {
    refresh();
    setSelectedFile(null);
    setLogContent(null);
  }, [profileId, refresh]);

  const handleSelectFile = useCallback(async (file: LogFileInfo) => {
    setSelectedFile(file);
    setLoading(true);
    const content = await window.api.readLogFile(file.filePath);
    setLogContent(content);
    setLoading(false);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await window.api.deleteLogFile(deleteTarget.filePath);
    if (selectedFile?.filePath === deleteTarget.filePath) {
      setSelectedFile(null);
      setLogContent(null);
    }
    setDeleteTarget(null);
    refresh();
  }, [deleteTarget, selectedFile, refresh]);

  const handleOpenDir = useCallback(async () => {
    if (!profileId) return;
    await window.api.openLogsDirectory(profileId);
  }, [profileId]);

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-muted">
        No profile selected
      </div>
    );
  }

  if (!activeProfile.fileLogging) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
        <p className="text-xs font-mono">File logging is disabled for this profile.</p>
        <p className="text-xs text-text-muted">
          Enable it in Configure &gt; General &gt; Save session logs to file.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
        <h2 className="text-sm font-medium text-text-primary flex-1">
          Session Logs
          <span className="text-xs text-text-muted font-mono ml-2">
            {logFiles.length} file{logFiles.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <button
          onClick={refresh}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          title="Refresh"
        >
          <VscRefresh size={13} />
        </button>
        <button
          onClick={handleOpenDir}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
          title="Open logs directory"
        >
          <VscFolderOpened size={13} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-56 shrink-0 border-r border-surface-border bg-base-900/60 overflow-y-auto">
          {logFiles.length === 0 && (
            <p className="text-xs text-text-muted font-mono py-8 text-center px-3">
              No log files yet. Start and stop a process to create one.
            </p>
          )}
          {logFiles.map((file) => (
            <button
              key={file.filename}
              onClick={() => handleSelectFile(file)}
              className={[
                'w-full text-left px-3 py-2.5 border-b border-surface-border/30 transition-colors',
                selectedFile?.filePath === file.filePath
                  ? 'bg-surface-raised border-r-2'
                  : 'hover:bg-surface-raised/50',
              ].join(' ')}
              style={
                selectedFile?.filePath === file.filePath
                  ? { borderRightColor: color }
                  : {}
              }
            >
              <p className="text-xs font-mono text-text-primary truncate">
                {file.startedAt || file.filename}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-text-muted font-mono">
                  {formatBytes(file.size)}
                </span>
                {file.stoppedAt && (
                  <span className="text-[10px] text-text-muted font-mono truncate">
                    to {file.stoppedAt}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!selectedFile && (
            <div className="flex items-center justify-center h-full text-xs text-text-muted font-mono">
              Select a log file to view its contents
            </div>
          )}
          {selectedFile && loading && (
            <div className="flex items-center justify-center h-full text-xs text-text-muted font-mono animate-pulse">
              Loading...
            </div>
          )}
          {selectedFile && !loading && logContent !== null && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border bg-base-900 shrink-0">
                <span className="text-xs font-mono text-text-secondary flex-1 truncate">
                  {selectedFile.filename}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(logContent)}
                >
                  Copy
                </Button>
                <button
                  onClick={(e) => {
                    if (e.shiftKey) {
                      window.api.deleteLogFile(selectedFile.filePath);
                      setSelectedFile(null);
                      setLogContent(null);
                      refresh();
                    } else {
                      setDeleteTarget(selectedFile);
                    }
                  }}
                  className="text-text-muted hover:text-red-400 transition-colors p-1"
                  title="Delete log file (hold Shift to skip confirmation)"
                >
                  <VscTrash size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-base-950 p-3 select-text">
                <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {logContent}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!deleteTarget}
        title="Delete log file?"
        message={`"${deleteTarget?.filename}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
