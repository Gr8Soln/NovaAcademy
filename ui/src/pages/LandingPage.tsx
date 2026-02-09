import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      {/* Hero */}
      <header className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-700">🎓 Gr8Academy</h1>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-primary-700 hover:text-primary-900"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-20 pb-32 text-center">
        <h2 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Your Personal
          <span className="text-primary-600"> AI Tutor</span>
        </h2>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your study materials and let AI generate summaries, flashcards,
          quizzes, and answer your questions — all grounded in your own content.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg text-lg font-semibold hover:bg-primary-700 shadow-lg"
          >
            Start Learning Free
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              title: "Document Q&A",
              desc: "Ask questions about your study materials and get AI-powered answers grounded in your content.",
              icon: "💬",
            },
            {
              title: "Smart Quizzes",
              desc: "AI generates quiz questions from your documents to test your understanding.",
              icon: "📝",
            },
            {
              title: "Flashcards & Summaries",
              desc: "Auto-generated flashcards and summaries for efficient revision.",
              icon: "⚡",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
