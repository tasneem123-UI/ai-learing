'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import documentService from '@/lib/documentService';
import aiService from '@/lib/aiService';
import flashcardService from '@/lib/flashcardService';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
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
  const [activeTab, setActiveTab] = useState<'pdf' | 'flashcards' | 'quiz' | 'summary' | 'chat'>('pdf');

  // Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Quizzes
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

  useEffect(() => {
    loadDocument();
    loadFlashcards();
    loadQuizzes();
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

  const loadQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const { data } = await api.get(`/quizzes/document/${id}`);
      setQuizzes(data.data || data || []);
    } catch {
      // مفيش اختبارات
    } finally {
      setLoadingQuizzes(false);
    }
  };

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
      setFlashcards(
        flashcards.map((c) =>
          c._id === cardId ? { ...c, isFavorite: !isFavorite } : c
        )
      );
    } catch {
      toast.error('خطأ في التحديث');
    }
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const { data } = await aiService.generateQuiz(
        id as string,
        5,
        `Quiz: ${document?.title}`
      );
      toast.success('تم توليد الاختبار');
      const newQuiz = data.data.quiz;
      setQuizzes([newQuiz, ...quizzes]);
      setSelectedQuiz(newQuiz);
      setSelectedAnswers({});
      setShowQuizResult(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في توليد الاختبار');
    } finally {
      setGeneratingQuiz(false);
    }
  };

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendingMessage) return;

    const userMessage = message;
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setMessage('');
    setSendingMessage(true);

    try {
      const { data } = await aiService.chat(
        userMessage,
        id as string,
        sessionId || undefined
      );
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.data.message },
      ]);
      if (data.data.sessionId) setSessionId(data.data.sessionId);
    } catch {
      toast.error('خطأ في الدردشة');
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'عذراً، حدث خطأ' },
      ]);
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

  const fileUrl = `${API_BASE}${document.fileUrl}`;
  const fileName = document.fileName.toLowerCase();
  const isPDF = fileName.endsWith('.pdf');
  const isWord = fileName.endsWith('.docx') || fileName.endsWith('.doc');
  const isTxt = fileName.endsWith('.txt');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/documents')}
            className="text-gray-600 hover:text-gray-800 text-xl flex-shrink-0"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-800 truncate">
            {document.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {[
            { key: 'pdf', label: '📄 المستند' },
            { key: 'flashcards', label: '🃏 البطاقات' },
            { key: 'quiz', label: '📝 الاختبارات' },
            { key: 'summary', label: '📋 التلخيص' },
            { key: 'chat', label: '💬 الدردشة' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* ============ Document Viewer Tab ============ */}
        {activeTab === 'pdf' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-gray-700 px-2 py-1 rounded truncate max-w-xs">
                  📄 {document.fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fileUrl}
                  download={document.fileName}
                  className="text-sm bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition flex items-center gap-1"
                >
                  ⬇️ تحميل
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition flex items-center gap-1"
                >
                  🔗 فتح في تاب جديد
                </a>
              </div>
            </div>

            {/* Viewer */}
            <div className="bg-gray-700 h-[80vh] overflow-hidden">
              {/* ✅ PDF */}
              {isPDF && (
                <iframe
                  src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              )}

              {/* ✅ Word - نعرض المحتوى النصي */}
              {isWord && (
                <div className="bg-white h-full overflow-y-auto p-8">
                  {document.content && document.content.trim() ? (
                    <>
                      <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                        <p className="text-sm text-gray-700">
                          ⚠️ لا يمكن معاينة ملفات Word مباشرة في المتصفح. هذا هو
                          المحتوى النصي المستخرج من الملف:
                        </p>
                      </div>
                      <div
                        className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                        dir="auto"
                      >
                        {document.content}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-6xl mb-4">📄</p>
                      <h2 className="text-xl font-bold text-gray-700 mb-2">
                        لا يمكن معاينة هذا الملف
                      </h2>
                      <p className="text-gray-500 mb-6">
                        هذا الملف من نوع Word ولا يمكن معاينته مباشرة. يمكنك
                        تحميله:
                      </p>
                      <a
                        href={fileUrl}
                        download={document.fileName}
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        ⬇️ تحميل الملف
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ TXT */}
              {isTxt && (
                <div className="bg-white h-full overflow-y-auto p-8">
                  <div
                    className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                    dir="auto"
                  >
                    {document.content || 'لا يوجد محتوى'}
                  </div>
                </div>
              )}

              {/* ❌ نوع مش مدعوم */}
              {!isPDF && !isWord && !isTxt && (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <p className="text-6xl mb-4">📄</p>
                    <p className="text-xl mb-2">
                      لا يمكن عرض هذا النوع من الملفات
                    </p>
                    <a
                      href={fileUrl}
                      download={document.fileName}
                      className="text-blue-400 hover:underline"
                    >
                      ⬇️ تحميل الملف
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ Flashcards Tab ============ */}
        {activeTab === 'flashcards' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {flashcards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-4">🃏</p>
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  لا توجد بطاقات بعد
                </h2>
                <p className="text-gray-500 mb-6">
                  اضغط لتوليد بطاقات من المستند
                </p>
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
                      <p className="text-sm opacity-75 mb-4">
                        {showAnswer ? 'الإجابة' : 'السؤال'}
                      </p>
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
                          (currentCardIndex - 1 + flashcards.length) %
                            flashcards.length
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
                        setCurrentCardIndex(
                          (currentCardIndex + 1) % flashcards.length
                        );
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
                      {generatingFlashcards
                        ? 'جاري التوليد...'
                        : '🔄 توليد بطاقات جديدة'}
                    </button>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    كل البطاقات ({flashcards.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flashcards.map((card, idx) => (
                      <div
                        key={card._id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
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
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {selectedQuiz ? (
              <div className="max-w-3xl mx-auto">
                <button
                  onClick={() => {
                    setSelectedQuiz(null);
                    setSelectedAnswers({});
                    setShowQuizResult(false);
                  }}
                  className="text-blue-600 hover:underline mb-4 text-sm"
                >
                  ← رجوع للاختبارات
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {selectedQuiz.title}
                </h2>

                {showQuizResult ? (
                  <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-2xl p-8 text-center">
                    <p className="text-6xl mb-4">🎉</p>
                    <h3 className="text-3xl font-bold mb-4">نتيجتك</h3>
                    <p className="text-5xl font-bold mb-2">
                      {
                        selectedQuiz.questions.filter(
                          (q, idx) => selectedAnswers[idx] === q.correctAnswer
                        ).length
                      }{' '}
                      / {selectedQuiz.questions.length}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedQuiz(null);
                        setSelectedAnswers({});
                        setShowQuizResult(false);
                      }}
                      className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      العودة للاختبارات
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedQuiz.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                      >
                        <p className="font-bold text-gray-800 mb-4">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() =>
                                setSelectedAnswers({
                                  ...selectedAnswers,
                                  [idx]: opt,
                                })
                              }
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
                      onClick={() => {
                        const unanswered = selectedQuiz.questions.filter(
                          (_, idx) => !selectedAnswers[idx]
                        );
                        if (unanswered.length > 0) {
                          toast.error(
                            `لديك ${unanswered.length} سؤال لم تجب عليه`
                          );
                          return;
                        }
                        setShowQuizResult(true);
                      }}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold"
                    >
                      تقديم الاختبار
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {loadingQuizzes ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-6xl mb-4">📝</p>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">
                      لا توجد اختبارات بعد
                    </h2>
                    <p className="text-gray-500 mb-6">
                      اضغط لتوليد اختبار من المستند
                    </p>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={generatingQuiz}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {generatingQuiz ? 'جاري التوليد...' : '🪄 توليد اختبار'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={handleGenerateQuiz}
                        disabled={generatingQuiz}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm disabled:opacity-50"
                      >
                        {generatingQuiz ? 'جاري التوليد...' : '+ اختبار جديد'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quizzes.map((q) => (
                        <div
                          key={q._id}
                          className="bg-white rounded-xl shadow p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                              📝
                            </div>
                            <span className="text-xs text-gray-400">
                              {q.questions.length} أسئلة
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 mb-3 truncate">
                            {q.title}
                          </h3>
                          <button
                            onClick={() => {
                              setSelectedQuiz(q);
                              setSelectedAnswers({});
                              setShowQuizResult(false);
                            }}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                          >
                            ابدأ الاختبار
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ Summary Tab ============ */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {summary.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-6xl mb-4">📋</p>
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  لا يوجد تلخيص بعد
                </h2>
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
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📋 الملخص
                </h3>
                <ul className="space-y-3">
                  {summary.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
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
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto mb-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">💬</p>
                  <h2 className="text-xl font-bold text-gray-700 mb-2">
                    ابدأ الدردشة
                  </h2>
                  <p className="text-gray-500">اسأل عن أي حاجة في المستند</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-start' : 'justify-end'
                      }`}
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
  );
}