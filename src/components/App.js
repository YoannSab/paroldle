import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
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
import MobileSidebar from './MobileSidebar';

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
import DailyQuiz from './DailyQuiz';
import { generateDateBasedIndex } from '../generate_quiz';

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
  const [gameMode, setGameMode] = useState(""); // daily, classic, NOPLP, battle
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
  const battleStateRef = useRef(battleState);
  const [battleStartTime, setBattleStartTime] = useState(null);
  const [fightIndex, setFightIndex] = useState(null);
  const [wantsTie, setWantsTie] = useState(false);
  const [tieRequestOpen, setTieRequestOpen] = useState(false);
  const storedProfilPicture = localStorage.getItem('paroldle_profilePicture');
  const [selectedImage, setSelectedImage] = useState(storedProfilPicture || 'pdp1');

  const [dailyIndex, setDailyIndex] = useState(null);
  const [dailyScores, setDailyScores] = useState({});
  const [dailySongOrQuiz, setDailySongOrQuiz] = useState("song");
  const [dailyTotalPoints, setDailyTotalPoints] = useState(0);

  localStorage.removeItem("paroldle_activeTab");

  console.log("App Rerendered");

  useEffect(() => {
    const fetchDailyIndex = async () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const storedDailyIndex = localStorage.getItem(`paroldle_daily_index_${todayString}`);
      if (storedDailyIndex) {
        setDailyIndex(parseInt(storedDailyIndex, 10));
        if (gameModeRef.current === "daily") {
          setIndex(parseInt(storedDailyIndex, 10));
        }
      }
      else {
        const index = await generateDateBasedIndex();
        setDailyIndex(index);
        setDailySongOrQuiz("song");
        localStorage.setItem(`paroldle_daily_index_${todayString}`, index);
        if (gameModeRef.current === "daily") {
          setIndex(index);
        }
      }
    };
    fetchDailyIndex();
  }, []);

  useEffect(() => {
    if (dailyIndex === null) return;
    const todayString = new Date().toISOString().split('T')[0];
    Object.keys(localStorage).filter((key) => key.startsWith('paroldle_daily') && !(key.endsWith(todayString) || key.endsWith(dailyIndex)) && !key.endsWith("scores")).forEach((key) => {
      console.log("Removing key", key);
      localStorage.removeItem(key);
    });
  }, [dailyIndex]);

  useEffect(() => {
    Object.keys(localStorage).filter((key) => key.startsWith('paroldle_battle') && !(key.endsWith("foundSongs") || key.endsWith("inProgressSongs"))).forEach((key) => {
      console.log("Removing key", key);
      localStorage.removeItem(key);
    }
    );
  }, []);

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

    const storedDailyScores = localStorage.getItem('paroldle_daily_scores');
    if (storedDailyScores) {
      setDailyScores(JSON.parse(storedDailyScores));
    }
  }, []);

  // Synchronisation des données en fonction du gameMode
  useEffect(() => {
    if (gameMode === "") return;
    setIsReady(false);
    localStorage.setItem('paroldle_gameMode', gameMode);

    const storedFoundSongs = localStorage.getItem(`paroldle_${gameMode}_foundSongs`) || "{}";
    setFoundSongs(storedFoundSongs ? JSON.parse(storedFoundSongs ?? '{}') : {});

    if (gameMode === "battle") {
      setIndex(null);
      setGameState("guessing_normal");
    }
    else if (gameMode !== "daily") {
      const storedInProgressSongs = localStorage.getItem(`paroldle_${gameMode}_inProgressSongs`);
      setInProgressSongs(storedInProgressSongs ? JSON.parse(storedInProgressSongs) : []);

      const storedIndex = localStorage.getItem(`paroldle_${gameMode}_index`);
      if (storedIndex && !isNaN(parseInt(storedIndex))) {
        const i = parseInt(storedIndex);
        setIndex(i);
        // const storedGuessList = localStorage.getItem(`paroldle_${gameMode}_guessList_${storedIndex}`);
        // setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);
        // const storedGameState = localStorage.getItem(`paroldle_${gameMode}_gameState_${storedIndex}`);
        // setGameState(storedGameState || (gameMode === "NOPLP" ? "guessing_hardcore" : "guessing_normal"));
      } else {
        setIndex(null);
        setGameState("");
        setGuessList([]);
      }
    }
    else if (gameMode === "daily") {
      setIndex(dailyIndex);
      const storedDailySongOrQuiz = localStorage.getItem(`paroldle_daily_songOrQuiz`);
      setDailySongOrQuiz(storedDailySongOrQuiz || "song");
      const todayString = new Date().toISOString().split('T')[0];
      const storedTotalPoints = localStorage.getItem(`paroldle_daily_total_points_${todayString}`);
      setDailyTotalPoints(storedTotalPoints ? parseInt(storedTotalPoints, 10) : 0);
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
    setGameState(storedGameState || (gameModeRef.current === "NOPLP" ? "guessing_hardcore" : "guessing_normal"));
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
    if (gameMode === "daily") {
      const todayString = new Date().toISOString().split('T')[0];
      localStorage.setItem(`paroldle_daily_total_points_${todayString}`, dailyTotalPoints);
    }
  }, [dailyTotalPoints]);

  useEffect(() => {
    localStorage.setItem(`paroldle_daily_songOrQuiz`, dailySongOrQuiz);
  }, [dailySongOrQuiz]);

  useEffect(() => {
    localStorage.setItem("paroldle_daily_scores", JSON.stringify(dailyScores));
  }, [dailyScores]);

  useEffect(() => {
    if (indexRef.current === null || gameModeRef.current === "") return;
    // const todayString = new Date().toISOString().split('T')[0];
    // const end = gameModeRef.current === "daily" ? todayString : indexRef.current;
    localStorage.setItem(`paroldle_${gameMode}_guessList_${indexRef.current}`, JSON.stringify(guessList));
  }, [guessList]);

  useEffect(() => {
    if (gameModeRef.current === "" || gameMode === "daily") return;
    localStorage.setItem(`paroldle_${gameModeRef.current}_foundSongs`, JSON.stringify(foundSongs));

  }, [foundSongs]);

  useEffect(() => {
    if (gameModeRef.current === "" || gameMode === "daily") return;
    localStorage.setItem(`paroldle_${gameModeRef.current}_inProgressSongs`, JSON.stringify(inProgressSongs));
  }, [inProgressSongs]);

  useEffect(() => {
    localStorage.setItem('paroldle_autoplay', autoplay);
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('paroldle_trophies', trophies);
  }, [trophies]);

  useEffect(() => {
    if (indexRef.current == null || gameModeRef.current === "") return;
    // const todayString = new Date().toISOString().split('T')[0];
    // const end = gameModeRef.current === "daily" ? todayString : indexRef.current;
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
        if (gameState === "victory_normal" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          setTrophies((prevTrophies) => prevTrophies + NORMAL_VICTORY_BASE_POINTS);
          return { ...prev, [indexRef.current]: { status: "victory", winner: playerName, players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")] } };
        }
        else if (gameState.startsWith("defeat_normal") && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          // setTrophies((prevTrophies) => Math.max(0, prevTrophies - NORMAL_VICTORY_BASE_POINTS));
          const winner = gameState.split("_")[2];
          return { ...prev, [indexRef.current]: { status: "defeat", winner: winner, players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")] } };
        }
        else if (gameState === "tie_normal" && !Object.hasOwn(prev, indexRef.current)) {
          setShowVictory(true);
          return { ...prev, [indexRef.current]: { status: "tie", players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")] } };
        }
      }
      return prev;
    });

    if (gameModeRef.current === "daily") {
      const todayString = new Date().toISOString().split('T')[0];

      if (gameState === "victory_normal" && !Object.hasOwn(dailyScores, todayString)) {
        setShowVictory(true);
        setDailyTotalPoints((prev) => prev + Math.max(0, 200 - guessListRef.current.length));
        setDailyScores((prev) => ({ ...prev, [todayString]: { song: { nGuesses: guessListRef.current.length, status: "victory_normal" } } }));
      }
      else if (gameState === "victory_hardcore" && dailyScores[todayString]?.song?.status === "victory_normal") {
        setShowVictory(true);
        setDailyTotalPoints((prev) => prev + 100);
        setDailyScores((prev) => ({ ...prev, [todayString]: { ...prev[todayString], song: { ...prev[todayString].song, status: "victory_hardcore" } } }));
      }
      else if (gameState === "abandonned_normal") {
        const todayString = new Date().toISOString().split('T')[0];
        setShowVictory(true);
        setDailyScores((prev) => ({ ...prev, [todayString]: { song: { nGuesses: "∞", status: "abandonned" } } }));
      }
    }
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
          setGameState("victory_normal");
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

            if (isConnected && gameModeRef.current !== "battle" && sendToPlayers) {
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

  const sendToBattlePlayers = useCallback((data) => {
    Object.keys(otherPlayersInfo).forEach(player => {
      if ((otherPlayersInfo[player].battleState === "ready" || otherPlayersInfo[player].battleState === "fighting") && otherPlayersInfo[player].sendFunc) {
        otherPlayersInfo[player].sendFunc(data);
      }
    });
  }, [otherPlayersInfo]);

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
            setGameState("defeat_normal_" + sender);
          }
        }
      }
      else if (jsonData.wantsTie) {
        if (data.gameMode === gameModeRef.current && !wantsTie) {
          setTieRequestOpen(true);
        }
      }
      else if (jsonData.foundWords) {
        if (data.gameMode === gameModeRef.current) {
          setOtherPlayersInfo((prev) => {
            if (Object.hasOwn(prev, sender)) {
              return {
                ...prev, [sender]: {
                  ...prev[sender], foundWords:
                  {
                    title: [...(prev[sender].foundWords?.title || []), ...(jsonData.foundWords.title || [])],
                    artist: [...(prev[sender].foundWords?.artist || []), ...(jsonData.foundWords.artist || [])],
                    lyrics: [...(prev[sender].foundWords?.lyrics || []), ...(jsonData.foundWords.lyrics || [])]
                  }
                }
              };
            }
            return prev;
          });
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
          setGameState("tie_normal");
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

  useEffect(() => {
    battleStateRef.current = battleState;
  }
    , [battleState]);

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
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
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

      <MobileSidebar
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
        setOtherPlayersInfo={setOtherPlayersInfo}
        setRtcModalOpen={setRtcModalOpen}
        playerName={playerName}
        sendGuessListCallback={handleSendGuessList}
        setIsReady={setIsReady}
        battleState={battleState}
        setBattleState={setBattleState}
        myGuess={myGuess}
        battleStartTime={battleStartTime}
        setBattleStartTime={setBattleStartTime}
        fightIndex={fightIndex}
        setFightIndex={setFightIndex}
        gameState={gameState}
        setWantsTie={setWantsTie}
        roomId={roomId}
        selectedImage={selectedImage}
        setGameState={setGameState}
        dailyIndex={dailyIndex}
        dailyScores={dailyScores}
        setDailySongOrQuiz={setDailySongOrQuiz}
        dailyTotalPoints={dailyTotalPoints}
      />
      <Container maxW="full" bg={colors.background} centerContent p={{ base: "2", xl: "10" }} minH="100vh">
        <Grid templateColumns={{ base: '1fr', xl: 'repeat(12, 1fr)' }} gap={{ base: 2, xl: 4 }} w="100%">
          {/* Sidebar desktop, affichée uniquement sur écran large */}
          <GridItem colSpan={{ base: 12, xl: 4 }} display={{ base: 'none', xl: 'block' }}>
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
              setOtherPlayersInfo={setOtherPlayersInfo}
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
              selectedImage={selectedImage}
              setGameState={setGameState}
              dailyIndex={dailyIndex}
              dailyScores={dailyScores}
              setDailySongOrQuiz={setDailySongOrQuiz}
              dailyTotalPoints={dailyTotalPoints}
              isMobile={false}
            />
          </GridItem>

          {/* Main content area - full width on mobile */}
          <GridItem colSpan={{ base: 12, xl: 8 }}>
            <Box bg={colors.primary} p={{ base: "2", xl: "4" }} borderRadius="3xl" shadow="xl" h="100%" minH={{ base: "400px", xl: "600px" }}>
              <Header
                onInfoClick={() => setShowInfoModal(true)}
                trophies={trophies}
                setAutoplay={setAutoplay}
                autoplay={autoplay}
              />
              {!(gameMode === "daily" && dailySongOrQuiz === "quiz") && (
                <ControlBar
                  isListening={isListening}
                  toggleListening={toggleListening}
                  inputWord={inputWord}
                  setInputWord={setInputWord}
                  handleClickEnter={handleClickEnter}
                  lastWord={lastWord}
                  guessList={guessList}
                  guessFeedback={guessFeedback}
                  gameState={gameState}
                  gameMode={gameMode}
                  showAllSong={showAllSong}
                  setShowAllSong={setShowAllSong}
                  handleAbandon={handleAbandon}
                  showHardcorePrompt={showHardcorePrompt}
                  setShowHardcorePrompt={setShowHardcorePrompt}
                  handleClickShowSong={handleClickShowSong}
                />
              )}

              <Box
                bg={colors.lyricsBg}
                p={{ base: "2", md: "4" }}
                borderRadius="md"
                boxShadow="inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(255,255,255,0.7)"
                mt={(gameMode === "daily" && dailySongOrQuiz === "quiz") ? 20 : 0}
                fontSize={{ base: "sm", md: "md" }}
              >
                {gameMode === "daily" && dailySongOrQuiz === "quiz" ? (
                  <DailyQuiz
                    songId={dailyIndex}
                    dailyScores={dailyScores}
                    setDailyScores={setDailyScores}
                    totalPoints={dailyTotalPoints}
                    setTotalPoints={setDailyTotalPoints}
                  />
                ) : (
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
                    sendToBattlePlayers={sendToBattlePlayers}
                    otherPlayersInfo={otherPlayersInfo}
                    battleStateRef={battleStateRef}
                  />
                )}
              </Box>
            </Box>
          </GridItem>
        </Grid>

        <Box mt={4}>
          <DBManager />
        </Box>
        <footer>
          <Text textAlign="center" mt={4} color="white" mb={5} fontSize={{ base: "xs", md: "sm" }}>
            © 2024 Paroldle. {t("Made with ❤️ for Charline")}
          </Text>
        </footer>
      </Container>
    </>
  );
};

export default memo(App);

const ControlBar = memo(({ 
  isListening, 
  toggleListening, 
  inputWord, 
  setInputWord, 
  handleClickEnter, 
  lastWord, 
  guessList, 
  guessFeedback, 
  gameState, 
  gameMode, 
  showAllSong, 
  handleClickShowSong,
  handleAbandon, 
  showHardcorePrompt, 
  setShowHardcorePrompt 
}) => {

  const { t } = useTranslation();
  const colors = useColors();


  return (
    <Box position="sticky" top={{ base: 10, xl: 0 }} zIndex={900} bg={colors.primary} p={{ base: "2", xl: "4" }} >
      <HStack spacing={{ base: 2, xl: 4 }} flexWrap="wrap" justifyContent="center">
        <IconButton
          size={{ base: "sm", xl: "md" }}
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
          maxW={{ base: "120px", sm: "200px", xl: "300px" }}
          size={{ base: "sm", xl: "md" }}
          colorScheme="pink"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleClickEnter();
          }}
        />
        <Button
          size={{ base: "sm", xl: "md" }}
          bgColor={colors.pinkButtonBg}
          _hover={{ bgColor: colors.pinkButtonBgHover }}
          onClick={handleClickEnter}
        >
          {t("Try")}
        </Button>
        <Box>
          {((gameState.startsWith('guessing')) && (gameMode === "classic" || gameMode === "daily")) && (
            <Button
              size={{ base: "sm", xl: "md" }}
              bgColor={colors.orangeButtonBg}
              _hover={{ bgColor: colors.orangeButtonBgHover }}
              onClick={() => {
                const confirmed = window.confirm(t("Are you sure you want to give up?"));
                if (confirmed) {
                  handleAbandon();
                }
              }}
              mt={{ base: 1, xl: 0 }}
            >
              {t("Give up")} {gameState === "guessing_hardcore" ? " " + t("HC") : ""}
            </Button>
          )}
          {gameState === "victory_normal" && (gameMode === "classic" || gameMode === "daily") && (
            <Button
              size={{ base: "sm", xl: "md" }}
              bgColor={colors.blueButtonBg}
              onClick={() => setShowHardcorePrompt(true)}
              _hover={{ bgColor: colors.blueButtonBgHover }}
              mt={{ base: 1, xl: 0 }}
            >
              {t("Let's go Hardcore")}
            </Button>
          )}

        </Box>
        {!gameState.startsWith("guessing") && gameState &&
          (showAllSong ? (
            <ViewOffIcon boxSize={{ base: 5, xl: 7 }} onClick={handleClickShowSong} cursor="pointer" />
          ) : (
            <ViewIcon boxSize={{ base: 5, xl: 7 }} onClick={handleClickShowSong} cursor="pointer" />
          ))
        }
      </HStack>

      <HStack mt={2} justify="space-between">
        {guessList.length > 0 && (
          <Text fontSize={{ base: "sm", xl: "md" }}>
            {guessFeedback.perfect_match > 0 || guessFeedback.partial_match > 0
              ? '🟩'.repeat(guessFeedback.perfect_match) +
              '🟧'.repeat(guessFeedback.partial_match)
              : '🟥'}
          </Text>
        )}

      </HStack>
    </Box>
  );
});