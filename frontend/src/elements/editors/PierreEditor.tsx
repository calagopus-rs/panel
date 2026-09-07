import { useComputedColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  type BaseCodeOptions,
  DEFAULT_VIRTUAL_FILE_METRICS,
  type FileContents,
  type FileDiffMetadata,
  type FileDiffOptions,
  type File as FileInstance,
  type FileOptions,
  type PostRenderPhase,
  parseDiffFromFile,
  type SelectedLineRange,
} from '@pierre/diffs';
import { Editor, type EditorChangeEvent, type EditorOptions, type TextEdit } from '@pierre/diffs/edit';
import { EditProvider, File, FileDiff, Virtualizer } from '@pierre/diffs/react';
import { type CSSProperties, forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

export interface PierreEditorHandle {
  getValue: () => string;
  setValue: (value: string) => void;
  applyEdits: (edits: TextEdit[], updateHistory?: boolean) => void;
  focus: () => void;
}

interface CommonPierreProps {
  wordWrap?: boolean;
  fontSize?: number;
  height?: CSSProperties['height'];
  width?: CSSProperties['width'];
}

export interface PierreEditorProps extends CommonPierreProps {
  path: string;
  defaultValue: string;
  readOnly?: boolean;
  selectedLines?: SelectedLineRange;
  unsafeCSS?: string;
  onChange?: (value: string) => void;
  onChangeEvent?: (event: EditorChangeEvent<undefined>) => void;
  onMount?: (handle: PierreEditorHandle) => void;
  onPostRender?: (node: HTMLElement, instance: FileInstance<undefined>, phase: PostRenderPhase) => void;
}

export interface PierreDiffEditorProps extends CommonPierreProps {
  originalPath: string;
  originalValue: string;
  modifiedPath: string;
  modifiedValue: string;
  readOnly?: true;
  onMount?: (handle: PierreEditorHandle) => void;
}

const createEditor = (opts: EditorOptions<undefined>) => new Editor(opts);

const toFile = (path: string, contents: string, cacheKey?: string): FileContents => {
  const name = path.trim() || 'untitled';
  return { name, contents, cacheKey: cacheKey ?? name };
};

const replaceBuffer = (editor: Editor<undefined>, text: string): void => {
  const current = editor.getText();
  if (current === text) return;
  const lines = current.split('\n');
  const last = lines.length - 1;
  editor.applyEdits(
    [
      {
        range: {
          start: { line: 0, character: 0 },
          end: { line: last, character: lines[last]?.length ?? 0 },
        },
        newText: text,
      },
    ],
    false,
  );
};

function usePierreStyle(
  height: CSSProperties['height'] | undefined,
  width: CSSProperties['width'] | undefined,
  fontSize: number,
  isDark: boolean,
): CSSProperties {
  return useMemo<CSSProperties>(
    () => ({
      height: height ?? '100%',
      width: width ?? '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'auto',
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      fontSize,
      ['--diffs-font-size' as string]: `${fontSize}px`,
      ['--diffs-line-height' as string]: `${Math.ceil(fontSize * 1.5)}px`,
      ['--diffs-tab-size' as string]: '2',
      ['--diffs-font-family' as string]:
        'ui-monospace, SFMono-Regular, "JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      ['--diffs-editor-selection-bg' as string]: isDark ? '#264f78' : '#add6ff',
      ['--diffs-editor-cursor-fg' as string]: isDark ? '#aeafad' : '#000000',
    }),
    [height, width, fontSize, isDark],
  );
}

function useBaseOptions(colorScheme: 'dark' | 'light', wordWrap: boolean): BaseCodeOptions {
  return useMemo<BaseCodeOptions>(
    () => ({
      theme: { dark: 'dark-plus', light: 'light-plus' },
      themeType: colorScheme,
      overflow: wordWrap ? 'wrap' : 'scroll',
      disableFileHeader: true,
    }),
    [colorScheme, wordWrap],
  );
}

export const PierreEditor = memo(
  forwardRef<PierreEditorHandle, PierreEditorProps>(function PierreEditor(
    {
      path,
      defaultValue,
      readOnly = false,
      selectedLines,
      unsafeCSS,
      wordWrap = false,
      fontSize = 13,
      height,
      width,
      onChange,
      onChangeEvent,
      onMount,
      onPostRender,
    },
    ref,
  ) {
    const colorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: false });
    const isDark = colorScheme === 'dark';
    const style = usePierreStyle(height, width, fontSize, isDark);
    const metrics = useMemo(
      () => ({ ...DEFAULT_VIRTUAL_FILE_METRICS, lineHeight: Math.ceil(fontSize * 1.5) }),
      [fontSize],
    );
    const baseOptions = useBaseOptions(colorScheme, wordWrap);

    const callbacks = useRef({ onMount, onChange, onChangeEvent, onPostRender });

    useEffect(() => {
      callbacks.current = { onMount, onChange, onChangeEvent, onPostRender };
    });

    const fileOptions = useMemo<FileOptions<undefined>>(
      () => ({
        ...baseOptions,
        unsafeCSS,
        onPostRender: (node, instance, phase) => callbacks.current.onPostRender?.(node, instance, phase),
      }),
      [baseOptions, unsafeCSS],
    );

    const instanceRef = useRef<Editor<undefined> | null>(null);
    const defaultValueRef = useRef(defaultValue);

    const file = useMemo(
      () => (readOnly ? { name: path.trim() || 'untitled', contents: defaultValue } : toFile(path, defaultValue)),
      [path, defaultValue, readOnly],
    );

    const handle = useMemo<PierreEditorHandle>(
      () => ({
        getValue: () => instanceRef.current?.getText() ?? defaultValueRef.current,
        setValue: (val) => {
          if (instanceRef.current) replaceBuffer(instanceRef.current, val);
        },
        applyEdits: (edits, updateHistory) => {
          instanceRef.current?.applyEdits(edits, updateHistory);
        },
        focus: () => instanceRef.current?.focus(),
      }),
      [],
    );

    useImperativeHandle(ref, () => handle, [handle]);

    useEffect(() => {
      defaultValueRef.current = defaultValue;
      const editor = instanceRef.current;
      if (editor) replaceBuffer(editor, defaultValue);
    }, [defaultValue, path]);

    const editorOptions = useMemo<EditorOptions<undefined>>(
      () => ({
        persistState: true,
        matchBrackets: true,
        autoSurround: 'default',
        roundedSelection: true,
        historyMaxEntries: 1000,
        onAttach: (editor) => {
          instanceRef.current = editor;
          replaceBuffer(editor, defaultValueRef.current);
          callbacks.current.onMount?.(handle);
        },
        onChange: (f, _lineAnnotations, event) => {
          callbacks.current.onChange?.(f.contents);
          callbacks.current.onChangeEvent?.(event);
        },
      }),
      [handle],
    );

    return (
      <EditProvider key={colorScheme} createEditor={createEditor}>
        <Virtualizer style={style}>
          <File
            key={`${colorScheme}:${fontSize}`}
            file={file}
            metrics={metrics}
            options={fileOptions}
            edit={!readOnly}
            selectedLines={selectedLines}
            editorOptions={editorOptions}
            style={style}
          />
        </Virtualizer>
      </EditProvider>
    );
  }),
);

