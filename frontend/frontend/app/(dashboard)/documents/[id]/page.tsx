'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import documentService from '@/lib/documentService';
import aiService from '@/lib/aiService';
import flashcardService from '@/lib/flashcardService';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  title: string;
  fileName: string;
  content: string;
}

interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  isFavorite: boolean;
}

interface Quiz {
  _id: string;
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'summary' | 'chat'>('flashcards');

  // Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Summary
  const [summary, setSummary] = useState<string[]>([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadDocument();
    loadFlashcards();
  }, [id]);

  const loadDocument = async () => {
    try {
      const { data } = await documentService.getById(id as string);
      setDocument(data.data || data);
    } catch {
      toast.error('خطأ في جلب المستند');
      router.push('/documents');
    } finally {
      setLoading(false);
    }
  };

  const loadFlashcards = async () => {
    try {
      const { data } = await flashcardService.getByDocument(id as string);
      setFlashcards(data.data || data || []);
    } catch {
      // مفيش بطاقات بعد
    }
  };

  // ============ Flashcards ============
  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    try {
      const { data } = await aiService.generateFlashcards(id as string, 10);
      toast.success('تم توليد البطاقات');
      setFlashcards(data.data || []);
      setCurrentCardIndex(0);
      setShowAnswer(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في توليد البطاقات');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleToggleFavorite = async (cardId: string, isFavorite: boolean) => {
    try {
      await flashcardService.update(cardId, { isFavorite: !isFavorite });
      setFlashcards(flashcards.map((c) => (c._id === cardId ? { ...c, isFavorite: !isFavorite } : c)));
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  // ============ Quiz ============
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const { data } = await aiService.generateQuiz(id as string, 5, `Quiz: ${document?.title}`);
      toast.success('تم توليد الاختبار');
      setQuiz(data.data.quiz);
      setSelectedAnswers({});
      setShowQuizResult(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في توليد الاختبار');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: answer });
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((_, idx) => !selectedAnswers[idx]);
    if (unanswered.length > 0) {
      toast.error('أجب على كل الأسئلة');
      return;
    }
    setShowQuizResult(true);
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

  // ============ Summary ============
  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const { data } = await aiService.generateSummary(id as string, 5);
      toast.success('تم التلخيص');
      setSummary(data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في التلخيص');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // ============ Chat ============
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendingMessage) return;

    const userMessage = message;
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setMessage('');
    setSendingMessage(true);

    try {
      const { data } = await aiService.chat(userMessage, id as string, sessionId || undefined);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.data.message }]);
      if (data.data.sessionId) setSessionId(data.data.sessionId);
    } catch (error: any) {
      toast.error('خطأ في الدردشة');
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ' }]);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/documents')} className="text-blue-600 hover:underline mb-2 text-sm">
          ← رجوع للمستندات
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{document.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{document.fileName}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'flashcards', label: '🃏 البطاقات' },
            { key: 'quiz', label: '📝 الاختبارات' },
            { key: 'summary', label: '📋 التلخيص' },
            { key: 'chat', label: '💬 الدردشة' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 text-center transition ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ============ Flashcards Tab ============ */}
          {activeTab === 'flashcards' && (
            <div>
              {flashcards.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">🃏</p>
                  <h2 className="text-xl font-bold text-gray-700 mb-2">لا توجد بطاقات بعد</h2>
                  <p className="text-gray-500 mb-6">اضغط لتوليد بطاقات من المستند</p>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={generatingFlashcards}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {generatingFlashcards ? 'جاري التوليد...' : '🪄 توليد بطاقات'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="max-w-2xl mx-auto">
                    <div
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-12 min-h-[300px] flex items-center justify-center cursor-pointer shadow-xl transition hover:scale-[1.02]"
                    >
                      <div className="text-center">
                        <p className="text-sm opacity-75 mb-4">{showAnswer ? 'الإجابة' : 'السؤال'}</p>
                        <p className="text-2xl font-bold">
                          {showAnswer
                            ? flashcards[currentCardIndex]?.answer
                            : flashcards[currentCardIndex]?.question}
                        </p>
                        <p className="text-xs opacity-60 mt-6">
                          اضغط لرؤية {showAnswer ? 'السؤال' : 'الإجابة'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => {
                          setCurrentCardIndex(
                            (currentCardIndex - 1 + flashcards.length) % flashcards.length
                          );
                          setShowAnswer(false);
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                      >
                        ← السابق
                      </button>

                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 text-sm">
                          {currentCardIndex + 1} / {flashcards.length}
                        </span>
                        <button
                          onClick={() =>
                            handleToggleFavorite(
                              flashcards[currentCardIndex]?._id,
                              flashcards[currentCardIndex]?.isFavorite
                            )
                          }
                          className="text-2xl"
                        >
                          {flashcards[currentCardIndex]?.isFavorite ? '⭐' : '☆'}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentCardIndex((currentCardIndex + 1) % flashcards.length);
                          setShowAnswer(false);
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                      >
                        التالي →
                      </button>
                    </div>

                    <div className="text-center mt-6">
                      <button
                        onClick={handleGenerateFlashcards}
                        disabled={generatingFlashcards}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {generatingFlashcards ? 'جاري التوليد...' : '🔄 توليد بطاقات جديدة'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-12">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      كل البطاقات ({flashcards.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card, idx) => (
                        <div key={card._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="font-bold text-gray-800 mb-2">
                            {idx + 1}. {card.question}
                          </p>
                          <p className="text-gray-600 text-sm">{card.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ Quiz Tab ============ */}
          {activeTab === 'quiz' && (
            <div>
              {!quiz ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">📝</p>
                  <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد اختبار بعد</h2>
                  <p className="text-gray-500 mb-6">اضغط لتوليد اختبار من المستند</p>
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {generatingQuiz ? 'جاري التوليد...' : '🪄 توليد اختبار'}
                  </button>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{quiz.title}</h2>

                  {showQuizResult ? (
                    <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-2xl p-8 text-center">
                      <p className="text-6xl mb-4">🎉</p>
                      <h3 className="text-3xl font-bold mb-4">نتيجتك</h3>
                      <p className="text-5xl font-bold mb-2">
                        {calculateScore().correct} / {calculateScore().total}
                      </p>
                      <p className="text-2xl">{calculateScore().percentage}%</p>
                      <button
                        onClick={() => {
                          setQuiz(null);
                          setSelectedAnswers({});
                          setShowQuizResult(false);
                        }}
                        className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition"
                      >
                        اختبار جديد
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {quiz.questions.map((q, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <p className="font-bold text-gray-800 mb-4">
                            {idx + 1}. {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => handleAnswerSelect(idx, opt)}
                                className={`w-full text-right px-4 py-2 rounded-lg border transition ${
                                  selectedAnswers[idx] === opt
                                    ? 'bg-blue-100 border-blue-500 font-bold'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleSubmitQuiz}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold"
                      >
                        تقديم الاختبار
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============ Summary Tab ============ */}
          {activeTab === 'summary' && (
            <div>
              {summary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">📋</p>
                  <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد تلخيص بعد</h2>
                  <p className="text-gray-500 mb-6">اضغط لتلخيص المستند</p>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                  >
                    {generatingSummary ? 'جاري التلخيص...' : '🪄 تلخيص المستند'}
                  </button>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">📋 الملخص</h3>
                    <ul className="space-y-3">
                      {summary.map((point, idx) => (
                        <li key={idx} className="flex gap-3 text-gray-700">
                          <span className="text-blue-600 font-bold">{idx + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-center mt-6">
                    <button
                      onClick={handleGenerateSummary}
                      disabled={generatingSummary}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {generatingSummary ? 'جاري التلخيص...' : '🔄 إعادة التلخيص'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ Chat Tab ============ */}
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gray-50 rounded-2xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto mb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-6xl mb-4">💬</p>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">ابدأ الدردشة</h2>
                    <p className="text-gray-500">اسأل عن أي حاجة في المستند</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {sendingMessage && (
                      <div className="flex justify-end">
                        <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl text-gray-400">
                          جاري الكتابة...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب سؤالك..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !message.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  إرسال
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}