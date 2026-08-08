'use client';

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SqlEditor({ value, onChange }: SqlEditorProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-700">
      <MonacoEditor
        height="250px"
        language="sql"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
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
