import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcon } from '../components/MaterialIcon';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAppContext } from '../context/AppContext';
import { generateAIResponse, createMessage } from '../utils/aiResponses';

export function VoiceScreen() {
  const navigation = useNavigation();
  const { state, dispatch } = useAppContext();
  const [recordingStatus, setRecordingStatus] = useState('Tap to speak');

  const { isListening, hasPermission, toggle } = useSpeechRecognition({
    onResult: (result) => {
      handleVoiceResult(result.transcript);
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setRecordingStatus('Error occurred. Tap to try again.');
      dispatch({ type: 'SET_RECORDING', payload: false });
    },
  });

  const handleVoiceResult = (transcript: string) => {
    // Add user message
    const userMessage = createMessage(transcript, 'user');
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

    // Navigate to chat to show conversation
    navigation.navigate('Chat' as never);

    // Generate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(transcript);
      const aiMessage = createMessage(aiResponse, 'ai');
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
    }, 1000);
  };

  const handleMicPress = () => {
    if (isListening) {
      setRecordingStatus('Tap to speak');
      dispatch({ type: 'SET_RECORDING', payload: false });
    } else {
      setRecordingStatus('Listening...');
      dispatch({ type: 'SET_RECORDING', payload: true });
    }
    toggle();
  };

  const suggestions = [
    "What's the weather like?",
    "Set a timer for 5 minutes",
    "Tell me a joke",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialIcon name="android" size={24} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.headerTitle}>Voice Assistant</Text>
        <TouchableOpacity 
          style={styles.headerRight}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <MaterialIcon name="settings" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.microphoneSection}>
          <MicrophoneButton
            isRecording={state.isRecording}
            onPress={handleMicPress}
            size={120}
            disabled={hasPermission === false}
          />
          <Text style={styles.recordingStatus}>{recordingStatus}</Text>
        </View>

        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Try saying...</Text>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleVoiceResult(suggestion)}
            >
              <Text style={styles.suggestionText}>"{suggestion}"</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#303030',
  },
  headerLeft: {
    width: 40,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#505050',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  microphoneSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  recordingStatus: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  suggestionsSection: {
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 16,
    color: '#ababab',
    marginBottom: 20,
    textAlign: 'center',
  },
  suggestionItem: {
    backgroundColor: '#303030',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    minWidth: 200,
  },
  suggestionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});