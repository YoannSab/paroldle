import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Box, Text, IconButton, Heading, Flex, Button, Switch } from "@chakra-ui/react";
import { FaLightbulb } from "react-icons/fa";
import {
  stringToList,
  isAlphanumeric,
  matchWord,
} from "../lyricsUtils";

import { N_CLUES, CLUE_COST_COUNT, CLUE_COST_TROPHIES, N_CLUE_BUY } from "../constants";
import Loading from "./Loading";
import LyricWords from "./LyricWords";
import { useTranslation } from "react-i18next";
import useColors from "../hooks/useColors";
import { getLocalStorageItem, setLocalStorageItem } from '../hooks/useLocalStorage';

// Sous-composants optimisés
const LyricsTitle = memo(({ 
  title, 
  found, 
  currentFound, 
  showAllSong, 
  gameState, 
  showSemanticPartial, 
  semanticPartial,
  partial,
  otherPlayersFound
}) => (
  <Heading as="h1" fontSize={["xl", "2xl", "4xl"]}>
    {title.map((word, i) => (
      <LyricWords
        key={`title-${i}`}
        prevWord={title[i - 1]}
        word={word}
        isCurrentGuess={currentFound.title.has(i)}
        found={found.title.has(i) || showAllSong}
        partialMatch={showSemanticPartial ? (semanticPartial.title[i] || null) : partial.title[i] ? partial.title[i][0] : null}
        otherPlayersFound={otherPlayersFound.title.has(i)}
        fontSize="inherit"
      />
    ))}
  </Heading>
));

const LyricsArtist = memo(({ 
  artist, 
  found, 
  currentFound, 
  showAllSong, 
  gameState, 
  showSemanticPartial, 
  semanticPartial,
  partial,
  otherPlayersFound
}) => (
  <Heading as="h2" fontSize={["lg", "xl", "2xl"]}>
    {artist.map((word, i) => 
      <LyricWords
        key={`artist-${i}`}
        prevWord={artist[i - 1]}
        word={word}
        isCurrentGuess={currentFound.artist.has(i)}
        found={found.artist.has(i) || showAllSong}
        partialMatch={showSemanticPartial ? (semanticPartial.artist[i] || null) : partial.artist[i] ? partial.artist[i][0] : null}
        otherPlayersFound={otherPlayersFound.artist.has(i)}
        fontSize="inherit"
      />
    )}
  </Heading>
));

const LyricsYear = memo(({ song, gameModeRef }) => {
  if (!song || gameModeRef.current === 'daily') return null;
  
  return (
    <Box textAlign="center" mb={2}>
      <Heading as="h3" fontSize={["md", "lg", "xl"]}>
        <LyricWords
          word={song.year.toString()}
          found={true}
          fontSize="inherit"
        />
      </Heading>
    </Box>
  );
});

