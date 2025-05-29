import React, { useCallback, memo, useMemo } from 'react';
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

// Sous-composants mémorisés pour optimiser les performances
const PlayerStats = memo(({ victories, defeats, ties, iconSize }) => (
  <HStack spacing={[1, 2, 3]}>
    <Badge colorScheme="green" borderRadius="full" px={[2, 2.5, 3]} py={[0.5, 0.75, 1]} fontSize={["xs", "sm", "md"]}>
      <HStack spacing={[0.5, 1]}>
        <FaTrophy size={iconSize} />
        <Text fontSize={["xs", "sm", "md"]}>{victories}</Text>
      </HStack>
    </Badge>
    <Badge colorScheme="red" borderRadius="full" px={[2, 2.5, 3]} py={[0.5, 0.75, 1]} fontSize={["xs", "sm", "md"]}>
      <HStack spacing={[0.5, 1]}>
        <FaSkull size={iconSize} />
        <Text fontSize={["xs", "sm", "md"]}>{defeats}</Text>
      </HStack>
    </Badge>
    <Badge colorScheme="yellow" borderRadius="full" px={[2, 2.5, 3]} py={[0.5, 0.75, 1]} fontSize={["xs", "sm", "md"]}>
      <HStack spacing={[0.5, 1]}>
        <FaBalanceScale size={iconSize} />
        <Text fontSize={["xs", "sm", "md"]}>{ties}</Text>
      </HStack>
    </Badge>
  </HStack>
));

const PlayerGuess = memo(({ latestGuess }) => (
  <Badge colorScheme="blue" borderRadius="full" px={[1.5, 2]} py={[0.5, 0.75, 1]} fontSize={["2xs", "sm", "md"]} size={["xs", "sm", "md"]}>
    {latestGuess}
    {latestGuess === "..." ? "" : " ?"}
  </Badge>
));

const PlayerAvatar = memo(({ player, playerGameInfo, playerImage, status }) => (
  <HStack spacing={[1, 1.5, 2]}>
    <Text fontSize={["xs", "sm", "md"]}>{status ? "🟢" : "🔴"}</Text>
    <Tooltip label={playerGameInfo} fontSize={["xs", "sm"]} hasArrow>
      <Avatar size={["sm", "md"]} src={playerImage} name={player} />
    </Tooltip>
    <VStack spacing={1} align="start">
      <Text fontSize={["xs", "sm", "md"]} fontWeight="bold" noOfLines={1}>{player}</Text>
    </VStack>
  </HStack>
));

const PlayerButtons = memo(({ player, gameMode, index, otherPlayersInfo, handleOnClick, sendGuessListCallback, t }) => (
  <HStack spacing={[1, 1.5, 2]}>
    <Tooltip label={t("Send guess list")} fontSize={["xs", "sm"]} hasArrow>
      <IconButton
        icon={<FaUpload />}
        variant="ghost"
        colorScheme="blue"
        size={["xs", "sm"]}
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
      fontSize={["xs", "sm"]}
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
        size={["xs", "sm"]}
        onClick={() => handleOnClick(player)}
      />
    </Tooltip>
  </HStack>
));

const PlayerBattleStatus = memo(({ battleState, t }) => (
  <Badge
    colorScheme={
      battleState === "ready" ? "green" :
      battleState === "not_participating" ? "red" :
      battleState === "fighting" ? "blue" :
      battleState === "victory" ? "green" :
      battleState === "defeat" ? "red" :
      battleState === "tie" ? "orange" : "yellow"
    }
    borderRadius="full"
    px={[2, 2.5, 3]}
    py={[0.5, 0.75, 1]}
    fontSize={["2xs", "sm", "md"]}
  >
    {t(battleState || "waiting")}
  </Badge>
));

