import React from 'react';
import { useSession } from './hooks/useSession';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { ConversationScreen } from './screens/ConversationScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { AppHeader } from './components/AppHeader';

export function App() {
  const session = useSession();

  switch (session.phase) {
    case 'welcome':
      return (
        <WelcomeScreen
          onStart={session.startSession}
          onSubmitFeedback={session.submitDirectFeedback}
        />
      );

    case 'conversation':
      return (
        <div className="min-h-screen flex flex-col bg-[#FAF9F7]">
          <AppHeader anchorName={session.anchorName} sessionId={session.sessionId} variant="light" />
          <div className="flex-1 flex flex-col">
            <ConversationScreen
              transcript={session.transcript}
              recordingStatus={session.recordingStatus}
              elapsedSeconds={session.elapsedSeconds}
              onStartRecording={session.startRecording}
              onStopRecording={session.stopRecording}
              onUpdateTranscript={session.updateTranscript}
              onSubmit={session.submitFeedback}
              onCancel={session.cancelSession}
            />
          </div>
        </div>
      );

    case 'processing':
      return (
        <div className="min-h-screen flex flex-col bg-[#FAF9F7]">
          <AppHeader anchorName={session.anchorName} sessionId={session.sessionId} variant="light" />
          <div className="flex-1 flex flex-col">
            <ProcessingScreen stages={session.processingStages} />
          </div>
        </div>
      );

    case 'review':
      return session.feedback ? (
        <div className="min-h-screen flex flex-col bg-[#FAF9F7]">
          <AppHeader anchorName={session.anchorName} sessionId={session.sessionId} variant="light" />
          <div className="flex-1 flex flex-col">
            <ReviewScreen
              feedback={session.feedback}
              onUpdate={session.updateFeedback}
              onSubmit={session.submitToFirebase}
              onBack={session.backToConversation}
            />
          </div>
        </div>
      ) : null;

    case 'success':
      return (
        <SuccessScreen
          sessionId={session.sessionId}
          anchorName={session.anchorName}
          submitResult={session.submitResult}
          onStartNew={session.startNewConversation}
        />
      );

    case 'error':
      return (
        <ErrorScreen
          errorMessage={session.errorMessage}
          onRetry={session.retrySubmit}
          onBack={session.backToConversation}
          onCancel={session.cancelSession}
        />
      );

    default:
      return (
        <WelcomeScreen
          onStart={session.startSession}
          onSubmitFeedback={session.submitDirectFeedback}
        />
      );
  }
}

export default App;
