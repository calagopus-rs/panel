import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AnsiUp } from 'ansi_up';
import { useServerStore } from '@/stores/server';
import { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import Card from '@/elements/Card';
import Spinner from '@/elements/Spinner';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import Notification from '@/elements/Notification';
import Progress from '@/elements/Progress';

const ansiUp = new AnsiUp();
const MAX_LINES = 1000;

interface TerminalLine {
  html: string;
  isPrelude: boolean;
  content: string;
}

export default function Terminal() {
  const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
  const { server, imagePulls, socketConnected, socketInstance } = useServerStore();

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAutoScrolling = useRef(false);
  const isInitialLoad = useRef(true);
  const initialScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const HISTORY_STORAGE_KEY = `terminal_command_history_${server.uuid}`;

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {
        console.error('Failed to parse terminal history:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 50;
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    return atBottom;
  }, []);

  const handleScroll = useCallback(() => {
    if (isAutoScrolling.current || isInitialLoad.current) return;

    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
  }, [checkIfAtBottom]);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      isAutoScrolling.current = true;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setIsAtBottom(true);
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 50);
    }
  }, []);

  const addLine = useCallback(
    (text: string, prelude = false) => {
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

      if (isInitialLoad.current) {
        if (initialScrollTimer.current) {
          clearTimeout(initialScrollTimer.current);
        }

        initialScrollTimer.current = setTimeout(() => {
          isInitialLoad.current = false;
          scrollToBottom();
          initialScrollTimer.current = null;
        }, 100);
      }
    },
    [scrollToBottom],
  );

  useEffect(() => {
    if (isInitialLoad.current || lines.length === 0) return;

    if (isAtBottom && containerRef.current) {
      isAutoScrolling.current = true;
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          setTimeout(() => {
            isAutoScrolling.current = false;
          }, 50);
        }
      });
    }
  }, [lines, isAtBottom]);

  useEffect(() => {
    if (!socketConnected || !socketInstance) return;

    setLines([]);
    isInitialLoad.current = true;
    setIsAtBottom(true);

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
      if (initialScrollTimer.current) {
        clearTimeout(initialScrollTimer.current);
      }
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

  const MemoizedLines = useMemo(
    () =>
      lines.map((line, index) => (
        <div
          key={`line-${index}`}
          className={'whitespace-pre-wrap break-all'}
          dangerouslySetInnerHTML={{
            __html:
              line.isPrelude && !line.content.includes('\u001b[1m\u001b[41m')
                ? ansiUp.ansi_to_html(TERMINAL_PRELUDE) + line.html
                : line.html,
          }}
        />
      )),
    [lines],
  );

  return (
    <Card className={'h-full flex flex-col font-mono text-sm relative !p-2'}>
      {!socketConnected && <Spinner.Centered />}

      <div
        ref={containerRef}
        className={'flex-1 overflow-auto custom-scrollbar space-y-1 select-text'}
        onScroll={handleScroll}
      >
        {MemoizedLines}
      </div>

      {imagePulls.size > 0 && (
        <span className={'flex flex-col justify-end mt-4'}>
          Your Server is currently pulling it&apos;s docker image. Please wait...
          {Array.from(imagePulls).map(([id, progress]) => (
            <span key={id} className={'flex flex-row w-full items-center whitespace-pre-wrap break-all'}>
              {progress.status === 'pulling' ? 'Pulling' : 'Extracting'} Layer{' '}
              <Progress value={(progress.progress / progress.total) * 100} className={'flex-1 ml-2 mr-2'} />
            </span>
          ))}
        </span>
      )}

      {!isAtBottom && (
        <div className={'absolute bottom-2 right-2 z-90 w-fit'}>
          <Button onClick={scrollToBottom} variant={'transparent'}>
            <FontAwesomeIcon icon={faArrowDown} />
          </Button>
        </div>
      )}

      <div className={'w-full mt-4'}>
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
