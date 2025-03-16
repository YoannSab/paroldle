import React, { useEffect, useState, useMemo } from 'react';
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
const StatCard = ({ icon, title, value, helpText, color }) => {
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
            <CardBody py={{ base: 1, md: 4 }} px={{ base: 1, md: 5 }}>
                <Flex 
                    align="center" 
                    
                    flexDirection={{ base: "column", sm: "row" }}
                    gap={{ base: 1, sm: 2 }}
                >
                    <Icon as={icon} color={iconColor} boxSize={{ base: 4, md: 6 }} mr={{ base: 0, sm: 2 }} />
                    <Text 
                        fontWeight="medium" 
                        color="gray.500" 
                        fontSize={{ base: "xs", md: "sm" }}
                        textAlign={{ base: "center", sm: "left" }}
                    >
                        {title}
                    </Text>
                </Flex>
                <Stat>
                    <Flex 
                        align="baseline" 
                        gap={1} 
                        justifyContent={{ base: "center", sm: "flex-start" }}
                    >
                        <StatNumber fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">{value}</StatNumber>
                        {helpText && (
                            <Text 
                                fontSize={{ base: "2xs", md: "xs" }} 
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
};

// Composant pour le podium
const PodiumDisplay = ({ scores }) => {
    // Couleurs constantes pour éviter l'erreur useColorModeValue conditionnel
    const textColor = useColorModeValue("gray.700", "white");
    const goldBg = useColorModeValue("yellow.100", "yellow.900");
    const goldBorder = useColorModeValue("yellow.400", "yellow.500");
    const silverBg = useColorModeValue("gray.100", "gray.600");
    const silverBorder = useColorModeValue("gray.400", "gray.500");
    const bronzeBg = useColorModeValue("orange.100", "orange.900");
    const bronzeBorder = useColorModeValue("orange.400", "orange.500");
    const { t } = useTranslation();

    if (!scores || scores.length === 0) {
        return (
            <Center p={6}>
                <Text color="gray.500">{t("No scores available for today.")}</Text>
            </Center>
        );
    }

    // Définir les positions du podium et leur style
    const positions = [
        { place: 1, height: { base: "120px", md: "190px" }, bgColor: silverBg, borderColor: silverBorder, icon: FaMedal, iconColor: "gray.500" },
        { place: 0, height: { base: "150px", md: "220px" }, bgColor: goldBg, borderColor: goldBorder, icon: FaTrophy, iconColor: "yellow.500" },
        { place: 2, height: { base: "110px", md: "170px" }, bgColor: bronzeBg, borderColor: bronzeBorder, icon: FaMedal, iconColor: "orange.500" }
    ];

    return (
        <Box px={{ base: 1, md: 4 }}>
            <Heading
                as="h3"
                size={{ base: "md", md: "lg" }}
                textAlign="center"
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
                letterSpacing="tight"
                mb={{ base: 2, md: 4 }}
            >
                🏆 {t("Daily Podium")}
            </Heading>

            <Flex 
                justify="center" 
                align="flex-end" 
                gap={{ base: 1, sm: 2, md: 3 }} 
                p={{ base: 1, md: 4 }} 

            >
                {positions.map((position, index) => {
                    const score = scores[position.place];
                    const place = position.place === 0 ? "place_1" : 
                                 position.place === 1 ? "place_2" :
                                 position.place === 2 ? "place_3" : "place_other";

                    if (!score) return null;

                    return (
                        <VStack
                            key={index}
                            justify="flex-end"
                            align="center"
                            spacing={0}
                        >
                            <Box
                                p={{ base: 2, md: 4 }}
                                bg={position.bgColor}
                                borderWidth="2px"
                                borderColor={position.borderColor}
                                borderRadius="md"
                                h={position.height}
                                w={{ base: "80px", md: "120px" }}
                                boxShadow="lg"
                                position="relative"
                                zIndex={10 - position.place}
                                transition="transform 0.3s"
                                _hover={{ transform: "translateY(-5px)" }}
                            >
                                <VStack spacing={{ base: 0.5, md: 1 }}>
                                    <Icon as={position.icon} boxSize={{ base: 4, md: 6 }} color={position.iconColor} />
                                    <Heading size={{ base: "xs", md: "md" }} color={textColor}>{t(place, {place : place+1})}</Heading>
                                    <Text 
                                        fontWeight="bold" 
                                        noOfLines={1} 
                                        fontSize={{ base: "2xs", md: "md" }}
                                        textAlign="center"
                                    >
                                        {score.playerName}
                                    </Text>
                                    <HStack spacing={1}>
                                        <Icon as={FaQuestionCircle} color="purple.500" boxSize={{ base: 2, md: 3 }} />
                                        <Text fontWeight="semibold" fontSize={{ base: "2xs", sm: "xs", md: "sm" }}>{score.score.quiz?.score}{" "} pts</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                        <Icon as={FaMusic} color="blue.500" boxSize={{ base: 2, md: 3 }} />
                                        <Text fontWeight="semibold" fontSize={{ base: "2xs", sm: "xs", md: "sm" }}>{score.score.song?.nGuesses}{" "}{t("words")}</Text>
                                    </HStack>
                                    {score.score.song?.status.includes('hardcore') && (
                                        <Badge 
                                            colorScheme="red" 
                                            borderRadius="full" 
                                            px={2} 
                                            mt={1} 
                                            fontSize={{ base: "2xs", sm: "xs", md: "sm" }}
                                        >
                                            {score.score.song?.status.replace('victory_', '')}
                                        </Badge>
                                    )}
                                </VStack>
                            </Box>
                            <Box
                                bg={textColor}
                                h={{ base: "6px", md: "10px" }}
                                w={{ base: "80px", md: "120px" }}
                                borderBottomRadius="md"
                                opacity={0.3}
                            />
                        </VStack>
                    );
                })}
            </Flex>
        </Box>
    );
};

// Composant pour le tableau des autres joueurs
const PlayersTable = ({ scores }) => {
    const bgColor = useColorModeValue("white", "gray.700");
    const oddRowBg = useColorModeValue("gray.50", "gray.800");
    const { t } = useTranslation();

    if (!scores || scores.length <= 3) {
        return null;
    }

    return (
        <Box p={{ base: 2, md: 4 }}  borderRadius="lg" boxShadow="md" bg={bgColor} width="100%">
            <Heading as="h4" size={{ base: "sm", md: "md" }} mb={4}>
                {t('Other players')}
            </Heading>
            <List spacing={1}>
                {scores.slice(3).map(({ playerName, score }, index) => (
                    <ListItem
                        key={index}
                        p={{ base: 2, md: 3 }}
                        borderRadius="md"
                        bg={index % 2 === 0 ? oddRowBg : bgColor}
                        transition="all 0.2s"
                        _hover={{ bg: "gray.100" }}
                    >
                        <Flex 
                            justifyContent="space-between" 
                            align="center"
                            flexDirection={{ base: "column", sm: "row" }}
                            gap={{ base: 1, sm: 0 }}
                        >
                            <HStack>
                                <Text fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>{index + 4}.</Text>
                                <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={1}>{playerName}</Text>
                            </HStack>
                            <HStack 
                                spacing={{ base: 2, md: 4 }} 
                                ml={{ base: 0, sm: 10 }}
                                justifyContent={{ base: "center", sm: "flex-start" }}
                                width={{ base: "100%", sm: "auto" }}
                            >
                                <HStack>
                                    <Icon as={FaQuestionCircle} color="purple.500" boxSize={{ base: 2.5, md: 3 }} />
                                    <Text fontSize={{ base: "xs", md: "sm" }}>{score.quiz?.score} pts</Text>
                                </HStack>
                                <HStack>
                                    <Icon as={FaMusic} color="blue.500" boxSize={{ base: 2.5, md: 3 }} />
                                    <Text fontSize={{ base: "xs", md: "sm" }}>{score.song?.nGuesses} {t("words")}</Text>
                                </HStack>
                            </HStack>
                        </Flex>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

// Composant pour les boutons de jeu
const GameButtons = ({ hasPlayedToday, setIsReady, setDailySongOrQuiz }) => {
    const buttonBgSong = useColorModeValue("blue.500", "blue.600");
    const buttonBgQuiz = useColorModeValue("purple.500", "purple.600");
    const buttonHoverBgSong = useColorModeValue("blue.600", "blue.700");
    const buttonHoverBgQuiz = useColorModeValue("purple.600", "purple.700");
    const { t } = useTranslation();
    
    return (
        <Card w="full" mb={{base:3, md: 6}}>
            <CardBody px={{ base: 2, md: 5 }} py={{ base: 3, md: 5 }}>
                <Flex 
                    direction="column" 
                    gap={{ base: 2, md: 4 }}
                >
                    <Button
                        onClick={() => {
                            setIsReady(false);
                            setDailySongOrQuiz('song');
                            setTimeout(() => setIsReady(true), 500);
                        }}
                        bg={buttonBgSong}
                        color="white"
                        _hover={{ bg: buttonHoverBgSong }}
                        size={{ base: "md", sm: "lg" }}
                        height={{ base: "50px", sm: "60px" }}
                        leftIcon={<Icon as={FaMusic} boxSize={{ base: 4, sm: 5 }} />}
                        borderRadius="lg"
                        boxShadow="md"
                        fontSize={{ base: "sm", sm: "md" }}
                    >
                        {t("Today's song")}
                    </Button>

                    <Tooltip 
                        label={!hasPlayedToday ? t("Find today's song to unlock the quiz!") : ""} 
                        hasArrow
                        placement="bottom"
                    >
                        <Button
                            onClick={() => setDailySongOrQuiz('quiz')}
                            isDisabled={!hasPlayedToday}
                            bg={buttonBgQuiz}
                            color="white"
                            _hover={{ bg: buttonHoverBgQuiz }}
                            size={{ base: "md", sm: "lg" }}
                            height={{ base: "50px", sm: "60px" }}
                            leftIcon={<Icon as={FaQuestionCircle} boxSize={{ base: 4, sm: 5 }} />}
                            borderRadius="lg"
                            boxShadow="md"
                            opacity={!hasPlayedToday ? 0.6 : 1}
                            fontSize={{ base: "sm", sm: "md" }}
                        >
                            {t("Today's quiz")}
                        </Button>
                    </Tooltip>
                </Flex>
            </CardBody>
        </Card>
    );
};

// Composant Statistiques
const UserStatistics = ({ dailyScores }) => {
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
            <Box
                p={{ base: 3, md: 4 }}
                mb={{ base: 4, md: 6 }}
                borderRadius="lg"
                bg={useColorModeValue("blue.50", "blue.900")}
                borderWidth="1px"
                borderColor={useColorModeValue("blue.200", "blue.600")}
            >
                <Flex 
                    align="center" 
                    justify="space-between"
                    direction={{ base: "column", sm: "row" }}
                    gap={{ base: 2, sm: 0 }}
                >
                    <VStack 
                        align={{ base: "center", sm: "flex-start" }} 
                        spacing={0}
                        mb={{ base: 2, sm: 0 }}
                    >
                        <Text 
                            fontSize={{ base: "xs", md: "sm" }} 
                            color="gray.500"
                            textAlign={{ base: "center", sm: "left" }}
                        >
                            {t("Streak (Consecutive days)")}
                        </Text>
                        <Flex align="center">
                            <Icon as={FaFire} color="red.500" mr={2} boxSize={{ base: 4, md: 5 }} />
                            <Heading size={{ base: "lg", md: "xl" }}>{stats.streak}</Heading>
                        </Flex>
                    </VStack>

                    <CircularProgress
                        value={(stats.streak / 30) * 100}
                        color="red.400"
                        thickness="12px"
                        size={{ base: "70px", md: "80px" }}
                    >
                        <CircularProgressLabel fontWeight="bold">{stats.streak}</CircularProgressLabel>
                    </CircularProgress>
                </Flex>
            </Box>

            <SimpleGrid 
                columns={{ base: 2, md: 2 }} 
                spacing={{ base: 2, md: 4 }} 
                p={{ base: 0, md: 4 }}
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
};

// Composant pour l'historique personnel
const PersonalHistory = ({ dailyScores }) => {
    const textColor = useColorModeValue("gray.800", "gray.200");
    const itemBg = useColorModeValue("gray.50", "gray.700");
    const { t } = useTranslation();

    // Trier les entrées par date (plus récentes d'abord)
    const sortedEntries = useMemo(() => {
        return Object.entries(dailyScores || {})
            .sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [dailyScores]);

    const stringDate = (date) => {
        const options = { day: 'numeric', month: 'long' };
        const dateStr = new Date(date + "T12:00:00").toLocaleDateString(navigator.language ?? "fr-FR", options);
        return dateStr;
    };
    

    return (
        <Box>
            <Heading 
                fontSize={{ base: "xl", md: "2xl" }} 
                mb={{ base: 4, md: 6 }} 
                textAlign="center" 
                color={textColor}
            >
                📅 {t("Personal History")}
            </Heading>

            {sortedEntries.length > 0 ? (
                <List spacing={{ base: 2, md: 3 }}>
                    {sortedEntries.map(([date, entry], index) => (
                        <ListItem
                            key={index}
                            p={{ base: 2, md: 3 }}
                            borderRadius="md"
                            bg={itemBg}
                            borderLeft="4px solid"
                            borderColor={entry.song?.status.includes('hardcore') ? "red.400" : "green.400"}
                            transition="all 0.2s"
                            _hover={{ transform: "translateX(5px)" }}
                        >
                            <Flex 
                                direction={{ base: "column", md: "row" }}
                                alignItems={{ base: "flex-start", md: "center" }}
                                gap={{ base: 2, md: 0 }}
                            >
                                <Text 
                                    fontWeight="bold" 
                                    color={textColor} 
                                    mr={{ base: 0, md: 5 }}
                                    fontSize={{ base: "sm", md: "md" }}
                                >
                                    {stringDate(date)}
                                </Text>
                                <Flex 
                                    wrap="wrap"
                                    gap={{ base: 1, md: 3 }}
                                    mt={{ base: 1, md: 0 }}
                                >
                                    <Badge
                                        colorScheme={entry.song?.status.includes('hardcore') ? "red" : "green"}
                                        borderRadius="full"
                                        px={2}
                                        fontSize={{ base: "2xs", md: "xs" }}
                                    >
                                        {entry.song?.status.replace('victory_', '')}
                                    </Badge>
                                    <Badge 
                                        colorScheme="blue" 
                                        borderRadius="full" 
                                        px={2}
                                        fontSize={{ base: "2xs", md: "xs" }}
                                    >
                                        <HStack spacing={1}>
                                            <Icon as={FaMusic} boxSize={{ base: 2, md: 3 }} />
                                            <Text>{entry.song?.nGuesses}{" "}{t("words")}</Text>
                                        </HStack>
                                    </Badge>
                                    <Badge 
                                        colorScheme="purple" 
                                        borderRadius="full" 
                                        px={2}
                                        fontSize={{ base: "2xs", md: "xs" }}
                                    >
                                        <HStack spacing={1}>
                                            <Icon as={FaQuestionCircle} boxSize={{ base: 2, md: 3 }} />
                                            <Text>{entry.quiz?.score} pts</Text>
                                        </HStack>
                                    </Badge>
                                </Flex>
                            </Flex>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Text 
                    color="gray.500" 
                    textAlign="center" 
                    fontSize={{ base: "sm", md: "md" }}
                >
                    {t("No history available.")}
                </Text>
            )}
        </Box>
    );
};

// Composant principal avec onglets
const QuizTab = ({ dailyScores, setDailySongOrQuiz, setIsReady, dailyTotalPoints }) => {
    const [scores, setScores] = useState([]);
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);
    const hasPlayedToday = useMemo(() => Boolean(dailyScores[todayString]), [dailyScores, todayString]);
    const { t } = useTranslation();
    // Couleurs définies en dehors des conditions pour éviter l'erreur useColorModeValue
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const tabBg = useColorModeValue("white", "gray.800");
    const activeTabBg = useColorModeValue("blue.50", "blue.900");
    const tabListBg = useColorModeValue("gray.100", "gray.700");

    useEffect(() => {
        const scoresRef = ref(database, `daily_scores/${today}`);
        const unsubscribe = onValue(scoresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const scoreArray = Object.entries(data).map(([playerName, score]) => ({ playerName, score }));
                scoreArray.sort((a, b) => b.score.quiz?.score - a.score.quiz?.score);
                setScores(scoreArray);
            } else {
                setScores([]);
            }
        });
        return () => unsubscribe();
    }, [today]);
    return (
        <Box p={{ base: 1, md: 6 }} borderRadius="lg" bg={bgColor}>
            <Tabs variant="enclosed" colorScheme="blue" isFitted>
                <TabList 
                    bg={tabListBg} 
                    borderRadius="xl" 
                    p={{ base: 0.5, md: 1 }} 
                    mb={{ base: 2, md: 4 }}
                    fontSize={{ base: "xs", md: "md" }}
                >
                    <Tab
                        _selected={{ bg: activeTabBg, color: "blue.600", fontWeight: "bold" }}
                        borderRadius="lg"
                        py={{ base: 2, md: 3 }}
                        px={{ base: 1, md: 3 }}
                    >
                        <HStack spacing={{ base: 1, md: 2 }}>
                            <Icon as={FaHome} boxSize={{ base: 3, md: 4 }} />
                            <Text display={{ base: "none", sm: "block" }}>{t("Home")}</Text>
                        </HStack>
                    </Tab>
                    <Tab
                        _selected={{ bg: activeTabBg, color: "blue.600", fontWeight: "bold" }}
                        borderRadius="lg"
                        py={{ base: 2, md: 3 }}
                        px={{ base: 1, md: 3 }}
                    >
                        <HStack spacing={{ base: 1, md: 2 }}>
                            <Icon as={FaTrophy} boxSize={{ base: 3, md: 4 }} />
                            <Text display={{ base: "none", sm: "block" }}>Podium</Text>
                        </HStack>
                    </Tab>
                    <Tab
                        _selected={{ bg: activeTabBg, color: "blue.600", fontWeight: "bold" }}
                        borderRadius="lg"
                        py={{ base: 2, md: 3 }}
                        px={{ base: 1, md: 3 }}
                    >
                        <HStack spacing={{ base: 1, md: 2 }}>
                            <Icon as={FaHistory} boxSize={{ base: 3, md: 4 }} />
                            <Text display={{ base: "none", sm: "block" }}>{t("History")}</Text>
                        </HStack>
                    </Tab>
                </TabList>

                <TabPanels bg={tabBg} borderRadius="xl" boxShadow="xl" p={{ base: 2, md: 4 }}>
                    {/* Onglet 1: Accueil avec boutons et statistiques */}
                    <TabPanel px={{ base: 1, md: 4 }}>
                        <VStack spacing={{ base: 3, md: 6 }}>
                            <Heading as="h3" size={{ base: "md", md: "lg" }} mb={2} textAlign="center">
                                {t("Total score: ")}
                                <Badge 
                                    colorScheme="blue" 
                                    ml={2} 
                                    fontSize={{ base: "lg", md: "2xl" }} 
                                    transform={"translateY(-2px)"}
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
                                size={{ base: "sm", md: "md" }} 
                                mb={2} 
                                alignSelf="flex-start"
                            >
                                📊 {t("Your Statistics")}
                            </Heading>

                            <UserStatistics dailyScores={dailyScores} />
                        </VStack>
                    </TabPanel>

                    {/* Onglet 2: Podium */}
                    <TabPanel px={{ base: 0, md: 4 }}>
                        <VStack spacing={{ base: 3, md: 6 }}>
                            <PodiumDisplay scores={scores} />
                            <PlayersTable scores={scores} />
                        </VStack>
                    </TabPanel>

                    {/* Onglet 3: Historique */}
                    <TabPanel px={{ base: 1, md: 4 }}>
                        <PersonalHistory dailyScores={dailyScores} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default QuizTab;