# WebSocket Integration with Text-to-Speech

This implementation adds WebSocket communication with AI backend and text-to-speech functionality to the existing voice recording application.

## Features Implemented

### 1. WebSocket Communication
- **Service**: `src/services/websocket.ts`
- **Connection**: Automatically connects to `ws://localhost:8000/ws`
- **Reconnection**: Automatic reconnection with exponential backoff
- **Message Handling**: Processes AI responses with type definitions

### 2. Speech-to-Text
- **Service**: `src/services/speechToText.ts`
- **Browser API**: Uses Web Speech API for real-time transcription
- **Fallback**: Simulated transcription for audio blob processing
- **Error Handling**: Graceful fallback for unsupported browsers

### 3. Text-to-Speech
- **Service**: `src/services/textToSpeech.ts`
- **Browser API**: Uses Web Speech Synthesis API
- **Voice Selection**: Automatically selects best English voice
- **Controls**: Play, pause, resume, stop functionality

### 4. AI Response Handling
- **Service**: `src/services/aiResponse.ts`
- **Response Processing**: Handles AI responses with products and messages
- **TTS Integration**: Automatically speaks AI responses
- **Session Management**: Tracks session IDs

### 5. UI Components

#### ConnectionStatus
- Shows WebSocket connection status
- Visual indicators for connecting, connected, disconnected, error states

#### TTSControls
- Play/pause/resume/stop controls for text-to-speech
- Real-time status updates

#### AIResponse
- Displays AI message with TTS controls
- Shows recommended products in a grid
- Session information display

#### Updated Recording Component
- Added speech-to-text processing
- Transcription preview with error handling
- Visual feedback for processing states

#### Updated Hero Component
- WebSocket connection management
- Complete flow: Recording → Transcription → AI Query → Response → TTS
- Status indicators and error handling
- Reset functionality

## Flow Overview

1. **User Input**: Name and email
2. **Recording**: Voice recording with visual feedback
3. **Transcription**: Audio converted to text
4. **WebSocket Query**: Text sent to AI backend
5. **AI Response**: Backend processes and returns response
6. **Text-to-Speech**: AI message spoken aloud
7. **Product Display**: Recommended products shown with TTS controls

## Technical Details

### WebSocket Message Format
```typescript
// Query
{
  type: 'query',
  data: {
    text: string,
    session_id?: string
  }
}

// Response
{
  type: 'response',
  data: {
    message: string,
    products: Product[],
    session_id: string
  }
}
```

### Error Handling
- WebSocket connection failures
- Speech recognition errors
- TTS synthesis failures
- Network timeouts
- Graceful fallbacks for each service

### Browser Compatibility
- Web Speech API (Chrome, Edge, Safari)
- Web Speech Synthesis API (All modern browsers)
- WebSocket API (All modern browsers)

## Usage

1. Enter name and email
2. Click microphone to start recording
3. Speak your question
4. Wait for transcription
5. AI processes and responds
6. Listen to AI response
7. View recommended products
8. Use TTS controls to replay response

## Development Notes

- All services are modular and testable
- TypeScript types ensure type safety
- Error boundaries prevent crashes
- Responsive design for all screen sizes
- Accessibility features included
