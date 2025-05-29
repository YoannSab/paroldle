import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import {
    Box,
    Heading,
    List,
    ListItem,
    Text,
    Flex,
    Button,
    Badge,
    Tooltip,
    Icon,
    VStack,
    HStack,
    CircularProgress,
    CircularProgressLabel,
    SimpleGrid,
    Card,
    CardBody,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useColorModeValue,
    Center,
    StatNumber,
    Stat
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { FaTrophy, FaFire, FaChartLine, FaMusic, FaQuestionCircle, FaHistory, FaMedal, FaHome } from 'react-icons/fa';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { useTranslation } from 'react-i18next';

// Composant pour les cartes de statistiques
const StatCard = memo(({ icon, title, value, helpText, color }) => {
    const bgColor = useColorModeValue("white", "gray.700");
    const borderColor = useColorModeValue(`${color}.200`, `${color}.800`);
    const iconColor = useColorModeValue(`${color}.500`, `${color}.300`);

    return (
        <Card
            borderLeft="4px solid"
            borderColor={borderColor}
            bg={bgColor}
            boxShadow="md"
            borderRadius="lg"
            transition="transform 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            h="100%"
        >
            <CardBody py={[2, 3, 4]} px={[2, 3, 5]}>
                <Flex 
                    align="center" 
                    flexDirection={["column", "row"]}
                    gap={[1, 2]}
                >
                    <Icon as={icon} color={iconColor} boxSize={[4, 5, 6]} mr={[0, 2]} />
                    <Text 
                        fontWeight="medium" 
                        color="gray.500" 
                        fontSize={["xs", "sm"]}
                        textAlign={["center", "left"]}
                    >
                        {title}
                    </Text>
                </Flex>
                <Stat>
                    <Flex 
                        align="baseline" 
                        gap={1} 
                        justifyContent={["center", "flex-start"]}
                    >
                        <StatNumber fontSize={["lg", "xl", "2xl"]} fontWeight="bold">{value}</StatNumber>
                        {helpText && (
                            <Text 
                                fontSize={["2xs", "xs"]} 
                                color="gray.500" 
                                alignSelf="flex-end" 
                                mb={1}
                            >
                                {helpText}
                            </Text>
                        )}
                    </Flex>
                </Stat>
            </CardBody>
        </Card>
    );
});

// Composant pour un position sur le podium
const PodiumPosition = memo(({ position, score, place, textColor }) => {
    const { t } = useTranslation();
    
    if (!score) return null;
    
    return (
        <VStack justify="flex-end" align="center" spacing={0}>
            <Box
                p={[2, 2, 4]}
                bg={position.bgColor}
                borderWidth="2px"
                borderColor={position.borderColor}
                borderRadius="md"
                h={position.height}
                w={["70px", "90px", "120px"]}
                boxShadow="lg"
                position="relative"
                zIndex={10 - position.place}
                transition="transform 0.3s"
                _hover={{ transform: "translateY(-5px)" }}
            >
                <VStack spacing={[0.5, 1]}>
                    <Icon as={position.icon} boxSize={[3, 4, 6]} color={position.iconColor} />
                    <Heading size={["xs", "xs", "md"]} color={textColor}>{t(place, {place: place+1})}</Heading>
                    <Text 
                        fontWeight="bold" 
                        noOfLines={1} 
                        fontSize={["2xs", "2xs", "md"]}
                        textAlign="center"
                    >
                        {score.playerName}
                    </Text>
                    <HStack spacing={1}>
                        <Icon as={FaQuestionCircle} color="purple.500" boxSize={[2, 2.5, 3]} />
                        <Text fontWeight="semibold" fontSize={["2xs", "xs", "sm"]}>{score.score.quiz?.score}{" "} pts</Text>
                    </HStack>
                    <HStack spacing={1}>
                        <Icon as={FaMusic} color="blue.500" boxSize={[2, 2.5, 3]} />
                        <Text fontWeight="semibold" fontSize={["2xs", "xs", "sm"]}>{score.score.song?.nGuesses}{" "}{t("words")}</Text>
                    </HStack>
                    {score.score.song?.status.includes('hardcore') && (
                        <Badge 
                            colorScheme="red" 
                            borderRadius="full" 
                            px={2} 
                            mt={1} 
                            fontSize={["2xs", "2xs", "sm"]}
                        >
                            {score.score.song?.status.replace('victory_', '')}
                        </Badge>
                    )}
                </VStack>
            </Box>
            <Box
                bg={textColor}
                h={["4px", "6px", "10px"]}
                w={["70px", "80px", "120px"]}
                borderBottomRadius="md"
                opacity={0.3}
            />
        </VStack>
    );
});

// Composant pour le podium
const PodiumDisplay = memo(({ scores }) => {
    // Couleurs constantes pour éviter l'erreur useColorModeValue conditionnel
    const textColor = useColorModeValue("gray.700", "white");
    const goldBg = useColorModeValue("yellow.100", "yellow.900");
    const goldBorder = useColorModeValue("yellow.400", "yellow.500");
    const silverBg = useColorModeValue("gray.100", "gray.600");
    const silverBorder = useColorModeValue("gray.400", "gray.500");
    const bronzeBg = useColorModeValue("orange.100", "orange.900");
    const bronzeBorder = useColorModeValue("orange.400", "orange.500");
    const { t } = useTranslation();

    // Définir les positions du podium et leur style
    const positions = useMemo(() => [
        { 
            place: 1, 
            height: ["130px", "150px", "230px"], 
            bgColor: silverBg, 
            borderColor: silverBorder, 
            icon: FaMedal, 
            iconColor: "gray.500" 
        },
        { 
            place: 0, 
            height: ["150px", "180px", "250px"], 
            bgColor: goldBg, 
            borderColor: goldBorder, 
            icon: FaTrophy, 
            iconColor: "yellow.500" 
        },
        { 
            place: 2, 
            height: ["120px", "140px", "200px"], 
            bgColor: bronzeBg, 
            borderColor: bronzeBorder, 
            icon: FaMedal, 
            iconColor: "orange.500" 
        }
    ], [goldBg, goldBorder, silverBg, silverBorder, bronzeBg, bronzeBorder]);

    if (!scores || scores.length === 0) {
        return (
            <Center p={6}>
                <Text color="gray.500">{t("No scores available for today.")}</Text>
            </Center>
        );
    }

    return (
        <Box px={[1, 2, 4]}>
            <Heading
                as="h3"
                size={["md", "lg"]}
                textAlign="center"
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
                letterSpacing="tight"
                mb={[2, 3, 4]}
            >
                🏆 {t("Daily Podium")}
            </Heading>

            <Flex 
                justify="center" 
                align="flex-end" 
                gap={[1, 1, 3]} 
                p={[1, 1, 4]} 
            >
                {positions.map((position, index) => {
                    const score = scores[position.place];
                    const place = position.place === 0 ? "place_1" : 
                                position.place === 1 ? "place_2" :
                                position.place === 2 ? "place_3" : "place_other";

                    return (
                        <PodiumPosition 
                            key={index}
                            position={position}
                            score={score}
                            place={place}
                            textColor={textColor}
                        />
                    );
                })}
            </Flex>
        </Box>
    );
});

// Composant pour un élément du tableau des autres joueurs
const PlayerTableItem = memo(({ player, index, oddRowBg, bgColor }) => {
    const { playerName, score } = player;
    const { t } = useTranslation();
    
    return (
        <ListItem
            p={[2, 2.5, 3]}
            borderRadius="md"
            bg={index % 2 === 0 ? oddRowBg : bgColor}
            transition="all 0.2s"
            _hover={{ bg: "gray.100" }}
        >
            <Flex 
                justifyContent="space-between" 
                align="center"
                flexDirection={["column", "row"]}
                gap={[1, 0]}
            >
                <HStack>
                    <Text fontWeight="bold" fontSize={["xs", "sm"]}>{index + 4}.</Text>
                    <Text fontSize={["xs", "sm"]} noOfLines={1}>{playerName}</Text>
                </HStack>
                <HStack 
                    spacing={[2, 3, 4]} 
                    ml={[0, 10]}
                    justifyContent={["center", "flex-start"]}
                    width={["100%", "auto"]}
                >
                    <HStack>
                        <Icon as={FaQuestionCircle} color="purple.500" boxSize={[2.5, 3]} />
                        <Text fontSize={["xs", "sm"]}>{score.quiz?.score} pts</Text>
                    </HStack>
                    <HStack>
                        <Icon as={FaMusic} color="blue.500" boxSize={[2.5, 3]} />
                        <Text fontSize={["xs", "sm"]}>{score.song?.nGuesses} {t("words")}</Text>
                    </HStack>
                </HStack>
            </Flex>
        </ListItem>
    );
});

// Composant pour le tableau des autres joueurs
const PlayersTable = memo(({ scores }) => {
    const bgColor = useColorModeValue("white", "gray.700");
    const oddRowBg = useColorModeValue("gray.50", "gray.800");
    const { t } = useTranslation();
    const otherPlayers = useMemo(() => scores.slice(3), [scores]);

    if (!scores || scores.length <= 3) {
        return null;
    }

    return (
        <Box p={[2, 3, 4]} borderRadius="lg" boxShadow="md" bg={bgColor} width="100%">
            <Heading as="h4" size={["sm", "md"]} mb={[2, 3, 4]}>
                {t('Other players')}
            </Heading>
            <List spacing={1}>
                {otherPlayers.map((player, index) => (
                    <PlayerTableItem 
                        key={index}
                        player={player}
                        index={index}
                        oddRowBg={oddRowBg}
                        bgColor={bgColor}
                    />
                ))}
            </List>
        </Box>
    );
});

// Composant pour les boutons de jeu
const GameButtons = memo(({ hasPlayedToday, setIsReady, setDailySongOrQuiz }) => {
    const buttonBgSong = useColorModeValue("blue.500", "blue.600");
    const buttonBgQuiz = useColorModeValue("purple.500", "purple.600");
    const buttonHoverBgSong = useColorModeValue("blue.600", "blue.700");
    const buttonHoverBgQuiz = useColorModeValue("purple.600", "purple.700");
    const { t } = useTranslation();
    
    const handleSongClick = useCallback(() => {
        setIsReady(false);
        setDailySongOrQuiz('song');
        setTimeout(() => setIsReady(true), 500);
    }, [setIsReady, setDailySongOrQuiz]);
    
    const handleQuizClick = useCallback(() => {
        setDailySongOrQuiz('quiz');
    }, [setDailySongOrQuiz]);
    
    return (
        <Card w="full" mb={[3, 4, 6]}>
            <CardBody px={[2, 3, 5]} py={[2, 3, 5]}>
                <Flex direction="column" gap={[2, 3, 4]}>
                    <Button
                        onClick={handleSongClick}
                        bg={buttonBgSong}
                        color="white"
                        _hover={{ bg: buttonHoverBgSong }}
                        size={["md", "lg"]}
                        height={["40px", "50px", "60px"]}
                        leftIcon={<Icon as={FaMusic} boxSize={[3, 4, 5]} />}
                        borderRadius="lg"
                        boxShadow="md"
                        fontSize={["sm", "md"]}
                    >
                        {t("Today's song")}
                    </Button>

                    <Tooltip 
                        label={!hasPlayedToday ? t("Find today's song to unlock the quiz!") : ""} 
                        hasArrow
                        placement="bottom"
                    >
                        <Button
                            onClick={handleQuizClick}
                            isDisabled={!hasPlayedToday}
                            bg={buttonBgQuiz}
                            color="white"
                            _hover={{ bg: buttonHoverBgQuiz }}
                            size={["md", "lg"]}
                            height={["40px", "50px", "60px"]}
                            leftIcon={<Icon as={FaQuestionCircle} boxSize={[3, 4, 5]} />}
                            borderRadius="lg"
                            boxShadow="md"
                            opacity={!hasPlayedToday ? 0.6 : 1}
                            fontSize={["sm", "md"]}
                        >
                            {t("Today's quiz")}
                        </Button>
                    </Tooltip>
                </Flex>
            </CardBody>
        </Card>
    );
});

// Composant pour la bannière de streak
const StreakBanner = memo(({ streak, maxStreak }) => {
    const { t } = useTranslation();
    
    return (
        <Box
            p={[3, 4]}
            mb={[3, 4, 6]}
            borderRadius="lg"
            bg={useColorModeValue("blue.50", "blue.900")}
            borderWidth="1px"
            borderColor={useColorModeValue("blue.200", "blue.600")}
        >
            <Flex 
                align="center" 
                justify="space-between"
                direction={["column", "row"]}
                gap={[2, 0]}
            >
                <VStack 
                    align={["center", "flex-start"]} 
                    spacing={0}
                    mb={[2, 0]}
                >
                    <Text 
                        fontSize={["xs", "sm"]} 
                        color="gray.500"
                        textAlign={["center", "left"]}
                    >
                        {t("Streak (Consecutive days)")}
                    </Text>
                    <Flex align="center">
                        <Icon as={FaFire} color="red.500" mr={2} boxSize={[4, 5]} />
                        <Heading size={["lg", "xl"]}>{streak}</Heading>
                    </Flex>
                </VStack>

                <CircularProgress
                    value={(streak / 30) * 100}
                    color="red.400"
                    thickness="12px"
                    size={["60px", "70px", "80px"]}
                >
                    <CircularProgressLabel fontWeight="bold">{streak}</CircularProgressLabel>
                </CircularProgress>
            </Flex>
        </Box>
    );
});

// Composant Statistiques
const UserStatistics = memo(({ dailyScores }) => {
    const { t } = useTranslation();

    // Calculer les statistiques à partir des scores quotidiens
    const stats = useMemo(() => {
        const entries = Object.entries(dailyScores || {});

        if (entries.length === 0) {
            return {
                totalDays: 0,
                streak: 0,
                maxStreak: 0,
                maxScore: 0,
                avgScore: 0,
                avgWords: 0
            };
        }

        // Trier les entrées par date
        entries.sort((a, b) => new Date(b[0]) - new Date(a[0]));

        // Calculer le streak actuel
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

        if (dailyScores[today]) {
            currentStreak += 1;
        }
        // Vérifier si joué aujourd'hui
        if (dailyScores[yesterday]) {
            currentStreak += 1;

            // Vérifier les jours précédents
            let checkDate = dayBefore;
            let streakBroken = false;

            while (!streakBroken) {
                if (dailyScores[checkDate]) {
                    currentStreak++;
                    // Passer au jour précédent
                    const prevDate = new Date(new Date(checkDate) - 86400000);
                    checkDate = prevDate.toISOString().split('T')[0];
                } else {
                    streakBroken = true;
                }
            }
        }

        // Calculer les autres statistiques
        let totalScore = 0;
        let totalWords = 0;
        let maxScore = 0;

        entries.forEach(([_, entry]) => {
            const score = entry.quiz?.score || 0;
            totalScore += score;
            if (score > maxScore) maxScore = score;

            totalWords += (entry.song?.nGuesses && !isNaN(entry.song?.nGuesses)) ? entry.song?.nGuesses : 0;
        });

        return {
            totalDays: entries.length,
            streak: currentStreak,
            maxStreak: Math.max(currentStreak, 10), // Simulé - à remplacer par le calcul réel du streak max
            maxScore,
            avgScore: Math.round(totalScore / entries.length),
            avgWords: Math.round(totalWords / entries.length)
        };
    }, [dailyScores]);

    return (
        <Box width="100%">
            <StreakBanner streak={stats.streak} maxStreak={stats.maxStreak} />

            <SimpleGrid 
                columns={[2]} 
                spacing={[2, 3, 4]} 
                p={[0, 2, 4]}
            >
                <StatCard
                    icon={CalendarIcon}
                    title={t("Days played")}
                    value={stats.totalDays}
                    color="blue"
                />

                <StatCard
                    icon={FaChartLine}
                    title={t("Max score")}
                    value={stats.maxScore}
                    helpText={t("pts")}
                    color="purple"
                />

                <StatCard
                    icon={FaQuestionCircle}
                    title={t("Average score")}
                    value={stats.avgScore}
                    helpText={t("pts")}
                    color="teal"
                />

                <StatCard
                    icon={FaMusic}
                    title={t("Average words")}
                    value={stats.avgWords}
                    color="orange"
                />
            </SimpleGrid>
        </Box>
    );
});

// Composant pour un élément d'historique personnel
const HistoryItem = memo(({ date, entry, index }) => {
    const textColor = useColorModeValue("gray.800", "gray.200");
    const itemBg = useColorModeValue("gray.50", "gray.700");
    const { t } = useTranslation();
    
    const stringDate = (date) => {
        const options = { day: 'numeric', month: 'long' };
        const dateStr = new Date(date + "T12:00:00").toLocaleDateString(navigator.language ?? "fr-FR", options);
        return dateStr;
    };
    
    return (
        <ListItem
            p={[2, 3]}
            borderRadius="md"
            bg={itemBg}
            borderLeft="4px solid"
            borderColor={entry.song?.status.includes('hardcore') ? "red.400" : "green.400"}
            transition="all 0.2s"
            _hover={{ transform: "translateX(5px)" }}
        >
            <Flex 
                direction={"column"}
                alignItems={"flex-start"}
                gap={2}
            >
                <Text 
                    fontWeight="bold" 
                    color={textColor} 
                    mr={[0, 5]}
                    fontSize={["sm", "md"]}
                >
                    {stringDate(date)} - {entry.song?.title?? ""} ({entry.song?.artist?? ""})
                </Text>
                <Flex 
                    wrap="wrap"
                    gap={[1, 2, 3]}
                    mt={[1, 0]}
                >
                    <Badge
                        colorScheme={entry.song?.status.includes('hardcore') ? "red" : "green"}
                        borderRadius="full"
                        px={2}
                        fontSize={["2xs", "xs"]}
                    >
                        {entry.song?.status.replace('victory_', '')}
                    </Badge>
                    <Badge 
                        colorScheme="blue" 
                        borderRadius="full" 
                        px={2}
                        fontSize={["2xs", "xs"]}
                    >
                        <HStack spacing={1}>
                            <Icon as={FaMusic} boxSize={[2, 3]} />
                            <Text>{entry.song?.nGuesses}{" "}{t("words")}</Text>
                        </HStack>
                    </Badge>
                    <Badge 
                        colorScheme="purple" 
                        borderRadius="full" 
                        px={2}
                        fontSize={["2xs", "xs"]}
                    >
                        <HStack spacing={1}>
                            <Icon as={FaQuestionCircle} boxSize={[2, 3]} />
                            <Text>{entry.quiz?.score} pts</Text>
                        </HStack>
                    </Badge>
                </Flex>
            </Flex>
        </ListItem>
    );
});

// Composant pour l'historique personnel
const PersonalHistory = memo(({ dailyScores }) => {
    const textColor = useColorModeValue("gray.800", "gray.200");
    const { t } = useTranslation();

    // Trier les entrées par date (plus récentes d'abord)
    const sortedEntries = useMemo(() => {
        return Object.entries(dailyScores || {})
            .sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [dailyScores]);

    return (
        <Box>
            <Heading 
                fontSize={["lg", "xl", "2xl"]} 
                mb={[3, 4, 6]} 
                textAlign="center" 
                color={textColor}
            >
                📅 {t("Personal History")}
            </Heading>

            {sortedEntries.length > 0 ? (
                <List spacing={[2, 3]}>
                    {sortedEntries.map(([date, entry], index) => (
                        <HistoryItem 
                            key={index}
                            date={date}
                            entry={entry}
                            index={index}
                        />
                    ))}
                </List>
            ) : (
                <Text 
                    color="gray.500" 
                    textAlign="center" 
                    fontSize={["sm", "md"]}
                >
                    {t("No history available.")}
                </Text>
            )}
        </Box>
    );
});

// Composant TabContent pour la page d'accueil
const HomeTabContent = memo(({ dailyScores, setDailySongOrQuiz, setIsReady, dailyTotalPoints, hasPlayedToday }) => {
    const { t } = useTranslation();
    
    return (
        <VStack spacing={[3, 4, 6]}>
            <Heading as="h3" size={["md", "lg"]} mb={[1, 2]} textAlign="center">
                {t("Total score: ")}
                <Badge 
                    colorScheme="blue" 
                    ml={2} 
                    fontSize={["lg", "xl", "2xl"]} 
                    transform="translateY(-2px)"
                >
                    {dailyTotalPoints} pts
                </Badge>
            </Heading>

            <GameButtons
                hasPlayedToday={hasPlayedToday}
                setIsReady={setIsReady}
                setDailySongOrQuiz={setDailySongOrQuiz}
            />

            <Heading 
                as="h3" 
                size={["sm", "md"]} 
                mb={[1, 2]} 
                alignSelf="flex-start"
            >
                📊 {t("Your Statistics")}
            </Heading>

            <UserStatistics dailyScores={dailyScores} />
        </VStack>
    );
});

// Composant TabContent pour le podium
const PodiumTabContent = memo(({ scores }) => {
    return (
        <VStack spacing={[3, 3, 6]}>
            <PodiumDisplay scores={scores} />
            <PlayersTable scores={scores} />
        </VStack>
    );
});

// Composant TabMenu pour l'onglet
const TabMenu = memo(({ activeIndex, onChange }) => {
    const { t } = useTranslation();
    const activeTabBg = useColorModeValue("blue.50", "blue.900");
    const tabListBg = useColorModeValue("gray.100", "gray.700");
    
    return (
        <TabList 
            bg={tabListBg} 
            borderRadius="xl" 
            p={[0.5, 1]} 
            mb={[2, 3, 4]}
            fontSize={["xs", "sm", "md"]}
        >
            <Tab
                _selected={{ bg: activeTabBg, color: "blue.600", fontWeight: "bold" }}
                borderRadius="lg"
                py={[1.5, 2, 3]}
                px={[1, 2, 3]}
            >
                <HStack spacing={[1, 2]}>
                    <Icon as={FaHome} boxSize={[3, 3.5, 4]} />
                    <Text display={["none", "none", "block"]}>{t("Home")}</Text>
                </HStack>
            </Tab>
            <Tab
                _selected={{ bg: activeTabBg, color: "blue.600", fontWeight: "bold" }}
                borderRadius="lg"
                py={[1.5, 2, 3]}
                px={[1, 2, 3]}
            >
                <HStack spacing={[1, 2]}>
                    <Icon as={FaTrophy} boxSize={[3, 3.5, 4]} />
                    <Text display={["none", "none", "block"]}>Podium</Text>
                </HStack>
            </Tab>
            <Tab
                _selected={{ bg: activeTabBg, color: "blue.600", fontWeight: "bold" }}
                borderRadius="lg"
                py={[1.5, 2, 3]}
                px={[1, 2, 3]}
            >
                <HStack spacing={[1, 2]}>
                    <Icon as={FaHistory} boxSize={[3, 3.5, 4]} />
                    <Text display={["none", "none", "block"]}>{t("History")}</Text>
                </HStack>
            </Tab>
        </TabList>
    );
});

// Composant principal avec onglets
const QuizTab = memo(({ dailyScores, setDailySongOrQuiz, setIsReady, dailyTotalPoints }) => {
    const [scores, setScores] = useState([]);
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);
    const hasPlayedToday = useMemo(() => Boolean(dailyScores[todayString]), [dailyScores, todayString]);
    const { t } = useTranslation();
    
    // Couleurs définies en dehors des conditions pour éviter l'erreur useColorModeValue
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const tabBg = useColorModeValue("white", "gray.800");

    // Charger les scores depuis Firebase
    useEffect(() => {
        const scoresRef = ref(database, `daily_scores/${today}`);
        const unsubscribe = onValue(scoresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const scoreArray = Object.entries(data).map(([playerName, score]) => ({ playerName, score }));
                scoreArray.sort((a, b) => (b.score.quiz?.score || 0) - (a.score.quiz?.score || 0));
                setScores(scoreArray);
            } else {
                setScores([]);
            }
        });
        return () => unsubscribe();
    }, [today]);

    // Props mémorisés pour les tabs
    const homeTabProps = useMemo(() => ({
        dailyScores,
        setDailySongOrQuiz,
        setIsReady,
        dailyTotalPoints,
        hasPlayedToday
    }), [dailyScores, setDailySongOrQuiz, setIsReady, dailyTotalPoints, hasPlayedToday]);

    const podiumTabProps = useMemo(() => ({
        scores
    }), [scores]);

    const historyTabProps = useMemo(() => ({
        dailyScores
    }), [dailyScores]);

    return (
        <Box p={[1, 3, 6]} borderRadius="lg" bg={bgColor}>
            <Tabs variant="enclosed" colorScheme="blue" isFitted>
                <TabMenu />
                
                <TabPanels bg={tabBg} borderRadius="xl" boxShadow="xl" p={[2, 3, 4]}>
                    {/* Onglet 1: Accueil avec boutons et statistiques */}
                    <TabPanel px={0}>
                        <HomeTabContent {...homeTabProps} />
                    </TabPanel>

                    {/* Onglet 2: Podium */}
                    <TabPanel px={0}>
                        <PodiumTabContent {...podiumTabProps} />
                    </TabPanel>

                    {/* Onglet 3: Historique */}
                    <TabPanel px={0}>
                        <PersonalHistory {...historyTabProps} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
});

export default QuizTab;