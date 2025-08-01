import getFileContent from '@/api/server/files/getFileContent';
import Spinner from '@/elements/Spinner';
import { getLanguageFromExtension } from '@/lib/files';
import { useServerStore } from '@/stores/server';
import { Editor } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { createSearchParams, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { FileBreadcrumbs } from './FileBreadcrumbs';
import { Button } from '@/elements/button';
import saveFileContent from '@/api/server/files/saveFileContent';
import FileNameDialog from './dialogs/FileNameDialog';
import { join } from 'pathe';
import NotFound from '@/pages/NotFound';

export default () => {
  const params = useParams<'action'>();
  if (!['new', 'edit'].includes(params.action)) {
    return <NotFound />;
  }

  const [searchParams, _] = useSearchParams();
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);
  const { browsingDirectory, setBrowsingDirectory, browsingBackup } = useServerStore();

  const [loading, setLoading] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');

  const editorRef = useRef(null);
  const contentRef = useRef(content);

  useEffect(() => {
    setBrowsingDirectory(searchParams.get('directory') || '/');
    setFileName(searchParams.get('file') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!browsingDirectory || !fileName) return;
    if (params.action === 'new') return;

    setLoading(true);
    getFileContent(server.uuid, join(browsingDirectory, fileName)).then((content) => {
      setContent(content);
      setLanguage(getLanguageFromExtension(fileName.split('.').pop()));
      setLoading(false);
    });
  }, [fileName]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveFile = (name?: string) => {
    if (!editorRef.current) return;

    const currentContent = editorRef.current.getValue();
    setLoading(true);

    saveFileContent(server.uuid, join(browsingDirectory, name ?? fileName), currentContent).then(() => {
      setLoading(false);
      setNameDialogOpen(false);

      if (name) {
        navigate(
          `/server/${server.uuidShort}/files/edit?${createSearchParams({
            directory: browsingDirectory,
            file: name,
          })}`,
        );
      }
    });
  };

  return loading ? (
    <div className={'w-full h-screen flex items-center justify-center'}>
      <Spinner size={75} />
    </div>
  ) : (
    <div className={'flex flex-col w-full'}>
      <FileNameDialog
        onFileName={(name: string) => saveFile(name)}
        open={nameDialogOpen}
        onClose={() => setNameDialogOpen(false)}
      />

      <div className={'flex justify-between w-full p-4'}>
        <FileBreadcrumbs path={join(decodeURIComponent(browsingDirectory), fileName)} browsingBackup={browsingBackup} />
        <div hidden={!!browsingBackup}>
          {params.action === 'edit' ? (
            <Button style={Button.Styles.Green} onClick={() => saveFile()}>
              Save
            </Button>
          ) : (
            <Button style={Button.Styles.Green} onClick={() => setNameDialogOpen(true)}>
              Create
            </Button>
          )}
        </div>
      </div>
      <Editor
        height={'100%'}
        theme={'vs-dark'}
        defaultLanguage={language}
        defaultValue={content}
        onChange={setContent}
        onMount={(editor, monaco) => {
          editorRef.current = editor;

          editor.onDidChangeModelContent(() => {
            contentRef.current = editor.getValue();
          });

          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (params.action === 'new') {
              setNameDialogOpen(true);
            } else {
              saveFile();
            }
          });
        }}
      />
    </div>
  );
};
