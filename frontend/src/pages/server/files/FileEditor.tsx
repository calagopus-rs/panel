import getFileContent from '@/api/server/files/getFileContent';
import Spinner from '@/elements/Spinner';
import { getLanguageFromExtension } from '@/lib/files';
import { useServerStore } from '@/stores/server';
import { Editor } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { createSearchParams, useNavigate, useParams, useSearchParams } from 'react-router';
import { FileBreadcrumbs } from './FileBreadcrumbs';
import saveFileContent from '@/api/server/files/saveFileContent';
import { join } from 'pathe';
import NotFound from '@/pages/NotFound';
import { createPortal } from 'react-dom';
import FileNameModal from './modals/FileNameModal';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';

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
  const [nameModalOpen, setNameModalOpen] = useState(false);
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

    load(true, setLoading);
    getFileContent(server.uuid, join(browsingDirectory, fileName)).then((content) => {
      setContent(content);
      setLanguage(getLanguageFromExtension(fileName.split('.').pop()));
      load(false, setLoading);
    });
  }, [fileName]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveFile = (name?: string) => {
    if (!editorRef.current) return;

    const currentContent = editorRef.current.getValue();
    load(true, setLoading);

    saveFileContent(server.uuid, join(browsingDirectory, name ?? fileName), currentContent).then(() => {
      load(false, setLoading);
      setNameModalOpen(false);

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
    createPortal(
      <>
        <div className={'flex flex-col w-full'}>
          <FileNameModal
            onFileName={(name: string) => saveFile(name)}
            opened={nameModalOpen}
            onClose={() => setNameModalOpen(false)}
          />

          <div className={'flex justify-between w-full p-4'}>
            <FileBreadcrumbs
              hideSelectAll
              path={join(decodeURIComponent(browsingDirectory), fileName)}
              browsingBackup={browsingBackup}
            />
            <div hidden={!!browsingBackup}>
              {params.action === 'edit' ? (
                <Button onClick={() => saveFile()}>Save</Button>
              ) : (
                <Button onClick={() => setNameModalOpen(true)}>Create</Button>
              )}
            </div>
          </div>
          <Editor
            height={'85vh'}
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
                  setNameModalOpen(true);
                } else {
                  saveFile();
                }
              });
            }}
          />
        </div>
      </>,
      document.getElementById('server-root')!,
    )
  );
};
