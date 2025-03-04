import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Text, Heading, VStack, HStack, Divider, Tooltip, Icon, Flex, useColorModeValue } from '@chakra-ui/react';
import { List, ListItem } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import { FaClock, FaHandshake } from 'react-icons/fa';


const SongsList = ({ allSongs, foundSongs }) => {
    const redButton = useColorModeValue('red.300', 'red.600');
    const greenButton = useColorModeValue('green.300', 'green.600');
    const yellowButton = useColorModeValue('yellow.300', 'yellow.600');
    if (!allSongs || !foundSongs) return null;
    return (
        <List spacing={3} overflow={'auto'} maxH={'400px'}>
            {Object.keys(foundSongs).map((song, i) => {
                const label = foundSongs[song] ?
                    ((foundSongs[song].status == "victory" ? "Victory" : foundSongs[song].status == "defeat" ? "Defeat" : "Tie")
                        + " against " + foundSongs[song]?.players.join(", ")) : "No result";
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
                            bgColor={foundSongs[song]?.status == "victory" ? greenButton : foundSongs[song]?.status == "defeat" ? redButton : yellowButton}                        >
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
}) => {
    const colors = useColors();
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(null);
    const [combatStarted, setCombatStarted] = useState(false);
    const [combatTimer, setCombatTimer] = useState(0);
    const [isTieButtonDisabled, setIsTieButtonDisabled] = useState(false);

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
            const sortedPlayers = [...roomPlayers].sort((a, b) => a.localeCompare(b));
            const isSelector = sortedPlayers[0] === playerName;
            if (isSelector && fightIndex === null) {
                // Le sélecteur choisit l'index aléatoire
                const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
                const randomIndex = randomSong ? randomSong.index : null;
                if (isNaN(randomIndex)) return;
                setFightIndex(randomIndex);
                const startTime = Date.now() + 5000; // démarrage prévu dans 5s
                // Envoyer l'index et l'heure de démarrage aux autres joueurs
                sendToPlayers(JSON.stringify({ songIndex: randomIndex, startTime }));
                setBattleStartTime(startTime);
                setCountdown(Math.ceil((startTime - Date.now()) / 1000));
            } else if (!isSelector && fightIndex !== null && battleStartTime) {
                // Les autres joueurs ont reçu l'index via RTC
                setCountdown(Math.ceil((battleStartTime - Date.now()) / 1000));
            }
        } 
        // else if (!allPlayersSet && countdown !== null) {
        //     // Si un joueur change d'état pendant le décompte, on l'annule
        //     setCountdown(null);
        // }
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
        <VStack spacing={6} align="stretch">
            {/* Battle Box */}
            <Box p={6} borderRadius="3xl" bg={colors.lyricsBg}>
                <Heading fontSize="2xl" fontWeight="bold" textAlign="center" mb={4}>
                    ⚔️ {t("1v1 Battle")}
                </Heading>
                <Divider borderWidth={2} borderColor={colors.text} width="80%" mx="auto" mb={4} />

                {countdown !== null ? (
                    <Text fontSize="6xl" textAlign="center" fontWeight="bold" color="yellow.400">
                        {countdown}
                    </Text>
                ) : !isConnected ? (
                    <Text textAlign="center" fontSize="lg" fontWeight={"bold"}>
                        {t("You need to be connected to start a battle.")}
                    </Text>
                ) : !combatStarted ? (
                    <VStack spacing={5}>
                        <Text textAlign="center" fontSize="lg" fontWeight={"bold"}>
                            {t("Battle against your friends! The first to find the song title wins trophies.")}
                        </Text>
                        <HStack spacing={4}>
                            <Button
                                colorScheme="red"
                                size="md"
                                onClick={handleReadyUp}
                                isDisabled={roomPlayers.length < 2 || battleState === "ready"}
                                _hover={{ transform: (roomPlayers.length < 2 || battleState === "ready") ? "none" : "scale(1.05)" }}
                            >
                                {t("Ready to battle!")}
                            </Button>
                            <Button
                                colorScheme="blue"
                                size="md"
                                onClick={handleNotParticipating}
                                isDisabled={roomPlayers.length < 2 || battleState === "not_participating"}
                                _hover={{ transform: (roomPlayers.length < 2 || battleState === "not_participating") ? "none" : "scale(1.05)" }}
                            >
                                {t("Not participating")}
                            </Button>

                        </HStack>
                    </VStack>
                ) : (
                    <VStack spacing={3}>
                        <Text textAlign="center" fontSize="xl" fontWeight="bold" color="yellow.400">
                            {t("Match in progress!")}
                        </Text>
                        <Flex align="center" p={3} borderRadius="md" borderWidth={2} >
                            <Icon as={FaClock} color="yellow.300" boxSize={5} mr={2} />
                            <Text fontSize="lg">{t("Time elapsed:")} {combatTimer} s</Text>
                        </Flex>
                        <Button
                            colorScheme="yellow"
                            size="lg"
                            onClick={handleAskForTie}
                            isDisabled={battleState === "tie" || isTieButtonDisabled}
                            leftIcon={<FaHandshake />}
                            _hover={{ transform: (battleState === "tie" || isTieButtonDisabled) ? "none" :"scale(1.05)"}}
                        >
                            {t("Ask for a tie")}
                        </Button>
                    </VStack>
                )}
            </Box>

            {/* Previous Fights Box */}
            <Box p={6} borderRadius="3xl" bg={colors.lyricsBg}>
                <Heading fontSize="2xl" fontWeight="bold" textAlign="center" mb={4}>
                    🎤 {t("Previous fights")}
                </Heading>
                <Divider borderWidth={2} borderColor="gray.600" width="80%" mx="auto" mb={4} />

                {Object.keys(allSongs).length === 0 || !foundSongs || Object.keys(foundSongs).length === 0 ? (
                    <Text textAlign="center" fontSize="lg" color="gray.400">
                        {t("No finished fights yet.")}
                    </Text>
                ) : (
                    <SongsList allSongs={allSongs} foundSongs={foundSongs} />
                )}
            </Box>
        </VStack>
    );
};
export default OneVsOne;
