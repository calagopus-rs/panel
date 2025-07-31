import { ChevronDoubleRightIcon } from '@heroicons/react/24/solid';
import classNames from 'classnames';
import debounce from 'debounce';
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { VariableSizeList as List } from 'react-window';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import { useServerStore } from '@/stores/server';
import Spinner from '@/elements/Spinner';
import styles from './console.module.css';
import { AnsiUp } from 'ansi_up';

const ansiUp = new AnsiUp();

interface TerminalLine {
  id: number;
  content: string;
  html: string;
  isPrelude: boolean;
  height: number;
}

// Helper function to strip ANSI codes
const stripAnsiCodes = (text: string): string => {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
};

// Memoize the line renderer to prevent unnecessary re-renders
const LineRenderer = memo(
  ({
    line,
    style,
    terminalPrelude,
    isLastLine,
  }: {
    line: TerminalLine;
    style: React.CSSProperties;
    terminalPrelude: string;
    isLastLine: boolean;
  }) => {
    if (!line) return null;

    // Extract plain text from the line for copying
    const getPlainText = () => {
      let text = stripAnsiCodes(line.content);
      if (line.isPrelude && !line.content.includes('\u001b[1m\u001b[41m')) {
        // Add plain prelude text
        text = 'container@pterodactyl~ ' + text;
      }
      return text;
    };

    return (
      <div
        style={{
          ...style,
          height: 'auto',
          minHeight: style.height,
        }}
        className='px-2 font-mono text-sm whitespace-pre-wrap select-text'
        data-plain-text={getPlainText()}
      >
        {line.isPrelude && !line.content.includes('\u001b[1m\u001b[41m') ? (
          <>
            <span dangerouslySetInnerHTML={{ __html: ansiUp.ansi_to_html(terminalPrelude) }} />
            <span dangerouslySetInnerHTML={{ __html: line.html }} />
          </>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: line.html }} />
        )}
        {/* Add a newline character that will be included in selection but not visible */}
        {!isLastLine && <span style={{ userSelect: 'text', fontSize: 0, lineHeight: 0 }}>{'\n'}</span>}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if the line data actually changed
    return (
      prevProps.line.id === nextProps.line.id &&
      prevProps.line.html === nextProps.line.html &&
      prevProps.style.top === nextProps.style.top &&
      prevProps.isLastLine === nextProps.isLastLine
    );
  },
);

LineRenderer.displayName = 'LineRenderer';

