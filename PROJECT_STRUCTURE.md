# MedConscious Voice Assistant - Project Structure

## Overview

This React Native application built with Expo provides a comprehensive voice assistant and chat interface with seamless navigation and modern UI design.

## File Structure

```
MedConscious/
├── .vscode/                     # VS Code configuration
│   ├── settings.json               # Editor settings and preferences
│   └── launch.json                 # Debug configurations
├── assets/                      # Static assets (icons, images)
├── src/                        # Source code directory
│   ├── components/             # Reusable UI components
│   │   ├── index.ts               # Component exports
│   │   ├── MaterialIcon.tsx       # Material Icons wrapper
│   │   ├── MicrophoneButton.tsx   # Animated microphone button
│   │   ├── ChatBubble.tsx         # Message bubbles and typing indicator
│   │   └── ErrorBoundary.tsx      # Error handling component
│   ├── screens/                # Application screens
│   │   ├── VoiceScreen.tsx        # Main voice assistant interface
│   │   ├── ChatScreen.tsx         # Chat messaging interface
│   │   └── SettingsScreen.tsx     # Settings menu screen
│   ├── navigation/             # Navigation configuration
│   │   ├── AppNavigator.tsx       # Main stack navigator
│   │   └── TabNavigator.tsx       # Bottom tab navigation
│   ├── hooks/                  # Custom React hooks
│   │   └── useSpeechRecognition.ts # Speech recognition logic
│   ├── context/                # React Context providers
│   │   └── AppContext.tsx         # Global state management
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts               # Application type definitions
│   └── utils/                  # Utility functions
│       └── aiResponses.ts         # AI response generation
├── App.tsx                     # Main application component
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── README.md                   # Documentation
└── PROJECT_STRUCTURE.md        # This file

```

## Key Features Implemented

### 🎤 Voice Recognition

- **File**: `src/hooks/useSpeechRecognition.ts`
- **Features**: Speech-to-text, microphone permissions, error handling
- **Components**: `MicrophoneButton.tsx` with pulse animations

### 💬 Chat Interface

- **File**: `src/screens/ChatScreen.tsx`
- **Features**: Real-time messaging, typing indicators, voice input
- **Components**: `ChatBubble.tsx` with slide animations

### 🧭 Navigation

- **Files**: `src/navigation/AppNavigator.tsx`, `TabNavigator.tsx`
- **Features**: Stack navigation, tab navigation, modal presentation

### 🎨 UI Components

- **Material Icons**: Consistent icon system
- **Animations**: Pulse effects, slide transitions, typing dots
- **Dark Theme**: Consistent color scheme (#141414 background)

### 🔧 State Management

- **File**: `src/context/AppContext.tsx`
- **Pattern**: React Context + useReducer
- **Features**: Recording states, message history, navigation state

### 🛡️ Error Handling

- **File**: `src/components/ErrorBoundary.tsx`
- **Features**: Graceful error recovery, development error details

## Development Workflow

### Starting Development

```bash
npm start          # Start Metro bundler
npm run ios        # iOS simulator (macOS only)
npm run android    # Android emulator
npm run web        # Web browser
```

### Debugging

- **VS Code**: Integrated debugging with launch configurations
- **Metro**: Hot reloading and error reporting
- **React Native Debugger**: Standalone debugging tool

### Code Organization

- **TypeScript**: Full type safety throughout
- **Component Structure**: Modular and reusable components
- **Custom Hooks**: Encapsulated business logic
- **Context Pattern**: Centralized state management

## Performance Features

### Optimizations

- **React.memo**: Memoized components
- **FlatList**: Optimized list rendering
- **Native Animations**: Smooth transitions
- **Error Boundaries**: Crash prevention

### Memory Management

- **Cleanup Effects**: Proper useEffect cleanup
- **Animation Cleanup**: Stop animations on unmount
- **Context Optimization**: Minimal re-renders

## Design System

### Colors

- **Primary Background**: #141414 (Dark)
- **Secondary Background**: #303030 (Gray)
- **Primary Accent**: #007AFF (Blue)
- **Text Primary**: #FFFFFF (White)
- **Text Secondary**: #ababab (Light Gray)
- **Error/Recording**: #dc2626 (Red)

### Typography

- **Font Family**: System default
- **Sizes**: 12px (small), 14px (body), 16px (medium), 18px (large), 20px+ (headings)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold)

### Spacing

- **Base Unit**: 4px
- **Common Spacings**: 8px, 12px, 16px, 20px, 24px, 32px
- **Safe Areas**: Handled with SafeAreaView

## API Integration Points

### Voice Recognition

- **Current**: Mock implementation with simulated responses
- **Future**: Integrate with real speech recognition services
- **Location**: `src/hooks/useSpeechRecognition.ts`

### AI Responses

- **Current**: Local response generation
- **Future**: Connect to AI services (OpenAI, etc.)
- **Location**: `src/utils/aiResponses.ts`

## Testing Strategy

### Unit Tests

- Component testing with React Native Testing Library
- Hook testing with @testing-library/react-hooks
- Utility function testing

### Integration Tests

- Navigation flow testing
- State management testing
- Voice recognition integration

### E2E Tests

- User journey testing
- Cross-platform compatibility
- Performance testing

## Deployment

### Build Configuration

- **iOS**: Bundle identifier, permissions, app store assets
- **Android**: Package name, permissions, play store assets
- **Web**: PWA capabilities, favicon, manifest

### CI/CD Pipeline

- Automated testing
- Build generation
- Store submission
- Version management

## Future Enhancements

### Features

- [ ] Real speech recognition integration
- [ ] Cloud-based AI responses
- [ ] User authentication
- [ ] Message persistence
- [ ] Voice training/customization
- [ ] Multiple language support

### Technical

- [ ] Performance monitoring
- [ ] Crash reporting
- [ ] Analytics integration
- [ ] Push notifications
- [ ] Offline capabilities
- [ ] Background processing

---

**Last Updated**: Development Phase Complete
**Version**: 1.0.0
**Status**: Ready for Testing
