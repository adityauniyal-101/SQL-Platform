'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on Ctrl/Cmd+Enter */
  onRun?: () => void;
}

export default function SqlEditor({ value, onChange, onRun }: SqlEditorProps) {
  // Monaco registers the command once, so read the latest callback through a ref
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700">
      <MonacoEditor
        height="250px"
        language="sql"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={(editor, monaco) => {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRunRef.current?.());
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