export default () => {
  const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sizeCalculatorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { socketConnected, socketInstance } = useServerStore();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(500);
  const [terminalWidth, setTerminalWidth] = useState(800);

  const calculateLineHeight = useCallback((content: string, width: number): number => {
    if (!sizeCalculatorRef.current) return 20;

    sizeCalculatorRef.current.innerHTML = content;
    sizeCalculatorRef.current.style.width = `${width}px`;

    const height = sizeCalculatorRef.current.offsetHeight;
    sizeCalculatorRef.current.innerHTML = '';

    return Math.max(20, height + 2);
  }, []);

  const getLineHeight = useCallback(
    (index: number) => {
      return lines[index]?.height || 20;
    },
    [lines],
  );

  const addLine = useCallback(
    (text: string, prelude = false) => {
      const processedText = text.replace(/(?:\r\n|\r|\n)$/im, '');
      const html = ansiUp.ansi_to_html(processedText);

      const fullContent = prelude ? ansiUp.ansi_to_html(TERMINAL_PRELUDE) + html : html;

      setLines((prevLines) => {
        const newLine = {
          id: prevLines.length > 0 ? prevLines[prevLines.length - 1].id + 1 : 0,
          content: processedText,
          html: html,
          isPrelude: prelude,
          height: calculateLineHeight(fullContent, terminalWidth - 20),
        };

        return [...prevLines, newLine];
      });
    },
    [terminalWidth, calculateLineHeight, TERMINAL_PRELUDE],
  );

  // Handle copy event to ensure proper line breaks
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      // Check if the selection is within our terminal
      if (!containerRef.current?.contains(container)) return;

      // Get all selected elements
      const selectedElements = containerRef.current.querySelectorAll('[data-plain-text]');
      let textContent = '';
      let foundStart = false;

      selectedElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const rangeRect = range.getBoundingClientRect();

        // Check if element is within the selection range
        if (rect.bottom > rangeRect.top && rect.top < rangeRect.bottom) {
          if (!foundStart) foundStart = true;
          const plainText = element.getAttribute('data-plain-text') || '';
          textContent += plainText + '\n';
        } else if (foundStart && rect.top > rangeRect.bottom) {
          // We've passed the selection
          return;
        }
      });

      // Remove trailing newline
      textContent = textContent.replace(/\n$/, '');

      if (textContent) {
        e.clipboardData?.setData('text/plain', textContent);
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);

  useEffect(() => {
    if (autoScroll && listRef.current && lines.length > 0) {
      listRef.current.scrollToItem(lines.length - 1, 'end');
    }
  }, [lines, autoScroll]);

  useEffect(() => {
    if (lines.length > 0 && terminalWidth > 0) {
      setLines((prevLines) =>
        prevLines.map((line) => {
          const fullContent = line.isPrelude ? ansiUp.ansi_to_html(TERMINAL_PRELUDE) + line.html : line.html;

          return {
            ...line,
            height: calculateLineHeight(fullContent, terminalWidth - 20),
          };
        }),
      );

      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
    }
  }, [terminalWidth, calculateLineHeight, TERMINAL_PRELUDE]);

  const handleConsoleOutput = useCallback(
    (line: string, prelude = false) => {
      addLine(line, prelude);
    },
    [addLine],
  );

  const handleTransferStatus = useCallback(
    (status: string) => {
      switch (status) {
        case 'failure':
          addLine('Transfer has failed.', true);
          return;
      }
    },
    [addLine],
  );

  const handleDaemonErrorOutput = useCallback(
    (line: string) => {
      addLine(`\u001b[1m\u001b[41m${line}\u001b[0m`, true);
    },
    [addLine],
  );

  const handlePowerChangeEvent = useCallback(
    (state: string) => {
      addLine(`Server marked as ${state}...`, true);
    },
    [addLine],
  );

  const handleCommandKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);

        setHistoryIndex(newIndex);
        e.currentTarget.value = history[newIndex] || '';

        e.preventDefault();
      }

      if (e.key === 'ArrowDown') {
        const newIndex = Math.max(historyIndex - 1, -1);

        setHistoryIndex(newIndex);
        e.currentTarget.value = history[newIndex] || '';
      }

      const command = e.currentTarget.value;
      if (e.key === 'Enter' && command.length > 0) {
        setHistory((prevHistory) => [command, ...prevHistory].slice(0, 32));
        setHistoryIndex(-1);

        if (socketInstance) {
          socketInstance.send('send command', command);
        }
        e.currentTarget.value = '';
      }
    },
    [history, historyIndex, socketInstance],
  );

  useEffect(() => {
    const handleResize = debounce(() => {
      if (ref.current) {
        setTerminalHeight(ref.current.clientHeight - 40);
        setTerminalWidth(ref.current.clientWidth);
      }
    }, 100);

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const listeners: Record<string, (s: string) => void> = {
      [SocketEvent.STATUS]: handlePowerChangeEvent,
      [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
      [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
      [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
      [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
      [SocketEvent.DAEMON_MESSAGE]: (line) => handleConsoleOutput(line, true),
      [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
    };

    if (socketConnected && socketInstance) {
      setLines([]);

      Object.keys(listeners).forEach((key: string) => {
        const listener = listeners[key];
        if (listener === undefined) {
          return;
        }

        socketInstance.addListener(key, listener);
      });
      socketInstance.send(SocketRequest.SEND_LOGS);
    }

    return () => {
      if (socketInstance) {
        Object.keys(listeners).forEach((key: string) => {
          const listener = listeners[key];
          if (listener === undefined) {
            return;
          }

          socketInstance.removeListener(key, listener);
        });
      }
    };
  }, [
    socketConnected,
    socketInstance,
    handleConsoleOutput,
    handleDaemonErrorOutput,
    handlePowerChangeEvent,
    handleTransferStatus,
  ]);

  // Memoized row renderer to prevent unnecessary re-renders
  const rowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const line = lines[index];
      const isLastLine = index === lines.length - 1;
      return <LineRenderer line={line} style={style} terminalPrelude={TERMINAL_PRELUDE} isLastLine={isLastLine} />;
    },
    [lines, TERMINAL_PRELUDE],
  );

  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
      if (!scrollUpdateWasRequested) {
        let totalHeight = 0;
        for (let i = 0; i < lines.length; i++) {
          totalHeight += getLineHeight(i);
        }

        const isAtBottom = scrollOffset >= totalHeight - terminalHeight - 40;
        setAutoScroll(isAtBottom);
      }
    },
    [lines.length, getLineHeight, terminalHeight],
  );

  return (
    <div className={classNames(styles.terminal, 'relative')} ref={ref}>
      {!socketConnected && <Spinner />}

      <div ref={sizeCalculatorRef} className='size-calculator font-mono text-sm' />

      <div className={classNames(styles.container, 'font-mono')} ref={containerRef}>
        <div className='h-full'>
          <List
            ref={listRef}
            height={terminalHeight}
            itemCount={lines.length}
            itemSize={getLineHeight}
            width='100%'
            className='custom-scrollbar'
            onScroll={handleScroll}
            overscanCount={20}
          >
            {rowRenderer}
          </List>
        </div>
      </div>
      <div className='relative'>
        <input
          ref={inputRef}
          className={classNames('peer', styles.command_input)}
          type='text'
          placeholder='Type a command...'
          aria-label='Console command input.'
          disabled={!socketInstance || !socketConnected}
          onKeyDown={handleCommandKeyDown}
          autoCorrect='off'
          autoCapitalize='none'
          onFocus={() => setAutoScroll(true)}
        />
        <div
          className={classNames(
            'text-slate-100 peer-focus:animate-pulse peer-focus:text-slate-50',
            styles.command_icon,
          )}
        >
          <ChevronDoubleRightIcon className='h-4 w-4' />
        </div>
      </div>
    </div>
  );
};
