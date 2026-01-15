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
                    // Simplified status for better UX
                    let status = "Initializing";
                    if (report.text.includes("Fetching")) status = "Downloading Model";
                    if (report.text.includes("Loading")) status = "Loading Model";
                    if (report.text.includes("Finish")) status = "Finalizing";

                    if (report.progress === 1) status = "Ready";

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
        } finally {
            setLoading(false);
            setProgress(null);
        }
    };

    const sendMessage = useCallback(async (messages, type, model, onChunk) => {
        setLoading(true);

        try {
            const engine = await initWebLLM(model);

            // Format messages for potentially multimodal models
            const formattedMessages = messages.map(msg => {
                if (msg.images && msg.images.length > 0) {
                    return {
                        role: msg.role,
                        content: [
                            { type: "text", text: msg.content },
                            ...msg.images.map(img => ({
                                type: "image_url",
                                image_url: { url: img }
                            }))
                        ]
                    };
                }
                return { role: msg.role, content: msg.content };
            });

            const chunks = await engine.chat.completions.create({
                messages: formattedMessages,
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
            throw new Error('Processing failed: ' + err.message);
        } finally {
            setLoading(false);
            setProgress(null);
        }
    }, []);

    return { sendMessage, loading, progress, initWebLLM };
};
