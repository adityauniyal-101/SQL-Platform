'use client';

import { useEffect, useState } from 'react';
import type { SchemaTable } from '@/app/api/datasets/[name]/schema/route';

interface SchemaReferenceProps {
  datasetName: string;
  /** Called once the tables are loaded (e.g. so the tour can build a sample query) */
  onLoad?: (tables: SchemaTable[]) => void;
}

export default function SchemaReference({ datasetName, onLoad }: SchemaReferenceProps) {
  const [tables, setTables] = useState<SchemaTable[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTables(null);
    setFailed(false);
    fetch(`/api/datasets/${encodeURIComponent(datasetName)}/schema`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { tables: SchemaTable[] }) => {
        if (cancelled) return;
        setTables(data.tables);
        onLoad?.(data.tables);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // onLoad is intentionally not a dependency: refetch only when the dataset changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetName]);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      {failed && <p className="text-xs text-gray-500">Couldn&apos;t load the table list. Your queries will still run.</p>}
      {!failed && !tables && <p className="text-xs text-gray-500">Loading tables…</p>}
      {tables && tables.length === 0 && <p className="text-xs text-gray-500">This dataset has no tables.</p>}
      {tables && tables.length > 0 && (
        <ul className="space-y-2 font-mono text-xs text-gray-300">
          {tables.map((t) => (
            <li key={t.name}>
              <span className="font-semibold text-blue-300">{t.name}</span>
              <span className="text-gray-500">(</span>
              {t.columns.map((c, i) => (
                <span key={c.name}>
                  <span title={c.type || undefined}>{c.name}</span>
                  {i < t.columns.length - 1 && <span className="text-gray-500">, </span>}
                </span>
              ))}
              <span className="text-gray-500">)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
