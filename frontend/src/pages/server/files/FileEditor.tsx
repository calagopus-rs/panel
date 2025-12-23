import { Editor, type OnMount } from '@monaco-editor/react';
import { join } from 'pathe';
import { useEffect, useRef, useState } from 'react';
import { createSearchParams, useNavigate, useParams, useSearchParams } from 'react-router';
import getFileContent from '@/api/server/files/getFileContent.ts';
import saveFileContent from '@/api/server/files/saveFileContent.ts';
import Button from '@/elements/Button.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { getLanguageFromExtension } from '@/lib/files.ts';
import NotFound from '@/pages/NotFound.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import FileBreadcrumbs from './FileBreadcrumbs.tsx';
import FileNameModal from './modals/FileNameModal.tsx';

export default function FileEditor() {
  const params = useParams<'action'>();

  const [searchParams, _] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);
  const { browsingDirectory, setBrowsingDirectory, browsingBackup } = useServerStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');

  const editorRef = useRef<Parameters<OnMount>[0]>(null);
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
      setLanguage(getLanguageFromExtension(fileName.split('.').pop()!));
      setLoading(false);
    });
  }, [fileName]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveFile = (name?: string) => {
    if (!editorRef.current) return;

    const currentContent = editorRef.current.getValue();
    setSaving(true);

    saveFileContent(server.uuid, join(browsingDirectory!, name ?? fileName), currentContent).then(() => {
      setSaving(false);
      setNameModalOpen(false);

      addToast(`${name ?? fileName} was saved.`);

      if (name) {
        navigate(
          `/server/${server.uuidShort}/files/edit?${createSearchParams({
            directory: browsingDirectory!,
            file: name,
          })}`,
        );
      }
    });
  };

  if (!['new', 'edit'].includes(params.action!)) {
    return <NotFound />;
  }

  return (
    <ServerContentContainer title={`File Editor (${fileName || 'New File'})`}>
      {loading ? (
        <div className='w-full h-screen flex items-center justify-center'>
          <Spinner size={75} />
        </div>
      ) : (
        <div className='flex flex-col'>
          <FileNameModal
            onFileName={(name: string) => saveFile(name)}
            opened={nameModalOpen}
            onClose={() => setNameModalOpen(false)}
          />

          <div className='flex justify-between w-full p-4'>
            <FileBreadcrumbs
              inFileEditor
              path={join(decodeURIComponent(browsingDirectory!), fileName)}
              browsingBackup={browsingBackup}
            />
            <div hidden={!!browsingBackup}>
              {params.action === 'edit' ? (
                <Button loading={saving} onClick={() => saveFile()}>
                  Save
                </Button>
              ) : (
                <Button loading={saving} onClick={() => setNameModalOpen(true)}>
                  Create
                </Button>
              )}
            </div>
          </div>
          <div className='mx-4 rounded-md overflow-hidden'>
            <Editor
              height='77vh'
              theme='vs-dark'
              defaultLanguage={language}
              defaultValue={content}
              onChange={(value) => setContent(value || '')}
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
        </div>
      )}
    </ServerContentContainer>
  );
}