export default PierreEditor;

export const PierreDiffEditor = memo(
  forwardRef<PierreEditorHandle, PierreDiffEditorProps>(function PierreDiffEditor(
    {
      originalPath,
      originalValue,
      modifiedPath,
      modifiedValue,
      wordWrap = false,
      fontSize = 13,
      height,
      width,
      onMount,
    },
    ref,
  ) {
    const colorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: false });
    const isDark = colorScheme === 'dark';
    const isMobile = useMediaQuery('(max-width: 768px)', false, { getInitialValueInEffect: false });
    const style = usePierreStyle(height, width, fontSize, isDark);
    const metrics = useMemo(
      () => ({ ...DEFAULT_VIRTUAL_FILE_METRICS, lineHeight: Math.ceil(fontSize * 1.5) }),
      [fontSize],
    );
    const baseOptions = useBaseOptions(colorScheme, wordWrap);

    const modifiedRef = useRef(modifiedValue);

    useEffect(() => {
      modifiedRef.current = modifiedValue;
    });

    const handle = useMemo<PierreEditorHandle>(
      () => ({
        getValue: () => modifiedRef.current,
        setValue: (val) => {
          modifiedRef.current = val;
        },
        applyEdits: () => undefined,
        focus: () => undefined,
      }),
      [],
    );

    useImperativeHandle(ref, () => handle, [handle]);
    useEffect(() => {
      onMount?.(handle);
    }, [onMount, handle]);

    const oldFile = useMemo(
      () => toFile(originalPath, originalValue, `old:${originalPath}:${originalValue.length}`),
      [originalPath, originalValue],
    );
    const newFile = useMemo(
      () => toFile(modifiedPath, modifiedValue, `new:${modifiedPath}:${modifiedValue.length}`),
      [modifiedPath, modifiedValue],
    );

    const diffOptions = useMemo<FileDiffOptions<undefined>>(
      () => ({
        ...baseOptions,
        diffStyle: isMobile ? 'unified' : 'split',
        diffIndicators: 'bars',
        expandUnchanged: true,
      }),
      [baseOptions, isMobile],
    );

    const fileDiff = useMemo<FileDiffMetadata>(() => parseDiffFromFile(oldFile, newFile), [oldFile, newFile]);

    return (
      <Virtualizer style={style}>
        {originalValue === modifiedValue ? (
          <File
            key={`${colorScheme}:${fontSize}`}
            file={newFile}
            options={baseOptions as FileOptions<undefined>}
            metrics={metrics}
            style={style}
          />
        ) : (
          <FileDiff
            key={`${colorScheme}:${fontSize}`}
            fileDiff={fileDiff}
            options={diffOptions}
            metrics={metrics}
            style={style}
          />
        )}
      </Virtualizer>
    );
  }),
);
