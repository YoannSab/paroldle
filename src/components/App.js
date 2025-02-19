// App.js
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
  const [victory, setVictory] = useState(''); // '' | 'normal' | 'hardcore'
  const [showVictory, setShowVictory] = useState(false);
  const [showAllSong, setShowAllSong] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessList, setGuessList] = useState([]);
  const [index, setIndex] = useState(null);
  const [guessFeedback, setGuessFeedback] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [foundSongs, setFoundSongs] = useState([]);
  // Nouvel état pour l'ID de la vidéo 
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [autoplay, setAutoplay] = useState(false);
  // Mode de jeu : "normal" ou "hardcore"
  const [gameMode, setGameMode] = useState("normal");
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

    setShowAllSong(false);
    setVictory('');
    setIsReady(false);
    setGuess('');
    setLastWord('');
    setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);
    getSong(index).then((data) => {
      setSong({ ...data, index });
    });
    setYoutubeVideoId(null);
    // Réinitialiser le mode de jeu pour chaque nouvelle chanson
    setGameMode("normal");
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

  useEffect(() => {
    // On s'assure que la chanson est chargée et qu'elle correspond bien à l'index actuel
    if (victory !== "" && song && song.index === index) {
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
  }, [song, victory, index]);

  // Lorsqu'une victoire est déclenchée…
  useEffect(() => {
    if (victory !== '' && !foundSongs.includes(index)) {
      if (victory === "normal") {
          // Si l'utilisateur a abandonné le mode hardcore, on confirme la victoire normale
          setShowVictory(true);
          setFoundSongs((prev) => [...prev, index]);
          setTrophies((prev) => prev + NORMAL_VICTORY_BASE_POINTS);

      } else if (victory === "hardcore") {
        // Victoire finale en mode hardcore
        setShowVictory(true);
        setFoundSongs((prev) => [...prev, index]);
        setTrophies((prev) => prev + NORMAL_VICTORY_BASE_POINTS + HARDCORE_VICTORY_BONUS);
      }
    }
    // eslint-disable-next-line
  }, [victory]);

  const handleClickEnter = useCallback(() => {
    if (!inputWord) return;
    const trimmed = inputWord.trim();
    if (trimmed && trimmed !== guess) {
      if (trimmed === "sudo reveal") {
        setVictory("normal");
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
    if (victory !== '' && gameMode === "normal") {
      setShowAllSong((prev) => !prev);
    }
  }, [victory, gameMode]);

  // Fonction de reset qui efface la base de données locale et réinitialise les états
  const resetDB = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('paroldle_'))
      .forEach((key) => localStorage.removeItem(key));
  };

  // Bouton pour abandonner le mode hardcore
  const handleAbandonHardcore = () => {
    setGameMode("normal");
    setVictory("normal");
  };

  return (
    <>
      <FestiveModal isOpen={showVictory} onClose={() => setShowVictory(false)} victory={victory} />
      <HardcorePromptModal
        isOpen={showHardcorePrompt}
        onConfirm={() => {
          // Passage en mode hardcore
          setGameMode("hardcore");
          setShowHardcorePrompt(false);
          // Réinitialiser la victoire pour continuer en mode hardcore
          setVictory('');
        }}
        onDecline={() => {
          // L'utilisateur refuse le mode hardcore, victoire normale confirmée
          setShowHardcorePrompt(false);
          setVictory("normal");
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
                  <Button onClick={() => setAutoplay(!autoplay)}>
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
                {gameMode === "hardcore" && victory !== "hardcore" && (
                  <Button colorScheme="orange" onClick={handleAbandonHardcore}>
                    Abandon
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
                {victory !== '' && gameMode === "normal" &&
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
                  victory={victory}
                  setVictory={setVictory}
                  guess={guess}
                  setGuess={setGuess}
                  showAllSong={showAllSong}
                  setGuessFeedback={setGuessFeedback}
                  isReady={isReady}
                  setIsReady={setIsReady}
                  youtubeVideoId={youtubeVideoId}
                  autoplay={autoplay}
                  gameMode={gameMode}
                  setShowHardcorePrompt={setShowHardcorePrompt}
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
