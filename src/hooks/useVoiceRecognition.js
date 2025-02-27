import { useRef, useState, useEffect, useCallback } from 'react';

const useVoiceRecognition = ({ onResult, lang }) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognizedWordsRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = lang || 'fr-FR';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Découpage en mots et gestion de l'apostrophe
      const rawWords = transcript.split(/\s+/).filter(word => word.length > 0);
      const words = rawWords.flatMap((word) => {
        const match = word.match(/^([^']+)'(.+)$/);
        if (match) {
          if (recognitionRef.current.lang === "en-US") {
            if (word.toLowerCase().includes("n't")) {
              return [word];
            }
            return [match[1], "'" + match[2]];
          }
          return [match[1] + "'", match[2]];
        }
        return [word];
      });
      const newWords = words.filter(word => !recognizedWordsRef.current.includes(word));
      if (newWords.length > 0) {
        newWords.forEach((word) => {
          onResult(word);
        });
        recognizedWordsRef.current = words;
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Erreur de reconnaissance vocale :", event.error);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start();
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang, onResult, isListening]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (!isListening) {
      recognizedWordsRef.current = [];
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
      recognizedWordsRef.current = [];
    }
  }, [isListening]);

  return { isListening, toggleListening };
};

export default useVoiceRecognition;
