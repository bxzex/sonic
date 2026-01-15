import { useState, useCallback, useRef } from 'react';
import * as webllm from "@mlc-ai/web-llm";

export const useEngine = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const contextRef = useRef(null);
    const activeCoreRef = useRef(null);

    const loadCore = async (coreId, onProgress) => {
        if (contextRef.current && activeCoreRef.current === coreId) {
            return contextRef.current;
        }

        if (contextRef.current) {
            await contextRef.current.unload();
            contextRef.current = null;
        }

        setLoading(true);
        try {
            const context = await webllm.CreateMLCEngine(coreId, {
                initProgressCallback: (report) => {
                    let status = "Preparing";
                    if (report.text.includes("Fetching")) status = "Optimizing";
                    if (report.text.includes("Loading")) status = "Syncing";
                    if (report.text.includes("Finish")) status = "Finalizing";

                    if (report.progress === 1) status = "Active";

                    const progressInfo = {
                        percent: Math.round(report.progress * 100),
                        status: status,
                        raw: report.text,
                        coreId: coreId
                    };
                    setProgress(progressInfo);
                    if (onProgress) onProgress(progressInfo);
                },
            });
            contextRef.current = context;
            activeCoreRef.current = coreId;
            return context;
        } catch (err) {
            setProgress(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const processQuery = useCallback(async (messages, type, core, onChunk) => {
        setLoading(true);

        try {
            const engine = await loadCore(core);

            const chunks = await engine.chat.completions.create({
                messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
                stream: true,
            });

            let fullContent = "";
            for await (const chunk of chunks) {
                const content = chunk.choices[0]?.delta?.content || "";
                fullContent += content;
                onChunk(fullContent);
            }
            return fullContent;
        } catch (err) {
            console.error("Core Processing Error:", err);
            setProgress(null);
            const errorMsg = err?.message || err?.toString() || 'Unknown synchronization error';
            throw new Error('Connection lost: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    }, [loadCore]);

    return { processQuery, loading, progress, loadCore };
};
