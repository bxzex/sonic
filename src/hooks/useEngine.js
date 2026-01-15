import { useState, useCallback, useRef } from 'react';
import * as webllm from "@mlc-ai/web-llm";

export const useEngine = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const engineRef = useRef(null);
    const currentModelIdRef = useRef(null);

    const initWebLLM = async (modelId, onProgress) => {
        if (engineRef.current && currentModelIdRef.current === modelId) {
            return engineRef.current;
        }

        if (engineRef.current) {
            await engineRef.current.unload();
            engineRef.current = null;
        }

        setLoading(true);
        try {
            const engine = await webllm.CreateMLCEngine(modelId, {
                initProgressCallback: (report) => {
                    let status = "Starting";
                    if (report.text.includes("Fetching")) status = "Downloading";
                    if (report.text.includes("Loading")) status = "Loading";
                    if (report.text.includes("Finish")) status = "Finishing";

                    if (report.progress === 1) status = "Finished";

                    const progressInfo = {
                        percent: Math.round(report.progress * 100),
                        status: status,
                        raw: report.text,
                        modelId: modelId
                    };
                    setProgress(progressInfo);
                    if (onProgress) onProgress(progressInfo);
                },
            });
            engineRef.current = engine;
            currentModelIdRef.current = modelId;
            return engine;
        } catch (err) {
            console.error("WebLLM Init Error:", err);
            setProgress(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = useCallback(async (messages, type, model, onChunk) => {
        setLoading(true);

        try {
            const engine = await initWebLLM(model);

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
            console.error("WebLLM Message Error:", err);
            setProgress(null);
            const errorMsg = err?.message || err?.toString() || 'Unknown error';
            throw new Error('Processing failed: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    }, [initWebLLM]);

    return { sendMessage, loading, progress, initWebLLM };
};