const YoutubEmbed = memo(({ song, gameState, autoplay }) => {
  if (gameState.startsWith("guessing") || !song?.video_id) return null;
  
  return (
    <Box mt={3} mb={3} mx="auto" maxW={["250px", "300px"]}>
      <iframe
        width="100%"
        height={["150px", "170px"]}
        src={`https://www.youtube.com/embed/${song.video_id}?autoplay=${autoplay ? 1 : 0}`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Lecture de la musique"
      />
    </Box>
  );
});

const LyricsColumn = memo(({ 
  columnLines, 
  position, 
  currentFound, 
  found, 
  showAllSong, 
  showSemanticPartial, 
  semanticPartial,
  partial,
  otherPlayersFound
}) => (
  <Box 
    textAlign={["center", "center", position === "left" ? "left" : "left"]}
    pr={position === "left" ? [2, 4] : 0}
    pl={position === "right" ? [2, 4] : 0}
    fontSize={["xs", "sm", "md"]}
    mb={position === "left" ? [4, 0] : 0}
  >
    {columnLines.map((line, lineIndex) => (
      <Box key={`${position}-line-${lineIndex}`}>
        {line.map((item, wordIndex) => (
          <LyricWords
            key={`${position}-${lineIndex}-${wordIndex}`}
            prevWord={wordIndex === 0 ? null : line[wordIndex - 1].word}
            word={item.word}
            isCurrentGuess={currentFound.lyrics.has(item.index)}
            found={found.lyrics.has(item.index) || showAllSong}
            partialMatch={showSemanticPartial 
              ? (semanticPartial.lyrics[item.index] || null) 
              : partial.lyrics[item.index] ? partial.lyrics[item.index][0] : null}
            otherPlayersFound={otherPlayersFound.lyrics.has(item.index)}
          />
        ))}
        <br />
      </Box>
    ))}
  </Box>
));

// Composant principal
const LyricsComponent = memo(({
  song,
  index,
  gameState,
  gameMode,
  gameModeRef,
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
  sendToBattlePlayers,
  otherPlayersInfo,
  battleStateRef
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  // Mémoriser les données transformées pour éviter des recalculs inutiles
  const title = useMemo(() => (song ? stringToList(song.title, song.lang) : []), [song]);
  const lyrics = useMemo(() => (song ? stringToList(song.lyrics, song.lang) : []), [song]);
  const artist = useMemo(() => (song ? stringToList(song.author, song.lang) : []), [song]);

  // Références pour éviter des re-renders inutiles
  const titleRef = useRef(title);
  const lyricsRef = useRef(lyrics);
  const artistRef = useRef(artist);
  
  // Mettre à jour les références quand nécessaire
  useEffect(() => {
    titleRef.current = title;
    lyricsRef.current = lyrics;
    artistRef.current = artist;
  }, [title, lyrics, artist]);

  // Utiliser des Sets pour une recherche d'inclusion optimisée O(1) au lieu de O(n)
  const initialFound = useMemo(() => {
    const computeFound = (list) => {
      const foundSet = new Set();
      list.forEach((word, i) => {
        if (!isAlphanumeric(word)) foundSet.add(i);
      });
      return foundSet;
    };
    return {
      title: computeFound(title),
      lyrics: computeFound(lyrics),
      artist: computeFound(artist),
    };
  }, [title, lyrics, artist]);

  // États principaux
  const [found, setFound] = useState({ 
    title: new Set(), 
    lyrics: new Set(), 
    artist: new Set() 
  });
  const [partial, setPartial] = useState({ 
    title: {}, 
    lyrics: {}, 
    artist: {} 
  });
  const [semanticPartial, setSemanticPartial] = useState({ 
    title: {}, 
    lyrics: {}, 
    artist: {} 
  });
  const [currentFound, setCurrentFound] = useState({
    title: new Set(),
    lyrics: new Set(),
    artist: new Set(),
  });
  const [clues, setClues] = useState(N_CLUES);
  const [showSemanticPartial, setShowSemanticPartial] = useState(false);

  // Chargement initial des données depuis localStorage
  useEffect(() => {
    if (!song || index === null || gameModeRef.current === "") return;
    
    setIsReady(false);
    console.log(`Loading game data for song ${index}...`);

    if (gameModeRef.current !== "battle") {
      // Charger les données depuis localStorage
      const storedFound = getLocalStorageItem(`paroldle_${gameModeRef.current}_found_${index}`);
      const storedPartial = getLocalStorageItem(`paroldle_${gameModeRef.current}_partial_${index}`);
      const storedClues = getLocalStorageItem(`paroldle_${gameModeRef.current}_clues_${index}`);
      const storedSemanticPartial = getLocalStorageItem(`paroldle_${gameModeRef.current}_semanticPartial_${index}`);
      
      // Convertir les tableaux stockés en Sets pour une meilleure performance
      setFound({
        title: storedFound ? new Set(storedFound.title) : new Set(initialFound.title),
        lyrics: storedFound ? new Set(storedFound.lyrics) : new Set(initialFound.lyrics),
        artist: storedFound ? new Set(storedFound.artist) : new Set(initialFound.artist),
      });
      
      setPartial(storedPartial || { title: {}, lyrics: {}, artist: {} });
      setSemanticPartial(storedSemanticPartial || { title: {}, lyrics: {}, artist: {} });
      setClues(storedClues !== null ? parseInt(storedClues, 10) : N_CLUES);
    } else {
      // Mode battle - utiliser les valeurs initiales
      setFound({
        title: new Set(initialFound.title),
        lyrics: new Set(initialFound.lyrics),
        artist: new Set(initialFound.artist),
      });
      setPartial({ title: {}, lyrics: {}, artist: {} });
      setSemanticPartial({ title: {}, lyrics: {}, artist: {} });
      setClues(N_CLUES);
    }
    
    setCurrentFound({ title: new Set(), lyrics: new Set(), artist: new Set() });
    setGuessFeedback({ perfect_match: 0, partial_match: 0 });
    setIsReady(true);
  }, [song]);

  // Sauvegarder les mots trouvés dans localStorage
  useEffect(() => {
    if (!isReady || !song || index === null || gameModeRef.current === "" || gameModeRef.current === "battle") return;
    
    // Convertir les Sets en arrays pour le stockage
    const foundArrays = {
      title: Array.from(found.title),
      lyrics: Array.from(found.lyrics),
      artist: Array.from(found.artist),
    };
    
    setLocalStorageItem(`paroldle_${gameModeRef.current}_found_${index}`, foundArrays);
  }, [found]);

  // Sauvegarder les correspondances partielles dans localStorage
  useEffect(() => {
    if (!isReady || !song || index === null || gameModeRef.current === "" || gameModeRef.current === "battle") return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_partial_${index}`, partial);
  }, [partial]);

  // Sauvegarder le nombre d'indices dans localStorage
  useEffect(() => {
    if (!isReady || !song || index === null || gameModeRef.current === "" || gameModeRef.current === "battle") return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_clues_${index}`, clues);
  }, [clues]);

  // Sauvegarder les correspondances sémantiques partielles dans localStorage
  useEffect(() => {
    if (!isReady || !song || index === null || gameModeRef.current === "" || gameModeRef.current === "battle") return;

    setLocalStorageItem(`paroldle_${gameModeRef.current}_semanticPartial_${index}`, semanticPartial);
  }, [semanticPartial]);

  // Fonction pour mettre à jour les mots trouvés dans une section
  const updateSectionFound = useCallback((wordList, currentFoundSet, currentFoundPartial, currentSemanticPartial) => {
    const newFoundIndices = [];
    const newPartial = {};
    const newSemanticPartial = {};
    
    if (!guess) return { newFoundIndices, newPartial, newSemanticPartial };
    
    // Optimisation: vérifier seulement les mots non trouvés
    for (let i = 0; i < wordList.length; i++) {
      if (currentFoundSet.has(i)) continue;
      
      const { match, syntaxicSim, semanticPartialMatch } = matchWord(guess, wordList[i], song?.lang);

      if (match) {
        newFoundIndices.push(i);
        continue;
      }
      
      if (syntaxicSim >= 0.7) {
        if (!currentFoundPartial[i] || currentFoundPartial[i][1] < syntaxicSim) {
          newPartial[i] = [guess, syntaxicSim.toFixed(2)];
        }
      }

      if (semanticPartialMatch) {
        if (!currentSemanticPartial[i]) {
          newSemanticPartial[i] = guess;
        }
      }
    }
    
    return { newFoundIndices, newPartial, newSemanticPartial };
  }, [guess, song]);

  // Traiter la tentative actuelle
  useEffect(() => {
    if (!guess || !song) return;

    const sections = { 
      title: titleRef.current, 
      lyrics: lyricsRef.current, 
      artist: artistRef.current 
    };
    
    const newResults = {};
    let totalNewMatches = 0;
    let totalPartialMatches = 0;

    // Traiter chaque section
    Object.keys(sections).forEach((section) => {
      newResults[section] = updateSectionFound(
        sections[section],
        found[section],
        partial[section],
        semanticPartial[section]
      );
      
      totalNewMatches += newResults[section].newFoundIndices.length;
      totalPartialMatches += Object.keys(newResults[section].newPartial).length + 
                           Object.keys(newResults[section].newSemanticPartial).length;
    });

    // En mode battle, envoyer les résultats aux autres joueurs
    if (gameModeRef.current === "battle" && battleStateRef.current === "fighting") {
      const newExactResults = {
        title: newResults.title.newFoundIndices,
        lyrics: newResults.lyrics.newFoundIndices,
        artist: newResults.artist.newFoundIndices
      };
      sendToBattlePlayers(JSON.stringify({ foundWords: newExactResults }));
    }

    // Mettre à jour les ensembles de mots trouvés (avec Sets)
    setFound(prev => {
      const newFound = {
        title: new Set(prev.title),
        lyrics: new Set(prev.lyrics),
        artist: new Set(prev.artist),
      };
      
      newResults.title.newFoundIndices.forEach(i => newFound.title.add(i));
      newResults.lyrics.newFoundIndices.forEach(i => newFound.lyrics.add(i));
      newResults.artist.newFoundIndices.forEach(i => newFound.artist.add(i));
      
      return newFound;
    });

    // Mettre à jour les correspondances partielles
    setPartial(prev => ({
      title: { ...prev.title, ...newResults.title.newPartial },
      lyrics: { ...prev.lyrics, ...newResults.lyrics.newPartial },
      artist: { ...prev.artist, ...newResults.artist.newPartial },
    }));

    // Mettre à jour les correspondances sémantiques
    setSemanticPartial(prev => ({
      title: { ...prev.title, ...newResults.title.newSemanticPartial },
      lyrics: { ...prev.lyrics, ...newResults.lyrics.newSemanticPartial },
      artist: { ...prev.artist, ...newResults.artist.newSemanticPartial },
    }));

    // Mettre à jour les mots trouvés actuellement pour le feedback visuel
    setCurrentFound({
      title: new Set(newResults.title.newFoundIndices),
      lyrics: new Set(newResults.lyrics.newFoundIndices),
      artist: new Set(newResults.artist.newFoundIndices),
    });

    // Mettre à jour le feedback pour le joueur
    setGuessFeedback({
      perfect_match: totalNewMatches,
      partial_match: totalPartialMatches,
    });
  }, [guess]);

  // Vérification de la condition de victoire selon le mode de jeu
  useEffect(() => {
    if (!isReady || !gameState.startsWith("guessing") || !gameModeRef.current) return;
    // Fonction helper pour vérifier si tous les mots alphanumériques sont trouvés
    const allWordsFound = (wordsList, foundSet) => {
      return wordsList.every((word, i) => !isAlphanumeric(word) || foundSet.has(i));
    };
    
    if (gameModeRef.current === "classic" || gameModeRef.current === "daily") {
      if (gameState === "guessing_hardcore") {
        if (
          title.length > 0 &&
          allWordsFound(title, found.title) &&
          allWordsFound(lyrics, found.lyrics) &&
          allWordsFound(artist, found.artist)
        ) {
          setGameState("victory_hardcore");
        }
      } else if (gameState === "guessing_normal") {
        if (title.length > 0 && allWordsFound(title, found.title)) {
          setGameState("victory_normal");
        }
      }
    } else if (gameModeRef.current === "NOPLP") {
      if (
        title.length > 0 &&
        allWordsFound(title, found.title) &&
        allWordsFound(lyrics, found.lyrics) &&
        allWordsFound(artist, found.artist)
      ) {
        setGameState("victory_hardcore");
      }
    } else if (gameModeRef.current === "battle") {
      if (title.length > 0 && allWordsFound(title, found.title)) {
        setGameState("victory_normal");
      }
    }
  }, [found]);

  // Statistiques et fonctions pour les indices
  const totalLyricsAlpha = useMemo(() => 
    lyrics.filter(word => isAlphanumeric(word)).length, 
    [lyrics]
  );

  const foundLyricsAlpha = useMemo(() => {
    let count = 0;
    found.lyrics.forEach(i => {
      if (isAlphanumeric(lyrics[i])) count++;
    });
    return count;
  }, [found.lyrics, lyrics]);

  // Fonction pour obtenir un indice
  const handleHelp = useCallback(() => {
    if (!song || clues <= 0) return;
    
    // Trouver les mots candidats pour l'indice
    const candidateIndices = [];
    const titleLower = title.map(w => w.toLowerCase());
    
    for (let i = 0; i < lyrics.length; i++) {
      if (
        isAlphanumeric(lyrics[i]) &&
        !found.lyrics.has(i) &&
        !titleLower.includes(lyrics[i].toLowerCase())
      ) {
        candidateIndices.push(i);
      }
    }

    if (candidateIndices.length === 0) return;

    // Privilégier les mots les plus longs
    const maxLength = Math.max(...candidateIndices.map(i => lyrics[i].length));
    const filteredCandidates = candidateIndices.filter(i => lyrics[i].length === maxLength);
    
    const randomIndex = filteredCandidates[Math.floor(Math.random() * filteredCandidates.length)];
    
    setGuess(lyrics[randomIndex]);
    setClues(prev => prev - 1);
  }, [song, lyrics, found.lyrics, clues, title, setGuess]);

  // Fonction pour acheter des indices
  const handleBuyClues = useCallback(() => {
    if (trophies < CLUE_COST_TROPHIES) {
      alert("Pas assez de trophées pour acheter des indices.");
      return;
    }
    
    setTrophies(prev => prev - CLUE_COST_TROPHIES);
    setClues(prev => prev + CLUE_COST_COUNT);
  }, [trophies, setTrophies]);

  // Mémoriser la structure des paroles pour éviter des recalculs coûteux
  const { _, leftColumn, rightColumn } = useMemo(() => {
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
    
    const midLine = Math.ceil(lines.length / 2);
    
    return {
      lyricLines: lines,
      leftColumn: lines.slice(0, midLine),
      rightColumn: lines.slice(midLine)
    };
  }, [lyrics]);

  const otherPlayersFound = useMemo(() => {
    const otherPlayersFound = {title: new Set(), lyrics: new Set(), artist: new Set()};

    if (gameMode !== "battle") return otherPlayersFound;

    Object.keys(otherPlayersInfo).forEach(player => {
      const playerFound = otherPlayersInfo[player]?.foundWords || {};
      Object.keys(playerFound).forEach(section => {
        playerFound[section].forEach(i => otherPlayersFound[section].add(i));
      });
    });
    return otherPlayersFound;
  }, [otherPlayersInfo, gameMode]);


  // Préparer les props communs pour améliorer les performances
  const commonProps = useMemo(() => ({
    found,
    currentFound,
    showAllSong,
    gameState,
    showSemanticPartial,
    semanticPartial,
    partial,
    otherPlayersFound
  }), [found, currentFound, showAllSong, gameState, showSemanticPartial, semanticPartial, partial, otherPlayersFound]);

  
  console.log('LyricsComponent Rerendered');

  // Gérer les cas particuliers
  if (index === null) {
    return (
      <Box minHeight={300}>
        {gameModeRef.current === "battle" ? (
          <Text>{t("Ready up to start the battle")}...</Text>
        ) : (
          <Text>{t("Choose a song to start playing")}...</Text>
        )}
      </Box>
    );
  }

  
  if (!isReady) {
    return (
      <Box minHeight={300}>
        <Loading />
      </Box>
    );
  }

  return (
    <Box position="relative" p={[2, 4]} fontFamily="Montserrat, sans-serif">
      {/* Contrôle pour basculer entre similarité syntaxique et sémantique */}
      <Box position="absolute" top={[2, 4]} left={[2, 4]} zIndex={10}>
        <Flex
          align="center"
          gap={[1, 4]}
          bg={colors.guessBg}
          p={[1, 3]}
          borderRadius="md"
          boxShadow="md"
          fontSize={["xs", "md"]}
        >
          <Text fontWeight="bold" fontSize={["xs", "md"]}>
            {t("Syntactic")}
          </Text>
          <Box display="flex" alignItems="center">
            <Box
              w={["25px", "35px"]}
              h={["15px", "20px"]}
              bg={showSemanticPartial ? "teal.500" : "red.500"}
              borderRadius="full"
              position="absolute"
              transition="background-color 0.2s ease-in-out"
            />
            <Switch
              isChecked={showSemanticPartial}
              onChange={() => setShowSemanticPartial(prev => !prev)}
              size={["sm", "md"]}
              sx={{
                "span.chakra-switch__track": {
                  bg: "transparent",
                },
                "span.chakra-switch__thumb": {
                  bg: "white",
                },
              }}
            />
          </Box>
          <Text fontWeight="bold" fontSize={["xs", "md"]}>
            {t("Semantic")}
          </Text>
        </Flex>
      </Box>

      {/* Compteur et contrôle des indices */}
      <Box position="absolute" top={[1, 2]} right={[2, 4]} zIndex={10}>
        <Flex
          align="center"
          gap={[1, 4]}
          bg={colors.guessBg}
          p={[1, 3]}
          borderRadius="md"
          boxShadow="md"
          fontSize={["xs", "md"]}
        >
          <Text fontWeight="bold" fontSize={["xs", "md"]}>
            {foundLyricsAlpha} / {totalLyricsAlpha}
          </Text>
          <Box position="relative">
            <IconButton
              icon={<FaLightbulb />}
              onClick={handleHelp}
              variant="outline"
              size={["xs", "md"]}
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
              w={[3, 5]}
              h={[3, 5]}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xs"
            >
              {clues}
            </Box>
          </Box>
          {clues === 0 && (
            <Button
              size="xs"
              bgColor={colors.tealButtonBg}
              _hover={{ bgColor: colors.tealButtonBgHover }}
              onClick={handleBuyClues}
              isDisabled={trophies < CLUE_COST_TROPHIES}
              variant="solid"
              fontSize={["2xs", "xs", "sm"]}
            >
              {t("Buy")}{" "} {N_CLUE_BUY} 💡{" "}{CLUE_COST_TROPHIES}🏆
            </Button>
          )}
        </Flex>
      </Box>

      {/* Titre de la chanson */}
      <Box mb={2} textAlign="center" mt={[14, 20]}>
        <LyricsTitle 
          title={title}
          {...commonProps}
        />
      </Box>

      {/* Artiste */}
      <Box mb={3} textAlign="center">
        <LyricsArtist 
          artist={artist}
          {...commonProps}
        />
      </Box>

      {/* Année de sortie */}
      <LyricsYear song={song} gameModeRef={gameModeRef} />

      {/* Lecture YouTube */}
      <YoutubEmbed song={song} gameState={gameState} autoplay={autoplay} />

      {/* Paroles */}
      <Flex 
        justifyContent="center" 
        mt={3} 
        flexDirection={["column", "column", "row"]}
      >
        <LyricsColumn 
          columnLines={leftColumn} 
          position="left" 
          {...commonProps}
        />
        <LyricsColumn 
          columnLines={rightColumn} 
          position="right" 
          {...commonProps}
        />
      </Flex>
    </Box>
  );
});

export default LyricsComponent;