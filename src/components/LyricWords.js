import React, { useState, useMemo, memo } from "react";
import { Box, Text, useBreakpointValue } from "@chakra-ui/react";
import useColors from "../hooks/useColors";
import { isAlphanumeric } from "../lyricsUtils";

const LyricWords = memo(
  ({ prevWord, word, isCurrentGuess, found, partialMatch, fontSize, otherPlayersFound }) => {
    const [showWordLength, setShowWordLength] = useState(false);
    const colors = useColors();

    // Responsive values based on screen size
    const responsiveMargin = useBreakpointValue({ base: 1, md: 1.5 });
    const responsiveFontSize = useBreakpointValue({ 
      base: fontSize ? `calc(${fontSize} * 0.85)` : "sm", 
      md: fontSize ? fontSize : "md" 
    });
    const responsiveHeight = useBreakpointValue({ base: "1.3ch", md: "1.5ch" });
    const responsiveTransformY = useBreakpointValue({ base: "5px", md: "5px" });

    // Calculate a responsive width that works better on small screens
    const charWidth = useBreakpointValue({ base: 1, md: 1 });
    const transformY = useBreakpointValue({ base: "2px", md: "3px" });
    
    const marginLeft = useMemo(() => {
      return !prevWord || prevWord === "\n" || (!isAlphanumeric(word) && !`("&-)`.includes(word))
        ? 0
        : responsiveMargin;
    }, [prevWord, word, responsiveMargin]);

    const handleClick = () => {
      if (!found && isAlphanumeric(word)) {
        setShowWordLength(true);
        setTimeout(() => setShowWordLength(false), 2000);
      }
    };

    if (found) {
      return isCurrentGuess || otherPlayersFound ? (
        <Box
          backgroundColor={isCurrentGuess ? colors.correctGuessBg : colors.otherPlayersGuessBg}
          display="inline-block"
          px={{ base: 0.5, md: 1 }}
          ml={marginLeft}
          textAlign="center"
          borderRadius="md"
          height={responsiveHeight}
          transform={`translateY(${responsiveTransformY})`}
        >
          <Text 
            fontSize={responsiveFontSize} 
            fontFamily="inherit" 
            transform={`translateY(-${responsiveTransformY})`}
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
        >
          {word}
        </Text>
      );
    }

    
    const wordWidth = partialMatch 
      ? `${Math.max(partialMatch.length + 1, word.length) * charWidth - 0.2 * Math.max(partialMatch.length + 1, word.length)}ch` 
      : `${word.length * charWidth - 0.2 * word.length}ch`;

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
        transform={`translateY(${transformY})`}
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
            fontSize={{ base: "2xs", md: "sm" }}
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
            fontSize={{ base: "2xs", md: "sm" }}
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