// Composant principal
const MultiplayerPanel = memo(({
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

  // Fonction mémorisée pour gérer la navigation vers un mode et un index de chanson
  const handleOnClick = useCallback((player) => {
    if (!otherPlayersInfo[player]?.song || !otherPlayersInfo[player]?.gameMode) return;

    if (gameMode === otherPlayersInfo[player].gameMode && index === otherPlayersInfo[player].song.index) {
      return;
    }

    setGameMode(otherPlayersInfo[player].gameMode);
    setIndex(otherPlayersInfo[player].song.index);
  }, [otherPlayersInfo, gameMode, index, setGameMode, setIndex]);

  // Fonction mémorisée pour obtenir les stats des matchs d'un joueur
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
      else if (foundSongs[song].players?.includes(player) && foundSongs[song].status !== "tie") {
        defeats++;
      }
      if (foundSongs[song].status === "tie" && foundSongs[song].players?.includes(player)) ties++;
    });

    return { victories, defeats, ties };
  }, [foundSongs]);

  // Éviter d'utiliser useBreakpointValue qui cause des re-renders lors du redimensionnement
  const iconSize = 14; // Valeur fixe, ou utiliser [11, 15, 18] pour un tableau responsif si nécessaire

  // Mémoriser la liste des joueurs triés pour éviter des recalculs à chaque rendu
  const sortedPlayersList = useMemo(() => {
    return [playerName, ...players.filter(item => item !== playerName)];
  }, [players, playerName]);

  const playersData = useMemo(() => {
    return sortedPlayersList.map((player, idx) => {
      const imageNumber = otherPlayersInfo[player]?.profilePicture ?? `pdp${(idx % 4) + 1}`;
      const playerImage = player !== playerName ? `/characters/${imageNumber}.png` : `/characters/${selectedImage}.png`;
      const latestGuess = player !== playerName ? otherPlayersInfo[player]?.guess || "..." : guess || "...";
      const playerGameInfo = player !== playerName && otherPlayersInfo[player]?.song
        ? `${t("Mode")}: ${t(otherPlayersInfo[player].gameMode)} - ${t("Index")}: ${otherPlayersInfo[player].song.index}`
        : "";
      const sortedPlayers = [...players].filter((p) => p === playerName ? battleState !== "not_participating" :
                                              otherPlayersInfo[p]?.battleState !== "not_participating")
                                              .sort((a, b) => a.localeCompare(b));
      const isSelector = sortedPlayers[0] === player;
      let playerNameLabel = isSelector ? "👑 " : "";
      playerNameLabel += player !== playerName ? player : player + t(" (You)");
      const playerBattleState = player !== playerName ? otherPlayersInfo[player]?.battleState : battleState;
      const isConnected = player === playerName || otherPlayersInfo[player]?.sendFunc;

      return {
        playerImage,
        latestGuess,
        playerGameInfo,
        playerNameLabel,
        playerBattleState,
        isConnected
      };
    });
  }
  , [sortedPlayersList, otherPlayersInfo, selectedImage, playerName, guess, battleState, players]);

  return (
    <Box p={[3, 4, 6]} borderRadius="2xl" boxShadow="lg" bg={colors.lyricsBg} m={[2, 3, 4]}>
      <Heading fontSize={["lg", "xl", "2xl"]} fontWeight="bold" mb={[2, 3, 4]} textAlign="center">
        🎮 {t("Room")} <Text as={"span"} color="blue.300">{roomId.toUpperCase()}</Text>
      </Heading>
      <Divider borderWidth={[1, 1.5, 2]} borderColor={colors.text} width="80%" mx="auto" mb={[2, 3, 4]} />

      <VStack spacing={[2, 3, 4]} align="start" w="100%">
        {sortedPlayersList.map((player, idx) => {
          // Mémoriser les données spécifiques au joueur
          const playerData = playersData[idx];

          const { victories, defeats, ties } = getMatchResults(player);

          return (
            <Box key={player} p={[2, 3, 4]} borderRadius="xl" bg={colors.lyricsBg} boxShadow="md" w="100%">
              <HStack spacing={[2, 3, 4]} w="100%" justify="space-between" flexWrap={["wrap", "nowrap"]}>
                {/* Avatar et Nom */}
                <PlayerAvatar 
                  player={playerData.playerNameLabel} 
                  playerGameInfo={playerData.playerGameInfo}
                  playerImage={playerData.playerImage}
                  status={playerData.isConnected}
                />

                {/* Badge de statut en Battle Mode */}
                {gameMode === "battle" && (
                  <PlayerBattleStatus 
                    battleState={playerData.playerBattleState} 
                    t={t} 
                  />
                )}

                {/* Boutons d'action (pour les autres joueurs, hors Battle Mode) */}
                {gameMode !== "battle" && player !== playerName && (
                  <PlayerButtons 
                    player={player}
                    gameMode={gameMode}
                    index={index}
                    otherPlayersInfo={otherPlayersInfo}
                    handleOnClick={handleOnClick}
                    sendGuessListCallback={sendGuessListCallback}
                    t={t}
                  />
                )}
              </HStack>

              {/* Statistiques ou dernier guess */}
              <Flex justify="center" w="100%" mt={[1, 1.5, 2]}>
                {gameMode === "battle" ? (
                  <PlayerStats 
                    victories={victories} 
                    defeats={defeats} 
                    ties={ties} 
                    iconSize={iconSize} 
                  />
                ) : (
                  <PlayerGuess latestGuess={playerData.latestGuess} />
                )}
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
});

export default MultiplayerPanel;