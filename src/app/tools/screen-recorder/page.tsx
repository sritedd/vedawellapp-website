"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export default function ScreenRecorder() {
    const [state, setState] = useState<RecordingState>("idle");
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
    const [includeAudio, setIncludeAudio] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const startRecording = async () => {
        setError(null);
        chunksRef.current = [];

        try {
            // Get screen capture
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "monitor",
                    frameRate: 30,
                },
                audio: includeAudio,
            });

            let combinedStream = displayStream;

            // If audio is requested but not captured from display, try microphone
            if (includeAudio && !displayStream.getAudioTracks().length) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                    });
                    const tracks = [...displayStream.getTracks(), ...audioStream.getTracks()];
                    combinedStream = new MediaStream(tracks);
                } catch {
                    // Proceed without microphone audio
                    console.log("Microphone not available, recording without audio");
                }
            }

            streamRef.current = combinedStream;

            // Determine supported MIME type
            const mimeTypes = [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm",
                "video/mp4",
            ];
            let mimeType = "";
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }

            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: mimeType || undefined,
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setRecordingUrl(url);
                setState("stopped");
            };

            // Handle when user stops sharing via browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                if (mediaRecorderRef.current?.state === "recording") {
                    stopRecording();
                }
            };

            mediaRecorder.start(1000); // Collect data every second
            setState("recording");
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((t) => t + 1);
            }, 1000);
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
                setError("Screen sharing was cancelled or denied.");
            } else {
                setError(`Failed to start recording: ${message}`);
            }
            setState("idle");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.pause();
            setState("paused");
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current?.state === "paused") {
            mediaRecorderRef.current.resume();
            setState("recording");
            timerRef.current = setInterval(() => {
                setRecordingTime((t) => t + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    };

    const downloadRecording = () => {
        if (!recordedBlob) return;

        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const newRecording = () => {
        if (recordingUrl) {
            URL.revokeObjectURL(recordingUrl);
        }
        setRecordedBlob(null);
        setRecordingUrl(null);
        setRecordingTime(0);
        setState("idle");
        setError(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (recordingUrl) {
                URL.revokeObjectURL(recordingUrl);
            }
        };
    }, [recordingUrl]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-red-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-red-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🎥</span>
                            Screen Recorder
                        </h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-red-800/30">
                    {/* Status Display */}
                    <div className="text-center mb-8">
                        {state === "idle" && !recordingUrl && (
                            <>
                                <div className="text-6xl mb-4">🖥️</div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Ready to Record
                                </h2>
                                <p className="text-slate-400">
                                    Capture your screen, window, or browser tab
                                </p>
                            </>
                        )}

                        {state === "recording" && (
                            <>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-400 font-medium">Recording</span>
                                </div>
                                <div className="text-6xl font-mono text-white mb-2">
                                    {formatTime(recordingTime)}
                                </div>
                            </>
                        )}

                        {state === "paused" && (
                            <>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                                    <span className="text-yellow-400 font-medium">Paused</span>
                                </div>
                                <div className="text-6xl font-mono text-white mb-2">
                                    {formatTime(recordingTime)}
                                </div>
                            </>
                        )}

                        {state === "stopped" && recordingUrl && (
                            <>
                                <div className="text-green-400 font-medium mb-4">
                                    ✓ Recording Complete
                                </div>
                                <div className="text-lg text-slate-300 mb-4">
                                    Duration: {formatTime(recordingTime)}
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="text-red-400 bg-red-500/10 px-4 py-3 rounded-lg mt-4">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* Video Preview */}
                    {recordingUrl && (
                        <div className="mb-8">
                            <video
                                src={recordingUrl}
                                controls
                                className="w-full rounded-xl bg-black"
                            />
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-4">
                        {state === "idle" && !recordingUrl && (
                            <>
                                {/* Audio Toggle */}
                                <label className="flex items-center gap-3 text-slate-300 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={includeAudio}
                                        onChange={(e) => setIncludeAudio(e.target.checked)}
                                        className="w-5 h-5 rounded text-red-500 focus:ring-red-500"
                                    />
                                    <span>Include audio (system/microphone)</span>
                                </label>

                                <button
                                    onClick={startRecording}
                                    className="px-8 py-4 bg-red-600 text-white rounded-xl text-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <span className="w-3 h-3 bg-white rounded-full" />
                                    Start Recording
                                </button>

                                <p className="text-slate-500 text-sm mt-4">
                                    Choose to share your entire screen, a window, or a browser tab
                                </p>
                            </>
                        )}

                        {state === "recording" && (
                            <div className="flex gap-4">
                                <button
                                    onClick={pauseRecording}
                                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 flex items-center gap-2"
                                >
                                    ⏸️ Pause
                                </button>
                                <button
                                    onClick={stopRecording}
                                    className="px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 flex items-center gap-2"
                                >
                                    ⏹️ Stop
                                </button>
                            </div>
                        )}

                        {state === "paused" && (
                            <div className="flex gap-4">
                                <button
                                    onClick={resumeRecording}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                                >
                                    ▶️ Resume
                                </button>
                                <button
                                    onClick={stopRecording}
                                    className="px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 flex items-center gap-2"
                                >
                                    ⏹️ Stop
                                </button>
                            </div>
                        )}

                        {state === "stopped" && recordingUrl && (
                            <div className="flex gap-4">
                                <button
                                    onClick={downloadRecording}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                                >
                                    ⬇️ Download Recording
                                </button>
                                <button
                                    onClick={newRecording}
                                    className="px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 flex items-center gap-2"
                                >
                                    🔄 New Recording
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Info */}
                <div className="mt-8 grid md:grid-cols-3 gap-4">
                    {[
                        { icon: "🖥️", title: "Full Screen", desc: "Record your entire display" },
                        { icon: "🪟", title: "Window", desc: "Capture a specific window" },
                        { icon: "🌐", title: "Browser Tab", desc: "Record just one tab" },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="bg-slate-800/30 rounded-xl p-6 text-center border border-slate-700/50"
                        >
                            <div className="text-3xl mb-2">{feature.icon}</div>
                            <div className="font-medium text-white">{feature.title}</div>
                            <div className="text-sm text-slate-400">{feature.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Browser Compatibility Note */}
                <div className="mt-6 text-center text-slate-500 text-sm">
                    Works best in Chrome, Edge, and Firefox. Safari has limited support.
                </div>
            </main>
        </div>
    );
}
