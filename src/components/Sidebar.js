import React, { memo, useEffect, useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Divider,
  Text,
  Grid,
  Stack,
  Tag,
  Progress,
  Checkbox,
  CheckboxGroup,
  Tooltip,
} from '@chakra-ui/react';
import {
  SONG_AVAILABILITY_INITIAL,
  SONG_AVAILABILITY_INCREMENT,
  SONG_AVAILABILITY_THRESHOLD,
  SONGS_REQUIRED,
} from '../constants';

const Sidebar = ({ index, guessList, setIndex, foundSongs, trophies }) => {
  const [allSongs, setAllSongs] = useState([]);

  useEffect(() => {
    fetch('/paroldle/songs_lyrics.json')
      .then((response) => response.json())
      .then((data) => {
        const songsWithIndex = data.map((song, idx) => ({ ...song, index: idx }));
        setAllSongs(songsWithIndex);
      })
      .catch((err) => console.error("Erreur lors du chargement des chansons:", err));
  }, []);

  const availableLanguages = useMemo(() => {
    const langs = new Set();
    allSongs.forEach((song) => {
      if (song.lang) langs.add(song.lang);
    });
    return Array.from(langs);
  }, [allSongs]);

  const availableDecades = useMemo(() => {
    const decadesSet = new Set();
    allSongs.forEach((song) => {
      if (song.year) {
        const decade = Math.floor(song.year / 10) * 10;
        decadesSet.add(decade);
      }
    });
    return Array.from(decadesSet).sort((a, b) => a - b);
  }, [allSongs]);

  const availableStyles = useMemo(() => {
    const stylesSet = new Set();
    allSongs.forEach((song) => {
      if (song.style) stylesSet.add(song.style);
    });
    return Array.from(stylesSet);
  }, [allSongs]);

  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [filterAvailable, setFilterAvailable] = useState(false);

  // Calcul de la disponibilité des chansons par style avec une logique de palier.
  // Pour chaque style, on regroupe les chansons et on détermine le "palier débloqué" en
  // fonction des trophées et du nombre de chansons découvertes (chaque palier nécessitant SONGS_REQUIRED chansons).
  const availableSongsMap = useMemo(() => {
    const map = {};
    const songsByStyle = {};
    allSongs.forEach((song) => {
      if (song.style) {
        if (!songsByStyle[song.style]) songsByStyle[song.style] = [];
        songsByStyle[song.style].push(song);
      }
    });
    for (const style in songsByStyle) {
      const songsOfStyle = songsByStyle[style].sort((a, b) => a.index - b.index);
      // Nombre de chansons découvertes dans ce style
      const discoveredCount = songsOfStyle.filter((song) =>
        foundSongs && Object.hasOwn(foundSongs, song.index)
      ).length;
      // Calcul du palier débloqué actuel :
      // On peut considérer le palier atteint comme le minimum entre le palier basé sur les trophées et celui sur le nombre de chansons découvertes.
      const tierFromTrophies = Math.floor(trophies / SONG_AVAILABILITY_THRESHOLD);
      const tierFromDiscovered = Math.floor(discoveredCount / SONGS_REQUIRED);
      const unlockedTier = Math.min(tierFromTrophies, tierFromDiscovered);
      // Le pourcentage de déblocage s'accroît de SONG_AVAILABILITY_INCREMENT par palier
      const currentPercentage = SONG_AVAILABILITY_INITIAL + unlockedTier * SONG_AVAILABILITY_INCREMENT;
      const allowedCount = Math.ceil(songsOfStyle.length * currentPercentage / 100);
      map[style] = {
        allowed: new Set(songsOfStyle.slice(0, allowedCount).map((s) => s.index)),
        songsOfStyle,
        allowedCount,
        discoveredCount,
        unlockedTier,
      };
    }
    return map;
  }, [allSongs, trophies, foundSongs]);

  // Filtre global appliquant également le filtre "disponible uniquement"
  const filteredSongs = useMemo(() => {
    let songs = allSongs.filter((song) => {
      if (selectedLanguages.length > 0 && !selectedLanguages.includes(song.lang)) {
        return false;
      }
      if (selectedDecades.length > 0 && !selectedDecades.includes(Math.floor(song.year / 10) * 10)) {
        return false;
      }
      if (selectedStyles.length > 0 && !selectedStyles.includes(song.style)) {
        return false;
      }
      return true;
    });
    if (filterAvailable) {
      songs = songs.filter((song) => availableSongsMap[song.style]?.allowed.has(song.index));
    }
    return songs;
  }, [allSongs, selectedLanguages, selectedDecades, selectedStyles, filterAvailable, availableSongsMap]);

  // Fonction pour obtenir les trophées et chansons manquantes pour débloquer LA chanson.
  // On cherche le plus petit palier targetTier tel que le nombre de chansons autorisées
  // (calculé avec SONG_AVAILABILITY_INITIAL + targetTier × SONG_AVAILABILITY_INCREMENT)
  // soit supérieur au rang de la chanson dans le style.
  const getRequirementsForSong = (song) => {
    const styleInfo = availableSongsMap[song.style];
    if (!styleInfo) return { missingTrophies: 0, missingSongs: 0 };
    const { songsOfStyle, discoveredCount } = styleInfo;
    const totalSongsInStyle = songsOfStyle.length;
    // Détermine le rang (0-indexé) de la chanson dans le style
    const rank = songsOfStyle.findIndex((s) => s.index === song.index);
    // On démarre à partir du palier actuellement débloqué (tel que calculé à partir des trophées et découvertes)
    const currentTier = Math.min(
      Math.floor(trophies / SONG_AVAILABILITY_THRESHOLD),
      Math.floor(discoveredCount / SONGS_REQUIRED)
    );
    let targetTier = currentTier;
    // Incrémente targetTier jusqu'à ce que la chanson soit débloquée à ce palier
    while (true) {
      const currentPercentage = SONG_AVAILABILITY_INITIAL + targetTier * SONG_AVAILABILITY_INCREMENT;
      const allowedCount = Math.ceil(totalSongsInStyle * currentPercentage / 100);
      if (rank < allowedCount) break;
      targetTier++;
      // On peut fixer une borne supérieure pour éviter une boucle infinie
      if (targetTier > 100) break;
    }
    // Pour débloquer le palier targetTier, il faut :
    // - Trophées requis : targetTier * SONG_AVAILABILITY_THRESHOLD
    // - Chansons découvertes requises : targetTier * SONGS_REQUIRED
    const requiredTrophies = targetTier * SONG_AVAILABILITY_THRESHOLD;
    const missingTrophies = Math.max(0, requiredTrophies - trophies);
    const requiredSongs = targetTier * SONGS_REQUIRED;
    const missingSongs = Math.max(0, requiredSongs - discoveredCount);
    return { missingTrophies, missingSongs };
  };

  const progressValue =
    filteredSongs.length > 0
      ? (filteredSongs.filter((song) => Object.keys(foundSongs).includes(String(song.index))).length /
          filteredSongs.length) *
        100
      : 0;

  return (
    <Box maxW="350px" mx="auto" h="100%">
      <Box bg="rgb(255,245,204)" p={6} borderRadius="3xl" textAlign="center" boxShadow="lg">
        <Heading size="lg" mb={3} color="black">
          🎵 Paroldle
        </Heading>
        <Heading size="md" mb={4} color="black">
          Chanson n° {index + 1}
        </Heading>
        <Divider width="60%" borderWidth="2px" borderColor="black" mx="auto" mb={4} />
        {guessList.length > 0 && (
          <Box mb={4}>
            <Text fontSize="lg" fontWeight="bold" color="black" mb={2}>
              Essais précédents
            </Text>
            <Stack
              spacing={2}
              direction="row"
              flexWrap="wrap"
              justify="center"
              maxH="200px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
                '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '3px' },
                '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
              }}
            >
              {guessList.map((word, i) => (
                <Tag
                  key={i}
                  size="md"
                  variant="solid"
                  bg="rgb(255,245,204)"
                  color="black"
                  border="1px solid black"
                >
                  {guessList.length - i}. {word}
                </Tag>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Filtres */}
      <Box bg="rgb(163,193,224)" p={6} borderRadius="3xl" boxShadow="md" mt={6} color="black">
        <Heading size="lg" mb={4} textAlign="center" color="black">
          Filtres
        </Heading>
        <Stack spacing={4}>
          <Box>
            <Text fontWeight="bold" mb={2}>
              Langue
            </Text>
            <CheckboxGroup value={selectedLanguages} onChange={(vals) => setSelectedLanguages(vals)}>
              <Stack direction="row" wrap="wrap">
                {availableLanguages.map((lang) => (
                  <Checkbox key={lang} value={lang}>
                    {lang === 'french' ? 'Français' : 'Anglais'}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </Box>
          <Box>
            <Text fontWeight="bold" mb={2}>
              Décennies
            </Text>
            <CheckboxGroup
              value={selectedDecades.map(String)}
              onChange={(vals) => setSelectedDecades(vals.map(Number))}
            >
              <Stack direction="row" wrap="wrap">
                {availableDecades.map((decade) => (
                  <Checkbox key={decade} value={String(decade)}>
                    {decade}s
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </Box>
          <Box>
            <Text fontWeight="bold" mb={2}>
              Style
            </Text>
            <CheckboxGroup value={selectedStyles} onChange={(vals) => setSelectedStyles(vals)}>
              <Stack direction="row" wrap="wrap">
                {availableStyles.map((style) => (
                  <Checkbox key={style} value={style}>
                    {style}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </Box>
          <Divider />
          <Box alignItems="center" textAlign="center">
            <Checkbox isChecked={filterAvailable} onChange={(e) => setFilterAvailable(e.target.checked)}>
              Chansons débloquées
            </Checkbox>
          </Box>
        </Stack>
      </Box>

      <Box bg="rgb(240,240,240)" p={6} borderRadius="3xl" boxShadow="md" mt={6} color="black">
        <Heading size="lg" mb={4} textAlign="center">
          Chansons
        </Heading>
        <Progress
          value={progressValue}
          size="sm"
          borderRadius="md"
          bg="gray.200"
          colorScheme="purple"
          mb={4}
        />
        <Grid
          templateColumns="repeat(auto-fill, minmax(40px, 1fr))"
          gap={2}
          maxH="400px"
          overflowY="auto"
          pr="2"
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
          }}
        >
          {filteredSongs.map((song) => {
            const styleInfo = availableSongsMap[song.style];
            const available = styleInfo ? styleInfo.allowed.has(song.index) : true;

            // Vérifie si la chanson a déjà été trouvée
            const songState = Object.hasOwn(foundSongs, song.index) ? foundSongs[song.index] : null;

            let bg, bgGradient, hover;
            if (songState === "normal") {
              bg = 'green.400';
              hover = 'green.500';
            } else if (songState === "hardcore") {
              bgGradient = "linear(to-r, red.400, orange.400)";
              hover = 'orange.500';
            } else if (songState === "abandonned") {
              bg = 'purple.400';
              hover = 'purple.500';
            } else if (available) {
              bg = 'gray.600';
              hover = 'gray.700';
            } else {
              bg = 'gray.400';
              hover = 'gray.400';
            }

            if (song.index === index) {
              bg = hover;
            }

            // Si la chanson n'est pas disponible, on affiche dans le tooltip
            // le nombre de trophées et de chansons manquantes pour débloquer la chanson.
            const { missingTrophies, missingSongs } = getRequirementsForSong(song);
            const tooltipLabel = available
              ? ''
              : `Il vous manque ${missingTrophies > 0 ? `${missingTrophies} trophées` : ''}${
                  missingTrophies > 0 && missingSongs > 0 ? ' et ' : ''
                }${missingSongs > 0 ? `${missingSongs} chanson${missingSongs > 1 ? 's' : ''} de la catégorie ${song.style}.` : ''}`;

            return (
              <Tooltip key={song.index} label={tooltipLabel} hasArrow>
                <Tag
                  size="md"
                  variant="solid"
                  cursor={available ? "pointer" : "not-allowed"}
                  onClick={() => available && setIndex(song.index)}
                  {...(bgGradient ? { bgGradient } : { bg })}
                  _hover={{ bg: hover }}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  textAlign="center"
                >
                  {song.index + 1}
                </Tag>
              </Tooltip>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default memo(Sidebar);
