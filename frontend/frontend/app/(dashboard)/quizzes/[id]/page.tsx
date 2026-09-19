'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  questions: Question[];
  document?: { title: string };
}

export default function QuizTakePage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      const { data } = await api.get(`/quizzes/${id}`);
      setQuiz(data.data || data);
    } catch {
      toast.error('خطأ في جلب الاختبار');
      router.push('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIndex: number, answer: string) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [qIndex]: answer });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((_, idx) => !selectedAnswers[idx]);
    if (unanswered.length > 0) {
      toast.error(`لديك ${unanswered.length} سؤال لم تجب عليه`);
      return;
    }

    setSaving(true);
    try {
      // حفظ النتيجة
      const answers = quiz.questions.map((_, idx) => selectedAnswers[idx]);
      await api.post('/quiz-results', {
        quizId: quiz._id,
        answers,
        timeTaken: 0,
      });
      setSubmitted(true);
      toast.success('تم تسليم الاختبار');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في حفظ النتيجة');
    } finally {
      setSaving(false);
    }
  };

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) correct++;
    });
    const total = quiz.questions.length;
    return { correct, total, percentage: Math.round((correct / total) * 100) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz) return null;

  const score = calculateScore();

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/quizzes')}
        className="text-blue-600 hover:underline mb-4 text-sm"
      >
        ← رجوع للاختبارات
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
      <p className="text-gray-500 mb-6">{quiz.questions.length} أسئلة</p>

      {/* Result Card */}
      {submitted && (
        <div
          className={`rounded-2xl p-8 mb-6 text-center text-white ${
            score.percentage >= 50
              ? 'bg-gradient-to-br from-green-500 to-blue-600'
              : 'bg-gradient-to-br from-red-500 to-orange-600'
          }`}
        >
          <p className="text-6xl mb-4">{score.percentage >= 50 ? '🎉' : '😞'}</p>
          <h2 className="text-3xl font-bold mb-4">
            {score.percentage >= 50 ? 'مبروك!' : 'حاول تاني'}
          </h2>
          <p className="text-5xl font-bold mb-2">
            {score.correct} / {score.total}
          </p>
          <p className="text-2xl">{score.percentage}%</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((q, idx) => {
          const userAnswer = selectedAnswers[idx];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6">
              <p className="font-bold text-gray-800 mb-4">
                {idx + 1}. {q.question}
              </p>

              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  let btnClass = 'bg-white border-gray-300 hover:bg-gray-50';
                  if (submitted) {
                    if (opt === q.correctAnswer) {
                      btnClass = 'bg-green-100 border-green-500 font-bold';
                    } else if (opt === userAnswer && !isCorrect) {
                      btnClass = 'bg-red-100 border-red-500 line-through';
                    }
                  } else if (userAnswer === opt) {
                    btnClass = 'bg-blue-100 border-blue-500 font-bold';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(idx, opt)}
                      disabled={submitted}
                      className={`w-full text-right px-4 py-2 rounded-lg border transition ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">💡 الشرح: </span>
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold mt-6 disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'تقديم الاختبار'}
        </button>
      ) : (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setSelectedAnswers({});
              setSubmitted(false);
            }}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold"
          >
            إعادة الاختبار
          </button>
          <button
            onClick={() => router.push('/quizzes')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-bold"
          >
            العودة للاختبارات
          </button>
        </div>
      )}
    </div>
  );
}