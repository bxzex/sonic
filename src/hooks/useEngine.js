import { useState, useCallback, useRef } from 'react';
import * as webllm from "@mlc-ai/web-llm";

export const useEngine = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const engineRef = useRef(null);

    const initWebLLM = async (modelId, onProgress) => {
        if (engineRef.current) return engineRef.current;

        setLoading(true);
        try {
            const engine = await webllm.CreateMLCEngine(modelId, {
                initProgressCallback: (report) => {
                    // Simplified status for better UX
                    let status = "Initializing";
                    if (report.text.includes("Fetching")) status = "Downloading Model";
                    if (report.text.includes("Loading")) status = "Loading Model";
                    if (report.text.includes("Finish")) status = "Finalizing";

                    if (report.progress === 1) status = "Ready";

                    const progressInfo = {
                        percent: Math.round(report.progress * 100),
                        status: status,
                        raw: report.text
                    };
                    setProgress(progressInfo);
                    if (onProgress) onProgress(progressInfo);
                },
            });
            engineRef.current = engine;
            return engine;
        } finally {
            setLoading(false);
            setProgress(null);
        }
    };

    const sendMessage = useCallback(async (messages, type, model, onChunk) => {
        setLoading(true);

        // Browser Engine (WebLLM)
        try {
            const engine = await initWebLLM(model);
            const chunks = await engine.chat.completions.create({
                messages: messages,
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
            throw new Error('WebGPU failed or Model error: ' + err.message);
        } finally {
            setLoading(false);
            setProgress(null);
        }
    }, []);

    return { sendMessage, loading, progress, initWebLLM };
};
