import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Text, Heading, VStack, HStack, Divider, Tooltip, Icon, Flex, useColorModeValue, Image } from '@chakra-ui/react';
import { List, ListItem } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import { FaClock, FaHandshake } from 'react-icons/fa';


const SongsList = ({ allSongs, foundSongs, playerName }) => {
    const redButton = useColorModeValue('red.300', 'red.600');
    const greenButton = useColorModeValue('green.300', 'green.600');
    const yellowButton = useColorModeValue('yellow.300', 'yellow.600');

    const { t } = useTranslation();

    if (!allSongs || !foundSongs) return null;
    // if foundSong[song] is not type dict then it will return null
    if (Object.values(foundSongs).some(song => typeof song !== 'object')) return null;

    return (
        <List spacing={3} overflow={'auto'} maxH={'400px'}>
            {Object.keys(foundSongs).map((song, i) => {
                const label = foundSongs[song] ?
                    ((foundSongs[song].status === "victory" ? t("Victory") : foundSongs[song].status === "defeat" ? t("Defeat") : t("Tie"))
                        + t(" against ") + foundSongs[song]?.players.filter(player => player !== playerName).join(", ")) : "";
                return (
                    <Tooltip
                        key={i}
                        label={label}
                        aria-label="A tooltip"
                    >
                        <ListItem
                            key={i}
                            p={2}
                            border="2px"
                            borderColor="gray.200"
                            borderRadius="md"
                            bgColor={foundSongs[song]?.status === "victory" ? greenButton : foundSongs[song]?.status === "defeat" ? redButton : yellowButton}                        >
                            <Text><Text as={'b'}>{allSongs[song]?.title}</Text> - {allSongs[song]?.author}</Text>
                        </ListItem>
                    </Tooltip>
                )
            })}
        </List>
    );
};

