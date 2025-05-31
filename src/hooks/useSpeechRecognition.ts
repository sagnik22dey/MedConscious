import { useState, useEffect, useRef } from "react";
import * as Speech from "expo-speech";
import { VoiceRecognitionResult } from "../types";

interface UseSpeechRecognitionProps {
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
}

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState("");
  const isRecordingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestPermissions();

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

  const requestPermissions = async () => {
    try {
      // For now, we'll assume permissions are granted
      // In a real implementation, you'd request microphone permissions here
      setHasPermission(true);
    } catch (error) {
      console.error("Error requesting audio permissions:", error);
      setHasPermission(false);
      onError?.("Failed to request microphone permissions");
    }
  };

  const startListening = async () => {
    if (!hasPermission) {
      onError?.("Microphone permission not granted");
      return;
    }

    // If already recording, stop first to prevent conflicts
    if (isRecordingRef.current) {
      await stopListening();
      // Add a small delay to ensure the previous recording is fully stopped
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      isRecordingRef.current = true;
      setIsListening(true);

      // For demo purposes, we'll simulate speech recognition
      // In a real app, you'd integrate with a speech recognition service
      simulateSpeechRecognition();
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      isRecordingRef.current = false;
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
      onError?.("Failed to stop recording");
      isRecordingRef.current = false;
      setIsListening(false);
    }
  };

  const simulateSpeechRecognition = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simulate speech recognition with mock responses
    timeoutRef.current = setTimeout(() => {
      // Check if we're still supposed to be listening
      if (!isRecordingRef.current) return;

      const mockTranscripts = [
        "Hello, how are you?",
        "What's the weather like today?",
        "Set a timer for 5 minutes",
        "Tell me a joke",
        "How can I help you?",
        "I have a headache, what should I do?",
        "What are the symptoms of flu?",
        "How can I improve my sleep?",
        "What foods are good for heart health?",
        "I feel stressed, any advice?",
        "Can you recommend some exercises?",
        "What vitamins should I take?",
        "How much water should I drink daily?",
        "What are healthy breakfast options?",
        "How can I reduce anxiety naturally?",
      ];

      const randomTranscript =
        mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(randomTranscript);

      onResult?.({
        transcript: randomTranscript,
        confidence: 0.95,
      });

      if (!continuous) {
        stopListening();
      }
    }, 2000); // Simulate 2 second recognition delay
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

  return {
    isListening,
    hasPermission,
    transcript,
    startListening,
    stopListening,
    toggle,
    speak,
  };
}
