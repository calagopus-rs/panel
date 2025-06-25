import { getFileContent } from '@/api/server/files/getFileContent';
import Spinner from '@/elements/Spinner';
import { getLanguageFromExtension } from '@/lib/files';
import { urlPathToFilePath } from '@/lib/path';
import { useServerStore } from '@/stores/server';
import { Editor } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { FileBreadcrumbs } from './FileBreadcrumbs';
import { Button } from '@/elements/button';
import { saveFileContent } from '@/api/server/files/saveFileContent';

export default function ServerFilesEdit() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const server = useServerStore(state => state.data);
  const [filePath, setFilePath] = useState(urlPathToFilePath(location.pathname));
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');

  useEffect(() => {
    setFilePath(urlPathToFilePath(location.pathname));
  }, [location]);

  useEffect(() => {
    getFileContent(server.id, filePath).then(content => {
      setContent(content);
      setLanguage(getLanguageFromExtension(filePath.split('.').pop()));
      setLoading(false);
    });
  }, [filePath]);

  const saveFile = () => {
    setLoading(true);

    saveFileContent(server.id, filePath, content).then(() => {
      setLoading(false);
    });
  };

  return loading ? (
    <div className="w-full h-screen flex items-center justify-center">
      <Spinner size={75} />
    </div>
  ) : (
    <div className="flex flex-col w-full">
      <div className="flex justify-between w-full p-4">
        <FileBreadcrumbs path={filePath} />
        <div>
          <Button style={Button.Styles.Green} onClick={() => saveFile()}>
            Save
          </Button>
        </div>
      </div>
      <Editor
        height={'100%'}
        theme="vs-dark"
        defaultLanguage={language}
        defaultValue={content}
        onChange={setContent}
        onMount={(editor, monaco) => {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            saveFile();
          });
        }}
      />
    </div>
  );
}
