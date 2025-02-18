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
  Switch,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { getSong } from './lyrics';
import LyricsComponent from './LyricsComponent';
import FestiveModal from './FestiveModal';
import Sidebar from './Sidebar';

const App = () => {
  // États principaux
  const [song, setSong] = useState(null);
  const [inputWord, setInputWord] = useState('');
  const [lastWord, setLastWord] = useState('');
  const [victory, setVictory] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showAllSong, setShowAllSong] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessList, setGuessList] = useState([]);
  const [index, setIndex] = useState(null);
  const [guessFeedback, setGuessFeedback] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [foundSongs, setFoundSongs] = useState([]);
  // Nouvel état pour l'ID de la vidéo YouTube
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [autoplay, setAutoplay] = useState(false);

  /** 
   * Au montage, on charge les données sauvegardées dans le localStorage.
   */
  useEffect(() => {
    const storedIndex = localStorage.getItem('paroldle_index');
    if (storedIndex && !isNaN(parseInt(storedIndex))) {
      setIndex(parseInt(storedIndex));
    } else {
      setIndex(new Date().getDate());
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
    // eslint-disable-next-line
  }, []);

  /** 
   * À chaque changement d'index, on sauvegarde, réinitialise quelques états
   * et on récupère la chanson correspondante. On ajoute l'index dans l'objet song
   * pour éviter la condition de course.
   */
  useEffect(() => {
    if (index == null) return;
    localStorage.setItem('paroldle_index', index);
    const storedGuessList = localStorage.getItem(`paroldle_guessList_${index}`);

    setShowAllSong(false);
    setVictory(foundSongs.includes(index));
    setIsReady(false);
    setGuess('');
    setLastWord('');
    setGuessList(storedGuessList ? JSON.parse(storedGuessList) : []);
    // Récupérer la chanson et y ajouter l'index actuel
    getSong(index).then((data) => {
      setSong({ ...data, index });
    });
    // Réinitialiser l'ID YouTube pour la nouvelle chanson
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
  
  // Lorsqu'on gagne, on affiche la modale et on ajoute la chanson trouvée à la mémoire
  useEffect(() => {
    if (victory && !foundSongs.includes(index)) {
      setShowVictory(true);
      setFoundSongs((prev) => [...prev, index]);
    }
    // eslint-disable-next-line
  }, [victory]);

  // Recherche et stockage de l'ID YouTube dans le localStorage pour la chanson en cours
  useEffect(() => {
    // On s'assure que la chanson est chargée et qu'elle correspond bien à l'index actuel
    if (victory && song && song.index === index) {
      const storedYoutubeId = localStorage.getItem(`paroldle_youtube_${index}`);
      if (storedYoutubeId) {
        setYoutubeVideoId(storedYoutubeId);
        return;
      }
      const API_KEY = "...";
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

  // Lorsqu'on soumet un essai, on met à jour le mot deviné et la liste des essais
  const handleClickEnter = useCallback(() => {
    if (!inputWord) return;
    const trimmed = inputWord.trim();
    if (trimmed && trimmed !== guess) {
      if (trimmed === "sudo reveal") {
        setVictory(true);
      } else {
        setGuess(trimmed);
        setLastWord(trimmed);
        setGuessList((prev) => [trimmed, ...prev]);
      }
    }
    setInputWord('');
  }, [inputWord, guess]);

  // Permet de basculer l'affichage complet de la chanson (si victoire)
  const handleClickShowSong = useCallback(() => {
    if (victory) {
      setShowAllSong((prev) => !prev);
    }
  }, [victory]);

  // Fonction de reset qui efface la base de données locale et réinitialise les états
  const resetDB = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('paroldle_'))
      .forEach((key) => localStorage.removeItem(key));
  };

  return (
    <>
      <FestiveModal isOpen={showVictory} onClose={() => setShowVictory(false)} />
      <Container maxW="full" bg="rgb(245,169,188)" centerContent p="4">
        <Grid templateColumns="1fr 4fr" gap={4} w="full">
          <GridItem>
            <Sidebar
              index={index}
              guessList={guessList}
              setIndex={setIndex}
              foundSongs={foundSongs}
            />
          </GridItem>
          <GridItem>
            {/* Conteneur principal */}
            <Box
              bg="rgb(163,193,224)"
              p="4"
              borderRadius="3xl"
              shadow="md"
              mt={10}
            >
              <HStack mb="4" justify="flex-end">
                <Text fontWeight={600} color="white">Autoplay</Text>
                <Switch 
                  colorScheme="teal" 
                  isChecked={autoplay} 
                  onChange={() => setAutoplay(!autoplay)}
                />
              </HStack>
              <Image
                src="/paroldle/paroldle.png"
                alt="Paroldle"
                w={500}
                mx="auto"
                mb="4"
              />
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
                <Button colorScheme="pink" onClick={handleClickEnter} mr={4}>
                  Rechercher
                </Button>
                {guessList.length > 0 && (
                  <Text>
                    {guessFeedback.perfect_match > 0 || guessFeedback.partial_match > 0
                      ? '🟩'.repeat(guessFeedback.perfect_match) +
                        '🟧'.repeat(guessFeedback.partial_match)
                      : '🟥'}
                  </Text>
                )}
                {victory &&
                  (showAllSong ? (
                    <ViewOffIcon boxSize={7} onClick={handleClickShowSong} cursor="pointer" />
                  ) : (
                    <ViewIcon boxSize={7} onClick={handleClickShowSong} cursor="pointer" />
                  ))}
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
                  youtubeVideoId={youtubeVideoId} // Prop transmise
                  autoplay={autoplay} // Prop transmise
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
