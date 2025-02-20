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
  Image,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaTrophy } from 'react-icons/fa';
import { getSong } from '../lyrics';
import LyricsComponent from './LyricsComponent';
import FestiveModal from './FestiveModal';
import Sidebar from './Sidebar';
import HardcorePromptModal from './HardcorePromptModal';
import {
  NORMAL_VICTORY_BASE_POINTS,
  HARDCORE_VICTORY_BONUS,
} from '../constants';

const App = () => {
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
  const [gameState, setGameState] = useState("guessing_normal");
  // Modal pour demander le passage en mode hardcore
  const [showHardcorePrompt, setShowHardcorePrompt] = useState(false);
  // État pour les trophées
  const [trophies, setTrophies] = useState(0);

  /** 
   * Au montage, on charge les données sauvegardées dans le localStorage.
   */
  useEffect(() => {
    const storedIndex = localStorage.getItem('paroldle_index');
    if (storedIndex && !isNaN(parseInt(storedIndex))) {
      setIndex(parseInt(storedIndex));
    } else {
      setIndex(0);
    }

    const storedGuessList = localStorage.getItem(`paroldle_guessList_${storedIndex}`);
    if (storedGuessList) {
      setGuessList(JSON.parse(storedGuessList));
    }

    const storedFoundSongs = localStorage.getItem('paroldle_foundSongs');
    if (storedFoundSongs) {
      setFoundSongs(JSON.parse(storedFoundSongs));
    }

    const storedAutoplay = localStorage.getItem('paroldle_autoplay');
    if (storedAutoplay) {
      setAutoplay(storedAutoplay === 'true');
    }

    const storedTrophies = localStorage.getItem('paroldle_trophies');
    if (storedTrophies) {
      setTrophies(parseInt(storedTrophies, 10));
    }

    // Charger le gameState sauvegardé
    const storedGameState = localStorage.getItem(`paroldle_gameState_${storedIndex}`);
    setGameState(storedGameState || 'guessing_normal');

    // eslint-disable-next-line
  }, []);

  /** 
   * À chaque changement d'index, on sauvegarde, réinitialise quelques états
   * et on récupère la chanson correspondante.
   */
  useEffect(() => {
    if (index == null) return;
    localStorage.setItem('paroldle_index', index);
    const storedGuessList = localStorage.getItem(`paroldle_guessList_${index}`);
    setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);

    const storedGameState = localStorage.getItem(`paroldle_gameState_${index}`);
    setGameState(storedGameState || 'guessing_normal');

    setShowAllSong(false);
    setIsReady(false);
    setGuess('');
    setLastWord('');

    getSong(index).then((data) => {
      setSong({ ...data, index });
    });
    setYoutubeVideoId(null);
    // eslint-disable-next-line
  }, [index]);

  // Sauvegarde automatique de la liste des essais
  useEffect(() => {
    if (index == null) return;
    localStorage.setItem(`paroldle_guessList_${index}`, JSON.stringify(guessList));
    // eslint-disable-next-line
  }, [guessList]);

  // Sauvegarde automatique des chansons trouvées
  useEffect(() => {
    localStorage.setItem('paroldle_foundSongs', JSON.stringify(foundSongs));
  }, [foundSongs]);

  // Sauvegarde automatique de l'autoplay
  useEffect(() => {
    localStorage.setItem('paroldle_autoplay', autoplay);
  }, [autoplay]);

  // Sauvegarde automatique des trophées
  useEffect(() => {
    localStorage.setItem('paroldle_trophies', trophies);
  }, [trophies]);

  // Sauvegarde automatique du gameState
  useEffect(() => {
    if (index == null) return;
    localStorage.setItem(`paroldle_gameState_${index}`, gameState);
  }, [gameState]);

  useEffect(() => {
    // On s'assure que la chanson est chargée et qu'elle correspond bien à l'index actuel
    if ((gameState.startsWith("victory") || gameState.startsWith("abandonned")) && song && song.index === index) {
      const storedYoutubeId = localStorage.getItem(`paroldle_youtube_${index}`);
      if (storedYoutubeId) {
        setYoutubeVideoId(storedYoutubeId);
        return;
      }
      const API_KEY = "AIzaSyCFkGm1OgvtT61t7PIdM2k3vSMU9mFkbFk";
      // Construire la requête à partir du titre et, si disponible, de l'artiste
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

  // Lorsqu'une victoire est déclenchée…
  useEffect(() => {
    if (!isReady || !song || index === null) return;
    
    setFoundSongs((prev) => {
      // Ne pas modifier l'état si ce n'est pas nécessaire
      if (gameState === "victory_normal" && !Object.hasOwn(prev, index)) {
        setShowVictory(true);
        setTrophies((prevTrophies) => prevTrophies + NORMAL_VICTORY_BASE_POINTS);
        setShowHardcorePrompt(true); // Proposer le mode hardcore
        return { ...prev, [index]: "normal" };
  
      } else if (gameState === "victory_hardcore" && prev[index] === "normal") {
        setShowVictory(true);
        setTrophies((prevTrophies) => prevTrophies + HARDCORE_VICTORY_BONUS);
        return { ...prev, [index]: "hardcore" };
  
      } else if (gameState === "abandonned_normal" && !Object.hasOwn(prev, index)) {
        return { ...prev, [index]: "abandonned" };
      }
  
      return prev; // Pas de changement si aucune des conditions n'est remplie
    });
  
  }, [gameState]);

  
const handleClickEnter = useCallback(() => {
  if (!inputWord) return;
  const trimmed = inputWord.trim();
  if (trimmed && trimmed !== guess) {
    if (trimmed === "sudo reveal") {
      // En mode normal, le sudo reveal force la victoire normale
      setGameState("victory_normal");
    } else {
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
  // Affichage complet uniquement en mode normal terminé
  if ((gameState === "victory_normal" || gameState.startsWith("abandonned"))) {
    setShowAllSong((prev) => !prev);
  }
}, [gameState]);

// Fonction de reset qui efface la base de données locale et réinitialise les états
const resetDB = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('paroldle_'))
    .forEach((key) => localStorage.removeItem(key));
};

// Bouton pour abandonner la partie (normal ou hardcore)
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
        // Passage en mode hardcore
        setGameState("guessing_hardcore");
        setShowHardcorePrompt(false);
      }}
      onDecline={() => {
        // L'utilisateur refuse le mode hardcore, victoire normale confirmée
        setShowHardcorePrompt(false);
      }}
    />
    <Container maxW="full" bg="rgb(245,169,188)" centerContent p="10" minH="100vh" position="relative">
      <Grid templateColumns="1fr 4fr" gap={6} w="full" mt={5} alignItems="stretch">
        <GridItem>
          <Sidebar
            index={index}
            guessList={guessList}
            setIndex={setIndex}
            foundSongs={foundSongs}
            trophies={trophies}
          />
        </GridItem>
        <GridItem>
          {/* Conteneur principal */}
          <Box
            position="relative"
            bg="rgb(163,193,224)"
            p="4"
            borderRadius="3xl"
            shadow="md"
            h="100%"
            minH="600px"
          >
            <Image
              src="/paroldle/paroldle.png"
              alt="Paroldle"
              w={400}
              mx="auto"
              mb="4"
            />

            {/* Affichage du trophée en haut à gauche */}
            <HStack position="absolute" top="4" left="4">
              <FaTrophy size={40} color="gold" />
              <Text fontWeight={"bold"} color="white" fontSize="3xl">
                {trophies}
              </Text>
            </HStack>

            <HStack
              position="absolute"
              top="4"
              right="4"
              spacing="4"
            >
              <HStack>
                <Text fontWeight={600} color="white">Autoplay</Text>
                <Button onClick={() => setAutoplay(!autoplay)} >
                  {autoplay ? "On" : "Off"}
                </Button>
              </HStack>
            </HStack>

            <Heading size="lg" mb="4" color="white" textAlign="center">
              Découvrez la chanson d'aujourd'hui !
            </Heading>
            <HStack mb="4">
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
              <Button colorScheme="pink" onClick={handleClickEnter} mr={2}>
                GUESS
              </Button>
              {(gameState === "guessing_normal" || gameState === "guessing_hardcore") && (
                <Button colorScheme="orange" onClick={handleAbandon}>
                  Abandon {gameState === "guessing_hardcore" ? "Hardcore" : ""}
                </Button>
              )}
              {(gameState === "victory_normal") && (
                <Button colorScheme="blue" onClick={() => setShowHardcorePrompt(true)}>
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
            <Box
              bg="gray.100"
              p="4"
              borderRadius="md"
              boxShadow="inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(255,255,255,0.7)"
            >
              <LyricsComponent
                song={song}
                index={index}
                gameState={gameState}
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
