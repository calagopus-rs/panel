import { transformKeysToCamelCase } from '@/api/transformers';
import useWebsocketEvent, { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

export default () => {
  const [searchParams, _] = useSearchParams();
  const { addToast } = useToast();
  const {
    socketConnected,
    socketInstance,
    updateServer,
    setStats,
    setBackupProgress,
    setBackupRestoreProgress,
    updateBackup,
    fileOperations,
    setFileOperation,
    removeFileOperation,
    refreshFiles,
  } = useServerStore();

  useEffect(() => {
    if (!socketConnected || !socketInstance) {
      return;
    }

    socketInstance.send(SocketRequest.SEND_STATS);
  }, [socketInstance, socketConnected]);

  useWebsocketEvent(SocketEvent.STATS, (data) => {
    let wsStats: any = {};
    try {
      wsStats = JSON.parse(data);
    } catch {
      return;
    }

    setStats(transformKeysToCamelCase(wsStats));
  });

  useWebsocketEvent(SocketEvent.BACKUP_PROGRESS, (uuid, data) => {
    let wsData: any = null;
    try {
      wsData = JSON.parse(data);
    } catch {
      return;
    }

    setBackupProgress(uuid, wsData.progress, wsData.total);
  });

  useWebsocketEvent(SocketEvent.BACKUP_COMPLETED, (uuid, data) => {
    let wsData: any = null;
    try {
      wsData = JSON.parse(data);
    } catch {
      return;
    }

    updateBackup(uuid, {
      isSuccessful: wsData.isSuccessful,
      checksum: `${wsData.checksum_type}:${wsData.checksum}`,
      bytes: wsData.size,
      files: wsData.files,
      completed: new Date(),
    });
  });

  useWebsocketEvent(SocketEvent.BACKUP_RESTORE_PROGRESS, (data) => {
    let wsData: any = null;
    try {
      wsData = JSON.parse(data);
    } catch {
      return;
    }

    setBackupRestoreProgress((wsData.progress / wsData.total) * 100);
  });

  useWebsocketEvent(SocketEvent.BACKUP_RESTORE_COMPLETED, () => {
    updateServer({ status: null });
  });

  useWebsocketEvent(SocketEvent.INSTALL_COMPLETED, () => {
    updateServer({ status: null });
  });

  useWebsocketEvent(SocketEvent.OPERATION_PROGRESS, (uuid, data) => {
    let wsData: any = null;
    try {
      wsData = JSON.parse(data);
    } catch {
      return;
    }

    setFileOperation(uuid, wsData);
  });

  useWebsocketEvent(SocketEvent.OPERATION_COMPLETED, (uuid) => {
    const fileOperation = fileOperations.get(uuid);
    switch (fileOperation.type) {
      case 'compress':
        addToast(`Compressed files to ${fileOperation.path} successfully.`, 'success');
        break;
      case 'decompress':
        addToast(`Decompressed ${fileOperation.path} to ${fileOperation.destination || '/'} successfully.`, 'success');
        break;
      case 'pull':
        addToast(`Pulled ${fileOperation.path} successfully.`, 'success');
        break;
      default:
        break;
    }

    refreshFiles(Number(searchParams.get('page')) || 1);
    removeFileOperation(uuid);
  });

  return null;
};
