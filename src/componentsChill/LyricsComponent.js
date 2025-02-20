import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, IconButton, Heading, Flex } from "@chakra-ui/react";
import { FaLightbulb } from "react-icons/fa";
import {
  stringToList,
  isAlphanumeric,
  matchWord,
} from "../lyricsUtils";

const LyricsComponent = ({
  song,
  index,
  victory,
  setVictory,
  guess,
  setGuess,
  showAllSong,
  setGuessFeedback,
  isReady,
  setIsReady,
  youtubeVideoId, // nouveau prop
  autoplay, // nouveau prop
}) => {
  // Création des listes de tokens pour le titre, les paroles et l'artiste
  const title = useMemo(() => (song ? stringToList(song.title, song.lang) : []), [song]);
  const lyrics = useMemo(() => (song ? stringToList(song.lyrics, song.lang) : []), [song]);
  const artist = useMemo(() => (song ? stringToList(song.author, song.lang) : []), [song]);

  // Calcul des indices initiaux pour les tokens non alphanumériques
  const initialFound = useMemo(() => {
    const computeFound = (list) =>
      list.reduce((acc, word, i) => {
        if (!isAlphanumeric(word)) acc.push(i);
        return acc;
      }, []);
    return {
      title: computeFound(title),
      lyrics: computeFound(lyrics),
      artist: computeFound(artist),
    };
  }, [title, lyrics, artist]);

  // États locaux pour suivre la progression
  const [found, setFound] = useState({ title: [], lyrics: [], artist: [] });
  const [partial, setPartial] = useState({ title: {}, lyrics: {}, artist: {} });
  const [currentFound, setCurrentFound] = useState({
    title: [],
    lyrics: [],
    artist: [],
  });

  // État local pour les clues (5 par défaut)
  const [clues, setClues] = useState(1000000);

  /**
   * Lors du chargement d'une chanson, on tente de récupérer la progression
   * sauvegardée dans le localStorage (identifiée par index).
   * Si aucune donnée n'est trouvée, on initialise avec les valeurs par défaut.
   */
  useEffect(() => {
    if (song) {
      setIsReady(false);
      const storedFound = localStorage.getItem(`paroldle_chill_found_${index}`);
      const storedPartial = localStorage.getItem(`paroldle_chill_partial_${index}`);
      const storedClues = localStorage.getItem(`paroldle_chill_clues_${index}`);
      setFound(storedFound ? JSON.parse(storedFound) : initialFound);
      setPartial(
        storedPartial ? JSON.parse(storedPartial) : { title: {}, lyrics: {}, artist: {} }
      );
      setClues(storedClues ? parseInt(storedClues, 10) : 100000);
      setCurrentFound({ title: [], lyrics: [], artist: [] });
      setGuessFeedback({ perfect_match: 0, partial_match: 0 });
      setIsReady(true);
    }
    // eslint-disable-next-line
  }, [song, initialFound]);

  // Persistance de l'état "found" dans le localStorage
  useEffect(() => {
    if (isReady && song) {
      localStorage.setItem(`paroldle_chill_found_${index}`, JSON.stringify(found));
    }
    // eslint-disable-next-line
  }, [found]);

  // Persistance de l'état "partial" dans le localStorage
  useEffect(() => {
    if (isReady && song) {
      localStorage.setItem(
        `paroldle_chill_partial_${index}`,
        JSON.stringify(partial)
      );
    }
    // eslint-disable-next-line
  }, [partial]);

  // Persistance du nombre de clues dans le localStorage
  useEffect(() => {
    if (isReady && song) {
      localStorage.setItem(`paroldle_chill_clues_${index}`, clues);
    }
  }, [clues]);

  // Fonction qui met à jour les indices trouvés pour une section, en détectant également les partial matches
  const updateSectionFound = useCallback(
    (wordList, currentFoundIndices, currentFoundPartial) => {
      const newFoundIndices = [];
      const newPartial = {};
      for (let i = 0; i < wordList.length; i++) {
        if (currentFoundIndices.includes(i)) continue;
        if (!guess) continue;
        const sim = matchWord(guess, wordList[i], song.lang);
        if (sim === 1) {
          newFoundIndices.push(i);
        } else if (sim >= 0.7) {
          if (!currentFoundPartial[i] || currentFoundPartial[i][1] < sim) {
            newPartial[i] = [guess, sim.toFixed(2)];
          }
        }
      }
      return { newFoundIndices, newPartial };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guess]
  );

  // Mise à jour des indices trouvés à chaque modification du "guess"
  useEffect(() => {
    if (!guess || !song) return;

    const sections = { title, lyrics, artist };
    const newResults = {};
    let totalNewMatches = 0;
    let totalPartialMatches = 0;

    Object.keys(sections).forEach((section) => {
      newResults[section] = updateSectionFound(
        sections[section],
        found[section],
        partial[section]
      );
      totalNewMatches += newResults[section].newFoundIndices.length;
      totalPartialMatches += Object.keys(newResults[section].newPartial).length;
    });

    setFound((prev) => ({
      title: [...prev.title, ...newResults.title.newFoundIndices],
      lyrics: [...prev.lyrics, ...newResults.lyrics.newFoundIndices],
      artist: [...prev.artist, ...newResults.artist.newFoundIndices],
    }));

    setPartial((prev) => ({
      title: { ...prev.title, ...newResults.title.newPartial },
      lyrics: { ...prev.lyrics, ...newResults.lyrics.newPartial },
      artist: { ...prev.artist, ...newResults.artist.newPartial },
    }));

    setCurrentFound({
      title: newResults.title.newFoundIndices,
      lyrics: newResults.lyrics.newFoundIndices,
      artist: newResults.artist.newFoundIndices,
    });

    setGuessFeedback({
      perfect_match: totalNewMatches,
      partial_match: totalPartialMatches,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guess]);

  // Déclenche la victoire si tous les mots du titre ont été trouvés
  useEffect(() => {
    if (isReady && !victory && title.length > 0 && found.title.length === title.length) {
      setVictory(true);
    }
  }, [found.title, title, setVictory, isReady, victory]);

  // --- Gestion du Clue ---

  // Calcule le nombre total de mots alphanumériques dans les paroles
  const totalLyricsAlpha = useMemo(
    () => lyrics.filter((word) => isAlphanumeric(word)).length,
    [lyrics]
  );

  // Calcule le nombre de mots alphanumériques trouvés dans les paroles
  const foundLyricsAlpha = useMemo(
    () =>
      found.lyrics.filter((i) => isAlphanumeric(lyrics[i])).length,
    [found.lyrics, lyrics]
  );

  // Révèle un mot aléatoire parmi les plus longs (hors titre) et décrémente le nombre de clues
  const handleHelp = useCallback(() => {
    if (!song || clues <= 0) return;
    const candidateIndices = lyrics.reduce((acc, word, i) => {
      if (
        isAlphanumeric(word) &&
        !found.lyrics.includes(i) &&
        !title.includes(word)
      ) {
        acc.push(i);
      }
      return acc;
    }, []);

    if (candidateIndices.length === 0) return; // Tous les mots sont déjà révélés

    // Parmi ces candidats, ne conserver que ceux ayant la longueur maximale
    const maxLength = Math.max(...candidateIndices.map(i => lyrics[i].length));
    const filteredCandidates = candidateIndices.filter(i => lyrics[i].length === maxLength);

    // Choisir aléatoirement un indice parmi les candidats filtrés
    const randomIndex =
      filteredCandidates[Math.floor(Math.random() * filteredCandidates.length)];

    setGuess(lyrics[randomIndex]);

    // Décrémente le nombre de clues
    setClues(prev => prev - 1);
  }, [song, lyrics, found.lyrics, clues, title]);

  // Création d'une structure "lignes" à partir de "lyrics"
  // On regroupe les tokens entre les sauts de ligne ("\n") en gardant leur index d'origine.
  const lyricLines = useMemo(() => {
    const lines = [];
    let currentLine = [];
    lyrics.forEach((word, i) => {
      if (word === "\n") {
        lines.push(currentLine);
        currentLine = [];
      } else {
        currentLine.push({ word, index: i });
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  }, [lyrics]);

  // Divise les lignes en deux colonnes égales
  const midLine = Math.ceil(lyricLines.length / 2);
  const leftColumn = lyricLines.slice(0, midLine);
  const rightColumn = lyricLines.slice(midLine);

  if (!isReady) {
    return <Text>Chargement...</Text>;
  }

  return (
    <Box position="relative" p={4} fontFamily="Montserrat, sans-serif">
      {/* Icône Clue et compteur en haut à droite */}
      <Box
        position="absolute"
        top={4}
        right={4}
        display="flex"
        alignItems="center"
        gap={3}
        zIndex={10}
      >
        <Text fontWeight="bold" px={3} py={1} borderRadius="full" bg="whiteAlpha.800">
          {foundLyricsAlpha} / {totalLyricsAlpha}
        </Text>
        <Box position="relative">
          <IconButton
            icon={<FaLightbulb />}
            onClick={handleHelp}
            variant="ghost"
            size="lg"
            colorScheme="teal"
            isDisabled={clues <= 0}
            aria-label="Clue"
          />
          <Box
            position="absolute"
            top="-4px"
            right="-4px"
            bg="teal.500"
            color="white"
            borderRadius="full"
            width="20px"
            height="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="xs"
          >
            ∞{/*clues*/}
          </Box>
        </Box>
      </Box>

      {/* Affichage du titre */}
      <Box mb={2} textAlign="center">
        <Heading as="h1" fontSize="4xl">
          {title.map((word, i) => (
            <LyricWords
              key={`title-${i}`}
              prevWord={title[i - 1]}
              word={word}
              isCurrentGuess={currentFound.title.includes(i)}
              found={found.title.includes(i) || showAllSong || victory}
              partialMatch={partial.title[i] ? partial.title[i][0] : null}
              fontSize="inherit"
            />
          ))}
        </Heading>
      </Box>

      {/* Affichage de l'artiste */}
      <Box mb={4} textAlign="center">
        <Heading as={'h2'} fontSize="2xl">
          {artist.map((word, i) => (
            <LyricWords
              key={`artist-${i}`}
              prevWord={artist[i - 1]}
              word={word}
              isCurrentGuess={currentFound.artist.includes(i)}
              found={found.artist.includes(i) || showAllSong || victory}
              partialMatch={partial.artist[i] ? partial.artist[i][0] : null}
              fontSize="inherit"
            />
          ))}
        </Heading>
      </Box>

      {/* Affichage de la vidéo YouTube, placée sous le titre et l'artiste */}
      {victory && youtubeVideoId && (
        <Box mt={4} mx="auto" maxW="300px">
          <iframe
            width="300"
            height="170"
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${autoplay ? 1 : 0}` }
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Lecture de la musique"
          />
        </Box>
      )}

      {/* Affichage des paroles en deux colonnes centrées */}
      <Flex justifyContent="center" mt={4}>
        {/* Colonne de gauche */}
        <Box textAlign="left" pr={100}>
          {leftColumn.map((line, lineIndex) => (
            <Box key={`left-line-${lineIndex}`}>
              {line.map((item, wordIndex) => (
                <LyricWords
                  key={`left-${lineIndex}-${wordIndex}`}
                  prevWord={wordIndex === 0 ? null : line[wordIndex - 1].word}
                  word={item.word}
                  isCurrentGuess={currentFound.lyrics.includes(item.index)}
                  found={found.lyrics.includes(item.index) || showAllSong}
                  partialMatch={
                    partial.lyrics[item.index]
                      ? partial.lyrics[item.index][0]
                      : null
                  }
                />
              ))}
              <br />
            </Box>
          ))}
        </Box>

        {/* Colonne de droite */}
        <Box textAlign="left" pl={2}>
          {rightColumn.map((line, lineIndex) => (
            <Box key={`right-line-${lineIndex}`}>
              {line.map((item, wordIndex) => (
                <LyricWords
                  key={`right-${lineIndex}-${wordIndex}`}
                  prevWord={wordIndex === 0 ? null : line[wordIndex - 1].word}
                  word={item.word}
                  isCurrentGuess={currentFound.lyrics.includes(item.index)}
                  found={found.lyrics.includes(item.index) || showAllSong}
                  partialMatch={
                    partial.lyrics[item.index]
                      ? partial.lyrics[item.index][0]
                      : null
                  }
                />
              ))}
              <br />
            </Box>
          ))}
        </Box>
      </Flex>
    </Box>
  );
};

const LyricWords = memo(
  ({ prevWord, word, isCurrentGuess, found, partialMatch, fontSize }) => {
    const [showWordLength, setShowWordLength] = useState(false);

    // Calcul de la marge à gauche en fonction du mot précédent
    const marginLeft = useMemo(() => {
      return !prevWord || prevWord === "\n" || (!isAlphanumeric(word) && !`("&-)`.includes(word))
        ? 0
        : 2;
    }, [prevWord, word]);

    const handleClick = () => {
      if (!found && isAlphanumeric(word)) {
        setShowWordLength(true);
        setTimeout(() => setShowWordLength(false), 2000);
      }
    };

    if (found) {
      return isCurrentGuess ? (
        <Box
          backgroundColor="green.300"
          display="inline-block"
          pl={1}
          pr={1}
          ml={marginLeft}
          textAlign="center"
          borderRadius="md"
          height={"1.5ch"}
          transform={"translateY(3px)"}
        >
          <Text fontSize={fontSize ? fontSize : "md"} fontFamily="inherit" transform={"translateY(-3px)"}>
            {word}
          </Text>
        </Box>
      ) : (
        <Text display="inline-block" ml={marginLeft} fontSize={fontSize ? fontSize : "md"} fontFamily="inherit">
          {word}
        </Text>
      );
    }

    return (
      <Box
        ml={marginLeft}
        backgroundColor="gray.600"
        display="inline-block"
        cursor="pointer"
        position="relative"
        onClick={handleClick}
        textAlign="center"
        borderRadius="md"
        transform="translateY(3px)"
        width={partialMatch ? `${partialMatch.length +1}ch` : `${word.length}ch`}
        height="1.5ch"
      >
        {showWordLength && (
          <Text
            color="white"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            fontWeight="bold"
            fontSize="sm"
            fontFamily="inherit"
          >
            {word.length}
          </Text>
        )}
        {!showWordLength && partialMatch && (
          <Text
            color="orange"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -52%)"
            fontSize="sm"
            fontFamily="inherit"
          >
            {partialMatch}
          </Text>
        )}
      </Box>
    );
  }
);

export default memo(LyricsComponent);