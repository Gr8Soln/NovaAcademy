import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    CheckCircle2,
    Circle,
    GraduationCap,
    Loader2,
    Sparkles,
    Trophy,
    X,
    XCircle,
} from "lucide-react";

import { documentsApi } from "@/lib/api/documents";
import { aiApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudyQuizModalProps {
    classCode: string;
    currentDocId?: string;
    onClose: () => void;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: string;
}

type Phase = "select" | "generating" | "quiz" | "results";

export default function StudyQuizModal({
    classCode,
    currentDocId,
    onClose,
}: StudyQuizModalProps) {
    const [phase, setPhase] = useState<Phase>("select");
    const [selectedDocs, setSelectedDocs] = useState<string[]>(
        currentDocId ? [currentDocId] : []
    );
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showAnswer, setShowAnswer] = useState(false);

    // Fetch available documents
    const { data } = useQuery({
        queryKey: ["quiz-documents", classCode],
        queryFn: () => documentsApi.list(classCode, 0, 50),
    });
    const documents = (data as any)?.data || data || [];
    const docList = Array.isArray(documents) ? documents : [];

    // Generate quiz mutation
    const { mutate: generateQuiz } = useMutation({
        mutationFn: async () => {
            // Generate quizzes for each selected doc and combine
            const allQuestions: QuizQuestion[] = [];
            for (const docId of selectedDocs) {
                try {
                    const result: any = await aiApi.generateQuiz(docId, 5);
                    const qs = result?.questions || result || [];
                    if (Array.isArray(qs)) {
                        allQuestions.push(...qs);
                    }
                } catch (err) {
                    console.error(`Quiz generation failed for ${docId}:`, err);
                }
            }
            return allQuestions;
        },
        onSuccess: (qs) => {
            if (qs.length > 0) {
                setQuestions(qs);
                setPhase("quiz");
            }
        },
    });

    const toggleDoc = (docId: string) => {
        setSelectedDocs((prev) =>
            prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
        );
    };

    const handleStartQuiz = () => {
        if (selectedDocs.length === 0) return;
        setPhase("generating");
        generateQuiz();
    };

    const handleAnswer = (option: string) => {
        if (showAnswer) return;
        setAnswers((prev) => ({ ...prev, [currentQ]: option }));
        setShowAnswer(true);
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ((q) => q + 1);
            setShowAnswer(false);
        } else {
            setPhase("results");
        }
    };

    const score = Object.entries(answers).filter(
        ([idx, ans]) => questions[Number(idx)]?.correct_answer === ans
    ).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50/50 to-accent-50/30">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-sm">
                            <GraduationCap className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-neutral-900">
                                {phase === "select" && "Generate Quiz"}
                                {phase === "generating" && "Generating Questions..."}
                                {phase === "quiz" && `Question ${currentQ + 1} of ${questions.length}`}
                                {phase === "results" && "Quiz Complete!"}
                            </h2>
                            <p className="text-[10px] text-neutral-400 font-medium">
                                {phase === "select" && "Select materials to quiz yourself on"}
                                {phase === "generating" && "NovaAI is crafting your quiz"}
                                {phase === "quiz" && "Choose the best answer"}
                                {phase === "results" && `You scored ${score}/${questions.length}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* ── Select Phase ── */}
                    {phase === "select" && (
                        <div className="space-y-4">
                            <p className="text-xs text-neutral-500">
                                Choose one or more documents to generate quiz questions from:
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {docList.filter((d: any) => d.processing_status === "ready").map((doc: any) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => toggleDoc(doc.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border",
                                            selectedDocs.includes(doc.id)
                                                ? "bg-primary-50 border-primary-200 text-primary-700"
                                                : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                        )}
                                    >
                                        {selectedDocs.includes(doc.id) ? (
                                            <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                                        ) : (
                                            <Circle className="h-4 w-4 text-neutral-300 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{doc.title}</p>
                                            <p className="text-[10px] text-neutral-400 uppercase">
                                                {doc.file_type}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {docList.filter((d: any) => d.processing_status === "ready").length === 0 && (
                                <p className="text-xs text-neutral-400 text-center py-4">
                                    No processed documents available. Upload and wait for processing to complete.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Generating Phase ── */}
                    {phase === "generating" && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                                <Sparkles className="h-5 w-5 text-accent-500 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-neutral-900">
                                    Crafting your questions...
                                </p>
                                <p className="text-xs text-neutral-400 mt-1">
                                    NovaAI is analyzing {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Quiz Phase ── */}
                    {phase === "quiz" && questions[currentQ] && (
                        <div className="space-y-5">
                            <p className="text-sm font-bold text-neutral-900 leading-relaxed">
                                {questions[currentQ].question}
                            </p>
                            <div className="space-y-2">
                                {questions[currentQ].options.map((option, idx) => {
                                    const isSelected = answers[currentQ] === option;
                                    const isCorrect = option === questions[currentQ].correct_answer;
                                    const revealed = showAnswer;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            disabled={showAnswer}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-medium transition-all border",
                                                revealed && isCorrect
                                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                                    : revealed && isSelected && !isCorrect
                                                        ? "bg-red-50 border-red-300 text-red-800"
                                                        : isSelected
                                                            ? "bg-primary-50 border-primary-300 text-primary-700"
                                                            : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
                                            )}
                                        >
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold flex-shrink-0">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="flex-1">{option}</span>
                                            {revealed && isCorrect && (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                            )}
                                            {revealed && isSelected && !isCorrect && (
                                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Results Phase ── */}
                    {phase === "results" && (
                        <div className="flex flex-col items-center py-8 space-y-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl shadow-primary-500/30">
                                <Trophy className="h-10 w-10" />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-neutral-900">
                                    {score}/{questions.length}
                                </p>
                                <p className="text-sm text-neutral-500 mt-1">
                                    {score === questions.length
                                        ? "Perfect score! 🎉"
                                        : score >= questions.length * 0.7
                                            ? "Great job! Keep it up! 💪"
                                            : "Keep studying, you'll get there! 📚"}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full max-w-xs">
                                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700"
                                        style={{ width: `${(score / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-3">
                    {phase === "select" && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                disabled={selectedDocs.length === 0}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-lg shadow-primary-500/20"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Generate {selectedDocs.length > 0 ? `(${selectedDocs.length} doc${selectedDocs.length > 1 ? "s" : ""})` : ""}
                            </button>
                        </>
                    )}
                    {phase === "quiz" && showAnswer && (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                        >
                            {currentQ < questions.length - 1 ? "Next Question" : "View Results"}
                        </button>
                    )}
                    {phase === "results" && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setPhase("select");
                                    setQuestions([]);
                                    setAnswers({});
                                    setCurrentQ(0);
                                    setShowAnswer(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
