import { getFileContent } from '@/api/server/files/getFileContent';
import Spinner from '@/elements/Spinner';
import { urlPathToFilePath } from '@/lib/path';
import { useServerStore } from '@/stores/server';
import { Editor } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export default function ServerFilesEdit() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const server = useServerStore(state => state.data);
  const [filePath, setFilePath] = useState(urlPathToFilePath(location.pathname));
  const [content, setContent] = useState('');

  useEffect(() => {
    setFilePath(urlPathToFilePath(location.pathname));
  }, [location]);

  useEffect(() => {
    getFileContent(server.id, filePath)
      .then(setContent)
      .finally(() => setLoading(false));
  }, [filePath]);

  return loading ? (
    <div className="w-full h-screen flex items-center justify-center">
      <Spinner size={75} />
    </div>
  ) : (
    <Editor height={'100vh'} theme="vs-dark" defaultLanguage="javascript" defaultValue={content} />
  );
}