const OneVsOne = ({
    filteredSongs,
    allSongs,
    setIndex,
    fightIndex,
    setFightIndex,
    roomPlayers,
    otherPlayersInfo,
    isConnected,
    playerName,
    battleState,
    setBattleState,
    battleStartTime,      // timestamp (en ms) auquel le combat doit démarrer
    setBattleStartTime,   // fonction pour mettre à jour battleStartTime
    gameState,
    foundSongs,
    setWantsTie,
    setOtherPlayersInfo,
}) => {
    const colors = useColors();
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(null);
    const [combatStarted, setCombatStarted] = useState(false);
    const [combatTimer, setCombatTimer] = useState(0);
    const [isTieButtonDisabled, setIsTieButtonDisabled] = useState(false);
    const [isRolling, setIsRolling] = useState(false); // État pour l'animation de dés

    // Boutons de préparation
    const handleReadyUp = () => {
        setBattleState("ready");
    };

    const handleNotParticipating = () => {
        setBattleState("not_participating");
    };

    const handleAskForTie = () => {
        sendToPlayers(JSON.stringify({ wantsTie: true }));
        setWantsTie(true);
        setIsTieButtonDisabled(true);
        // enable in 10 seconds
        setTimeout(() => {
            setIsTieButtonDisabled(false);
            setWantsTie(false);
        }, 10000);
    };

    const sendToPlayers = useCallback((data) => {
        Object.keys(otherPlayersInfo).forEach(player => {
            if ((otherPlayersInfo[player].battleState === "ready" || otherPlayersInfo[player].battleState === "fighting") && otherPlayersInfo[player].sendFunc) {
                otherPlayersInfo[player].sendFunc(data);
            }
        });
    }, [otherPlayersInfo]);

    // Vérifier que tous les joueurs ont choisi un état ("ready" ou "not_participating")
    useEffect(() => {
        if (combatStarted || countdown !== null) return;
        const validStates = ["ready", "not_participating"];
        const isCurrentReady = battleState && validStates.includes(battleState);
        const areOthersReady =
            otherPlayersInfo &&
            Object.keys(otherPlayersInfo).every(
                player => validStates.includes(otherPlayersInfo[player].battleState)
            );
        const nPlayersParticipating = Object.keys(otherPlayersInfo).filter(
            player => otherPlayersInfo[player].battleState === "ready"
        ).length + (battleState === "ready" ? 1 : 0);

        const allPlayersSet = isCurrentReady && areOthersReady && nPlayersParticipating >= 2;
        if (allPlayersSet && !combatStarted) {

            // Déterminer le premier joueur par ordre lexicographique
            const sortedPlayers = [...roomPlayers].filter((player) => player === playerName ? battleState === "ready" :
                                                    otherPlayersInfo[player].battleState === "ready")
                                                    .sort((a, b) => a.localeCompare(b));
                                                    
            const isSelector = sortedPlayers[0] === playerName;
            if (isSelector && fightIndex === null) {
                // Le sélecteur choisit l'index aléatoire
                setIsRolling(true); // Démarre l'animation de dés
                // setTimeout(() => {
                const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
                const randomIndex = randomSong ? randomSong.index : null;
                if (isNaN(randomIndex)) return;
                setFightIndex(randomIndex);
                const startTime = Date.now() + 5000; // démarrage prévu dans 5s
                // Envoyer l'index et l'heure de démarrage aux autres joueurs
                sendToPlayers(JSON.stringify({ songIndex: randomIndex, startTime }));
                setBattleStartTime(startTime);
                setCountdown(Math.ceil((startTime - Date.now()) / 1000));
                setIsRolling(false); // Arrête l'animation de dés
                // }, 2500); // Durée de l'animation de dés
            } else if (!isSelector && fightIndex !== null && battleStartTime) {
                // Les autres joueurs ont reçu l'index via RTC
                setCountdown(Math.ceil((battleStartTime - Date.now()) / 1000));
            }
        }
    }, [battleState, otherPlayersInfo, roomPlayers, fightIndex, battleStartTime]);

    // Décompte avant le lancement du combat
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timerId = setTimeout(() => {
                setCountdown(Math.ceil((battleStartTime - Date.now()) / 1000));
            }, 1000);
            return () => clearTimeout(timerId);
        } else if (countdown !== null && countdown <= 0) {
            if (fightIndex !== null) {
                setIndex(fightIndex);
                startCombat();
            }
        }
    }, [countdown, battleStartTime]);

    // Démarrer le combat
    const startCombat = () => {
        // delete foundWords from otherPlayersInfo
        const newOtherPlayersInfo = { ...otherPlayersInfo };
        Object.keys(newOtherPlayersInfo).forEach(player => {
            if (newOtherPlayersInfo[player].foundWords) {
                delete newOtherPlayersInfo[player].foundWords;
            }
        });
        setOtherPlayersInfo(newOtherPlayersInfo);

        setBattleState("fighting");
        setCombatStarted(true);
        setCountdown(null);
    };

    // Minuteur du combat
    useEffect(() => {
        let timerId;
        if (combatStarted) {
            timerId = setInterval(() => {
                setCombatTimer(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [combatStarted]);

    const handleEndGame = (status) => {

        setBattleState(status);
        setCombatStarted(false);
        setCombatTimer(0);
        setFightIndex(null);
        setBattleStartTime(null);
        setWantsTie(false);
    };

    useEffect(() => {
        if (combatStarted) {
            if (gameState.startsWith("victory")) {
                // Envoyer le résultat aux autres joueurs
                sendToPlayers(JSON.stringify({ songResult: "victory" }));
                handleEndGame("victory");
            }
            else if (gameState.startsWith("defeat")) {
                handleEndGame("defeat");

            }
            else if (gameState.startsWith("tie")) {
                handleEndGame("tie");
            }
        }
    }
        , [gameState]);

    return (
        <VStack spacing={[3, 4, 6]} align="stretch">
            {/* Battle Box */}
            <Box p={[3, 4, 6]} borderRadius="3xl" bg={colors.lyricsBg}>
                <Heading fontSize={["lg", "xl", "2xl"]} fontWeight="bold" textAlign="center" mb={[2, 3, 4]}>
                    ⚔️ {t("1v1 Battle")}
                </Heading>
                <Divider borderWidth={[1, 1.5, 2]} borderColor={colors.text} width="80%" mx="auto" mb={[2, 3, 4]} />

                {countdown !== null ? (
                    <Text fontSize={["4xl", "5xl", "6xl"]} textAlign="center" fontWeight="bold" color="yellow.400">
                        {countdown}
                    </Text>
                ) : !isConnected ? (
                    <Text textAlign="center" fontSize={["md", "md", "lg"]} fontWeight={"bold"}>
                        {t("You need to be connected to start a battle.")}
                    </Text>
                ) : !combatStarted ? (
                    <VStack spacing={[3, 4, 5]}>
                        <Text textAlign="center" fontSize={["sm", "md", "lg"]} fontWeight={"bold"}>
                            {t("The first to find the song title wins trophies.")}
                        </Text>
                        {filteredSongs.length === 0 ? (
                            <Text textAlign="center" fontSize={["sm", "md", "lg"]} fontWeight={"bold"}>
                                {t("Uncheck some filters to get more songs!")}
                            </Text>
                        ) : (
                            <Text textAlign="center" fontSize={["sm", "md", "lg"]} fontWeight={"bold"}>
                                {t("Random choice among")} <Text as="span" color="yellow.400">{filteredSongs.length}</Text> {t("songs")}!
                            </Text>
                        )}
                        <HStack spacing={[2, 3, 4]} flexWrap={["wrap", "nowrap"]}>
                            <Button
                                colorScheme="red"
                                size={["xs", "md"]}
                                onClick={handleReadyUp}
                                isDisabled={roomPlayers.length < 2 || battleState === "ready" || filteredSongs.length === 0}
                                _hover={{ transform: (roomPlayers.length < 2 || battleState === "ready" || filteredSongs.length === 0) ? "none" : "scale(1.05)" }}
                                mb={[1, 0]}
                                w={["full", "auto"]}
                            >
                                {t("Ready to battle!")}
                            </Button>
                            <Button
                                colorScheme="blue"
                                size={["xs", "md"]}
                                onClick={handleNotParticipating}
                                isDisabled={roomPlayers.length < 2 || battleState === "not_participating"}
                                _hover={{ transform: (roomPlayers.length < 2 || battleState === "not_participating") ? "none" : "scale(1.05)" }}
                                w={["full", "auto"]}
                            >
                                {t("Not participating")}
                            </Button>
                        </HStack>
                    </VStack>
                ) : (
                    <VStack spacing={[2, 2, 3]}>
                        <Text textAlign="center" fontSize={["lg", "xl"]} fontWeight="bold" color="yellow.400">
                            {t("Match in progress!")}
                        </Text>
                        <Flex align="center" p={[2, 2, 3]} borderRadius="md" borderWidth={[1, 1, 2]} >
                            <Icon as={FaClock} color="yellow.300" boxSize={[4, 5]} mr={2} />
                            <Text fontSize={["md", "md", "lg"]}>{t("Time elapsed:")} {combatTimer} s</Text>
                        </Flex>
                        <Button
                            colorScheme="yellow"
                            size={["md", "md", "lg"]}
                            onClick={handleAskForTie}
                            isDisabled={battleState === "tie" || isTieButtonDisabled}
                            leftIcon={<FaHandshake />}
                            _hover={{ transform: (battleState === "tie" || isTieButtonDisabled) ? "none" : "scale(1.05)" }}
                        >
                            {t("Ask for a tie")}
                        </Button>
                    </VStack>
                )}
            </Box>

            {/* Previous Fights Box */}
            <Box p={[3, 4, 6]} borderRadius="3xl" bg={colors.lyricsBg}>
                <Heading fontSize={["lg", "xl", "2xl"]} fontWeight="bold" textAlign="center" mb={[2, 3, 4]}>
                    🎤 {t("Previous fights")}
                </Heading>
                <Divider borderWidth={[1, 1.5, 2]} borderColor="gray.600" width="80%" mx="auto" mb={[2, 3, 4]} />

                {Object.keys(allSongs).length === 0 || !foundSongs || Object.keys(foundSongs).length === 0 ? (
                    <Text textAlign="center" fontSize={["sm", "md", "lg"]} fontWeight={"bold"}>
                        {t("No finished fights yet.")}
                    </Text>
                ) : (
                    <SongsList allSongs={allSongs} foundSongs={foundSongs} playerName={playerName} />
                )}
            </Box>
        </VStack>
    );
};
export default OneVsOne;
