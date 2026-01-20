import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

interface EditorAreaProps {
  code: string;
  onChange: (value: string) => void;
  onCursorChange: (position: monaco.Position | null, selection: monaco.Selection | null) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => void;
  language?: string;
}

export default function EditorArea({
  code,
  onChange,
  onCursorChange,
  onMount,
  language = 'javascript',
}: EditorAreaProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    // Configure Monaco theme
    monaco.editor.defineTheme('collab-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0F1115',
        'editor.foreground': '#E6E8EB',
        'editorLineNumber.foreground': '#6B7280',
        'editorLineNumber.activeForeground': '#9BA1AC',
        'editor.selectionBackground': 'rgba(99, 102, 241, 0.2)',
        'editor.lineHighlightBackground': 'rgba(255, 255, 255, 0.03)',
        'editorCursor.foreground': '#6366F1',
        'editorWhitespace.foreground': 'rgba(107, 114, 128, 0.3)',
        'editorIndentGuide.background': 'rgba(107, 114, 128, 0.15)',
        'editorIndentGuide.activeBackground': 'rgba(107, 114, 128, 0.3)',
      },
    });

    monaco.editor.setTheme('collab-dark');
  }, []);

  return (
    <div className="editor-area">
      <div className="editor-area__container">
        {code === '' && (
          <div className="editor-area__empty-state">
            <div className="editor-area__empty-state-text">
              Start typing to begin editing...
            </div>
          </div>
        )}
        <Editor
          height="100%"
          defaultLanguage={language}
          value={code}
          theme="collab-dark"
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Cursor / selection tracking
            editor.onDidChangeCursorSelection(() => {
              const pos = editor.getPosition();
              const sel = editor.getSelection();
              onCursorChange(pos, sel);
            });

            // Call parent onMount if provided
            onMount?.(editor, monaco);
          }}
          onChange={(value) => {
            if (value !== undefined) {
              onChange(value);
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'selection',
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>
    </div>
  );
}
