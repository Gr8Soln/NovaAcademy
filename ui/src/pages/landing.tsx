import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Layers,
  MessageSquare,
  Shield,
  Swords,
  TrendingUp,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores";
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
    icon: Shield,
    title: "Exam Hall",
    description:
      "Immersive timed exams that simulate real test pressure and build confidence.",
  },
  {
    icon: Swords,
    title: "1v1 Challenges",
    description: "Compete head-to-head against other students and earn points.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Track study time, quiz scores, streaks, and mastery over time.",
  },
];

/* ─── Steps data ────────────────────────────────────────────── */

const steps = [
  { icon: Upload, title: "Upload", desc: "Drop your study materials" },
  {
    icon: Brain,
    title: "AI Processes",
    desc: "AI chunks, embeds, and understands your content",
  },
  {
    icon: BookOpen,
    title: "Study",
    desc: "Get summaries, flashcards, and Q&A",
  },
  {
    icon: Swords,
    title: "Challenge",
    desc: "Quiz yourself or challenge friends",
  },
  {
    icon: TrendingUp,
    title: "Track",
    desc: "Watch your mastery grow",
  },
];

/* ─── Stats data ────────────────────────────────────────────── */

const stats = [
  { value: 10000, label: "Questions Answered", suffix: "+" },
  { value: 5000, label: "Quizzes Taken", suffix: "+" },
  { value: 2000, label: "Students", suffix: "+" },
  { value: 50000, label: "Study Minutes", suffix: "+" },
];

/* ─── Component ─────────────────────────────────────────────── */

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);

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
                Upload your materials. Master them with AI-generated summaries,
                flashcards, and timed exams. Compete on the leaderboard.
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
                    Gr8Academy Dashboard
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
                  #3 on Leaderboard
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
      <section
        id="how-it-works"
        className="py-20 lg:py-28 bg-primary-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              How It Works
            </h2>
            <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
              From upload to mastery in five simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[60%] right-[-40%] h-px border-t-2 border-dashed border-primary-600" />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  {/* Number */}
                  <span className="font-display text-4xl font-bold text-accent-500 mb-3">
                    {i + 1}
                  </span>
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-primary-800 flex items-center justify-center mb-4">
                    <step.icon className="h-7 w-7 text-accent-300" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-neutral-300 max-w-[200px]">
                    {step.desc}
                  </p>
                </div>
              </div>
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

      {/* ── Leaderboard Preview ──────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-900">
              See Who's Leading
            </h2>
            <p className="mt-3 text-neutral-600">Our top scholars this week</p>
          </div>

          <Card className="overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {[
                { name: "Sarah Mitchell", pts: 2840 },
                { name: "James Park", pts: 2615 },
                { name: "Aisha Okafor", pts: 2490 },
                { name: "Liam Chen", pts: 2305 },
                { name: "Emma Rodriguez", pts: 2150 },
              ].map((entry, i) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-4 py-4 hover:px-4 hover:bg-neutral-50 rounded-md transition-all cursor-pointer"
                >
                  <div className="relative">
                    <Avatar name={entry.name} size="sm" />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white ${i === 0
                        ? "bg-accent-500 text-white"
                        : i === 1
                          ? "bg-neutral-300 text-neutral-800"
                          : i === 2
                            ? "bg-accent-700 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span className="font-medium text-neutral-900 flex-1">
                    {entry.name}
                  </span>

                  <span className="font-mono text-sm font-semibold text-accent-700">
                    {entry.pts.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="text-center mt-6">
            {user ? (
              <Link to={pages.leaderboard}>
                <Button variant="primary">
                  View Full Leaderboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to={pages.register}>
                <Button variant="accent">
                  Sign Up to See Your Rank
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
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
