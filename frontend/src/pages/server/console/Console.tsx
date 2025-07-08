import { ChevronDoubleRightIcon } from '@heroicons/react/24/solid';
import classNames from 'classnames';
import debounce from 'debounce';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ITerminalInitOnlyOptions, ITerminalOptions, ITheme } from '@xterm/xterm';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';

import '@xterm/xterm/css/xterm.css';
import styles from './console.module.css';
import Spinner from '@/elements/Spinner';
import { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import { useServerStore } from '@/stores/server';

const theme: ITheme = {
  cursor: 'transparent',
};

const terminalProps: ITerminalOptions = {
  disableStdin: true,
  cursorStyle: 'underline',
  allowTransparency: true,
  fontSize: 12,
  theme: theme,
  allowProposedApi: true,
};

const terminalInitOnlyProps: ITerminalInitOnlyOptions = {
  rows: 30,
};

export default () => {
  const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
  const ref = useRef<HTMLDivElement>(null);
  const terminal = useMemo(() => new Terminal({ ...terminalProps, ...terminalInitOnlyProps }), []);
  const fitAddon = new FitAddon();
  const searchAddon = new SearchAddon();
  const webLinksAddon = new WebLinksAddon();
  // const scrollDownHelperAddon = new ScrollDownHelperAddon();
  const { socketConnected, socketInstance } = useServerStore();
  // const [canSendCommands] = usePermissions(['control.console']);
  const server = useServerStore(state => state.server);
  // const [history, setHistory] = usePersistedState<string[]>(`${server.uuid}:command_history`, []);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleConsoleOutput = (line: string, prelude = false) =>
    terminal.writeln((prelude ? TERMINAL_PRELUDE : '') + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m');

  const handleTransferStatus = (status: string) => {
    switch (status) {
      // Sent by either the source or target node if a failure occurs.
      case 'failure':
        terminal.writeln(TERMINAL_PRELUDE + 'Transfer has failed.\u001b[0m');
        return;
    }
  };

  const handleDaemonErrorOutput = (line: string) =>
    terminal.writeln(TERMINAL_PRELUDE + '\u001b[1m\u001b[41m' + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m');

  const handlePowerChangeEvent = (state: string) =>
    terminal.writeln(TERMINAL_PRELUDE + 'Server marked as ' + state + '...\u001b[0m');

  const handleCommandKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      const newIndex = Math.min(historyIndex + 1, history!.length - 1);

      setHistoryIndex(newIndex);
      e.currentTarget.value = history![newIndex] || '';

      // By default, up arrow will also bring the cursor to the start of the line,
      // so we'll preventDefault to keep it at the end.
      e.preventDefault();
    }

    if (e.key === 'ArrowDown') {
      const newIndex = Math.max(historyIndex - 1, -1);

      setHistoryIndex(newIndex);
      e.currentTarget.value = history![newIndex] || '';
    }

    const command = e.currentTarget.value;
    if (e.key === 'Enter' && command.length > 0) {
      // setHistory(prevHistory => [command, ...prevHistory!].slice(0, 32));
      setHistoryIndex(-1);

      if (socketInstance) {
        socketInstance.send('send command', command);
      }
      e.currentTarget.value = '';
    }
  };

  useEffect(() => {
    if (socketConnected && ref.current && !terminal.element) {
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(searchAddon);
      terminal.loadAddon(webLinksAddon);
      // terminal.loadAddon(scrollDownHelperAddon);

      terminal.open(ref.current);
      fitAddon.fit();

      // Add support for capturing keys
      terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          document.execCommand('copy');
          return false;
        }
        return true;
      });
    }
  }, [terminal, socketConnected]);

  addEventListener(
    'resize',
    debounce(() => {
      if (terminal.element) {
        fitAddon.fit();
      }
    }, 100),
  );

  useEffect(() => {
    const listeners: Record<string, (s: string) => void> = {
      [SocketEvent.STATUS]: handlePowerChangeEvent,
      [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
      [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
      [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
      [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
      [SocketEvent.DAEMON_MESSAGE]: line => handleConsoleOutput(line, true),
      [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
    };

    if (socketConnected && socketInstance) {
      // TODO: Do not clear the console if the server is being transferred.
      // if (!server.isTransferring) {
      //   terminal.clear();
      // }

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
  }, [socketConnected, socketInstance]);

  return (
    <div className={classNames(styles.terminal, 'relative')}>
      {!socketConnected && <Spinner />}
      <div className={classNames(styles.container)}>
        <div className="h-full">
          <div id={styles.terminal} ref={ref} />
        </div>
      </div>
      {/* {canSendCommands && ( */}
      <div className="relative">
        <input
          className={classNames('peer', styles.command_input)}
          type="text"
          placeholder="Type a command..."
          aria-label="Console command input."
          disabled={!socketInstance || !socketConnected}
          onKeyDown={handleCommandKeyDown}
          autoCorrect="off"
          autoCapitalize="none"
        />
        <div
          className={classNames(
            'text-slate-100 peer-focus:animate-pulse peer-focus:text-slate-50',
            styles.command_icon,
          )}
        >
          <ChevronDoubleRightIcon className="h-4 w-4" />
        </div>
      </div>
      {/* )} */}
    </div>
  );
};
