import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
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
  useBreakpointValue,
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
import { setLocalStorageItem, getLocalStorageItem } from '../hooks/useLocalStorage';

// Composant principal App
const App = () => {
  console.log("App Rerendered");
  const { t, i18n } = useTranslation();
  const colors = useColors();

  // Utilise useBreakpointValue pour éviter les re-renders pendant le redimensionnement
  const isMobile = useBreakpointValue({ base: true, xl: false });

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
  const storedProfilPicture = useMemo(() => localStorage.getItem('paroldle_profilePicture'), []);
  const [selectedImage, setSelectedImage] = useState(storedProfilPicture || 'pdp1');

  const [dailyIndex, setDailyIndex] = useState(null);
  const [dailyScores, setDailyScores] = useState({});
  const [dailySongOrQuiz, setDailySongOrQuiz] = useState("song");
  const [dailyTotalPoints, setDailyTotalPoints] = useState(0);

  // Utilisation de useRef pour éviter les re-renders
  const isConnectedRef = useRef(isConnected);
  const indexRef = useRef(index);
  const guessListRef = useRef(guessList);
  const gameModeRef = useRef(gameMode);
  const battleStateRef = useRef(battleState);

  // Suppression de l'onglet actif au démarrage (une seule fois)
  useEffect(() => {
    localStorage.removeItem("paroldle_activeTab");
  }, []);

  // Initialisation des indices quotidiens
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
        setLocalStorageItem(`paroldle_daily_index_${todayString}`, index);
        if (gameModeRef.current === "daily") {
          setIndex(index);
        }
      }
    };
    fetchDailyIndex();
  }, []);

  // Nettoyage des valeurs du localStorage obsolètes (une seule fois quand dailyIndex change)
  useEffect(() => {
    if (dailyIndex === null) return;

    setTimeout(() => {
      const todayString = new Date().toISOString().split('T')[0];
      Object.keys(localStorage)
        .filter((key) =>
          key.startsWith('paroldle_daily') &&
          !(key.endsWith(todayString) || key.endsWith(dailyIndex))&&
          !key.endsWith("scores"))
        .forEach((key) => {
          localStorage.removeItem(key);
        });
    }, 1000);  // Délai pour ne pas bloquer le rendu initial
  }, [dailyIndex]);

  // Nettoyage des valeurs du localStorage de bataille (une seule fois)
  useEffect(() => {
    setTimeout(() => {
      Object.keys(localStorage)
        .filter((key) =>
          key.startsWith('paroldle_battle') &&
          !(key.endsWith("foundSongs") || key.endsWith("inProgressSongs")))
        .forEach((key) => {
          localStorage.removeItem(key);
        });
    }, 1000);  // Délai pour ne pas bloquer le rendu initial
  }, []);

  // Définir la langue en fonction du navigateur (une seule fois)
  useEffect(() => {
    const userLang = navigator.language || navigator.userLanguage;
    i18n.changeLanguage(userLang.startsWith("fr") ? "fr" : "en");
  }, [i18n]);

  // Chargement initial depuis le localStorage (une seule fois)
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
      try {
        setDailyScores(JSON.parse(storedDailyScores));
      } catch (e) {
        console.error("Error parsing daily scores", e);
      }
    }
  }, []);

  // Synchronisation des données en fonction du gameMode
  useEffect(() => {
    if (gameMode === "") return;

    setIsReady(false);
    setLocalStorageItem('paroldle_gameMode', gameMode);

    const storedFoundSongs = getLocalStorageItem(`paroldle_${gameMode}_foundSongs`, {});
    setFoundSongs(storedFoundSongs);

    if (gameMode === "battle") {
      setIndex(null);
      setGameState("guessing_normal");
    }
    else if (gameMode !== "daily") {
      const storedInProgressSongs = getLocalStorageItem(`paroldle_${gameMode}_inProgressSongs`, []);
      setInProgressSongs(storedInProgressSongs);

      const storedIndex = localStorage.getItem(`paroldle_${gameMode}_index`);
      if (storedIndex && !isNaN(parseInt(storedIndex))) {
        const i = parseInt(storedIndex);
        setIndex(i);
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
      if (storedTotalPoints) {
        setDailyTotalPoints(parseInt(storedTotalPoints, 10));
      }
    }

    setIsReady(true);
    setSideBarLoading(false);
  }, [gameMode]);

  // Charger les données spécifiques à un index
  useEffect(() => {
    if (index == null || gameModeRef.current === "") return;

    setIsReady(false);
    setLocalStorageItem(`paroldle_${gameModeRef.current}_index`, index);

    const storedGuessList = getLocalStorageItem(`paroldle_${gameModeRef.current}_guessList_${index}`, []);
    setGuessList(storedGuessList);

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
        setIsReady(true);
      }
    });
  }, [index]);

  // Enregistrer les points quotidiens dans localStorage
  useEffect(() => {
    if (gameMode === "daily" && dailyTotalPoints > 0) {
      const todayString = new Date().toISOString().split('T')[0];
      setLocalStorageItem(`paroldle_daily_total_points_${todayString}`, dailyTotalPoints);
    }
  }, [dailyTotalPoints, gameMode]);

  // Enregistrer le mode chanson/quiz dans localStorage
  useEffect(() => {
    setLocalStorageItem(`paroldle_daily_songOrQuiz`, dailySongOrQuiz);
  }, [dailySongOrQuiz]);

  // Enregistrer les scores quotidiens dans localStorage
  useEffect(() => {
    if (Object.keys(dailyScores).length > 0) {
      setLocalStorageItem("paroldle_daily_scores", dailyScores);
    }
  }, [dailyScores]);

  // Save guessList to localStorage with debounce
  useEffect(() => {
    if (indexRef.current === null || gameModeRef.current === "" || guessList.length === 0) return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_guessList_${indexRef.current}`, guessList);
  }, [guessList]);

  // Enregistrer foundSongs dans localStorage
  useEffect(() => {
    if (gameModeRef.current === "" || gameModeRef.current === "daily" || Object.keys(foundSongs).length === 0) return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_foundSongs`, foundSongs);
  }, [foundSongs]);

  // Enregistrer inProgressSongs dans localStorage
  useEffect(() => {
    if (gameModeRef.current === "" || gameModeRef.current === "daily" || inProgressSongs.length === 0) return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_inProgressSongs`, inProgressSongs);
  }, [inProgressSongs]);

  // Enregistrer l'autoplay dans localStorage
  useEffect(() => {
    setLocalStorageItem('paroldle_autoplay', autoplay);
  }, [autoplay]);

  // Enregistrer les trophées dans localStorage
  useEffect(() => {
    if (trophies > 0) {
      setLocalStorageItem('paroldle_trophies', trophies);
    }
  }, [trophies]);

  // Enregistrer le gameState dans localStorage
  useEffect(() => {
    if (indexRef.current == null || gameModeRef.current === "" || !gameState) return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_gameState_${indexRef.current}`, gameState);
  }, [gameState]);

  // Mise à jour de foundSongs selon le gameState
  useEffect(() => {
    if (!isReady || !song || index === null || gameModeRef.current === "") return;

    setFoundSongs((prev) => {
      let newFoundSongs = { ...prev };
      let shouldShowVictory = false;
      let shouldUpdateTrophies = false;
      let trophyAmount = 0;
      let shouldShowHardcorePrompt = false;
      let newInProgressSongs = [...inProgressSongs];

      if (gameModeRef.current === "classic") {
        if (gameState === "victory_normal" && !Object.hasOwn(prev, indexRef.current)) {
          shouldShowVictory = true;
          shouldUpdateTrophies = true;
          trophyAmount = NORMAL_VICTORY_BASE_POINTS;
          shouldShowHardcorePrompt = true;
          newInProgressSongs = newInProgressSongs.filter((i) => i !== indexRef.current);
          newFoundSongs[indexRef.current] = "normal";
        } else if (gameState === "victory_hardcore" && prev[indexRef.current] === "normal") {
          shouldShowVictory = true;
          shouldUpdateTrophies = true;
          trophyAmount = HARDCORE_VICTORY_BONUS;
          newInProgressSongs = newInProgressSongs.filter((i) => i !== indexRef.current);
          newFoundSongs[indexRef.current] = "hardcore";
        } else if (gameState === "abandonned_normal" && !Object.hasOwn(prev, indexRef.current)) {
          shouldShowVictory = true;
          newInProgressSongs = newInProgressSongs.filter((i) => i !== indexRef.current);
          newFoundSongs[indexRef.current] = "abandonned";
        } else if (gameState === "abandonned_hardcore" && prev[indexRef.current] === "normal") {
          newInProgressSongs = newInProgressSongs.filter((i) => i !== indexRef.current);
        } else if (gameState === "guessing_hardcore" && !newInProgressSongs.includes(indexRef.current)) {
          newInProgressSongs.push(indexRef.current);
        }
      } else if (gameModeRef.current === "NOPLP") {
        if (gameState === "victory_hardcore" && !Object.hasOwn(prev, indexRef.current)) {
          shouldShowVictory = true;
          shouldUpdateTrophies = true;
          trophyAmount = HARDCORE_VICTORY_BONUS;
          newInProgressSongs = newInProgressSongs.filter((i) => i !== indexRef.current);
          newFoundSongs[indexRef.current] = "hardcore";
        }
      } else if (gameModeRef.current === "battle") {
        if (gameState === "victory_normal" && !Object.hasOwn(prev, indexRef.current)) {
          shouldShowVictory = true;
          shouldUpdateTrophies = true;
          trophyAmount = NORMAL_VICTORY_BASE_POINTS;
          newFoundSongs[indexRef.current] = {
            status: "victory",
            winner: playerName,
            players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")]
          };
        }
        else if (gameState.startsWith("defeat_normal") && !Object.hasOwn(prev, indexRef.current)) {
          shouldShowVictory = true;
          const winner = gameState.split("_")[2];
          newFoundSongs[indexRef.current] = {
            status: "defeat",
            winner: winner,
            players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")]
          };
        }
        else if (gameState === "tie_normal" && !Object.hasOwn(prev, indexRef.current)) {
          shouldShowVictory = true;
          newFoundSongs[indexRef.current] = {
            status: "tie",
            players: [playerName, ...Object.keys(otherPlayersInfo).filter((player) => otherPlayersInfo[player].battleState === "fighting")]
          };
        }
      }

      // Mise à jour des états en dehors de la fonction de mise à jour des états
      if (shouldShowVictory) {
        setShowVictory(true);
      }

      if (shouldUpdateTrophies && trophyAmount > 0) {
        setTrophies((prevTrophies) => prevTrophies + trophyAmount);
      }

      if (shouldShowHardcorePrompt) {
        setShowHardcorePrompt(true);
      }

      if (JSON.stringify(newInProgressSongs) !== JSON.stringify(inProgressSongs)) {
        setInProgressSongs(newInProgressSongs);
      }

      return newFoundSongs;
    });

    if (gameModeRef.current === "daily") {
      const todayString = new Date().toISOString().split('T')[0];

      if (gameState === "victory_normal" && !Object.hasOwn(dailyScores, todayString)) {
        setShowVictory(true);
        setDailyTotalPoints((prev) => prev + Math.max(0, 200 - guessListRef.current.length));
        setDailyScores((prev) => ({
          ...prev,
          [todayString]: {
            song: {
              nGuesses: guessListRef.current.length,
              status: "victory_normal",
              title: song.title,
              artist: song.author
            }
          }
        }));
      }
      else if (gameState === "victory_hardcore" && dailyScores[todayString]?.song?.status === "victory_normal") {
        setShowVictory(true);
        setDailyTotalPoints((prev) => prev + 100);
        setDailyScores((prev) => ({
          ...prev,
          [todayString]: {
            ...prev[todayString],
            song: {
              ...prev[todayString].song,
              status: "victory_hardcore"
            }
          }
        }));
      }
      else if (gameState === "abandonned_normal") {
        setShowVictory(true);
        setDailyScores((prev) => ({
          ...prev,
          [todayString]: {
            song: {
              nGuesses: "∞",
              status: "abandonned",
              title: song.title,
              artist: song.author
            }
          }
        }));
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
            if (part.trim()) {
              setGuessList((prev) => {
                if (prev.includes(part)) return prev;
                setGuess(part);
                setLastWord(part);
                setMyGuess(part);

                if (isConnected && gameModeRef.current !== "battle" && sendToPlayers) {
                  sendToPlayers(JSON.stringify({ guess: part, index: indexRef.current }));
                }
                return [part, ...prev];
              });
            }
          }
            , 1);
        });
      }
    }
    setInputWord('');
  }, [inputWord, guess, inProgressSongs, gameState, sendToPlayers, isConnected]);

  const handleClickShowSong = useCallback(() => {
    if (!gameState.startsWith("guessing")) {
      setShowAllSong((prev) => !prev);
    }
  }, [gameState]);

  const handleAbandon = useCallback(() => {
    if (gameState === "guessing_normal") {
      setGameState("abandonned_normal");
    } else if (gameState === "guessing_hardcore") {
      setGameState("abandonned_hardcore");
    }
  }, [gameState]);

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
              // Create new Sets from existing arrays (or empty arrays) and new words
              const titleSet = new Set([
                ...(prev[sender].foundWords?.title || []),
                ...(jsonData.foundWords.title || [])
              ]);
              const artistSet = new Set([
                ...(prev[sender].foundWords?.artist || []),
                ...(jsonData.foundWords.artist || [])
              ]);
              const lyricsSet = new Set([
                ...(prev[sender].foundWords?.lyrics || []),
                ...(jsonData.foundWords.lyrics || [])
              ]);

              // Convert Sets back to arrays for React state update
              return {
                ...prev,
                [sender]: {
                  ...prev[sender],
                  foundWords: {
                    title: titleSet,
                    artist: artistSet,
                    lyrics: lyricsSet
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
          });
          setOtherPlayersInfo((prev) => {
            if (Object.hasOwn(prev, sender)) {
              return { ...prev, [sender]: { ...prev[sender], guess: jsonData.guess } };
            }
            return prev;
          });
        }
      }
      else if (jsonData.guessList && jsonData.index === indexRef.current) {
        const uniqueGuesses = jsonData.guessList.filter(guess => !guessListRef.current.includes(guess));
        if (uniqueGuesses.length > 0) {
          setGuessList((prev) => [...uniqueGuesses, ...prev]);
          uniqueGuesses.forEach((guess) => {
            setTimeout(() => {
              setGuess(guess);
            }
              , 1);
          });
        }
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
  }, [battleState, isConnected, roomId, playerName]);

  useEffect(() => {
    if (isConnected && roomId && playerName) {
      const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
      update(playerRef, { wantsTie: wantsTie });
    }
  }, [wantsTie, isConnected, roomId, playerName]);

  const handleSendGuessList = useCallback((player) => {
    if (otherPlayersInfo[player].sendFunc) {
      otherPlayersInfo[player].sendFunc(JSON.stringify({ guessList: guessListRef.current, index: indexRef.current }));
    }
  }, [otherPlayersInfo]);

  // Mise à jour des références pour éviter les dépendances circulaires dans les effets
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    guessListRef.current = guessList;
  }, [guessList]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    battleStateRef.current = battleState;
  }, [battleState]);

  // Memoize les props pour éviter des re-renders inutiles
  const sidebarProps = useMemo(() => ({
    index,
    guessList,
    setIndex,
    foundSongs,
    trophies,
    setGameMode,
    gameMode,
    sideBarLoading,
    setSideBarLoading,
    inProgressSongs,
    isConnected,
    roomPlayers,
    otherPlayersInfo,
    setOtherPlayersInfo,
    setRtcModalOpen,
    playerName,
    sendGuessListCallback: handleSendGuessList,
    setIsReady,
    battleState,
    setBattleState,
    guess: myGuess,
    battleStartTime,
    setBattleStartTime,
    fightIndex,
    setFightIndex,
    gameState,
    setWantsTie,
    roomId,
    selectedImage,
    setGameState,
    dailyIndex,
    dailyScores,
    setDailySongOrQuiz,
    dailyTotalPoints,
  }), [
    index, guessList, foundSongs, trophies, gameMode, sideBarLoading, inProgressSongs,
    isConnected, roomPlayers, otherPlayersInfo, playerName, battleState, myGuess,
    battleStartTime, fightIndex, gameState, roomId, selectedImage, dailyIndex,
    dailyScores, dailyTotalPoints, handleSendGuessList
  ]);

  // Memoize les props du control bar pour éviter des re-renders inutiles
  const controlBarProps = useMemo(() => ({
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
  }), [
    isListening, inputWord, handleClickEnter, lastWord, guessList,
    guessFeedback, gameState, gameMode, showAllSong, handleClickShowSong,
    handleAbandon, showHardcorePrompt
  ]);

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

          {/* MobileSidebar conditionnellement rendu uniquement sur mobile */}
          {isMobile && (
          <MobileSidebar
            {...sidebarProps}
            isMobile={true}
          />
          )}

          <Container maxW="full" bg={colors.background} centerContent p={isMobile ? 2 : 10} minH="100vh">
          <Grid
            templateColumns={isMobile ? "1fr" : "repeat(12, 1fr)"}
            gap={isMobile ? 2 : 4}
            w="100%"
          >
            {/* Sidebar desktop, affichée uniquement sur écran large */}
            {!isMobile && (
            <GridItem colSpan={4}>
            <Sidebar
              {...sidebarProps}
              isMobile={false}
            />
            </GridItem>
            )}

            {/* Main content area - full width on mobile */}
            <GridItem colSpan={isMobile ? 12 : 8}>
            <Box
              bg={colors.primary}
              p={isMobile ? 2 : 4}
              borderRadius="3xl"
              shadow="xl"
              h="100%"
              minH={isMobile ? "400px" : "600px"}
            >
              <Header
              onInfoClick={() => setShowInfoModal(true)}
              trophies={trophies}
              setAutoplay={setAutoplay}
              autoplay={autoplay}
              />

              {!(gameMode === "daily" && dailySongOrQuiz === "quiz") && (
              <ControlBar {...controlBarProps} isMobile={isMobile} />
              )}

              <Box
              bg={colors.lyricsBg}
              p={isMobile ? 2 : 4}
              borderRadius="md"
              boxShadow="inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(255,255,255,0.7)"
              mt={(gameMode === "daily" && dailySongOrQuiz === "quiz") ? 20 : 0}
              fontSize={isMobile ? "sm" : "md"}
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
            <Text textAlign="center" mt={4} color="white" mb={5} fontSize={isMobile ? "xs" : "sm"}>
            © 2024 Paroldle. {t("Made with ❤️ for Charline")}
            </Text>
          </footer>
          </Container>
        </>
        );
      };

      // Memoize le ControlBar pour éviter des re-renders inutiles
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
        setShowHardcorePrompt,
        isMobile
      }) => {
        const { t } = useTranslation();
        const colors = useColors();

        return (
        <Box position="sticky" top={isMobile ? 10 : 0} zIndex={900} bg={colors.primary} p={isMobile ? 2 : 4}>
          <HStack spacing={isMobile ? 2 : 4} flexWrap="wrap" justifyContent="center">
          <IconButton
            size={isMobile ? "sm" : "md"}
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
            maxW={isMobile ? "120px" : "300px"}
            size={isMobile ? "sm" : "md"}
            colorScheme="pink"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            onKeyDown={(e) => {
            if (e.key === 'Enter') handleClickEnter();
            }}
          />
          <Button
            size={isMobile ? "sm" : "md"}
            bgColor={colors.pinkButtonBg}
            _hover={{ bgColor: colors.pinkButtonBgHover }}
            onClick={handleClickEnter}
          >
            {t("Try")}
          </Button>
          <Box>
            {((gameState.startsWith('guessing')) && (gameMode === "classic" || gameMode === "daily")) && (
            <Button
              size={isMobile ? "sm" : "md"}
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
              size={isMobile ? "sm" : "md"}
              bgColor={colors.blueButtonBg}
              onClick={() => setShowHardcorePrompt(true)}
              _hover={{ bgColor: colors.blueButtonBgHover }}
              mt={isMobile ? 1 : 0}
            >
              {t("Let's go Hardcore")}
            </Button>
            )}
          </Box>
          {!gameState.startsWith("guessing") && gameState &&
            (showAllSong ? (
            <ViewOffIcon boxSize={isMobile ? 5 : 7} onClick={handleClickShowSong} cursor="pointer" />
            ) : (
            <ViewIcon boxSize={isMobile ? 5 : 7} onClick={handleClickShowSong} cursor="pointer" />
            ))
          }
          </HStack>

          <HStack mt={2} justify="space-between">
          {guessList.length > 0 && (
            <Text fontSize={isMobile ? "sm" : "md"}>
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

      export default memo(App);