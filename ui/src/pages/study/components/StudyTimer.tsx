import { Clock, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { studySessionsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudyTimerProps {
    documentId: string;
    classId?: string;
    onSessionStarted?: (sessionId: string) => void;
}

export default function StudyTimer({
    documentId,
    onSessionStarted,
}: StudyTimerProps) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const heartbeatIntervalRef = useRef<number | null>(null);

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
            // Cleanup heartbeat on unmount
            if (heartbeatIntervalRef.current) {
                window.clearInterval(heartbeatIntervalRef.current);
            }
            // End session if it was active
            if (sessionId) {
                studySessionsApi.end(sessionId).catch(console.error);
            }
        };
    }, [documentId]);

    // Timer Tick
    useEffect(() => {
        let interval: number | null = null;
        if (isActive) {
            interval = window.setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isActive]);

    // Heartbeat Logic (Sync every 30s)
    useEffect(() => {
        if (isActive && sessionId) {
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
    }, [isActive, sessionId]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-2xl px-4 py-2 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Clock className={cn("h-4 w-4", isActive && "animate-pulse")} />
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">
                    Deep Focus
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
