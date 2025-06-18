import { urlPathToFilePath } from '@/lib/path';
import { Editor } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export default function ServerFilesEdit() {
  const location = useLocation();

  const [_, setFilePath] = useState(urlPathToFilePath(location.pathname));

  useEffect(() => {
    setFilePath(urlPathToFilePath(location.pathname));
  }, [location]);

  return (
    <Editor
      height={'100vh'}
      theme="vs-dark"
      defaultLanguage="javascript"
      defaultValue='console.log("Hello, world!");'
    />
  );
}
