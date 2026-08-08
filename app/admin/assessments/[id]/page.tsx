'use client';
import { Fragment, useEffect, useState } from 'react';

interface Answer {
  question_id: number;
  submitted_sql: string | null;
  is_correct: number | null;
  question_title: string;
}

interface Submission {
  id: number;
  student_name: string;
  score: number;
  total: number;
  submitted_at: string;
  correct_count: number;
  answers: Answer[];
}

interface AssessmentDetail {
  title: string;
  access_code: string;
  time_limit_mins: number;
}

export default function AssessmentResults({ params }: { params: { id: string } }) {
  const [data, setData] = useState<{ assessment: AssessmentDetail; submissions: Submission[] } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/admin/assessments/${params.id}`).then(r => r.json()).then(setData);
  }, [params.id]);

  const toggleExpanded = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (!data) return <div className="text-gray-400 p-8">Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{data.assessment.title}</h1>
        <div className="flex gap-6 mt-2">
          <span className="text-gray-400 text-sm">Code: <span className="text-blue-400 font-mono font-bold">{data.assessment.access_code}</span></span>
          <span className="text-gray-400 text-sm">⏱ {data.assessment.time_limit_mins} mins</span>
          <span className="text-gray-400 text-sm">👥 {data.submissions.length} submissions</span>
        </div>
      </div>

      {data.submissions.length === 0 ? (
        <div className="text-gray-500 text-center py-16">No submissions yet.</div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Student</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Score</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Percentage</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {data.submissions.map((s, i) => (
                <Fragment key={s.id}>
                  <tr
                    onClick={() => toggleExpanded(s.id)}
                    className={`cursor-pointer transition-colors hover:bg-gray-700 ${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}`}
                  >
                    <td className="text-white px-6 py-4">
                      <span className="text-gray-500 mr-2">{expandedId === s.id ? '▼' : '▶'}</span>
                      {s.student_name}
                    </td>
                    <td className="text-white px-6 py-4 font-semibold">{s.score} / {s.total}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${
                        (s.score / s.total) >= 0.7 ? 'text-green-400' :
                        (s.score / s.total) >= 0.4 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round((s.score / s.total) * 100)}%
                      </span>
                    </td>
                    <td className="text-gray-400 px-6 py-4 text-sm">
                      {new Date(s.submitted_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr>
                      <td colSpan={4} className="bg-gray-950 px-6 py-4">
                        <div className="space-y-3">
                          {s.answers.map(a => (
                            <div key={a.question_id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <span className="text-white font-medium text-sm">{a.question_title}</span>
                                {a.is_correct === 1 ? (
                                  <span className="text-green-400 text-sm font-medium">✅ Correct</span>
                                ) : (
                                  <span className="text-red-400 text-sm font-medium">❌ Incorrect</span>
                                )}
                              </div>
                              {a.submitted_sql ? (
                                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                  {a.submitted_sql}
                                </pre>
                              ) : (
                                <p className="text-gray-500 text-sm">No answer submitted</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
