import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Container,
  Grid,
  GridItem,
  Box,
  Text,
  Button,
  Input,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { getSong } from '../lyrics';
import LyricsComponent from './LyricsComponent';
import FestiveModal from './FestiveModal';
import Sidebar from './Sidebar';
import HardcorePromptModal from './HardcorePromptModal';
import {
  NORMAL_VICTORY_BASE_POINTS,
  HARDCORE_VICTORY_BONUS,
  useColors,
} from '../constants';
import InfoModal from './InfoModal';
import Header from './Header';
import { useTranslation } from 'react-i18next';

const App = () => {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  // États principaux
  const [song, setSong] = useState(null);
  const [inputWord, setInputWord] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [showVictory, setShowVictory] = useState(false);
  const [showAllSong, setShowAllSong] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessList, setGuessList] = useState([]);
  const [index, setIndex] = useState(null);
  const [guessFeedback, setGuessFeedback] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [foundSongs, setFoundSongs] = useState({});
  const [autoplay, setAutoplay] = useState(false);
  // Game state et mode
  const [gameState, setGameState] = useState("");
  const [gameMode, setGameMode] = useState("");
  const [showHardcorePrompt, setShowHardcorePrompt] = useState(false);
  const [trophies, setTrophies] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sideBarLoading, setSideBarLoading] = useState(false);
  const [inProgressSongs, setInProgressSongs] = useState([]);

  // États et refs pour la reconnaissance vocale
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // Pour éviter de renvoyer plusieurs fois le même mot, on garde en mémoire ceux déjà traités
  const recognizedWordsRef = useRef([]);


  useEffect(() => {
    const userLang = navigator.language || navigator.userLanguage;
    i18n.changeLanguage(userLang.startsWith("fr") ? "fr" : "en");
  }, []);

  // Chargement initial depuis le localStorage
  useEffect(() => {
    const storedGameMode = localStorage.getItem('paroldle_gameMode');
    if (storedGameMode) {
      setGameMode(storedGameMode);
      setGameState(storedGameMode === "NOPLP" ? "guessing_hardcore" : "guessing_normal");
    }
    const storedAutoplay = localStorage.getItem('paroldle_autoplay');
    if (storedAutoplay) {
      setAutoplay(storedAutoplay === 'true');
    }
    const storedTrophies = localStorage.getItem('paroldle_trophies');
    if (storedTrophies) {
      setTrophies(parseInt(storedTrophies, 10));
    }
  }, []);

  // Chargement/sauvegarde en fonction du gameMode
  useEffect(() => {
    if (gameMode === "") return;
    localStorage.setItem('paroldle_gameMode', gameMode);

    const storedInProgressSongs = localStorage.getItem(`paroldle_${gameMode}_inProgressSongs`);
    setInProgressSongs(storedInProgressSongs ? JSON.parse(storedInProgressSongs) : []);

    const storedFoundSongs = localStorage.getItem(`paroldle_${gameMode}_foundSongs`);
    setFoundSongs(storedFoundSongs ? JSON.parse(storedFoundSongs) : {});

    const storedIndex = localStorage.getItem(`paroldle_${gameMode}_index`);
    if (storedIndex && !isNaN(parseInt(storedIndex))) {
      const i = parseInt(storedIndex);
      setIndex(i);

      const storedGuessList = localStorage.getItem(`paroldle_${gameMode}_guessList_${storedIndex}`);
      setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);
      const storedGameState = localStorage.getItem(`paroldle_${gameMode}_gameState_${storedIndex}`);
      setGameState(storedGameState || (gameMode === "NOPLP" ? "guessing_hardcore" : "guessing_normal"));
    } else {
      setIndex(null);
      setGameState("");
      setGuessList([]);
    }
    setSideBarLoading(false);
  }, [gameMode]);

  useEffect(() => {
    if (index == null || gameMode === "") return;

    localStorage.setItem(`paroldle_${gameMode}_index`, index);
    const storedGuessList = localStorage.getItem(`paroldle_${gameMode}_guessList_${index}`);
    setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);
    const storedGameState = localStorage.getItem(`paroldle_${gameMode}_gameState_${index}`);
    setGameState(storedGameState || (gameMode === "NOPLP" ? "guessing_hardcore" : "guessing_normal"));
    setShowAllSong(false);
    setIsReady(false);
    setGuess('');
    setLastWord('');
    setSong(null);
    getSong(index).then((data) => {
      setSong(data);
    });
  }, [index]);

  useEffect(() => {
    if (index == null || gameMode === "" || !song) return;
    localStorage.setItem(`paroldle_${gameMode}_guessList_${index}`, JSON.stringify(guessList));
  }, [guessList]);

  useEffect(() => {
    if (gameMode === "") return;
    localStorage.setItem(`paroldle_${gameMode}_foundSongs`, JSON.stringify(foundSongs));
  }, [foundSongs]);

  useEffect(() => {
    if (gameMode === "") return;
    localStorage.setItem(`paroldle_${gameMode}_inProgressSongs`, JSON.stringify(inProgressSongs));
  }, [inProgressSongs]);

  useEffect(() => {
    localStorage.setItem('paroldle_autoplay', autoplay);
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('paroldle_trophies', trophies);
  }, [trophies]);

  useEffect(() => {
    if (index == null) return;
    if (gameMode === "") return;
    localStorage.setItem(`paroldle_${gameMode}_gameState_${index}`, gameState);
  }, [gameState]);

  useEffect(() => {
    if (!isReady || !song || index === null || gameMode === "") return;
    setFoundSongs((prev) => {
      if (gameMode === "classic") {
        if (gameState === "victory_normal" && !Object.hasOwn(prev, index)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + NORMAL_VICTORY_BASE_POINTS);
          setShowHardcorePrompt(true);
          setInProgressSongs((prev) => prev.filter((i) => i !== index));
          return { ...prev, [index]: "normal" };
        } else if (gameState === "victory_hardcore" && prev[index] === "normal") {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + HARDCORE_VICTORY_BONUS);
          setInProgressSongs((prev) => prev.filter((i) => i !== index));
          return { ...prev, [index]: "hardcore" };
        } else if (gameState === "abandonned_normal" && !Object.hasOwn(prev, index)) {
          setInProgressSongs((prev) => prev.filter((i) => i !== index));
          return { ...prev, [index]: "abandonned" };
        } else if (gameState === "abandonned_hardcore" && prev[index] === "normal") {
          setInProgressSongs((prev) => prev.filter((i) => i !== index));
          return prev;
        } else if (gameState === "guessing_hardcore") {
          setInProgressSongs((prev) => [...prev, index]);
          return prev;
        }
      } else if (gameMode === "NOPLP") {
        if (gameState === "victory_hardcore" && !Object.hasOwn(prev, index)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + HARDCORE_VICTORY_BONUS);
          setInProgressSongs((prev) => prev.filter((i) => i !== index));
          return { ...prev, [index]: "hardcore" };
        }
      }
      return prev;
    });
  }, [gameState]);

  // Fonction pour traiter un mot reconnu par la voix (similaire à handleClickEnter)
  const handleVoiceGuess = useCallback((voiceWord) => {
    const trimmed = voiceWord.trim();
    if (trimmed && trimmed !== guess) {
      if (!inProgressSongs.includes(index) && gameState.startsWith("guessing")) {
        setInProgressSongs((prev) => [...prev, index]);
      }
      // Ajoute directement le mot à la liste s'il n'est pas déjà présent
      setGuessList((prev) => {
        if (prev.includes(trimmed)) return prev;
        return [trimmed, ...prev];
      });
      setGuess(trimmed);
      setLastWord(trimmed);
    }
  }, [guess, gameState, inProgressSongs, index]);

  // Fonction appelée lors de la soumission via le champ de texte
  const handleClickEnter = useCallback(() => {
    if (!inputWord) return;
    const trimmed = inputWord.trim();
    if (trimmed && trimmed !== guess) {
      if (trimmed === "sudo reveal") {
        if (gameMode === "NOPLP") {
          setGameState("victory_hardcore");
        } else {
          setGameState("victory_normal");
        }
      } else if (trimmed === "sudo reveal hardcore") {
        setGameState("victory_hardcore");
      } else {
        if (!inProgressSongs.includes(index) && gameState.startsWith("guessing")) {
          setInProgressSongs((prev) => [...prev, index]);
        }
        const parts = trimmed.split(' ');
        parts.forEach((part) => {
          setTimeout(() => {
            setGuessList((prev) => {
              if (prev.includes(part)) return prev;
              return [part, ...prev];
            });
            setGuess(part);
            setLastWord(part);
          }, 0);
        });
      }
    }
    setInputWord('');
  }, [inputWord, guess, gameMode, inProgressSongs, index, gameState]);

  const handleClickShowSong = useCallback(() => {
    if (gameState === "victory_normal" || gameState.startsWith("abandonned")) {
      setShowAllSong((prev) => !prev);
    }
  }, [gameState]);

  const resetDB = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('paroldle_'))
      .forEach((key) => localStorage.removeItem(key));
  };

  const handleAbandon = () => {
    if (gameState === "guessing_normal") {
      setGameState("abandonned_normal");
    } else if (gameState === "guessing_hardcore") {
      setGameState("abandonned_hardcore");
    }
  };

  // --- Intégration de la reconnaissance vocale ---
  // Initialisation unique de l'instance SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = song ? (song.lang === "french" ? "fr-FR" : "en-US") : "fr-FR";
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true; // pour recevoir les résultats au fur et à mesure

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        // Découpe en mots puis découpe les mots contenant un apostrophe
        const rawWords = transcript.split(/\s+/).filter(word => word.length > 0);
        const words = rawWords.flatMap((word) => {
          const match = word.match(/^([^']+)'(.+)$/);
          if (match) {
            if (recognitionRef.current.lang === "en-US") {
              // Si c'est une négation, on ne découpe pas (ex: don't)
              if (word.toLowerCase().includes("n't")) {
                return [word];
              }
              // Sinon, l'apostrophe est attachée au début du second segment
              return [match[1], "'" + match[2]];
            }
            // Pour une autre langue, on attache l'apostrophe au premier segment
            return [match[1] + "'", match[2]];
          }
          return [word];
        });
        // Ne traiter que les nouveaux mots (pour éviter les doublons dus aux mises à jour intermédiaires)
        const newWords = words.filter(word => !recognizedWordsRef.current.includes(word));
        if (newWords.length > 0) {
          newWords.forEach((word) => {
            handleVoiceGuess(word);
          });
          recognizedWordsRef.current = words;
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Erreur de reconnaissance vocale :", event.error);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, handleVoiceGuess]);

  // Mise à jour de l'événement onend selon la valeur de isListening
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }
  }, [isListening]);

  useEffect(() => {
    console.log("song2", song);
    if (recognitionRef.current) {
      recognitionRef.current.lang = song ? (song.lang === "french" ? "fr-FR" : "en-US") : "fr-FR";
    }
  }, [song]);

  // Réinitialise la reconnaissance vocale si l'index ou le gameMode change
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      recognizedWordsRef.current = [];
    }
  }, [index, gameMode]);

  // Fonction pour démarrer/arrêter la reconnaissance vocale
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (!isListening) {
      recognizedWordsRef.current = []; // réinitialisation des mots déjà traités
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
      recognizedWordsRef.current = [];
    }
  }, [isListening]);
  // --- Fin de l'intégration vocale ---

  return (
    <>
      <FestiveModal isOpen={showVictory} onClose={() => setShowVictory(false)} state={gameState} />
      <HardcorePromptModal
        isOpen={showHardcorePrompt}
        onConfirm={() => {
          setGameState("guessing_hardcore");
          setShowHardcorePrompt(false);
        }}
        onDecline={() => {
          setShowHardcorePrompt(false);
        }}
      />
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        autoplay={autoplay}
        setAutoplay={setAutoplay}
      />

      <Container maxW="full" bg={colors.background} centerContent p="10" minH="100vh">
        <Grid templateColumns="1fr 4fr" gap={6} w="full" mt={5} alignItems="stretch">
          <GridItem>
            <Sidebar
              index={index}
              guessList={guessList}
              setIndex={setIndex}
              foundSongs={foundSongs}
              trophies={trophies}
              setGameMode={setGameMode}
              sideBarLoading={sideBarLoading}
              setSideBarLoading={setSideBarLoading}
              inProgressSongs={inProgressSongs}
            />
          </GridItem>
          <GridItem>
            {/* Conteneur principal */}
            <Box
              bg={colors.primary}
              p="4"
              borderRadius="3xl"
              shadow="md"
              h="100%"
              minH="600px"
            >
              <Header
                onInfoClick={() => setShowInfoModal(true)}
                trophies={trophies}
                setAutoplay={setAutoplay}
                autoplay={autoplay}
              />

              {/* Barre de recherche sticky */}
              <Box
                position="sticky"
                top="0"
                zIndex={1000}
                bg={colors.primary}
                p="4"
              >
                <HStack spacing={4}>
                  {/* Bouton micro cliquable */}
                  <IconButton
                    icon={isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    bgColor={colors.pinkButtonBg}
                    _hover={{ bgColor: colors.pinkButtonBgHover }}
                    onClick={toggleListening}
                    title={isListening ? t("Click to stop singing") : t("Click to sing the song")}
                  >
                  </IconButton>
                  <Input
                    placeholder={lastWord}
                    maxW={300}
                    colorScheme="pink"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleClickEnter();
                    }}
                  />
                  <Button
                    bgColor={colors.pinkButtonBg}
                    _hover={{ bgColor: colors.pinkButtonBgHover }}
                    onClick={handleClickEnter}
                    mr={2}
                  >
                    {t("Try")}
                  </Button>
                  {((gameState === "guessing_normal" || gameState === "guessing_hardcore") && gameMode !== "NOPLP") && (
                    <Button
                      bgColor={colors.orangeButtonBg}
                      _hover={{ bgColor: colors.orangeButtonBgHover }}
                      onClick={handleAbandon}
                    >
                      {t("Give up")}
                      {gameState === "guessing_hardcore" ? " " + t("Hardcore") : ""}
                    </Button>
                  )}
                  {gameState === "victory_normal" && (
                    <Button
                      bgColor={colors.blueButtonBg}
                      onClick={() => setShowHardcorePrompt(true)}
                      _hover={{ bgColor: colors.blueButtonBgHover }}
                    >
                      {t("Let's go Hardcore")}
                    </Button>
                  )}
                  {guessList.length > 0 && (
                    <Text>
                      {guessFeedback.perfect_match > 0 || guessFeedback.partial_match > 0
                        ? '🟩'.repeat(guessFeedback.perfect_match) +
                        '🟧'.repeat(guessFeedback.partial_match)
                        : '🟥'}
                    </Text>
                  )}
                  {(gameState === "victory_normal" || gameState.startsWith("abandonned")) &&
                    (showAllSong ? (
                      <ViewOffIcon boxSize={7} onClick={handleClickShowSong} cursor="pointer" />
                    ) : (
                      <ViewIcon boxSize={7} onClick={handleClickShowSong} cursor="pointer" />
                    ))
                  }
                </HStack>
              </Box>

              {/* Contenu défilable */}
              <Box
                bg={colors.lyricsBg}
                p="4"
                borderRadius="md"
                boxShadow="inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(255,255,255,0.7)"
              >
                <LyricsComponent
                  song={song}
                  index={index}
                  gameState={gameState}
                  gameMode={gameMode}
                  setGameState={setGameState}
                  guess={guess}
                  setGuess={setGuess}
                  showAllSong={showAllSong}
                  setGuessFeedback={setGuessFeedback}
                  isReady={isReady}
                  setIsReady={setIsReady}
                  autoplay={autoplay}
                  trophies={trophies}
                  setTrophies={setTrophies}
                />
              </Box>
            </Box>
          </GridItem>
        </Grid>
        <Box mt={4}>
          <Button colorScheme="red" onClick={resetDB}>
            {t("Reset DB")}
          </Button>
        </Box>
        <footer>
          <Text textAlign="center" mt={4} color="white" mb={5}>
            © 2024 Paroldle.{" "}{t("Made with ❤️ for Charline")}
          </Text>
        </footer>
      </Container>
    </>
  );
};

export default App;
