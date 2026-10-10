import { useCallback, useRef, useState } from "react";

const useSSEStream = () => {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (fetchFn: () => Promise<Response>) => {
    setText("");
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetchFn();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              setIsStreaming(false);
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              if (parsed.token) {
                setText((prev) => prev + parsed.token);
              }
              if (parsed.error) {
                setError(parsed.error);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { text, isStreaming, error, start, stop, reset };
};

export default useSSEStream;
