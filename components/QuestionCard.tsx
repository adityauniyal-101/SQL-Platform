'use client';

import { useRouter } from 'next/navigation';

interface QuestionCardProps {
  id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const DIFFICULTY_STYLES: Record<QuestionCardProps['difficulty'], string> = {
  easy: 'bg-green-500/10 text-green-400 border border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-400 border border-red-500/30',
};

export default function QuestionCard({ id, title, difficulty }: QuestionCardProps) {
  const router = useRouter();

  const goToQuestion = () => router.push(`/questions/${id}`);

  return (
    <div
      onClick={goToQuestion}
      className="group cursor-pointer rounded-xl border border-gray-700 bg-gray-800 p-5 transition-colors hover:border-blue-500/50 hover:bg-gray-750"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${DIFFICULTY_STYLES[difficulty]}`}
        >
          {difficulty}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          goToQuestion();
        }}
        className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors group-hover:text-blue-300"
      >
        Solve <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
