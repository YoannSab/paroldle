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
import { NORMAL_VICTORY_BASE_POINTS, HARDCORE_VICTORY_BONUS } from '../constants';
import InfoModal from './InfoModal';
import Header from './Header';
import { useTranslation } from 'react-i18next';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import DBManager from './DBManager';
import useColors from '../hooks/useColors';
import FirebaseSignalingModal from './FirebaseSignalingModal';
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import TieRequestDialog from './TieRequestDialog';

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
  const [gameState, setGameState] = useState("");
  const [gameMode, setGameMode] = useState(""); // classic, NOPLP, battle
  const [showHardcorePrompt, setShowHardcorePrompt] = useState(false);
  const [trophies, setTrophies] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sideBarLoading, setSideBarLoading] = useState(false);
  const [inProgressSongs, setInProgressSongs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(isConnected);
  const indexRef = useRef(index);
  const guessListRef = useRef(guessList);
  const gameModeRef = useRef(gameMode);

  const [myGuess, setMyGuess] = useState("");

  const [roomPlayers, setRoomPlayers] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [otherPlayersInfo, setOtherPlayersInfo] = useState({});
  // États pour la connexion RTC
  const [rtcModalOpen, setRtcModalOpen] = useState(false);
  const [sendToPlayers, setSendToPlayers] = useState(null);

  const [battleState, setBattleState] = useState("waiting");
  const [battleStartTime, setBattleStartTime] = useState(null);
  const [fightIndex, setFightIndex] = useState(null);
  const [wantsTie, setWantsTie] = useState(false);
  const [tieRequestOpen, setTieRequestOpen] = useState(false);

  // Définir la langue en fonction du navigateur
  useEffect(() => {
    const userLang = navigator.language || navigator.userLanguage;
    i18n.changeLanguage(userLang.startsWith("fr") ? "fr" : "en");
  }, [i18n]);


  // Chargement initial depuite  le localStorage
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

  // Synchronisation des données en fonction du gameMode
  useEffect(() => {
    if (gameMode === "") return;
    localStorage.setItem('paroldle_gameMode', gameMode);

    const storedFoundSongs = localStorage.getItem(`paroldle_${gameMode}_foundSongs`);
    setFoundSongs(storedFoundSongs ? JSON.parse(storedFoundSongs) : {});

    if (gameMode === "battle") {
      setIndex(null);
      setGameState("guessing_battle");
      
    }
    else {
      setIsReady(false);

      const storedInProgressSongs = localStorage.getItem(`paroldle_${gameMode}_inProgressSongs`);
      setInProgressSongs(storedInProgressSongs ? JSON.parse(storedInProgressSongs) : []);

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
    }
    setIsReady(true);
    setSideBarLoading(false);
  }, [gameMode]);

  useEffect(() => {
    if (index == null || gameModeRef.current === "") return;
    setIsReady(false);
    localStorage.setItem(`paroldle_${gameModeRef.current}_index`, index);
    const storedGuessList = localStorage.getItem(`paroldle_${gameModeRef.current}_guessList_${index}`);
    setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);
    const storedGameState = localStorage.getItem(`paroldle_${gameModeRef.current}_gameState_${index}`);
    setGameState(storedGameState || (gameModeRef.current === "NOPLP" ? "guessing_hardcore" : gameModeRef.current === "battle" ? "guessing_battle" : "guessing_normal"));
    setShowAllSong(false);

    setGuess('');
    setLastWord('');
    setSong(null);
    getSong(index).then((data) => {
      if (!data) {
        setIndex(null);
        setGameState("");
        setGuessList([]);
      }
      else {
        setSong(data);
      }
    });
  }, [index]);

  useEffect(() => {
    if (indexRef.current == null || gameModeRef.current === "") return;
    localStorage.setItem(`paroldle_${gameMode}_guessList_${indexRef.current}`, JSON.stringify(guessList));
  }, [guessList]);

  useEffect(() => {
    if (gameModeRef.current === "") return;
    localStorage.setItem(`paroldle_${gameModeRef.current}_foundSongs`, JSON.stringify(foundSongs));
  }, [foundSongs]);

  useEffect(() => {
    if (gameModeRef.current === "") return;
    localStorage.setItem(`paroldle_${gameModeRef.current}_inProgressSongs`, JSON.stringify(inProgressSongs));
  }, [inProgressSongs]);

  useEffect(() => {
    localStorage.setItem('paroldle_autoplay', autoplay);
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('paroldle_trophies', trophies);
  }, [trophies]);

  useEffect(() => {
    if (indexRef.current == null || gameMode === "") return;
    localStorage.setItem(`paroldle_${gameModeRef.current}_gameState_${indexRef.current}`, gameState);
  }, [gameState]);

  // Mise à jour de foundSongs selon le gameState
  useEffect(() => {
    if (!isReady || !song || index === null || gameModeRef.current === "") return;
    setFoundSongs((prev) => {
      if (gameModeRef.current === "classic") {
        if (gameState === "victory_normal" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + NORMAL_VICTORY_BASE_POINTS);
          setShowHardcorePrompt(true);
          setInProgressSongs((prev) => prev.filter((i) => i !== indexRef.current));
          return { ...prev, [indexRef.current]: "normal" };
        } else if (gameState === "victory_hardcore" && prev[indexRef.current] === "normal") {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + HARDCORE_VICTORY_BONUS);
          setInProgressSongs((prev) => prev.filter((i) => i !== indexRef.current));
          return { ...prev, [indexRef.current]: "hardcore" };
        } else if (gameState === "abandonned_normal" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          setInProgressSongs((prev) => prev.filter((i) => i !== indexRef.current));
          return { ...prev, [indexRef.current]: "abandonned" };
        } else if (gameState === "abandonned_hardcore" && prev[indexRef.current] === "normal") {
          setInProgressSongs((prev) => prev.filter((i) => i !== indexRef.current));
          return prev;
        } else if (gameState === "guessing_hardcore") {
          setInProgressSongs((prev) => [...prev, indexRef.current]);
          return prev;
        }
      } else if (gameModeRef.current === "NOPLP") {
        if (gameState === "victory_hardcore" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + HARDCORE_VICTORY_BONUS);
          setInProgressSongs((prev) => prev.filter((i) => i !== indexRef.current));
          return { ...prev, [indexRef.current]: "hardcore" };
        }
      } else if (gameModeRef.current === "battle") {
        if (gameState === "victory_battle" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + NORMAL_VICTORY_BASE_POINTS);
          return { ...prev, [indexRef.current]: {status: "victory", winner: playerName, players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")]} };
        }
        else if (gameState.startsWith("defeat_battle") && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => Math.max(0, prevTrophies - NORMAL_VICTORY_BASE_POINTS));
          const winner = gameState.split("_")[2];
          return { ...prev, [indexRef.current]: {status: "defeat", winner: winner, players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")]} };
        }
        else if (gameState === "tie_battle" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          return { ...prev, [indexRef.current]: {status: "tie", players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")]} };
        }
      }
      return prev;
    });
  }, [gameState]);

  // Gestion du mot reconnu par la voix
  const handleVoiceGuess = useCallback((voiceWord) => {
    const trimmed = voiceWord.trim();
    if (trimmed && trimmed !== guess) {
      if (!inProgressSongs.includes(index) && gameState.startsWith("guessing")) {
        setInProgressSongs((prev) => [...prev, index]);
      }
      setGuessList((prev) => {
        if (prev.includes(trimmed)) return prev;
        return [trimmed, ...prev];
      });
      setGuess(trimmed);
      setLastWord(trimmed);
    }
  }, [guess, gameState, inProgressSongs, index]);

  // Utilisation du hook de reconnaissance vocale
  const { isListening, toggleListening } = useVoiceRecognition({
    onResult: handleVoiceGuess,
    lang: song ? (song.lang === "french" ? "fr-FR" : "en-US") : "fr-FR"
  });

  // Gestion de la soumission par champ texte
  const handleClickEnter = useCallback(() => {
    if (!inputWord) return;
    const trimmed = inputWord.trim();
    if (trimmed && trimmed !== guess) {
      if (trimmed === "sudo reveal") {
        if (gameModeRef.current === "NOPLP") {
          setGameState("victory_hardcore");
        } else if (gameModeRef.current === "battle") {
          setGameState("victory_battle");
        } else {
          setGameState("victory_normal");
        }
      } else if (trimmed === "sudo reveal hardcore") {
        setGameState("victory_hardcore");
      } else {
        if (!inProgressSongs.includes(indexRef.current) && gameState.startsWith("guessing")) {
          setInProgressSongs((prev) => [...prev, indexRef.current]);
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
            setMyGuess(part);

            if (isConnected) {
              sendToPlayers(JSON.stringify({ guess: part, index: indexRef.current }));
            }
          }, 0);
        });
      }
    }
    setInputWord('');
  }, [inputWord, guess, inProgressSongs, gameState, sendToPlayers]);

  const handleClickShowSong = useCallback(() => {
    if (!gameState.startsWith("guessing")) {
      setShowAllSong((prev) => !prev);
    }
  }, [gameState]);

  const handleAbandon = () => {
    if (gameState === "guessing_normal") {
      setGameState("abandonned_normal");
    } else if (gameState === "guessing_hardcore") {
      setGameState("abandonned_hardcore");
    }
  };

  // Callbacks pour RTC multi-peer
  const handleRtcConnected = useCallback((sendFn) => {
    setSendToPlayers(() => sendFn);
  }, []);

  const handleRtcDisconnected = useCallback(() => {
    setSendToPlayers(null);
    setOtherPlayersInfo({});
  }, []);

  const handleRtcMessage = useCallback((data) => {
    if (isConnectedRef.current && data.type === "game_data") {
      const sender = data.sender;
      const jsonData = JSON.parse(data.text);
      if (jsonData.songIndex !== undefined && jsonData.startTime) {
        if (data.gameMode === gameModeRef.current) {
          setFightIndex(jsonData.songIndex);
          setBattleStartTime(jsonData.startTime);
        }
      }
      else if (jsonData.songResult) {
        if (data.gameMode === gameModeRef.current) {
          if (jsonData.songResult === "victory") {
            setGameState("defeat_battle_" + sender);
          }
        }
      }
      else if (jsonData.wantsTie) {
        if (data.gameMode === gameModeRef.current && !wantsTie) {
          setTieRequestOpen(true);
        }
      }
      else if (jsonData.guess) {
        if (jsonData.index === indexRef.current && data.gameMode === gameModeRef.current && gameModeRef.current !== "battle") {
          setGuessList((prev) => {
            if (prev.includes(jsonData.guess)) return prev;
            setGuess(jsonData.guess);
            return [jsonData.guess, ...prev];
          }
          );
          setOtherPlayersInfo((prev) => {
            if (Object.hasOwn(prev, sender)) {
              return { ...prev, [sender]: { ...prev[sender], guess: jsonData.guess } };
            }
            return prev;
          });
        }
      }
      else if (jsonData.guessList && jsonData.index === indexRef.current) {
        jsonData.guessList.forEach((guess) => {
          setTimeout(() => {
            setGuessList((prev) => {
              if (prev.includes(guess)) return prev;
              setGuess(guess);
              return [guess, ...prev];
            }
            );
          }, 0);
        });
      }
    }
  }, [wantsTie]);

  useEffect(() => {
    if (wantsTie) {
      // do all other players want a tie?
      const allPlayers = Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting");
      if (allPlayers.length !== 0) {
        const allWantTie = allPlayers.every((player) => otherPlayersInfo[player]?.wantsTie === true);
        if (allWantTie) {
          setGameState("tie_battle");
        }
      }
    }
  }, [wantsTie, otherPlayersInfo]);

  useEffect(() => {
    if (isConnected && roomId && playerName) {

      const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
      update(playerRef, { battleState: battleState });

    }
  }, [battleState, isConnected]);

  useEffect(() => {
    if (isConnected && roomId && playerName) {
      const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
      update(playerRef, { wantsTie: wantsTie });
    }
  }, [wantsTie, isConnected]);

  const handleSendGuessList = useCallback((player) => {
    if (otherPlayersInfo[player].sendFunc) {
      otherPlayersInfo[player].sendFunc(JSON.stringify({ guessList: guessListRef.current, index: indexRef.current }));
    }
  }, [otherPlayersInfo]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }
    , [isConnected]);

  useEffect(() => {
    indexRef.current = index;
  }
    , [index]);

  useEffect(() => {
    guessListRef.current = guessList;
  }
    , [guessList]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }
    , [gameMode]);

  return (
    <>
      <TieRequestDialog
        isOpen={tieRequestOpen}
        onClose={() => setTieRequestOpen(false)}
        onAccept={() => {
          setWantsTie(true);
          setTieRequestOpen(false);
        }}
      />

      <FirebaseSignalingModal
        isOpen={rtcModalOpen}
        onClose={() => setRtcModalOpen(false)}
        onConnected={handleRtcConnected}
        onDisconnected={handleRtcDisconnected}
        onMessage={handleRtcMessage}
        roomPlayers={roomPlayers}
        setRoomPlayers={setRoomPlayers}
        playerName={playerName}
        setPlayerName={setPlayerName}
        setOtherPlayersInfo={setOtherPlayersInfo}
        song={song}
        gameMode={gameMode}
        gameModeRef={gameModeRef}
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        roomId={roomId}
        setRoomId={setRoomId}
      />
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
              gameMode={gameMode}
              sideBarLoading={sideBarLoading}
              setSideBarLoading={setSideBarLoading}
              inProgressSongs={inProgressSongs}
              isConnected={isConnected}
              roomPlayers={roomPlayers}
              otherPlayersInfo={otherPlayersInfo}
              setRtcModalOpen={setRtcModalOpen}
              playerName={playerName}
              sendGuessListCallback={handleSendGuessList}
              setIsReady={setIsReady}
              battleState={battleState}
              setBattleState={setBattleState}
              guess={myGuess}
              battleStartTime={battleStartTime}
              setBattleStartTime={setBattleStartTime}
              fightIndex={fightIndex}
              setFightIndex={setFightIndex}
              gameState={gameState}
              setWantsTie={setWantsTie}
              roomId={roomId}

            />
          </GridItem>
          <GridItem>
            <Box bg={colors.primary} p="4" borderRadius="3xl" shadow="md" h="100%" minH="600px">
              <Header
                onInfoClick={() => setShowInfoModal(true)}
                trophies={trophies}
                setAutoplay={setAutoplay}
                autoplay={autoplay}
              />

              <Box position="sticky" top="0" zIndex={1000} bg={colors.primary} p="4">
                <HStack spacing={4}>
                  <IconButton
                    icon={isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    bgColor={colors.pinkButtonBg}
                    _hover={{ bgColor: colors.pinkButtonBgHover }}
                    onClick={toggleListening}
                    title={(window.SpeechRecognition || window.webkitSpeechRecognition)
                      ? isListening ? t("Click to stop singing") : t("Click to sing the song")
                      : t("Voice recognition not supported")}
                    disabled={!(window.SpeechRecognition || window.webkitSpeechRecognition)}
                  />
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
                      {t("Give up")} {gameState === "guessing_hardcore" ? " " + t("Hardcore") : ""}
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
                  {!gameState.startsWith("guessing") && gameState && 
                    (showAllSong ? (
                      <ViewOffIcon boxSize={7} onClick={handleClickShowSong} cursor="pointer" />
                    ) : (
                      <ViewIcon boxSize={7} onClick={handleClickShowSong} cursor="pointer" />
                    ))
                  }
                </HStack>
              </Box>
              <Box bg={colors.lyricsBg} p="4" borderRadius="md" boxShadow="inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(255,255,255,0.7)">
                <LyricsComponent
                  song={song}
                  index={index}
                  gameState={gameState}
                  gameMode={gameMode}
                  gameModeRef={gameModeRef}
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
          <DBManager />
        </Box>
        <footer>
          <Text textAlign="center" mt={4} color="white" mb={5}>
            © 2024 Paroldle. {t("Made with ❤️ for Charline")}
          </Text>
        </footer>
      </Container>
    </>
  );
};

export default App;