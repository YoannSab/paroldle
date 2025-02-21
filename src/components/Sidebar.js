import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
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
  Button
} from '@chakra-ui/react';
import { SONG_AVAILABILITY_THRESHOLD, SONGS_REQUIRED } from '../constants';

const MAX_VISIBLE_PER_GROUP = 20;
const MAX_GROUP_HEIGHT = 250; // en pixels

// ---------- GuessListDisplay ----------
const GuessListDisplay = memo(({ guessList }) => {
  if (guessList.length === 0) return null;
  return (
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
  );
});

// ---------- Filters ----------
const Filters = memo(({
  availableLanguages,
  availableDecades,
  availableStyles,
  selectedLanguages,
  setSelectedLanguages,
  selectedDecades,
  setSelectedDecades,
  selectedStyles,
  setSelectedStyles,
  filterAvailable,
  setFilterAvailable,
  selectedStatuses,
  setSelectedStatuses,
}) => {
  return (
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
        {/* Nouveau groupe de filtres pour l'état de la chanson */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            État de la chanson
          </Text>
          <CheckboxGroup value={selectedStatuses} onChange={(vals) => setSelectedStatuses(vals)}>
            <Stack direction="row" wrap="wrap">
              <Checkbox isChecked={filterAvailable} onChange={(e) => setFilterAvailable(e.target.checked)}>Débloquées</Checkbox>
              <Checkbox value="not_found">Non trouvées</Checkbox>
              <Checkbox value="hardcore">Trouvées (hardcore)</Checkbox>
              <Checkbox value="normal">Trouvées (normal)</Checkbox>
              <Checkbox value="abandonned">Abandonnées</Checkbox>
            </Stack>
          </CheckboxGroup>
        </Box>
      </Stack>
    </Box>
  );
});

// ---------- SongsDisplay ----------
const SongsDisplay = memo(({
  index,
  groupedSongs,
  currentTierPerStyle,
  foundSongs,
  toggleGroup,
  expandedStyles,
  setIndex,
  getRequirementsForSong,
  progressValue,
}) => {
  return (
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
      {Object.keys(groupedSongs).length === 0 ? (
        <Text>Aucune chanson à afficher.</Text>
      ) : (
        Object.entries(groupedSongs).map(([style, songs]) => {
          const currentTier = currentTierPerStyle[style]?.unlockedTier || 1;
          const songsWithAvailability = songs.map((song) => {
            const isAvailable = song.tier <= currentTier || Object.hasOwn(foundSongs, song.index);
            return { ...song, isAvailable };
          });
          const isExpanded = expandedStyles[style];
          const songsToShow = isExpanded
            ? songsWithAvailability
            : songsWithAvailability.slice(
                0,
                MAX_VISIBLE_PER_GROUP + (currentTierPerStyle[style]?.foundCount || 0)
              );
          return (
            <Box key={style} mb={6}>
              <Heading size="md" mb={2} color="black">
                {style}
              </Heading>
              <Box
                maxH={MAX_GROUP_HEIGHT}
                overflowY="auto"
                border="1px solid #ccc"
                borderRadius="md"
                p={2}
              >
                <Grid templateColumns="repeat(auto-fill, minmax(40px, 1fr))" gap={2}>
                  {songsToShow.map((song) => {
                    const { missingTrophies, missingSongs } = getRequirementsForSong(song);
                    const tooltipLabel = song.isAvailable
                      ? ''
                      : `Il vous manque ${
                          missingTrophies > 0 ? `${missingTrophies} trophées` : ''
                        }${missingTrophies > 0 && missingSongs > 0 ? ' et ' : ''}${
                          missingSongs > 0 ? `${missingSongs} chanson${missingSongs > 1 ? 's' : ''}` : ''
                        } pour débloquer.`;
                    let bg, hover;
                    const songState = Object.hasOwn(foundSongs, song.index)
                      ? foundSongs[song.index]
                      : null;
                    if (songState === "normal") {
                      bg = 'green.400';
                      hover = 'green.500';
                    } else if (songState === "hardcore") {
                      bg = 'red.400';
                      hover = 'red.500';
                    } else if (songState === "abandonned") {
                      bg = 'purple.400';
                      hover = 'purple.500';
                    } else if (song.isAvailable) {
                      bg = 'gray.600';
                      hover = 'gray.700';
                    } else {
                      bg = 'gray.400';
                      hover = 'gray.400';
                    }
                    if (song.index === index) {
                      bg = hover;
                    }
                    return (
                      <Tooltip key={song.index} label={tooltipLabel} hasArrow>
                        <Tag
                          size="md"
                          variant="solid"
                          cursor={song.isAvailable ? "pointer" : "not-allowed"}
                          onClick={() => song.isAvailable && setIndex(song.index)}
                          bg={bg}
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
              {songsWithAvailability.length > MAX_VISIBLE_PER_GROUP && (
                <Box textAlign="center" mt={2}>
                  <Button size="sm" onClick={() => toggleGroup(style)}>
                    {isExpanded ? "Afficher moins" : "Afficher plus"}
                  </Button>
                </Box>
              )}
            </Box>
          );
        })
      )}
    </Box>
  );
});

// ---------- Composant principal Sidebar ----------
const Sidebar = ({ index, guessList, setIndex, foundSongs, trophies }) => {
  const [allSongs, setAllSongs] = useState([]);
  
  // Filtres locaux
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [filterAvailable, setFilterAvailable] = useState(false);
  // Nouveaux filtres pour l'état des chansons
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  
  // Pour gérer l’expansion par style
  const [expandedStyles, setExpandedStyles] = useState({});

  // Chargement initial de la songList (imaginée comme statique)
  useEffect(() => {
    fetch('/songs_lyrics.json')
      .then((response) => response.json())
      .then((data) => {
        // Chaque chanson possède déjà les attributs "index" et "tier"
        setAllSongs(data);
      })
      .catch((err) => console.error("Erreur lors du chargement des chansons:", err));
  }, []);

  // Pré-calcul : regrouper et trier les chansons par style (une seule fois)
  const sortedSongsByStyle = useMemo(() => {
    const groups = {};
    allSongs.forEach((song) => {
      if (!groups[song.style]) groups[song.style] = [];
      groups[song.style].push(song);
    });
    Object.keys(groups).forEach((style) => {
      groups[style].sort((a, b) => a.index - b.index);
    });
    return groups;
  }, [allSongs]);

  // Calcul du tier courant par style en fonction des chansons découvertes et des trophées
  const currentTierPerStyle = useMemo(() => {
    const result = {};
    Object.keys(sortedSongsByStyle).forEach((style) => {
      const songs = sortedSongsByStyle[style];
      const discoveredCount = songs.filter(
        (song) =>
          Object.hasOwn(foundSongs, song.index) &&
          foundSongs[song.index] !== "abandonned"
      ).length;
      const foundCount = songs.filter((song) => Object.hasOwn(foundSongs, song.index)).length;
      const tierFromTrophies = Math.floor(trophies / SONG_AVAILABILITY_THRESHOLD);
      const tierFromDiscovered = Math.floor(discoveredCount / SONGS_REQUIRED);
      const unlockedTier = Math.min(tierFromTrophies, tierFromDiscovered) + 1;
      result[style] = { discoveredCount, unlockedTier, foundCount };
    });
    return result;
  }, [sortedSongsByStyle, foundSongs, trophies]);

  // Langues, décennies et styles disponibles
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

  // Regroupe les chansons par style en appliquant les filtres simples ET le filtre par état
  const groupedSongs = useMemo(() => {
    const groups = {};
    Object.keys(sortedSongsByStyle).forEach((style) => {
      const filteredSongs = sortedSongsByStyle[style].filter((song) => {
        if (selectedLanguages.length > 0 && !selectedLanguages.includes(song.lang))
          return false;
        if (selectedDecades.length > 0 && !selectedDecades.includes(Math.floor(song.year / 10) * 10))
          return false;
        if (selectedStyles.length > 0 && !selectedStyles.includes(song.style))
          return false;
        // Filtrage par état de la chanson
        if (selectedStatuses.length > 0) {
          const status = Object.hasOwn(foundSongs, song.index)
            ? foundSongs[song.index]
            : "not_found";
          if (!selectedStatuses.includes(status)) return false;
        }
        return true;
      });
      if (filteredSongs.length > 0) {
        if (filterAvailable) {
          const unlockedTier = currentTierPerStyle[style]?.unlockedTier || 1;
          groups[style] = filteredSongs.filter(
            (song) => song.tier <= unlockedTier || Object.hasOwn(foundSongs, song.index)
          );
        } else {
          groups[style] = filteredSongs;
        }
      }
    });
    return groups;
  }, [
    sortedSongsByStyle,
    selectedLanguages,
    selectedDecades,
    selectedStyles,
    filterAvailable,
    currentTierPerStyle,
    foundSongs,
    selectedStatuses,
  ]);

  // Calcul de la progression globale
  const filteredFlat = useMemo(() => Object.values(groupedSongs).flat(), [groupedSongs]);
  const progressValue =
    filteredFlat.length > 0
      ? (filteredFlat.filter((song) => Object.hasOwn(foundSongs, song.index)).length / filteredFlat.length) * 100
      : 0;

  // Permet d'afficher/masquer un groupe de style
  const toggleGroup = useCallback((style) => {
    setExpandedStyles((prev) => ({ ...prev, [style]: !prev[style] }));
  }, []);

  // Calcul des trophées et chansons manquants pour débloquer une chanson
  const getRequirementsForSong = useCallback(
    (song) => {
      const discoveredCount = currentTierPerStyle[song.style]?.discoveredCount || 0;
      const targetTier = song.tier;
      const requiredTrophies = targetTier * SONG_AVAILABILITY_THRESHOLD;
      const missingTrophies = Math.max(0, requiredTrophies - trophies);
      const requiredSongs = targetTier * SONGS_REQUIRED;
      const missingSongs = Math.max(0, requiredSongs - discoveredCount);
      return { missingTrophies, missingSongs };
    },
    [currentTierPerStyle, trophies]
  );

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
        <GuessListDisplay guessList={guessList} />
      </Box>

      <Filters
        availableLanguages={availableLanguages}
        availableDecades={availableDecades}
        availableStyles={availableStyles}
        selectedLanguages={selectedLanguages}
        setSelectedLanguages={setSelectedLanguages}
        selectedDecades={selectedDecades}
        setSelectedDecades={setSelectedDecades}
        selectedStyles={selectedStyles}
        setSelectedStyles={setSelectedStyles}
        filterAvailable={filterAvailable}
        setFilterAvailable={setFilterAvailable}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
      />

      <SongsDisplay
        index={index}
        groupedSongs={groupedSongs}
        currentTierPerStyle={currentTierPerStyle}
        foundSongs={foundSongs}
        toggleGroup={toggleGroup}
        expandedStyles={expandedStyles}
        setIndex={setIndex}
        getRequirementsForSong={getRequirementsForSong}
        progressValue={progressValue}
      />
    </Box>
  );
};

export default memo(Sidebar);
