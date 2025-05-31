import { useState, useEffect, useRef } from "react";
import * as Speech from "expo-speech";
import { VoiceRecognitionResult } from "../types";

interface UseSpeechRecognitionProps {
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
}

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
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
      // First try to use expo-speech-recognition if available
      try {
        const { ExpoSpeechRecognitionModule } = await import(
          "expo-speech-recognition"
        );
        const result =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

        if (result.granted) {
          setHasPermission(true);
          console.log("Expo speech recognition permissions granted");
          return;
        }
      } catch (expoError) {
        console.log(
          "Expo speech recognition not available, falling back to web API"
        );
      }

      // Fallback to web API
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);
        console.log("Web microphone permissions granted");
      } else {
        setHasPermission(true);
        console.log("Assuming permissions granted for compatibility");
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setHasPermission(false);
      onError?.("Microphone permission is required for voice recording");
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
      audioChunksRef.current = [];

      // Start audio recording for bytes capture
      await startAudioRecording();

      // Start speech recognition
      await startSpeechRecognition();
    } catch (error) {
      console.error("Error starting recording/recognition:", error);
      onError?.("Failed to start voice recording");
      setIsListening(false);
      isRecordingRef.current = false;
    }
  };

  const startAudioRecording = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Convert recorded audio to bytes
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBytes = new Uint8Array(arrayBuffer);
          setAudioData(audioBytes);
          console.log(`Audio recorded: ${audioBytes.length} bytes`);

          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(100); // Collect data every 100ms
        console.log("Audio recording started");
      } else {
        console.log("MediaRecorder not available, skipping audio recording");
      }
    } catch (error) {
      console.error("Error starting audio recording:", error);
      // Don't throw error, continue with speech recognition
    }
  };

  const startSpeechRecognition = async () => {
    try {
      // First try expo-speech-recognition if available
      try {
        const { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } =
          await import("expo-speech-recognition");

        console.log("Starting Expo speech recognition");

        // Set up event listeners
        const setupExpoListeners = () => {
          ExpoSpeechRecognitionModule.addListener("result", (event: any) => {
            console.log("Expo speech recognition result:", event);
            if (event.results && event.results.length > 0) {
              const result = event.results[0];
              if (result && result.transcript) {
                const transcript = result.transcript.trim();
                const confidence = result.confidence || 0.9;

                console.log("Recognized text:", transcript);
                setTranscript(transcript);
                onResult?.({
                  transcript: transcript,
                  confidence: confidence,
                });

                if (!continuous) {
                  stopListening();
                }
              }
            }
          });

          ExpoSpeechRecognitionModule.addListener("error", (event: any) => {
            console.error(
              "Expo speech recognition error:",
              event.error,
              event.message
            );
            onError?.("Speech recognition failed: " + event.error);
            setIsListening(false);
            isRecordingRef.current = false;
          });

          ExpoSpeechRecognitionModule.addListener("end", () => {
            console.log("Expo speech recognition ended");
            setIsListening(false);
            isRecordingRef.current = false;
          });
        };

        setupExpoListeners();

        // Start recognition
        ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          interimResults: false,
          maxAlternatives: 1,
          continuous: continuous,
        });

        return; // Successfully started Expo recognition
      } catch (expoError) {
        console.log(
          "Expo speech recognition not available, falling back to web API"
        );
      }

      // Fallback to web speech recognition
      await startWebSpeechRecognition();
    } catch (error) {
      console.error("Speech recognition error:", error);
      await startWebSpeechRecognition();
    }
  };

  const startWebSpeechRecognition = async () => {
    try {
      // Check if we're in a web environment and SpeechRecognition is available
      if (
        typeof window !== "undefined" &&
        (window.webkitSpeechRecognition || window.SpeechRecognition)
      ) {
        const WebSpeechRecognition =
          window.webkitSpeechRecognition || window.SpeechRecognition;

        const recognition = new WebSpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log("Web speech recognition started");
        };

        recognition.onresult = (event: any) => {
          console.log("Web speech recognition result received");
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            const transcript = result[0].transcript.trim();
            const confidence = result[0].confidence;

            console.log("Web recognized text:", transcript);
            setTranscript(transcript);
            onResult?.({
              transcript: transcript,
              confidence: confidence || 0.9,
            });

            if (!continuous) {
              stopListening();
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Web speech recognition error:", event.error);

          // Handle different error types
          switch (event.error) {
            case "no-speech":
              onError?.("No speech detected. Please try again.");
              break;
            case "network":
              onError?.(
                "Network error. Please check your connection and try again."
              );
              break;
            case "not-allowed":
              onError?.(
                "Microphone permission denied. Please allow microphone access and try again."
              );
              break;
            default:
              onError?.("Speech recognition failed: " + event.error);
          }
        };

        recognition.onend = () => {
          console.log("Web speech recognition ended");
          if (continuous && isRecordingRef.current) {
            // Restart if continuous and still supposed to be listening
            try {
              recognition.start();
            } catch (error) {
              console.error("Error restarting web recognition:", error);
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // No speech recognition available - provide helpful message
        console.log("No speech recognition API available");
        onError?.(
          "Speech recognition is not supported. Please use a device with speech recognition capabilities or try the web version in Chrome/Safari."
        );
      }
    } catch (error) {
      console.error("Web speech recognition start error:", error);
      onError?.("Failed to start speech recognition. Please try again.");
    }
  };

  const stopListening = async () => {
    if (!isRecordingRef.current) return;

    try {
      isRecordingRef.current = false;
      setIsListening(false);

      // Clear any timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Stop Expo speech recognition
      try {
        const { ExpoSpeechRecognitionModule } = await import(
          "expo-speech-recognition"
        );
        ExpoSpeechRecognitionModule.stop();
        console.log("Expo speech recognition stopped");
      } catch (error) {
        console.log("Expo speech recognition not available or already stopped");
      }

      // Stop web speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
          console.log("Web speech recognition stopped");
        } catch (error) {
          console.log("Web speech recognition stop error:", error);
        }
      }

      // Stop audio recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        } catch (error) {
          console.error("Error stopping media recorder:", error);
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      onError?.("Failed to stop recording");
      isRecordingRef.current = false;
      setIsListening(false);
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
