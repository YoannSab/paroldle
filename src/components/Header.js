// src/components/Header.js
import React, { memo, useMemo } from 'react';
import { Box, Image, IconButton, Text, useColorModeValue, useBreakpointValue } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { FaTrophy } from 'react-icons/fa';
import { Badge } from "@chakra-ui/react";

// Composant TrophyBadge mémorisé
const TrophyBadge = memo(({ trophies }) => {
  // Utiliser useBreakpointValue une seule fois pour éviter les calculs multiples
  const position = useBreakpointValue({ base: "center", xl: "left" });
  
  // Utiliser useColorModeValue une seule fois pour chaque propriété
  const bgColor = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("gray.600", "white");
  
  // Calculer les styles de positionnement de manière mémorisée
  const positionStyles = useMemo(() => ({
    position: "absolute",
    top: "2",
    left: position === "left" ? "4" : "50%",
    transform: position === "center" ? "translateX(-50%)" : "none"
  }), [position]);
  
  return (
    <Box {...positionStyles}>
      <Badge
        display="flex"
        alignItems="center"
        gap={1}
        bg={bgColor}
        color={textColor}
        px={2}
        py={0.5}
        borderRadius="full"
        boxShadow="md"
      >
        <FaTrophy size={16} />
        <Text fontWeight="bold" fontSize="md">
          {trophies}
        </Text>
      </Badge>
    </Box>
  );
});

// Composant InfoButton mémorisé
const InfoButton = memo(({ onInfoClick }) => (
  <Box position="absolute" zIndex={1000} top="2" right="2">
    <IconButton
      icon={<InfoIcon w={4} h={4} />}
      aria-label="Info"
      onClick={onInfoClick}
      variant="outline"
      color="white"
      width={35}
      height={35}
      borderRadius="full"
    />
  </Box>
));

// Composant Header principal mémorisé
const Header = memo(({ onInfoClick, trophies }) => {
  console.log('Header Rerendered');
  
  return (
    <Box position="relative" mb={4}>
      <Image
        src="/paroldle_banner.png"
        alt="Paroldle"
        w={["100%", "90%", "80%"]}
        mx="auto"
        // mb={-5}
        zIndex={1}
        pointerEvents="none"
      />

      {/* Affichage du trophée */}
      <TrophyBadge trophies={trophies} />

      {/* Bouton d'information en haut à droite */}
      <InfoButton onInfoClick={onInfoClick} />
    </Box>
  );
});

export default Header;