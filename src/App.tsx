import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import DefaultExport from 'module-name';
import App from './App';

function App(): boolean {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup media stream on component unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          setIsLoading(true);
          const response = await fetch(process.env.REACT_APP_API_ENDPOINT + '/process-audio', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }

          const data = await response.json();
          setResponse(data.response);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Error processing audio');
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      setError('Error accessing microphone. Please check permissions.');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div>className) = "app-container" >
<div className="app-container">
  <h1>Voice Assistant</h1>

  <div className="controls">
    <button
      onClick={handleButtonClick}
      className={isRecording ? 'recording' : ''}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
    </button>

    {isRecording && (
      <div className="recording-indicator"></div>
    )}
  </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {response && (
        <div className="response-container">
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}

      <style>{`
        .app-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .recording { background-color: #ff4444; }
        .recording-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: red;
          animation: pulse 1s infinite;
        }
        .error-message {
          color: #ff4444;
          margin: 1rem 0;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

