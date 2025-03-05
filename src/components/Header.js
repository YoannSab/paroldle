// src/components/Header.js
import React from 'react';
import { Box, Image, IconButton, HStack, Text, useColorModeValue  } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { FaTrophy } from 'react-icons/fa';
import { Badge } from "@chakra-ui/react";

const TrophyBadge = ({ trophies }) => {
  return (
    <Box position="absolute" top="4" left="4">
      <Badge 
        display="flex"
        alignItems="center"
        gap={2}
        bg={useColorModeValue("gray.100", "gray.800")}
        color={useColorModeValue("gray.600", "white")}
        px={3}
        py={1}
        borderRadius="full"
        boxShadow="lg"
      >
        <FaTrophy size={20} />
        <Text fontWeight="bold" fontSize="lg">
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
                w={800}
                mx="auto"
                mb={-5}
            />

            {/* Affichage du trophée en haut à gauche */}
            <TrophyBadge trophies={trophies} />

            {/* Bouton d'information en haut à droite */}
            <HStack position="absolute" top="2" right="2">
                <IconButton
                    icon={<InfoIcon w={6} h={6} />}
                    aria-label="Info"
                    onClick={onInfoClick}
                    variant="outline"
                    color="white"
                    width={50}
                    height={50}
                    borderRadius="full"
                />
            </HStack>
        </Box>
    );
};

export default Header;
