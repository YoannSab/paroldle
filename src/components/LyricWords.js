import React, { useState, useMemo, memo } from "react";
import { Box, Text } from "@chakra-ui/react";
import useColors from "../hooks/useColors";
import { isAlphanumeric } from "../lyricsUtils";


const LyricWords = memo(
    ({ prevWord, word, isCurrentGuess, found, partialMatch, fontSize, otherPlayersFound }) => {
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
        return isCurrentGuess || otherPlayersFound ? (
          <Box
            backgroundColor={isCurrentGuess ? colors.correctGuessBg: colors.otherPlayersGuessBg}
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
          backgroundColor={otherPlayersFound ? colors.otherPlayersGuessBg : colors.maskedWordBg}
          display="inline-block"
          cursor="pointer"
          position="relative"
          onClick={handleClick}
          textAlign="center"
          borderRadius="md"
          transform="translateY(3px)"
          width={partialMatch ? `${Math.max(partialMatch.length + 1, word.length) - 0.2 * Math.max(partialMatch.length + 1, word.length)}ch` : `${word.length - 0.2 * word.length}ch`}
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
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -52%)"
              fontSize="sm"
              fontFamily="inherit"
              color={otherPlayersFound ? colors.partialOnOtherPlayersGuess : colors.partialGuessOnNormal}
            >
              {partialMatch}
            </Text>
          )}
        </Box>
      );
    }
  );

export default LyricWords;