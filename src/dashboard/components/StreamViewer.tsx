'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface StreamMessage {
  type: 'connected' | 'heartbeat' | 'output' | 'error' | 'done';
  dept?: string;
  timestamp: string;
  message?: string;
}

interface StreamLine {
  id: number;
  type: StreamMessage['type'];
  text: string;
  timestamp: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface StreamViewerProps {
  department: string | null;
}

const CONNECTION_STATUS_BADGE: Record<ConnectionStatus, { label: string; className: string }> = {
  idle: { label: 'Idle', className: 'badge badge-idle' },
  connecting: { label: 'Connecting...', className: 'badge badge-info' },
  connected: { label: 'Connected', className: 'badge badge-success' },
  disconnected: { label: 'Disconnected', className: 'badge badge-idle' },
  error: { label: 'Error', className: 'badge badge-error' },
};

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toTimeString().slice(0, 8);
  } catch {
    return '--:--:--';
  }
}

export function StreamViewer({ department }: StreamViewerProps) {
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const logRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const lineIdRef = useRef(0);

  const appendLine = useCallback((type: StreamMessage['type'], text: string, timestamp: string) => {
    setLines((prev) => [
      ...prev.slice(-499), // keep last 500 lines to avoid memory growth
      { id: ++lineIdRef.current, type, text, timestamp },
    ]);
  }, []);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    if (!department) {
      setStatus('idle');
      setLines([]);
      return;
    }

    setStatus('connecting');
    setLines([]);

    const url = `/api/stream?dept=${encodeURIComponent(department)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setStatus('connected');
    };

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as StreamMessage;
        const ts = data.timestamp ?? new Date().toISOString();

        if (data.type === 'connected') {
          appendLine('connected', `Connected to stream for: ${data.dept ?? department}`, ts);
        } else if (data.type === 'heartbeat') {
          appendLine('heartbeat', `heartbeat`, ts);
        } else if (data.type === 'output' && data.message) {
          appendLine('output', data.message, ts);
        } else if (data.type === 'error' && data.message) {
          appendLine('error', `ERROR: ${data.message}`, ts);
        } else if (data.type === 'done') {
          appendLine('done', `Stream ended for: ${data.dept ?? department}`, ts);
          setStatus('disconnected');
          es.close();
        }
      } catch {
        appendLine('error', `Unparseable event: ${event.data}`, new Date().toISOString());
      }
    };

    es.onerror = () => {
      setStatus('error');
      appendLine('error', 'Connection error — stream interrupted', new Date().toISOString());
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [department, appendLine]);

  const handleClear = () => setLines([]);

  const badge = CONNECTION_STATUS_BADGE[status];

  return (
    <div>
      {/* Viewer header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            {department
              ? `Stream: ${department.charAt(0).toUpperCase() + department.slice(1)}`
              : 'Stream Viewer'}
          </span>
          <span className={badge.className}>{badge.label}</span>
        </div>
        <button
          className="btn btn-sm"
          onClick={handleClear}
          disabled={lines.length === 0}
          style={{ opacity: lines.length === 0 ? 0.4 : 1 }}
        >
          Clear
        </button>
      </div>

      {/* Log area */}
      <div className="stream-log" ref={logRef}>
        {lines.length === 0 && !department && (
          <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
            Select a department to begin streaming output.
          </span>
        )}
        {lines.length === 0 && department && status === 'connecting' && (
          <span style={{ color: 'var(--accent)' }}>Connecting to {department}...</span>
        )}
        {lines.map((line) => (
          <span
            key={line.id}
            className={`stream-line ${line.type === 'heartbeat' ? 'heartbeat' : line.type === 'connected' ? 'connected' : line.type === 'error' ? 'error' : ''}`}
          >
            {`[${formatTime(line.timestamp)}] ${line.text}\n`}
          </span>
        ))}
      </div>

      {/* Line count */}
      {lines.length > 0 && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--muted)', textAlign: 'right' }}>
          {lines.length} line{lines.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
