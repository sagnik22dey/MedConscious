import { useState, useEffect, useRef } from "react";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { VoiceRecognitionResult } from "../types";

interface UseSpeechRecognitionProps {
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
}

// Declare global types for web speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState("");
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [speechMethod, setSpeechMethod] = useState<
    "expo" | "web" | "simulation"
  >("simulation");
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expoSpeechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    initializeSpeechRecognition();

    // Cleanup function to ensure recording is stopped on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (isRecordingRef.current) {
        stopListening();
      }
    };
  }, []);

  const initializeSpeechRecognition = async () => {
    console.log("Initializing speech recognition...");

    // First, try to use expo-speech-recognition
    try {
      const { ExpoSpeechRecognitionModule } = await import(
        "expo-speech-recognition"
      );
      const { status } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (status === "granted") {
        setSpeechMethod("expo");
        setHasPermission(true);
        expoSpeechRecognitionRef.current = ExpoSpeechRecognitionModule;
        console.log("Using expo-speech-recognition");

        // Set up expo speech recognition event listeners
        setupExpoSpeechRecognitionEvents();
        return;
      }
    } catch (error: any) {
      console.log("expo-speech-recognition not available:", error.message);
    }

    // Fallback to web speech recognition
    if (Platform.OS === "web") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechMethod("web");
        setHasPermission(true);
        console.log("Using web speech recognition");
        return;
      }
    }

    // Final fallback to simulation
    setSpeechMethod("simulation");
    setHasPermission(true);
    console.log("Using simulation mode for Expo Go");
  };

  const setupExpoSpeechRecognitionEvents = async () => {
    try {
      const { useSpeechRecognitionEvent } = await import(
        "expo-speech-recognition"
      );

      useSpeechRecognitionEvent("start", () => {
        console.log("Expo speech recognition started");
        setIsListening(true);
        isRecordingRef.current = true;
      });

      useSpeechRecognitionEvent("end", () => {
        console.log("Expo speech recognition ended");
        setIsListening(false);
        isRecordingRef.current = false;
      });

      useSpeechRecognitionEvent("result", (event: any) => {
        console.log("Expo speech recognition result:", event);
        const recognizedText = event.results[0]?.transcript || "";
        const confidence = event.results[0]?.confidence || 0;

        setTranscript(recognizedText);

        if (recognizedText) {
          onResult?.({
            transcript: recognizedText,
            confidence: confidence,
          });
        }
      });

      useSpeechRecognitionEvent("error", (event: any) => {
        console.error("Expo speech recognition error:", event);
        setIsListening(false);
        isRecordingRef.current = false;
        onError?.(`Speech recognition failed: ${event.error}`);
      });
    } catch (error) {
      console.log("Could not set up expo speech recognition events:", error);
    }
  };

  const startWebSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error("Web Speech Recognition not supported");
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Web speech recognition started");
      setIsListening(true);
      isRecordingRef.current = true;
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        console.log("Web speech recognition result:", finalTranscript);
        setTranscript(finalTranscript);
        onResult?.({
          transcript: finalTranscript,
          confidence: event.results[0]?.[0]?.confidence || 0.9,
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Web speech recognition error:", event.error);
      setIsListening(false);
      isRecordingRef.current = false;
      onError?.(`Speech recognition failed: ${event.error}`);
    };

    recognition.onend = () => {
      console.log("Web speech recognition ended");
      setIsListening(false);
      isRecordingRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startMobileSpeechRecognition = () => {
    console.log("Starting mobile speech recognition simulation for Expo Go...");
    setIsListening(true);
    isRecordingRef.current = true;

    // Show interim transcript to indicate it's processing
    setTranscript("🎤 Listening... (simulation mode)");

    // For Expo Go, simulate speech recognition with predefined responses
    timeoutRef.current = setTimeout(() => {
      if (isRecordingRef.current) {
        // Simulate a few different responses for testing
        const simulatedResponses = [
          "I have a headache, what should I do?",
          "What are the symptoms of flu?",
          "How can I improve my sleep?",
          "What foods are good for heart health?",
          "I feel stressed, any advice?",
          "How much water should I drink daily?",
        ];

        // Pick a random response for simulation
        const randomResponse =
          simulatedResponses[
            Math.floor(Math.random() * simulatedResponses.length)
          ];

        console.log("🤖 Simulated speech recognition result:", randomResponse);
        console.log(
          "💡 Note: This is simulation mode for Expo Go. For real speech recognition, use a development build or EAS build."
        );
        setTranscript(randomResponse);
        onResult?.({
          transcript: randomResponse,
          confidence: 0.95,
        });

        if (!continuous) {
          stopListening();
        }
      }
    }, 2000); // 2 second delay to simulate processing
  };

  const startExpoSpeechRecognition = async () => {
    if (!expoSpeechRecognitionRef.current) {
      throw new Error("Expo speech recognition not available");
    }

    await expoSpeechRecognitionRef.current.start({
      lang: "en-US",
      interimResults: true,
      maxAlternatives: 1,
      continuous: continuous,
      requiresOnDeviceRecognition: false,
    });
  };

  const startListening = async () => {
    if (hasPermission === null) {
      console.log("Permissions not yet determined, initializing...");
      await initializeSpeechRecognition();
      return;
    }

    if (!hasPermission) {
      onError?.("Microphone permission not granted");
      return;
    }

    // If already recording, stop first to prevent conflicts
    if (isRecordingRef.current) {
      await stopListening();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      console.log("Starting speech recognition...");
      setTranscript(""); // Clear previous transcript

      if (speechMethod === "expo") {
        await startExpoSpeechRecognition();
      } else if (speechMethod === "web") {
        startWebSpeechRecognition();
      } else {
        startMobileSpeechRecognition();
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      onError?.("Failed to start speech recognition");
      setIsListening(false);
      isRecordingRef.current = false;
    }
  };

  const stopListening = async () => {
    if (!isRecordingRef.current) return;

    try {
      console.log("Stopping speech recognition...");

      // Clear any timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Stop expo speech recognition
      if (speechMethod === "expo" && expoSpeechRecognitionRef.current) {
        try {
          await expoSpeechRecognitionRef.current.stop();
        } catch (error) {
          console.log("Error stopping expo speech recognition:", error);
        }
      }

      // Stop web speech recognition if it exists
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (error) {
          console.log("Error stopping web speech recognition:", error);
        }
      }
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
      onError?.("Failed to stop speech recognition");
    } finally {
      setIsListening(false);
      isRecordingRef.current = false;
    }
  };

  const speak = async (text: string) => {
    try {
      await Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error("Error speaking text:", error);
      onError?.("Failed to speak text");
    }
  };

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getAudioBytes = () => audioData;
  const clearAudioData = () => setAudioData(null);

  return {
    isListening,
    hasPermission,
    transcript,
    audioData,
    startListening,
    stopListening,
    toggle,
    speak,
    getAudioBytes,
    clearAudioData,
  };
}
