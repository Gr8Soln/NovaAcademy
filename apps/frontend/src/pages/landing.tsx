import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  Flame,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons";
import { Card } from "@/components/ui/card";
import { pages } from "@/lib/constant";

/* ─── Counter hook ──────────────────────────────────────────── */

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return { count, ref };
}

/* ─── Feature data ──────────────────────────────────────────── */

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Upload,
    title: "Smart Document Upload",
    description:
      "Upload PDFs, DOCX, PPTX, images — AI parses and understands everything.",
  },
  {
    icon: MessageSquare,
    title: "AI Q&A",
    description:
      "Ask questions about your materials and get grounded, streaming answers.",
  },
  {
    icon: Layers,
    title: "Summaries & Flashcards",
    description: "Auto-generated study aids from your uploaded content.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Track study time, quiz scores, streaks, and mastery over time.",
  },
];

/* ─── Steps data (How It Works cards) ───────────────────────── */

interface HowItWorksStep {
  badge: string;
  badgeIcon: LucideIcon;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
  illustration: React.FC;
}

/* ── Coded illustrations for each step ──────────────────────── */

const UploadIllustration = () => (
  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl p-6 overflow-hidden">
    {/* Drop zone  */}
    <div className="absolute inset-4 border-2 border-dashed border-primary-300 rounded-xl flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-full bg-primary-200 flex items-center justify-center">
        <Upload className="h-7 w-7 text-primary-600" />
      </div>
      <p className="text-sm font-medium text-primary-700">Drop files here</p>
    </div>
    {/* Floating doc icons */}
    <div
      className="absolute top-3 right-3 bg-white rounded-lg shadow-md p-2 flex items-center gap-2 animate-bounce"
      style={{ animationDuration: "3s" }}
    >
      <FileText className="h-4 w-4 text-danger-500" />
      <span className="text-xs font-medium text-neutral-700">Biology.pdf</span>
    </div>
    <div
      className="absolute bottom-3 left-3 bg-white rounded-lg shadow-md p-2 flex items-center gap-2 animate-bounce"
      style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
    >
      <FileText className="h-4 w-4 text-primary-500" />
      <span className="text-xs font-medium text-neutral-700">Notes.docx</span>
    </div>
  </div>
);

const AIProcessIllustration = () => (
  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-secondary-100 to-secondary-50 rounded-2xl p-6 overflow-hidden">
    {/* Central brain */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-secondary-200 flex items-center justify-center">
          <Brain className="h-10 w-10 text-secondary-600" />
        </div>
        {/* Orbiting dots */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute w-3 h-3 rounded-full bg-secondary-400"
            style={{
              top: `${50 - 45 * Math.cos((deg * Math.PI) / 180)}%`,
              left: `${50 + 45 * Math.sin((deg * Math.PI) / 180)}%`,
              transform: "translate(-50%, -50%)",
              opacity: 0.6 + (deg % 120 === 0 ? 0.4 : 0),
            }}
          />
        ))}
      </div>
    </div>
    {/* Floating chips */}
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-sm px-3 py-1.5 flex items-center gap-1.5">
      <Sparkles className="h-3 w-3 text-accent-500" />
      <span className="text-xs font-medium text-neutral-600">Embedding</span>
    </div>
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-sm px-3 py-1.5 flex items-center gap-1.5">
      <Zap className="h-3 w-3 text-accent-500" />
      <span className="text-xs font-medium text-neutral-600">Analyzing</span>
    </div>
  </div>
);

const StudyIllustration = () => (
  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-success-100 to-success-50 rounded-2xl p-6 overflow-hidden">
    {/* Flashcards */}
    <div className="absolute top-6 left-6 right-6 space-y-3">
      <div className="bg-white rounded-xl shadow-sm p-4 transform -rotate-1">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-success-500" />
          <span className="text-xs font-semibold text-success-700">
            Flashcard
          </span>
        </div>
        <p className="text-sm text-neutral-700">What is mitosis?</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4 transform rotate-1">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-success-500" />
          <span className="text-xs font-semibold text-success-700">
            Summary
          </span>
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-neutral-200 rounded-full w-full" />
          <div className="h-2 bg-neutral-200 rounded-full w-4/5" />
          <div className="h-2 bg-neutral-200 rounded-full w-3/5" />
        </div>
      </div>
    </div>
    {/* Chat bubble */}
    <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-md p-3 max-w-[160px]">
      <div className="flex items-center gap-1.5 mb-1">
        <MessageSquare className="h-3 w-3 text-primary-500" />
        <span className="text-[10px] font-medium text-primary-600">
          AI Tutor
        </span>
      </div>
      <p className="text-xs text-neutral-600">Great question! Here's what...</p>
    </div>
  </div>
);

