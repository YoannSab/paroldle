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
  Tooltip,
} from '@chakra-ui/react';
import { FaMusic, FaUpload } from 'react-icons/fa';
import useColors from '../hooks/useColors';
import { useTranslation } from 'react-i18next';

const MultiplayerPanel = ({
  players,
  playerName,
  otherPlayersInfo,
  sendGuessListCallback,
  gameMode,
  setGameMode,
  setIndex,
  index,
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  // Exclure le joueur actuel
  const filteredPlayers = useMemo(
    () => players.filter((player) => player !== playerName),
    [players, playerName]
  );

  const handleOnClick = (player) => {
    if (
      !otherPlayersInfo[player] ||
      !otherPlayersInfo[player].song ||
      !otherPlayersInfo[player].gameMode
    ) {
      return;
    }
    if (
      gameMode === otherPlayersInfo[player]?.gameMode &&
      index === otherPlayersInfo[player]?.song.index
    ) {
      return;
    }
    setGameMode(otherPlayersInfo[player].gameMode);
    setIndex(otherPlayersInfo[player].song.index);
  };

  return (
    <Box p={6} borderRadius="2xl" boxShadow="lg" bg={colors.lyricsBg} m={4}>
      <Heading fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
        🎮 {t("Multiplayer")}
      </Heading>
      <Divider
        borderWidth={2}
        borderColor={colors.text}
        width="80%"
        mx="auto"
        mb={4}
      />
      
      <VStack spacing={4} align="start">
        {filteredPlayers.length === 0 ? (
          <Text fontWeight="bold" textAlign="center" w="100%">
            {t("No other players connected")}.
          </Text>
        ) : (
          filteredPlayers.map((player, idx) => {
            const imageNumber = (idx % 4) + 1;
            const playerImage = `/men/man_${imageNumber}.png`;
            const latestGuess = otherPlayersInfo[player]?.guess || "...";
            const playerGameInfo = otherPlayersInfo[player]?.song
              ? `${t("Mode")}: ${t(otherPlayersInfo[player].gameMode)} - ${t("Index")}: ${otherPlayersInfo[player].song.index}`
              : t("No game data");

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
                  <Tooltip label={playerGameInfo} fontSize="sm" hasArrow>
                    <Avatar size="md" src={playerImage} name={player} />
                  </Tooltip>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold">{player}</Text>
                    <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                      {latestGuess}
                      {latestGuess === "..." ? "" : " ?"}
                    </Badge>
                  </VStack>
                  <Tooltip label={t("Send guess list")} fontSize="sm" hasArrow>
                    <IconButton
                      icon={<FaUpload />}
                      variant="ghost"
                      colorScheme="blue"
                      size="sm"
                      _hover={{ transform: 'scale(1.1)' }}
                      onClick={() => sendGuessListCallback(player)}
                    />
                  </Tooltip>
                  <Tooltip
                    label={
                      !otherPlayersInfo[player]?.song ||
                      (gameMode === otherPlayersInfo[player]?.gameMode &&
                        index === otherPlayersInfo[player]?.song?.index)
                        ? t("")
                        : t("Go to mode: ") +
                          otherPlayersInfo[player]?.gameMode +
                          " -> " +
                          t("Index: ") +
                          otherPlayersInfo[player]?.song?.index
                    }
                    fontSize="sm"
                    hasArrow
                  >
                    <IconButton
                      disabled={
                        !otherPlayersInfo[player]?.song ||
                        (gameMode === otherPlayersInfo[player]?.gameMode &&
                          index === otherPlayersInfo[player]?.song?.index)
                      }
                      icon={<FaMusic />}
                      variant="ghost"
                      colorScheme="pink"
                      size="sm"
                      onClick={() => handleOnClick(player)}
                    />
                  </Tooltip>
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
