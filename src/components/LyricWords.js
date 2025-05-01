import React, { useState, useMemo, memo, useCallback } from "react";
import { Box, Text } from "@chakra-ui/react";
import useColors from "../hooks/useColors";
import { isAlphanumeric } from "../lyricsUtils";


// Composant optimisé pour le texte visible
const VisibleText = memo(({ word, isCurrentGuess, otherPlayersFound, marginLeft, responsiveFontSize, colors, responsiveHeight }) => (
  isCurrentGuess || otherPlayersFound ? (
    <Box
      backgroundColor={isCurrentGuess ? colors.correctGuessBg : colors.otherPlayersGuessBg}
      display="inline-block"
      px={[0.5, 1]}
      ml={marginLeft}
      textAlign="center"
      borderRadius="md"
      height={responsiveHeight}
      transform={"translateY(1px)"}
    >
      <Text 
        fontSize={responsiveFontSize} 
        fontFamily="inherit" 
        transform={"translateY(-3px)"}
      >
        {word}
      </Text>
    </Box>
  ) : (
    <Text 
      display="inline-block" 
      ml={marginLeft} 
      fontSize={responsiveFontSize} 
      fontFamily="inherit"
      transform={"translateY(-3px)"}
    >
      {word}
    </Text>
  )
));

// Composant optimisé pour le texte masqué
const MaskedText = memo(({ 
  marginLeft, 
  otherPlayersFound, 
  colors, 
  handleClick, 
  wordWidth, 
  responsiveHeight, 
  showWordLength, 
  word, 
  partialMatch 
}) => (
  <Box
    ml={marginLeft}
    backgroundColor={otherPlayersFound ? colors.otherPlayersGuessBg : colors.maskedWordBg}
    display="inline-block"
    cursor="pointer"
    position="relative"
    onClick={handleClick}
    textAlign="center"
    borderRadius="md"
    width={wordWidth}
    height={responsiveHeight}
  >
    {showWordLength && (
      <Text
        color={colors.invText}
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        fontWeight="bold"
        fontSize={["2xs", "sm"]}
        fontFamily="inherit"
      >
        {word.length}
      </Text>
    )}
    {!showWordLength && partialMatch && (
      <Text
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -52%)"
        fontSize={["2xs", "sm"]}
        fontFamily="inherit"
        color={otherPlayersFound ? colors.partialOnOtherPlayersGuess : colors.partialGuessOnNormal}
      >
        {partialMatch}
      </Text>
    )}
  </Box>
));

// Composant principal LyricWords optimisé
const LyricWords = memo(({ 
  prevWord, 
  word, 
  isCurrentGuess, 
  found, 
  partialMatch, 
  fontSize, 
  otherPlayersFound 
}) => {
  const [showWordLength, setShowWordLength] = useState(false);
  const colors = useColors();

  // Valeurs responsives statiques - performances améliorées sans useBreakpointValue
  const responsiveMargin = 1;
  const responsiveFontSize = fontSize || ["sm", "md"];
  const responsiveHeight = ["1.3ch", "1.5ch"];
  const charWidth = 1;

  
  // Calcul du margin gauche - optimisé et mémorisé
  const marginLeft = useMemo(() => {
    return !prevWord || prevWord === "\n" || (!isAlphanumeric(word) && !`("&-)`.includes(word))
      ? 0
      : responsiveMargin;
  }, [prevWord, word, responsiveMargin]);

  // Gestionnaire d'événement - optimisé avec useCallback
  const handleClick = useCallback(() => {
    if (!found && isAlphanumeric(word)) {
      setShowWordLength(true);
      setTimeout(() => setShowWordLength(false), 2000);
    }
  }, [found, word]);
  
  // Calcul de la largeur du mot - optimisé et mémorisé
  const wordWidth = useMemo(() => {
    if (!partialMatch) {
      return `${word.length * charWidth - 0.2 * word.length}ch`;
    }
    const maxLength = Math.max(partialMatch.length + 1, word.length);
    return `${maxLength * charWidth - 0.2 * maxLength}ch`;
  }, [partialMatch, word.length, charWidth]);

  // Props communes mémorisées pour éviter les recréations
  const visibleTextProps = useMemo(() => ({
    word,
    isCurrentGuess,
    otherPlayersFound,
    marginLeft,
    responsiveFontSize,
    colors,
    responsiveHeight,
  }), [word, isCurrentGuess, otherPlayersFound, marginLeft, responsiveFontSize, colors, responsiveHeight]);

  const maskedTextProps = useMemo(() => ({
    marginLeft,
    otherPlayersFound,
    colors,
    handleClick,
    wordWidth,
    responsiveHeight,
    showWordLength,
    word,
    partialMatch
  }), [marginLeft, otherPlayersFound, colors, handleClick, wordWidth, responsiveHeight, showWordLength, word, partialMatch]);

  // Rendu conditionnel - afficher soit le texte visible, soit le texte masqué
  return found ? (
    <VisibleText {...visibleTextProps} />
  ) : (
    <MaskedText {...maskedTextProps} />
  );
});

export default LyricWords;