const TrackIllustration = () => (
  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-danger-50 to-primary-50 rounded-2xl p-6 overflow-hidden">
    {/* Chart bars */}
    <div className="absolute bottom-6 left-6 right-6 flex items-end gap-2 h-[60%]">
      {[35, 55, 40, 70, 90, 65, 85].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all"
            style={{ height: `${h}%` }}
          />
          <span className="text-[9px] text-neutral-400">
            {["M", "T", "W", "T", "F", "S", "S"][i]}
          </span>
        </div>
      ))}
    </div>
    {/* Streak badge */}
    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-sm px-3 py-2 flex items-center gap-2">
      <Flame className="h-4 w-4 text-accent-500 fill-accent-500" />
      <div>
        <p className="text-xs font-bold text-neutral-800">7 Day Streak</p>
        <p className="text-[10px] text-neutral-500">Keep it up!</p>
      </div>
    </div>
    {/* Mastery badge */}
    <div className="absolute top-4 right-4 bg-white rounded-xl shadow-sm px-3 py-2 flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-success-500" />
      <span className="text-xs font-bold text-success-700">+12%</span>
    </div>
  </div>
);

const howItWorksSteps: HowItWorksStep[] = [
  {
    badge: "Smart Upload",
    badgeIcon: Upload,
    heading: "Drop & Go",
    description:
      "Upload PDFs, DOCX, PPTX, or images — our AI parses, chunks, and understands everything. Just drag your files and let the magic begin.",
    ctaText: "Upload Now",
    ctaLink: pages.documents,
    bgColor: "bg-primary-50",
    badgeBg: "bg-primary-100",
    badgeText: "text-primary-700",
    illustration: UploadIllustration,
  },
  {
    badge: "AI Engine",
    badgeIcon: Brain,
    heading: "Instant Understanding",
    description:
      "Our AI engine chunks, embeds, and deeply understands your content in seconds. It builds a knowledge graph tailored to your learning needs.",
    ctaText: "Learn More",
    ctaLink: "#features",
    bgColor: "bg-secondary-50",
    badgeBg: "bg-secondary-100",
    badgeText: "text-secondary-700",
    illustration: AIProcessIllustration,
  },
  {
    badge: "Study Tools",
    badgeIcon: BookOpen,
    heading: "Your Personal Tutor",
    description:
      "Get AI-generated summaries, interactive flashcards, and contextual Q&A. Ask anything about your materials and get grounded, streaming answers.",
    ctaText: "Start Studying",
    ctaLink: pages.documents,
    bgColor: "bg-success-50",
    badgeBg: "bg-success-100",
    badgeText: "text-success-700",
    illustration: StudyIllustration,
  },
  {
    badge: "Analytics",
    badgeIcon: BarChart3,
    heading: "Track Your Growth",
    description:
      "Watch your mastery grow with detailed performance analytics. Track study time, quiz scores, streaks, and subject mastery over time.",
    ctaText: "View Analytics",
    ctaLink: pages.dashboard,
    bgColor: "bg-rose-50",
    badgeBg: "bg-danger-100",
    badgeText: "text-danger-700",
    illustration: TrackIllustration,
  },
];

