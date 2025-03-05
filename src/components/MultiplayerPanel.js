import React, { useCallback } from 'react';
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
  Flex
} from '@chakra-ui/react';
import { FaMusic, FaUpload, FaTrophy, FaSkull, FaBalanceScale } from 'react-icons/fa';
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
  guess,
  battleState,
  foundSongs,
  roomId,
  selectedImage
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  // Fonction pour gérer la navigation vers un mode et un index de chanson
  const handleOnClick = (player) => {
    if (!otherPlayersInfo[player]?.song || !otherPlayersInfo[player]?.gameMode) return;

    if (gameMode === otherPlayersInfo[player].gameMode && index === otherPlayersInfo[player].song.index) {
      return;
    }

    setGameMode(otherPlayersInfo[player].gameMode);
    setIndex(otherPlayersInfo[player].song.index);
  };

  // Fonction pour obtenir les stats des matchs d'un joueur
  const getMatchResults = useCallback((player) => {
    if (!foundSongs ||
        Object.values(foundSongs).some((song) => typeof song !== "object") ||
        !Object.keys(foundSongs).length
    ) return { victories: 0, defeats: 0, ties: 0 };

    let victories = 0, defeats = 0, ties = 0;

    Object.keys(foundSongs).forEach((song) => {
      if (foundSongs[song].winner === player) {
        victories++;
      }
      else if (foundSongs[song].players.includes(player) && foundSongs[song].status !== "tie") {
        defeats++;
      }
      if (foundSongs[song].status === "tie" && foundSongs[song].players.includes(player)) ties++;
    });

    return { victories, defeats, ties };
  }, [foundSongs]);

  return (
    <Box p={6} borderRadius="2xl" boxShadow="lg" bg={colors.lyricsBg} m={4}>
      <Heading fontSize="2xl" fontWeight="bold" mb={4} textAlign="center">
      🎮 {t("Room")} <Text as={"span"} color="blue.300">{roomId.toUpperCase()}</Text>
      </Heading>
      <Divider borderWidth={2} borderColor={colors.text} width="80%" mx="auto" mb={4} />

      <VStack spacing={4} align="start" w="100%">
        {[playerName, ...players.filter(item => item !== playerName)].map((player, idx) => {
          const imageNumber = otherPlayersInfo[player]?.profilePicture ?? `pdp${(idx % 4) + 1}`;
          const playerImage = player !== playerName ? `/characters/${imageNumber}.png` : `/characters/${selectedImage}.png`;
          
          const latestGuess = player !== playerName ? otherPlayersInfo[player]?.guess || "..." : guess || "...";
          const playerGameInfo = player !== playerName && otherPlayersInfo[player]?.song
            ? `${t("Mode")}: ${t(otherPlayersInfo[player].gameMode)} - ${t("Index")}: ${otherPlayersInfo[player].song.index}`
            : t("");

          const sortedPlayers = [...players].filter((player) => player === playerName ? battleState !== "not_participating" :
                                                  otherPlayersInfo[player].battleState !== "not_participating")
                                                  .sort((a, b) => a.localeCompare(b));
          const isSelector = sortedPlayers[0] === player;

          let playerNameLabel = isSelector ? "👑 " : "";
          playerNameLabel += player !== playerName ? player : player + t(" (You)");

          const { victories, defeats, ties } = getMatchResults(player);

          return (
            <Box key={player} p={4} borderRadius="xl" bg={colors.lyricsBg} boxShadow="md" w="100%">
              <HStack spacing={4} w="100%" justify="space-between">
                {/* Avatar */}
                <HStack spacing={2}>

                  <Text>{player === playerName || otherPlayersInfo[player]?.sendFunc ? "🟢" : "🔴"}</Text>

                  <Tooltip label={playerGameInfo} fontSize="sm" hasArrow>
                    <Avatar size="md" src={playerImage} name={player} />
                  </Tooltip>
                  <VStack spacing={2}>
                    <Text fontWeight="bold">{playerNameLabel}</Text>
                  </VStack>
                </HStack>

                {/* Nom & Statut Aligné à Droite */}

                {gameMode === "battle" && (
                  <Badge
                    colorScheme={
                      otherPlayersInfo[player]?.battleState === "ready" || (player === playerName && battleState === "ready")
                        ? "green"
                        : otherPlayersInfo[player]?.battleState === "not_participating" || (player === playerName && battleState === "not_participating")
                          ? "red"
                          : otherPlayersInfo[player]?.battleState === "fighting" || (player === playerName && battleState === "fighting")
                            ? "blue"
                            : otherPlayersInfo[player]?.battleState === "victory" || (player === playerName && battleState === "victory")
                              ? "green"
                              : otherPlayersInfo[player]?.battleState === "defeat" || (player === playerName && battleState === "defeat")
                                ? "red"
                                : otherPlayersInfo[player]?.battleState === "tie" || (player === playerName && battleState === "tie")
                                  ? "orange"
                                  : "yellow"
                    }
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {t(
                      otherPlayersInfo[player]?.battleState ||
                      (player === playerName && battleState) ||
                      "waiting"
                    )}
                  </Badge>
                )}

                {/* Boutons à Droite */}
                {gameMode !== "battle" && player !== playerName && (
                  <HStack spacing={2}>
                    <Tooltip label={t("Send guess list")} fontSize="sm" hasArrow>
                      <IconButton
                        icon={<FaUpload />}
                        variant="ghost"
                        colorScheme="blue"
                        size="sm"
                        _hover={{ transform: "scale(1.1)" }}
                        onClick={() => sendGuessListCallback(player)}
                      />
                    </Tooltip>
                    <Tooltip
                      label={
                        !otherPlayersInfo[player]?.song ||
                          (gameMode === otherPlayersInfo[player]?.gameMode &&
                            index === otherPlayersInfo[player]?.song?.index)
                          ? t("")
                          : `${t("Go to mode:")} ${otherPlayersInfo[player]?.gameMode} -> ${t("Index:")} ${otherPlayersInfo[player]?.song?.index}`
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
                )}
              </HStack>

              {/* Statistiques Centrés en Bas */}
              <Flex justify="center" w="100%" mt={2}>
                {gameMode === "battle" ? (
                  <HStack spacing={3}>
                    <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                      <HStack spacing={1}>
                        <FaTrophy />
                        <Text>{victories}</Text>
                      </HStack>
                    </Badge>
                    <Badge colorScheme="red" borderRadius="full" px={3} py={1}>
                      <HStack spacing={1}>
                        <FaSkull />
                        <Text>{defeats}</Text>
                      </HStack>
                    </Badge>
                    <Badge colorScheme="yellow" borderRadius="full" px={3} py={1}>
                      <HStack spacing={1}>
                        <FaBalanceScale />
                        <Text>{ties}</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                ) : (

                  <Badge colorScheme="blue" borderRadius="full" px={2} py={1}>
                    {latestGuess}
                    {latestGuess === "..." ? "" : " ?"}
                  </Badge>

                )}
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

export default MultiplayerPanel;
