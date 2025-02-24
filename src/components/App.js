import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Grid,
  GridItem,
  Box,
  Heading,
  Text,
  Button,
  Input,
  HStack,
} from '@chakra-ui/react';
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

const App = () => {
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
  // Nouvel état pour l'ID de la vidéo 
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [autoplay, setAutoplay] = useState(false);
  // Remplacement de victory et gameMode par un seul état gameState
  // Valeurs possibles : "guessing_normal", "victory_normal", "guessing_hardcore", "victory_hardcore", "abandonned_normal", "abandonned_hardcore"
  const [gameState, setGameState] = useState("");
  // État pour le mode de jeu
  // Valeurs possibles : "classic", "NOPLP"
  const [gameMode, setGameMode] = useState("");
  // Modal pour demander le passage en mode hardcore
  const [showHardcorePrompt, setShowHardcorePrompt] = useState(false);
  // État pour les trophées
  const [trophies, setTrophies] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sideBarLoading, setSideBarLoading] = useState(false);
  const [inProgressSongs, setInProgressSongs] = useState([]);

  useEffect(() => {
    const storedGameMode = localStorage.getItem('paroldle_gameMode');
    if (storedGameMode) {
      setGameMode(storedGameMode);
      setGameState(gameMode === "NOPLP" ? "guessing_hardcore" : "guessing_normal");
    }
    const storedAutoplay = localStorage.getItem('paroldle_autoplay');
    if (storedAutoplay) {
      setAutoplay(storedAutoplay === 'true');
    }
    const storedTrophies = localStorage.getItem('paroldle_trophies');
    if (storedTrophies) {
      setTrophies(parseInt(storedTrophies, 10));
    }
  }
    , []);

  // (Les useEffect pour le chargement et la sauvegarde restent inchangés)
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
      // if (storedGuessList && storedGuessList.length > 0 && !Object.hasOwn(foundSongs, i) && !inProgressSongs.includes(i)) {
      //   setInProgressSongs((prev) => [...prev, parseInt(storedIndex)]);
      // }

      const storedGameState = localStorage.getItem(`paroldle_${gameMode}_gameState_${storedIndex}`);
      setGameState(storedGameState || (gameMode === "NOPLP" ? "guessing_hardcore" : "guessing_normal"));
      // eslint-disable-next-line
    } else {
      setIndex(null);
      setGameState("");
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
    setYoutubeVideoId(null);

    // eslint-disable-next-line
  }, [index]);

  useEffect(() => {
    if (index == null || gameMode === "" || !song) return;
    localStorage.setItem(`paroldle_${gameMode}_guessList_${index}`, JSON.stringify(guessList));
    // eslint-disable-next-line
  }, [guessList]);

  useEffect(() => {
    if (gameMode === "") return;
    localStorage.setItem(`paroldle_${gameMode}_foundSongs`, JSON.stringify(foundSongs));
  }, [foundSongs]);

  useEffect(() => {
    if (gameMode === "") return;
    localStorage.setItem(`paroldle_${gameMode}_inProgressSongs`, JSON.stringify(inProgressSongs));
  }
    , [inProgressSongs]);

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
    if ((gameState.startsWith("victory") || gameState.startsWith("abandonned")) && song && song.index === index) {
      const storedYoutubeId = localStorage.getItem(`paroldle_youtube_${index}`);
      if (storedYoutubeId) {
        setYoutubeVideoId(storedYoutubeId);
        return;
      }
      const API_KEY = "AIzaSyCFkGm1OgvtT61t7PIdM2k3vSMU9mFkbFk";
      const query = encodeURIComponent(`${song.title} ${song.author || ''}`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${query}&key=${API_KEY}`;
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            setYoutubeVideoId(videoId);
            localStorage.setItem(`paroldle_youtube_${index}`, videoId);
          }
        })
        .catch(err => console.error("Erreur lors de la recherche YouTube:", err));
    }
  }, [song, gameState, index]);

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
        if (!inProgressSongs.includes(index)) {
          setInProgressSongs((prev) => [...prev, index]);
        }
        const parts = trimmed.split(' ');
        parts.forEach((part) => {
          setTimeout(() => {
            setGuess(part);
            setLastWord(part);
            setGuessList((prev) => [part, ...prev]);
          }, 0);
        });
      }
    }
    setInputWord('');
  }, [inputWord, guess]);

  const handleClickShowSong = useCallback(() => {
    if ((gameState === "victory_normal" || gameState.startsWith("abandonned"))) {
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

              {/* Conteneur de la barre de recherche sticky */}
              <Box
                position="sticky"
                top="0"
                zIndex={1000}
                bg={colors.primary}
                p="4"
              >
                <HStack spacing={4}>
                  <Heading size="lg">🎤</Heading>
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
                    Essai
                  </Button>
                  {((gameState === "guessing_normal" || gameState === "guessing_hardcore") && gameMode !== "NOPLP") && (
                    <Button
                      bgColor={colors.orangeButtonBg}
                      _hover={{ bgColor: colors.orangeButtonBgHover }}
                      onClick={handleAbandon}
                    >
                      Abandon {gameState === "guessing_hardcore" ? "Hardcore" : ""}
                    </Button>
                  )}
                  {gameState === "victory_normal" && (
                    <Button
                      bgColor={colors.blueButtonBg}
                      onClick={() => setShowHardcorePrompt(true)}
                      _hover={{ bgColor: colors.blueButtonBgHover }}
                    >
                      Tenter Hardcore
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
                  youtubeVideoId={youtubeVideoId}
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
            Reset DB
          </Button>
        </Box>
        <footer>
          <Text textAlign="center" mt={4} color="white" mb={5}>
            © 2024 Paroldle. Réalisé avec ❤️ pour Charline.
          </Text>
        </footer>
      </Container>
    </>
  );
};

export default App;
