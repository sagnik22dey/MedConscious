import { useState, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { VoiceRecognitionResult } from '../types';

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
  const [transcript, setTranscript] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setHasPermission(false);
      onError?.('Failed to request microphone permissions');
    }
  };

  const startListening = async () => {
    if (!hasPermission) {
      onError?.('Microphone permission not granted');
      return;
    }

    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsListening(true);

      // Start recording
      await recording.startAsync();

      // For demo purposes, we'll simulate speech recognition
      // In a real app, you'd integrate with a speech recognition service
      simulateSpeechRecognition();

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError?.('Failed to start speech recognition');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      onError?.('Failed to stop recording');
    }
  };

  const simulateSpeechRecognition = () => {
    // Simulate speech recognition with mock responses
    setTimeout(() => {
      const mockTranscripts = [
        "Hello, how are you?",
        "What's the weather like today?",
        "Set a timer for 5 minutes",
        "Tell me a joke",
        "How can I help you?",
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
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
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
      onError?.('Failed to speak text');
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