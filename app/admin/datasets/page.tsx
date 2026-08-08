'use client';
import { useEffect, useState, useRef } from 'react';
import { Dataset } from '@/types';

export default function AdminDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch('/api/admin/datasets').then(r => r.json()).then(d => setDatasets(d.datasets));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!file || !displayName.trim()) return setError('Please provide a name and select a .db file');
    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('display_name', displayName);

    const res = await fetch('/api/admin/datasets', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      setSuccess(`Dataset uploaded! Tables found: ${data.table_summary}`);
      setDisplayName('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } else {
      setError(data.error || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete dataset "${name}"?`)) return;
    const res = await fetch(`/api/admin/datasets/${name}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      load();
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-8">Datasets</h1>

      {/* Upload form */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-white font-semibold text-lg mb-4">Upload New Dataset</h2>
        <p className="text-gray-400 text-sm mb-4">
          Upload a SQLite .db file. Students will query against this dataset.
          Make sure the file contains the tables your questions reference.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Dataset Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Hospital Records, Sales Data 2024"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">SQLite Database File (.db)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".db"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-sm cursor-pointer"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">✅ {success}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </div>
      </div>

      {/* Existing datasets */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Available Datasets</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Name</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Tables</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Internal ID</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((d, i) => (
              <tr key={d.id} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                <td className="text-white px-6 py-4 font-medium">{d.display_name}</td>
                <td className="text-gray-400 px-6 py-4 text-sm font-mono">{d.table_summary || '—'}</td>
                <td className="text-gray-500 px-6 py-4 text-sm font-mono">{d.name}</td>
                <td className="px-6 py-4">
                  {d.name === 'ecommerce' ? (
                    <span className="text-gray-600 text-sm">Default</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(d.name)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