/* ─── Scroll reveal hook (bidirectional) ────────────────────── */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Bidirectional: show when entering, hide when leaving
        setIsVisible(entry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Stats data ────────────────────────────────────────────── */

const stats = [
  { value: 10000, label: "Questions Answered", suffix: "+" },
  { value: 5000, label: "Quizzes Taken", suffix: "+" },
  { value: 2000, label: "Students", suffix: "+" },
  { value: 50000, label: "Study Minutes", suffix: "+" },
];

/* ─── HowItWorksCard component ──────────────────────────────── */

function HowItWorksCard({
  step,
  index,
}: {
  step: HowItWorksStep;
  index: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const Illustration = step.illustration;

  return (
    <div
      ref={ref}
      className={`sticky top-20 lg:top-28 w-full mb-8 lg:mb-12 last:mb-0 transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        zIndex: index + 10,
      }}
    >
      <div
        className={`${step.bgColor} rounded-2xl shadow-xl overflow-hidden border border-neutral-200/60 transition-transform duration-700 ${
          isVisible ? "translate-y-0" : "translate-y-8"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0">
          {/* Left column — Text */}
          <div className="flex flex-col justify-center p-8 lg:p-12">
            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 mb-6 self-start">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full ${step.badgeBg} ${step.badgeText} px-3 py-1.5 text-xs font-semibold shadow-sm`}
              >
                <step.badgeIcon className="h-3.5 w-3.5" />
                {step.badge}
              </span>
            </div>

            {/* Heading */}
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-900 mb-4 tracking-tight">
              {step.heading}
            </h3>

            {/* Description */}
            <p className="text-neutral-600 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
              {step.description}
            </p>

            {/* CTA */}
            <div>
              <Link to={step.ctaLink}>
                <Button
                  variant="primary"
                  size="md"
                  className="rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                >
                  {step.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column — Illustration */}
          <div className="flex items-center justify-center p-6 lg:p-10 bg-white/30 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent">
            <div className="w-full max-w-md">
              <Illustration />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header transparent />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-500/5 blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-accent-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left column — Text */}
            <div className="text-center lg:text-left">
              <span className="inline-block font-sans text-xs font-semibold uppercase tracking-widest text-accent-700 mb-4">
                AI-Powered Academic Excellence
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-900 leading-tight">
                Outperform. Outlearn. Outrank.
              </h1>
              <p className="mt-6 font-sans text-lg text-neutral-600 max-w-xl mx-auto lg:mx-0">
                Upload your materials. Master them with AI-generated summaries
                and flashcards.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/register">
                  <Button variant="accent" size="lg">
                    Start Learning Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg">
                    See How It Works
                  </Button>
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-8 hidden lg:flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["Alice Chen", "Bob Smith", "Carlos Diaz", "Dana Lee"].map(
                    (name) => (
                      <Avatar
                        key={name}
                        name={name}
                        size="sm"
                        className="ring-2 ring-white"
                      />
                    ),
                  )}
                </div>
                <span className="text-sm text-neutral-600">
                  Join <strong className="text-primary-900">2,000+</strong>{" "}
                  students
                </span>
              </div>
            </div>

            {/* Right column — Illustration */}
            <div className="block relative">
              <div className="relative bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-sm text-neutral-300 ml-2">
                    NovaAcademy Dashboard
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-neutral-300 mb-1">
                      Study Streak
                    </p>
                    <p className="text-2xl font-display font-bold text-accent-300">
                      7 days 🔥
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-xs text-neutral-300">Quiz Score</p>
                      <p className="text-lg font-mono font-bold text-success-400">
                        92%
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-xs text-neutral-300">Points</p>
                      <p className="text-lg font-mono font-bold text-accent-300">
                        1,240
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs text-neutral-300 mb-2">
                      AI: Based on your Biology notes...
                    </p>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-accent-500 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-4 right-4 lg:-right-4 bg-accent-500 text-primary-900 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg">
                  A+ Student
                </div>
              </div>
            </div>

            {/*  */}
            <div className="flex lg:hidden items-center gap-3 justify-center">
              <div className="flex -space-x-2">
                {["Alice Chen", "Bob Smith", "Carlos Diaz", "Dana Lee"].map(
                  (name) => (
                    <Avatar
                      key={name}
                      name={name}
                      size="sm"
                      className="ring-2 ring-white"
                    />
                  ),
                )}
              </div>
              <span className="text-sm text-neutral-600">
                Join <strong className="text-primary-900">2,000+</strong>{" "}
                students
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-900">
              Everything You Need to Excel
            </h2>
            <p className="mt-4 text-neutral-600 max-w-2xl mx-auto">
              Powerful tools designed to help you study smarter, not harder.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="group">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-900">
              How It Works
            </h2>
            <p className="mt-4 text-neutral-600 max-w-2xl mx-auto">
              From upload to mastery in five simple steps.
            </p>
          </div>

          {/* Stacked cards */}
          <div className="space-y-0">
            {howItWorksSteps.map((step, i) => (
              <HowItWorksCard key={step.badge} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const { count, ref } = useCountUp(stat.value);
              return (
                <div key={stat.label} ref={ref} className="text-center">
                  <p className="font-display text-3xl md:text-4xl font-bold text-accent-500">
                    {count.toLocaleString()}
                    {stat.suffix}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-accent-500 to-accent-700 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            Ready to Dominate Your Exams?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join thousands of high-performing students using AI to achieve
            academic excellence.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-accent-700 border-white hover:bg-neutral-50"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
