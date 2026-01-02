import { faArrowDown, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { AnsiUp } from 'ansi_up';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Progress from '@/elements/Progress.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

const ansiUp = new AnsiUp();
const MAX_LINES = 1000;

const configureDOMPurify = () => {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('class', 'hover:text-blue-300 underline cursor-pointer');
    }
  });
};

configureDOMPurify();

const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

const linkifyText = (html: string): string => {
  const linked = html.replace(URL_REGEX, (url) => {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return url;
      }
    } catch {
      return url;
    }

    const escapedHref = url
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<a href="${escapedHref}">${url}</a>`;
  });

  return DOMPurify.sanitize(linked, {
    ALLOWED_TAGS: ['a', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
  });
};

interface TerminalLine {
  html: string;
  isPrelude: boolean;
  content: string;
}

export default function Terminal() {
  const { t } = useTranslations();
  const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@calagopus~ \u001b[0m';
  const { server, imagePulls, socketConnected, socketInstance, state } = useServerStore();

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [websocketPing, setWebsocketPing] = useState(0);
  const [consoleFontSize, setConsoleFontSize] = useState(14);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAutoScrolling = useRef(false);
  const isInitialLoad = useRef(true);
  const initialScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const HISTORY_STORAGE_KEY = `terminal_command_history_${server.uuid}`;
  const CONSOLE_FONT_SIZE_KEY = 'terminal_console_font_size';

  useEffect(() => {
    let pingInterval: NodeJS.Timeout;

    if (socketConnected && socketInstance) {
      const pingFn = () => {
        const start = Date.now();
        socketInstance.send(SocketRequest.PING);

        const handlePong = () => {
          const latency = Date.now() - start;
          setWebsocketPing(latency);
          socketInstance.removeListener(SocketEvent.PONG, handlePong);
        };

        socketInstance.addListener(SocketEvent.PONG, handlePong);
      };

      pingInterval = setInterval(pingFn, 10000);
      pingFn();
    }

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, [socketConnected, socketInstance]);

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
  }, [HISTORY_STORAGE_KEY]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history, HISTORY_STORAGE_KEY]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem(CONSOLE_FONT_SIZE_KEY);
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (!isNaN(size)) {
        setConsoleFontSize(size);
      }
    }
  }, [CONSOLE_FONT_SIZE_KEY]);

  useEffect(() => {
    localStorage.setItem(CONSOLE_FONT_SIZE_KEY, consoleFontSize.toString());
  }, [consoleFontSize, CONSOLE_FONT_SIZE_KEY]);

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
      if (text.includes('container@pterodactyl~')) {
        text = text.replace('container@pterodactyl~', 'container@calagopus~');
      }

      const processed = text.replace(/(?:\r\n|\r|\n)$/im, '');
      const ansiHtml = ansiUp.ansi_to_html(processed);
      const html = linkifyText(ansiHtml);

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
      [SocketEvent.STATUS]: (s) =>
        addLine(
          t('pages.server.console.message.serverMarkedAs', {
            state:
              s === 'offline'
                ? t('common.enum.serverState.offline', {})
                : s === 'running'
                  ? t('common.enum.serverState.running', {})
                  : s === 'starting'
                    ? t('common.enum.serverState.starting', {})
                    : s === 'stopping'
                      ? t('common.enum.serverState.stopping', {})
                      : s,
          }),
          true,
        ),
      [SocketEvent.CONSOLE_OUTPUT]: (l) => addLine(l),
      [SocketEvent.INSTALL_OUTPUT]: (l) => addLine(l),
      [SocketEvent.TRANSFER_LOGS]: (l) => addLine(l),
      [SocketEvent.TRANSFER_STATUS]: (s) => {
        if (s === 'failure') addLine(t('pages.server.console.message.transferFailed', {}), true);
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

        if (history[0] !== command) {
          setHistory((prev) => [command, ...prev].slice(0, 32));
        }
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
          className='whitespace-pre-wrap break-all'
          dangerouslySetInnerHTML={{
            __html:
              line.isPrelude && !line.content.includes('\u001b[1m\u001b[41m')
                ? linkifyText(ansiUp.ansi_to_html(TERMINAL_PRELUDE)) + line.html
                : line.html,
          }}
        />
      )),
    [lines],
  );

  return (
    <Card className='h-full flex flex-col font-mono text-sm relative p-2!'>
      <div className='flex flex-row justify-between items-center mb-2 text-xs'>
        <div className='flex flex-row items-center'>
          <span
            className={classNames(
              'rounded-full h-3 w-3 animate-pulse mr-2',
              socketConnected ? 'bg-green-500' : 'bg-red-500',
            )}
          />
          {socketConnected
            ? t('pages.server.console.socketConnected', { ping: websocketPing })
            : t('pages.server.console.socketDisconnected', {})}
        </div>
        <div className='flex flex-row items-center'>
          <ActionIcon
            className='mr-2'
            size='xs'
            variant='subtle'
            color='gray'
            onClick={() => setConsoleFontSize((size) => Math.max(10, size - 1))}
          >
            <FontAwesomeIcon icon={faMinus} />
          </ActionIcon>
          {consoleFontSize}px
          <ActionIcon
            className='ml-2'
            size='xs'
            variant='subtle'
            color='gray'
            onClick={() => setConsoleFontSize((size) => Math.min(24, size + 1))}
          >
            <FontAwesomeIcon icon={faPlus} />
          </ActionIcon>
        </div>
      </div>

      {!socketConnected && <Spinner.Centered />}

      <div
        ref={containerRef}
        className='flex-1 overflow-auto custom-scrollbar space-y-1 select-text'
        style={{ fontSize: `${consoleFontSize}px` }}
        onScroll={handleScroll}
      >
        {MemoizedLines}
      </div>

      {imagePulls.size > 0 && (
        <span className='flex flex-col justify-end mt-4'>
          {t('pages.server.console.message.pullingImage', {})}
          {Array.from(imagePulls).map(([id, progress]) => (
            <span key={id} className='flex flex-row w-full items-center whitespace-pre-wrap break-all'>
              {progress.status === 'pulling'
                ? t('pages.server.console.message.pulling', {})
                : t('pages.server.console.message.extracting', {})}{' '}
              {t('pages.server.console.message.layer', {})}{' '}
              <Progress hourglass={false} value={(progress.progress / progress.total) * 100} className='flex-1 ml-2' />
            </span>
          ))}
        </span>
      )}

      {!isAtBottom && (
        <div className='absolute bottom-2 right-2 z-90 w-fit'>
          <Button onClick={scrollToBottom} variant='transparent'>
            <FontAwesomeIcon icon={faArrowDown} />
          </Button>
        </div>
      )}

      <div className='w-full mt-4'>
        <TextInput
          ref={inputRef}
          placeholder={t('pages.server.console.input.placeholder', {})}
          aria-label={t('pages.server.console.input.ariaLabel', {})}
          disabled={!socketConnected || state === 'offline'}
          onKeyDown={handleKeyDown}
          autoCorrect='off'
          autoCapitalize='none'
          className='w-full'
        />
      </div>
    </Card>
  );
}
