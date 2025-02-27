import React, { useMemo } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Badge,
  Heading,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { FaUpload } from 'react-icons/fa';
import useColors from '../hooks/useColors';

const MultiplayerPanel = ({ players, playersGuess, playerName, sendGuessListCallback }) => {
  const colors = useColors();

  // Filtre les joueurs pour exclure le joueur actuel
  const filteredPlayers = useMemo(() => players.filter((player) => player !== playerName), [players, playerName]);

  return (
    <Box
      p={6}
      borderRadius="2xl"
      boxShadow="lg"
      bg={colors.lyricsBg}
      m={4}
    >
      <Heading fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        🎮 Multijoueur
      </Heading>
      <Divider borderWidth={2} borderColor={colors.text} width="80%" mx="auto" mb={4} />
      <VStack spacing={4} align="start">
        {filteredPlayers.length === 0 ? (
          <Text fontWeight="bold" textAlign="center" w="100%">
            Tu es seul pour l'instant...
          </Text>
        ) : (
          filteredPlayers.map((player, idx) => {
            const imageNumber = (idx % 4) + 1; // Cycle entre 1 et 4 pour les images
            const playerImage = `/men/man_${imageNumber}.png`;
            const latestGuess = playersGuess[player] || "...";

            return (
              <Box
                key={player}
                p={4}
                borderRadius="xl"
                bg={colors.lyricsBg}
                boxShadow="md"
                w="100%"
              >
                <HStack spacing={4} align="center">
                  <Avatar size="md" src={playerImage} name={player} />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold" >
                      {player}
                    </Text>
                    <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                      {latestGuess}{latestGuess === "..." ? "" : " ?"}
                    </Badge>
                  </VStack>
                  <IconButton
                    title="Envoyer les essais précédents"
                    icon={<FaUpload />}
                    variant="ghost"
                    colorScheme="blue"
                    size="sm"
                    _hover={{ bg: 'blue.100', transform: 'scale(1.1)' }}
                    onClick={() => sendGuessListCallback(player)}
                  />
                </HStack>
              </Box>
            );
          })
        )}
      </VStack>
    </Box>
  );
};

export default MultiplayerPanel;