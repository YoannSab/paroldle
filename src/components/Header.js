// src/components/Header.js
import React from 'react';
import { Box, Image, IconButton, Text, useColorModeValue, useBreakpointValue } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { FaTrophy } from 'react-icons/fa';
import { Badge } from "@chakra-ui/react";

const TrophyBadge = ({ trophies }) => {
  const position = useBreakpointValue({ base: "center", xl: "left" });

  return (
    <Box
      position="absolute"
      top="2"
      left={position === "left" ? "4" : "50%"}
      transform={position === "center" ? "translateX(-50%)" : "none"}
    >
      <Badge
        display="flex"
        alignItems="center"
        gap={1}
        bg={useColorModeValue("gray.100", "gray.800")}
        color={useColorModeValue("gray.600", "white")}
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
};

const Header = ({ onInfoClick, trophies }) => {
  return (
    <Box position="relative" mb={4}>
      <Image
        src="/paroldle_banner.png"
        alt="Paroldle"
        w={{ base: "100%", md: "80%" }}
        mx="auto"
        mb={-5}
        zIndex={1}
        pointerEvents="none"
      />


      {/* Affichage du trophée */}
      <TrophyBadge trophies={trophies} />

      {/* Bouton d'information en haut à droite */}
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

    </Box>
  );
};

export default Header;
