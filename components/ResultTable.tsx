interface ResultTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  return String(value);
}

export default function ResultTable({ columns, rows }: ResultTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 text-sm text-gray-400">
        No rows returned
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-auto rounded-lg border border-gray-700">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="border-b border-gray-700 px-4 py-2 font-semibold text-gray-200 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/40'}>
              {columns.map((col) => (
                <td
                  key={col}
                  className="border-b border-gray-800 px-4 py-2 whitespace-nowrap text-gray-300"
                >
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
