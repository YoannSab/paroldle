import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, IconButton, Heading, Flex, Button } from "@chakra-ui/react";
import { FaLightbulb } from "react-icons/fa";
import {
  stringToList,
  isAlphanumeric,
  matchWord,
} from "../lyricsUtils";

// import { cosineSimilarity } from "../compare_words";

import { N_CLUES, CLUE_COST_COUNT, CLUE_COST_TROPHIES, N_CLUE_BUY, useColors } from "../constants";
import Loading from "./Loading";
import { useTranslation } from "react-i18next";

const LyricsComponent = ({
  song,
  index,
  gameState,
  gameMode,
  setGameState,
  guess,
  setGuess,
  showAllSong,
  setGuessFeedback,
  isReady,
  setIsReady,
  autoplay,
  trophies,
  setTrophies,
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  const title = useMemo(() => (song ? stringToList(song.title, song.lang) : []), [song]);
  const lyrics = useMemo(() => (song ? stringToList(song.lyrics, song.lang) : []), [song]);
  const artist = useMemo(() => (song ? stringToList(song.author, song.lang) : []), [song]);

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

  const [found, setFound] = useState({ title: [], lyrics: [], artist: [] });
  const [partial, setPartial] = useState({ title: {}, lyrics: {}, artist: {} });
  const [currentFound, setCurrentFound] = useState({
    title: [],
    lyrics: [],
    artist: [],
  });

  const [clues, setClues] = useState(N_CLUES);
  const [unlockedYear, setUnlockedYear] = useState(false);

  useEffect(() => {
    if (song && index !== null && gameMode !== "") {
      setIsReady(false);
      const storedFound = localStorage.getItem(`paroldle_${gameMode}_found_${index}`);
      const storedPartial = localStorage.getItem(`paroldle_${gameMode}_partial_${index}`);
      const storedClues = localStorage.getItem(`paroldle_${gameMode}_clues_${index}`);
      setFound(storedFound ? JSON.parse(storedFound) : initialFound);
      setPartial(
        storedPartial ? JSON.parse(storedPartial) : { title: {}, lyrics: {}, artist: {} }
      );
      setClues(storedClues ? parseInt(storedClues, 10) : N_CLUES);
      setCurrentFound({ title: [], lyrics: [], artist: [] });
      setGuessFeedback({ perfect_match: 0, partial_match: 0 });
      setIsReady(true);
    }
    // eslint-disable-next-line
  }, [song, initialFound, index]);

  useEffect(() => {
    if (isReady && song && index !== null && gameMode !== "") {
      localStorage.setItem(`paroldle_${gameMode}_found_${index}`, JSON.stringify(found));
    }
    // eslint-disable-next-line
  }, [found, song]);

  useEffect(() => {
    if (isReady && song && index !== null && gameMode !== "") {
      localStorage.setItem(
        `paroldle_${gameMode}_partial_${index}`,
        JSON.stringify(partial)
      );
    }
    // eslint-disable-next-line
  }, [partial]);

  useEffect(() => {
    if (isReady && song && index !== null && gameMode !== "") {
      localStorage.setItem(`paroldle_${gameMode}_clues_${index}`, clues);
    }
  }, [clues]);

  const updateSectionFound = useCallback(
    (wordList, currentFoundIndices, currentFoundPartial) => {
      const newFoundIndices = [];
      const newPartial = {};
      for (let i = 0; i < wordList.length; i++) {
        if (currentFoundIndices.includes(i)) continue;
        if (!guess) continue;
        const sim = matchWord(guess, wordList[i], song.lang);
        // const sim2 = cosineSimilarity(guess, wordList[i]);
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

  // Vérification de la condition de victoire selon le mode de jeu
  useEffect(() => {
    if (!isReady || !gameState.startsWith("guessing") || gameMode === "") return;
    if (gameMode === "classic") {
      if (gameState === "guessing_hardcore") {
        if (
          title.length > 0 &&
          found.title.length === title.length &&
          found.lyrics.length === lyrics.length &&
          found.artist.length === artist.length
        ) {
          setGameState("victory_hardcore");
        }
      } else if (gameState === "guessing_normal") {
        if (title.length > 0 && found.title.length === title.length) {
          setGameState("victory_normal");
        }
      }
    } else if (gameMode === "NOPLP") {
      if (
        title.length > 0 &&
        found.title.length === title.length &&
        found.lyrics.length === lyrics.length &&
        found.artist.length === artist.length
      ) {
        setGameState("victory_hardcore");
      }
    }

  }, [found.title, found.lyrics, found.artist, gameState, title.length, lyrics.length, artist.length, isReady]);

  // --- Gestion du Clue ---

  const totalLyricsAlpha = useMemo(
    () => lyrics.filter((word) => isAlphanumeric(word)).length,
    [lyrics]
  );

  const foundLyricsAlpha = useMemo(
    () =>
      found.lyrics.filter((i) => isAlphanumeric(lyrics[i])).length,
    [found.lyrics, lyrics]
  );

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

    if (candidateIndices.length === 0) return;

    const maxLength = Math.max(...candidateIndices.map(i => lyrics[i].length));
    const filteredCandidates = candidateIndices.filter(i => lyrics[i].length === maxLength);

    const randomIndex =
      filteredCandidates[Math.floor(Math.random() * filteredCandidates.length)];

    setGuess(lyrics[randomIndex]);
    setClues(prev => prev - 1);
  }, [song, lyrics, found.lyrics, clues, title]);

  // Fonction pour acheter des indices en échange de trophées
  const handleBuyClues = useCallback(() => {
    if (trophies < CLUE_COST_TROPHIES) {
      alert("Pas assez de trophées pour acheter des indices.");
      return;
    }
    setTrophies(prev => prev - CLUE_COST_TROPHIES);
    setClues(prev => prev + CLUE_COST_COUNT);
  }, [trophies, setTrophies, setClues]);

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

  const midLine = Math.ceil(lyricLines.length / 2);
  const leftColumn = lyricLines.slice(0, midLine);
  const rightColumn = lyricLines.slice(midLine);

  if (index === null) {
    return (
      <Box minHeight={300}>
        <Text>{t("Choose a song to start playing")}...</Text>
      </Box>
    )
  }
  if (!isReady) {
    return (
      <Box minHeight={300}>
        <Loading />
      </Box>
    )
  }

  return (
    <Box position="relative" p={4} fontFamily="Montserrat, sans-serif">
      <Box position="absolute" top={4} right={4} zIndex={10}>
        <Flex
          align="center"
          gap={4}
          bg={colors.guessBg}
          p={3}
          borderRadius="md"
          boxShadow="md"
        >
          <Text fontWeight="bold" fontSize="md">
            {foundLyricsAlpha} / {totalLyricsAlpha}
          </Text>
          <Box position="relative">
            <IconButton
              icon={<FaLightbulb />}
              onClick={handleHelp}
              variant="outline"
              size="md"
              colorScheme="teal"
              aria-label="Obtenir un indice"
              isDisabled={clues <= 0}
              
            />
            <Box
              position="absolute"
              top={-1}
              right={-1}
              bg="teal.500"
              color="white"
              borderRadius="full"
              w={5}
              h={5}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
            >
              {clues}
            </Box>
          </Box>
          {clues === 0 && (
            <Button
              size="sm"
              bgColor={colors.tealButtonBg}
              _hover={{ bgColor: colors.tealButtonBgHover }}
              onClick={handleBuyClues}
              isDisabled={trophies < CLUE_COST_TROPHIES}
              variant="solid"
            >
              {t("Buy")}{" "} {N_CLUE_BUY} 💡{" "} {t("for")}{" "} {CLUE_COST_TROPHIES}🏆
            </Button>
          )}
        </Flex>
      </Box>

      <Box mb={2} textAlign="center">
        <Heading as="h1" fontSize="4xl">
          {title.map((word, i) => (
            <LyricWords
              key={`title-${i}`}
              prevWord={title[i - 1]}
              word={word}
              isCurrentGuess={currentFound.title.includes(i)}
              found={found.title.includes(i) || showAllSong || !gameState.startsWith("guessing")}
              partialMatch={partial.title[i] ? partial.title[i][0] : null}
              fontSize="inherit"
            />
          ))}
        </Heading>
      </Box>

      <Box mb={4} textAlign="center">
        <Heading as={"h2"} fontSize="2xl">
          {artist.map((word, i) => (
            <LyricWords
              key={`artist-${i}`}
              prevWord={artist[i - 1]}
              word={word}
              isCurrentGuess={currentFound.artist.includes(i)}
              found={found.artist.includes(i) || showAllSong || !gameState.startsWith("guessing")}
              partialMatch={partial.artist[i] ? partial.artist[i][0] : null}
              fontSize="inherit"
            />
          ))}
        </Heading>
      </Box>

      {/* Affichage de l'année de sortie de la chanson accompagnée d'un bouton pour la débloquer */}
      <Box textAlign="center" mb={4}>
        <Heading as="h3" fontSize="xl">
          <LyricWords
            word={song.year.toString()}
            found={true}
            fontSize="inherit"
          />
        </Heading>
      </Box>

      {!gameState.startsWith("guessing") && song.video_id && (
        <Box mt={4} mb={4} mx="auto" maxW="300px">
          <iframe
            width="300"
            height="170"
            src={`https://www.youtube.com/embed/${song.video_id}?autoplay=${autoplay ? 1 : 0}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Lecture de la musique"
          />
        </Box>
      )}

      <Flex justifyContent="center" mt={4}>
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
    const colors = useColors();

    const marginLeft = useMemo(() => {
      return !prevWord || prevWord === "\n" || (!isAlphanumeric(word) && !`("&-)`.includes(word))
        ? 0
        : 1.5;
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
          backgroundColor={colors.correctGuessBg}
          display="inline-block"
          pl={1}
          pr={1}
          ml={marginLeft}
          textAlign="center"
          borderRadius="md"
          height={"1.5ch"}
          transform={"translateY(5px)"}
        >
          <Text fontSize={fontSize ? fontSize : "md"} fontFamily="inherit" transform={"translateY(-5px)"}>
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
        backgroundColor={colors.maskedWordBg}
        display="inline-block"
        cursor="pointer"
        position="relative"
        onClick={handleClick}
        textAlign="center"
        borderRadius="md"
        transform="translateY(3px)"
        width={partialMatch ? `${partialMatch.length}ch` : `${word.length - 0.2 * word.length}ch`}
        height="1.5ch"
      >
        {showWordLength && (
          <Text
            color={colors.invText}
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
            color={colors.partialGuess}
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
