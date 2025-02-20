// Sidebar.js
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
} from '@chakra-ui/react';

const Sidebar = ({ index, guessList, setIndex, foundSongs }) => {
  // État pour récupérer toutes les chansons depuis le JSON
  const [allSongs, setAllSongs] = useState([]);

  useEffect(() => {
    fetch('/paroldle/songs_lyrics.json')
      .then(response => response.json())
      .then(data => {
        // On ajoute un attribut "index" à chaque chanson pour pouvoir la référencer
        const songsWithIndex = data.map((song, idx) => ({ ...song, index: idx }));
        setAllSongs(songsWithIndex);
      })
      .catch(err => console.error("Erreur lors du chargement des chansons:", err));
  }, []);

  // Calcul des options disponibles pour chaque critère
  const availableLanguages = useMemo(() => {
    const langs = new Set();
    allSongs.forEach(song => {
      if (song.lang) langs.add(song.lang);
    });
    return Array.from(langs);
  }, [allSongs]);

  const availableDecades = useMemo(() => {
    const decadesSet = new Set();
    allSongs.forEach(song => {
      if (song.year) {
        const decade = Math.floor(song.year / 10) * 10;
        decadesSet.add(decade);
      }
    });
    return Array.from(decadesSet).sort((a, b) => a - b);
  }, [allSongs]);

  const availableStyles = useMemo(() => {
    const stylesSet = new Set();
    allSongs.forEach(song => {
      if (song.style) stylesSet.add(song.style);
    });
    return Array.from(stylesSet);
  }, [allSongs]);

  // États pour les filtres sélectionnés
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);

  // Calcul de la liste des chansons filtrées en fonction des filtres sélectionnés
  const filteredSongs = useMemo(() => {
    return allSongs.filter(song => {
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
  }, [allSongs, selectedLanguages, selectedDecades, selectedStyles]);

  // Calcul du pourcentage de chansons trouvées parmi celles filtrées
  const progressValue =
    filteredSongs.length > 0
      ? (filteredSongs.filter(song => foundSongs.includes(song.index)).length / filteredSongs.length) * 100
      : 0;

  return (
    <Box p={{ base: 4, md: 5 }} maxW="350px" mx="auto" mt={5}>
      {/* En-tête avec le titre et l'historique des essais */}
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

      {/* Section des filtres */}
      <Box bg="rgb(163,193,224)" p={6} borderRadius="3xl" boxShadow="md" mt={6} color="black">
        <Heading size="lg" mb={4} textAlign="center" color="black">
          Filtres
        </Heading>
        <Stack spacing={4}>
          {/* Filtre par langue */}
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

          {/* Filtre par décennies */}
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

          {/* Filtre par style */}
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
        </Stack>
      </Box>

      {/* Liste des chansons filtrées avec barre de progression */}
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
          maxH="600px"
          overflowY="auto"
          pr="2"  // Décale la scrollbar un peu à droite
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
          }}
        >
          {filteredSongs.map((song) => (
            <Tag
              key={song.index}
              size="md"
              variant="solid"
              cursor="pointer"
              onClick={() => setIndex(song.index)}
              bg={
                song.index === index
                  ? 'pink.300'
                  : foundSongs.includes(song.index)
                  ? 'green.300'
                  : 'gray.300'
              }
              _hover={{
                bg:
                  song.index === index
                    ? 'pink.400'
                    : foundSongs.includes(song.index)
                    ? 'green.400'
                    : 'gray.400',
              }}
              display="flex"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
            >
              {song.index + 1}
            </Tag>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default memo(Sidebar);