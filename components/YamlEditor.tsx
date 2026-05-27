"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function YamlEditor({ value, onChange, readOnly = false }: Props) {
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (val !== undefined) onChange(val);
    },
    [onChange]
  );

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-surface-600 bg-surface-800">
      <div className="h-full">
        <MonacoEditor
          height="100%"
          defaultLanguage="yaml"
          value={value}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            readOnly,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: "on",
            renderWhitespace: "boundary",
            padding: { top: 8, bottom: 8 },
          }}
          loading={
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading editor…
            </div>
          }
        />
      </div>
    </div>
  );
}
