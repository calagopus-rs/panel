'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnsiUp } from 'ansi_up';
import { useServerStore } from '@/stores/server';
import { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import Card from '@/elements/Card';
import Spinner from '@/elements/Spinner';
import TextInput from '@/elements/input/TextInput';

const ansiUp = new AnsiUp();
const MAX_LINES = 1000;

interface TerminalLine {
  html: string;
  isPrelude: boolean;
  content: string;
}

export default function Terminal() {
  const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
  const { socketConnected, socketInstance } = useServerStore();

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback((text: string, prelude = false) => {
    const processed = text.replace(/(?:\r\n|\r|\n)$/im, '');
    const html = ansiUp.ansi_to_html(processed);

    setLines((prev) => {
      const newLine: TerminalLine = {
        html,
        content: processed,
        isPrelude: prelude,
      };

      const updated = [...prev, newLine];
      return updated.length > MAX_LINES ? updated.slice(-MAX_LINES) : updated;
    });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (!socketConnected || !socketInstance) return;

    setLines([]);

    const listeners: Record<string, (msg: string) => void> = {
      [SocketEvent.STATUS]: (s) => addLine(`Server marked as ${s}...`, true),
      [SocketEvent.CONSOLE_OUTPUT]: (l) => addLine(l),
      [SocketEvent.INSTALL_OUTPUT]: (l) => addLine(l),
      [SocketEvent.TRANSFER_LOGS]: (l) => addLine(l),
      [SocketEvent.TRANSFER_STATUS]: (s) => {
        if (s === 'failure') addLine('Transfer has failed.', true);
      },
      [SocketEvent.DAEMON_MESSAGE]: (l) => addLine(l, true),
      [SocketEvent.DAEMON_ERROR]: (l) => addLine(`\u001b[1m\u001b[41m${l}\u001b[0m`, true),
    };

    Object.entries(listeners).forEach(([k, fn]) => socketInstance.addListener(k, fn));
    socketInstance.send(SocketRequest.SEND_LOGS);

    return () => {
      Object.entries(listeners).forEach(([k, fn]) => socketInstance.removeListener(k, fn));
    };
  }, [socketConnected, socketInstance, addLine]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!inputRef.current) return;

      if (e.key === 'ArrowUp') {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        inputRef.current.value = history[newIndex] || '';
        e.preventDefault();
      }

      if (e.key === 'ArrowDown') {
        const newIndex = Math.max(historyIndex - 1, -1);
        setHistoryIndex(newIndex);
        inputRef.current.value = history[newIndex] || '';
        e.preventDefault();
      }

      if (e.key === 'Enter') {
        const command = inputRef.current.value.trim();
        if (!command) return;

        setHistory((prev) => [command, ...prev].slice(0, 32));
        setHistoryIndex(-1);
        socketInstance?.send('send command', command);
        inputRef.current.value = '';
      }
    },
    [history, historyIndex, socketInstance],
  );

  return (
    <Card className={'h-full flex flex-col font-mono text-sm'}>
      {!socketConnected && <Spinner />}

      <div ref={containerRef} className={'flex-1 overflow-auto custom-scrollbar p-2 space-y-1 select-text'}>
        {lines.map((line) => (
          <div
            key={Math.random() * 100000}
            className={'whitespace-pre-wrap break-all'}
            dangerouslySetInnerHTML={{
              __html:
                line.isPrelude && !line.content.includes('\u001b[1m\u001b[41m')
                  ? ansiUp.ansi_to_html(TERMINAL_PRELUDE) + line.html
                  : line.html,
            }}
          />
        ))}
      </div>

      <div className={'w-full mt-2'}>
        <TextInput
          ref={inputRef}
          placeholder={'Type a command...'}
          aria-label={'Console command input.'}
          disabled={!socketConnected}
          onKeyDown={handleKeyDown}
          autoCorrect={'off'}
          autoCapitalize={'none'}
          className={'w-full'}
        />
      </div>
    </Card>
  );
}
