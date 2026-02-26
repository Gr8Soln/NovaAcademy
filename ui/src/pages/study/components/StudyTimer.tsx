import { Clock, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { studySessionsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudyTimerProps {
    documentId: string;
    classId?: string;
    hideUI?: boolean;
    onSessionStarted?: (sessionId: string) => void;
}

export default function StudyTimer({
    documentId,
    hideUI = false,
    onSessionStarted,
}: StudyTimerProps) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [isUserActive, setIsUserActive] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const heartbeatIntervalRef = useRef<number | null>(null);
    const activityTimeoutRef = useRef<number | null>(null);
    const lastActivityTimeRef = useRef<number>(Date.now());

    // Initialize Session
    useEffect(() => {
        const startSession = async () => {
            try {
                const session: any = await studySessionsApi.start(documentId);
                setSessionId(session.id);
                if (onSessionStarted) onSessionStarted(session.id);
            } catch (error) {
                console.error("Failed to start study session:", error);
            }
        };

        startSession();

        return () => {
            if (heartbeatIntervalRef.current) window.clearInterval(heartbeatIntervalRef.current);
            if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);

            if (sessionId) {
                studySessionsApi.end(sessionId).catch(console.error);
            }
        };
    }, [documentId]);

    // Smart Activity Tracking: Visibility + Activity Listeners
    useEffect(() => {
        const ACTIVITY_THRESHOLD = 60000; // 1 minute of no activity before pausing

        const handleActivity = () => {
            lastActivityTimeRef.current = Date.now();
            if (!isUserActive) setIsUserActive(true);

            if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);
            activityTimeoutRef.current = window.setTimeout(() => {
                setIsUserActive(false);
            }, ACTIVITY_THRESHOLD);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsUserActive(false);
            } else {
                handleActivity();
            }
        };

        // Events to track
        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("mousedown", handleActivity);
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("touchstart", handleActivity);
        window.addEventListener("scroll", handleActivity, { passive: true });
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Initial timeout
        activityTimeoutRef.current = window.setTimeout(() => {
            setIsUserActive(false);
        }, ACTIVITY_THRESHOLD);

        return () => {
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("mousedown", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("touchstart", handleActivity);
            window.removeEventListener("scroll", handleActivity);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);
        };
    }, []);

    // Timer Tick (Only if active, visible, and user is active)
    useEffect(() => {
        let interval: number | null = null;
        if (isActive && isUserActive && !document.hidden) {
            interval = window.setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isActive, isUserActive]);

    // Heartbeat Logic (Sync every 30s)
    useEffect(() => {
        if (isActive && isUserActive && !document.hidden && sessionId) {
            heartbeatIntervalRef.current = window.setInterval(async () => {
                try {
                    await studySessionsApi.heartbeat(sessionId);
                } catch (error) {
                    console.error("Heartbeat sync failed:", error);
                }
            }, 30000);
        } else {
            if (heartbeatIntervalRef.current) {
                window.clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
        }
        return () => {
            if (heartbeatIntervalRef.current) window.clearInterval(heartbeatIntervalRef.current);
        };
    }, [isActive, isUserActive, sessionId]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (hideUI) return null;

    return (
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-2xl px-4 py-2 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Clock className={cn("h-4 w-4", (isActive && isUserActive) && "animate-pulse")} />
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">
                    {isUserActive ? "Deep Focus" : "Idle..."}
                </span>
                <span className="text-sm font-mono font-bold text-neutral-900 tabular-nums">
                    {formatTime(seconds)}
                </span>
            </div>

            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-neutral-100">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                        "p-1.5 rounded-lg transition-all",
                        isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                    )}
                    title={isActive ? "Pause Focus" : "Resume Focus"}
                >
                    {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                    onClick={() => setSeconds(0)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all"
                    title="Reset timer"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
