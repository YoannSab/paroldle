import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { memo } from 'react';
import {
    Box,
    Button,
    Text,
    Heading,
    Input,
    Flex,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    useToast,
    Icon,
    Progress,
    Tag,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    HStack,
    Badge,
    VStack,
    Image,
} from '@chakra-ui/react';
import { useBreakpointValue } from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { PiApproximateEqualsBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import Confetti from 'react-confetti';
import generateQuiz from '../generate_quiz';
import { ref, get, set } from 'firebase/database';
import { database } from '../firebase';
import Loading from './Loading';
import { isAlphanumeric, matchWord, stringToList } from '../lyricsUtils';
import { useTranslation } from 'react-i18next';

const BUTTON_STYLES = {
    variant: 'outline',
    size: 'lg',
    _hover: { transform: 'scale(1.02)', shadow: 'md' },
    size: { base: 'sm', md: 'md', lg: 'lg' },
    fontSize: { base: 'xs', sm: 'sm', md: 'md' },
    px: { base: 2, sm: 3, md: 4 },
    py: { base: 1, sm: 2, md: 3 },
    minW: { base: '60px', sm: '80px', md: '100px' },
};

const POINTS_CONFIG = {
    qcm: { base: 100, penalty: 30 },
    intruder: { selection: 50, artist: 75 },
    songs: { perSong: 80 },
    general: { skipPenalty: 20 }
};

console.log('DailyQuiz Rerendered');

// ======================
// MultipleChoiceQuestion
// ======================
const MultipleChoiceQuestion = memo(({ options, correctAnswer, onAnswer, userAnswer, questionType }) => {
    const toast = useToast();
    const [attempts, setAttempts] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const { t } = useTranslation();


    const gapSize = useBreakpointValue({ base: 2, md: 3, lg: 4 });
    const flagSize = useBreakpointValue({ base: 4, md: 5, lg: 6 });

    const handleOptionClick = useCallback((option) => {
        if (userAnswer) return;
        setSelectedOption(option);
        const isCorrect = option === correctAnswer;
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        let points = 0;
        if (isCorrect) {
            points = POINTS_CONFIG.qcm.base - (attempts * POINTS_CONFIG.qcm.penalty);
            onAnswer(option, points, 1);
        } else if (!isCorrect && attempts >= 2) {
            onAnswer(option, 0, -1);
        }
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1500);
        toast({
            title: isCorrect
                ? t("Correct answer!") + ` +${points} ` + t("points")
                : t("Wrong answer") + ` (${t("Attempts remaining")}: ${3 - newAttempts})`,
            status: isCorrect ? 'success' : attempts >= 2 ? 'error' : 'warning',
            duration: 2000,
            isClosable: true,
        });

    }, [attempts, correctAnswer, onAnswer, toast, userAnswer]);

    const customCountryFlag = useCallback((code) =>
        <Image src={`https://flagsapi.com/${code}/flat/64.png`} boxSize={flagSize} mr={1} />,
        [flagSize]
    );

    return (
        <Flex wrap="wrap" gap={gapSize} justify="center" width="100%">
            {options.map((option, idx) => {
                const isSelected = userAnswer === option;
                const isCorrect = option === correctAnswer;
                let colorScheme = 'gray';
                if (userAnswer) {
                    colorScheme = isCorrect ? 'green' : isSelected ? 'red' : 'gray';
                } else if (showFeedback) {
                    colorScheme = option === selectedOption && !isCorrect ? 'red' : 'gray';
                }
                return (
                    <Button
                        key={idx}
                        {...BUTTON_STYLES}
                        colorScheme={colorScheme}
                        onClick={() => handleOptionClick(option)}
                        isDisabled={!!userAnswer}
                        leftIcon={questionType === 'country' ? customCountryFlag(option) : null}
                    >
                        {option}
                    </Button>
                );
            })}
        </Flex>
    );
});

// =================
// ImageQuestion
// =================
const ImageQuestion = memo(({ options, correctAnswer, onAnswer, userAnswer }) => {
    const toast = useToast();
    const [selectedOption, setSelectedOption] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const { t } = useTranslation();

    // Responsive values based on screen size
    const imageSize = useBreakpointValue({ base: "100px", sm: "120px", md: "150px" });
    const gapSize = useBreakpointValue({ base: 2, sm: 4, md: 6 });
    const padding = useBreakpointValue({ base: 2, sm: 3, md: 4 });
    const borderWidth = useBreakpointValue({ base: "2px", sm: "2px", md: "3px" });
    const iconSize = useBreakpointValue({ base: 4, sm: 5, md: 6 });
    const fontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });
    const boxPadding = useBreakpointValue({ base: 1, sm: 1.5, md: 2 });

    const handleSelect = useCallback((option) => {
        if (userAnswer) return;
        setSelectedOption(option);
        const isCorrect = option.title === correctAnswer.title;
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        let points = 0;
        if (isCorrect) {
            points = POINTS_CONFIG.qcm.base - (attempts * POINTS_CONFIG.qcm.penalty);
            onAnswer(option, points, 1);
        } else if (!isCorrect && attempts >= 2) {
            onAnswer(option, 0, -1);
        }
        toast({
            title: isCorrect
                ? t("Correct answer!") + ` +${points} ` + t("points")
                : t("Wrong answer") + ` (${t("Attempts remaining")}: ${3 - newAttempts})`,
            status: isCorrect ? 'success' : attempts >= 2 ? 'error' : 'warning',
            duration: 2000,
        });

        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1500);
    }, [attempts, correctAnswer, onAnswer, toast, userAnswer]);

    return (
        <Flex
            wrap="wrap"
            gap={gapSize}
            justify="center"
            p={padding}
            width="100%"
        >
            {options.map((option, idx) => {
                const isCorrect = option.title === correctAnswer.title;
                const isSelected = selectedOption?.title === option.title;
                let borderColor = 'gray.200';
                if (userAnswer) {
                    borderColor = isCorrect ? 'green.500' : isSelected ? 'red.500' : 'gray.200';
                } else if (showFeedback) {
                    borderColor = option.title === selectedOption?.title && !isCorrect ? 'red.500' : 'gray.200';
                }
                return (
                    <Box
                        key={idx}
                        borderWidth={borderWidth}
                        borderColor={borderColor}
                        borderRadius="lg"
                        p={boxPadding}
                        onClick={() => handleSelect(option)}
                        cursor={userAnswer ? 'default' : 'pointer'}
                        _hover={{ shadow: userAnswer ? 'none' : 'md' }}
                        position="relative"
                        width={{ base: "45%", sm: "40%", md: "auto" }}
                        minWidth={{ base: "130px", sm: "150px", md: "170px" }}
                    >
                        <Image
                            src={option.image}
                            alt={option.title}
                            boxSize={imageSize}
                            objectFit="cover"
                            borderRadius="md"
                            opacity={userAnswer && !isCorrect ? 0.5 : 1}
                            mx="auto"
                        />
                        {isCorrect && userAnswer && (
                            <Icon
                                as={CheckIcon}
                                position="absolute"
                                top={1}
                                right={1}
                                bg="green.500"
                                color="white"
                                borderRadius="full"
                                p={1}
                                boxSize={iconSize}
                            />
                        )}
                        <Text
                            mt={1}
                            textAlign="center"
                            fontWeight="semibold"
                            fontSize={fontSize}
                            noOfLines={2}
                        >
                            {option.title}
                        </Text>
                    </Box>
                );
            })}
        </Flex>
    );
});

// ===================================
// WordByWordLyricsInput (free-text)
// ===================================
const WordByWordLyricsInput = memo(({ correctAnswers, labels, onComplete, userAnswer, isVictorious }) => {
    const toast = useToast();
    const { t } = useTranslation();

    const initialTitlesState = useMemo(() => (
        userAnswer ? userAnswer.titlesState :
            correctAnswers.map(title =>
                stringToList(title)
                    .filter(w => w !== '\n')
                    .map(w => ({
                        word: w,
                        found: !isAlphanumeric(w),
                        partial: '',
                        isAlphanumeric: isAlphanumeric(w)
                    }))
            )
    ), [correctAnswers, userAnswer]);

    const [titlesState, setTitlesState] = useState(initialTitlesState);
    const [titlesFound, setTitlesFound] = useState(initialTitlesState.map(titleWords => titleWords.every(item => item.found)));

    const [input, setInput] = useState('');


    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        const guess = input.trim();
        if (!guess) return;

        let foundAny = false;
        let updatedState = [...titlesState];

        guess.split(' ').forEach(word => {
            updatedState = updatedState.map(titleWords =>
                titleWords.map(item => {
                    if (item.found) return item;
                    const res = matchWord(word, item.word);
                    if (res.match) {
                        foundAny = true;
                        return { ...item, found: true, partial: '' };
                    }
                    if (res.syntaxicSim >= 0.7) {
                        foundAny = true;
                        return { ...item, partial: word };
                    }
                    return item;
                })
            );
        });
        setTitlesState(updatedState);
        toast({
            title: foundAny ? t("Correct word!") : t("Wrong answer"),
            status: foundAny ? "success" : "error",
            duration: 1000,
        });

        setInput('');
    }, [input, titlesState, toast]);

    useEffect(() => {
        const newTitlesFound = titlesState.map(titleWords => titleWords.every(item => item.found));
        if (newTitlesFound.some((found, i) => !titlesFound[i] && found) && !userAnswer?.isFinished) {
            toast({
                title: `${labels ? t("Artist") : t("Title")} ${t('found')} ! +${POINTS_CONFIG.songs.perSong} points`,
                status: "success",
                duration: 2000,
            });

            if (titlesState.every(titleWords => titleWords.every(item => item.found))) {
                const pointsWon = POINTS_CONFIG.songs.perSong
                onComplete({ titlesState, isFinished: true }, pointsWon, isVictorious === undefined ? (isVictorious ? 1 : -2) : 1);
            }
            else {
                const pointsWon = POINTS_CONFIG.songs.perSong
                onComplete({ titlesState, isFinished: false }, pointsWon, 0);
            }
        }

        setTitlesFound(newTitlesFound);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [titlesState]);

    const handleSkip = useCallback(() => {
        onComplete({ titlesState, isFinished: true }, 0, (isVictorious ? -2 : titlesFound.every(found => !found) ? -1 : -2));
    }, [onComplete, titlesState, titlesFound, isVictorious]);

    return (
        <Box textAlign="center">
            <Box display="inline-block" textAlign="left" maxWidth="100%">
                <Flex direction="column" gap={{ base: 2, md: 4 }}>
                    {titlesState.map((title, i) => (
                        <HStack spacing={{ base: 2, md: 4 }} key={i}>
                            <Icon
                                as={titlesFound[i] ? CheckIcon : userAnswer?.isFinished ? CloseIcon : PiMagnifyingGlassBold}
                                boxSize={{ base: 3, md: 4 }}
                                color={titlesFound[i] ? 'green.500' : userAnswer?.isFinished ? 'red.500' : 'gray.500'}
                            />
                            <Text fontSize={{ base: 'sm', md: 'lg' }} fontWeight={{ base: 'normal', md: 'bold' }}>
                                {i + 1}.
                            </Text>
                            {labels && labels[i] && (
                                <Text fontSize={{ base: 'sm', md: 'lg' }} fontWeight={{ base: 'normal', md: 'bold' }}>
                                    {labels[i]} :
                                </Text>
                            )}
                            <Flex wrap="wrap" gap={2}>
                                {title.map((word, j) => (
                                    word.isAlphanumeric ? (
                                        <Tag
                                            key={j}
                                            colorScheme={userAnswer?.isFinished ? (word.found ? 'green' : 'red') : word.found ? 'green' : word.partial ? 'orange' : 'cyan'}
                                            width={word.partial && !word.found && !userAnswer?.isFinished ? `${Math.max(word.partial.length + 2, word.word.length + 1)}ch` : `${(word.word.length + 2)}ch`}
                                            justifyContent="center"
                                            fontSize={{ base: 'sm', md: 'lg' }}
                                        >
                                            {word.found || userAnswer?.isFinished ? word.word : word.partial || ''}
                                        </Tag>
                                    ) : (
                                        <Text key={j} fontSize={{ base: 'sm', md: 'lg' }}>
                                            {word.word}
                                        </Text>
                                    )
                                ))}
                            </Flex>
                        </HStack>
                    ))}
                </Flex>
                <Flex mt={{ base: 2, md: 4 }} align="center" justify="center" gap={2}>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={useBreakpointValue({ base: t("Word..."), md: t("Enter a word...") })}
                        variant="filled"
                        size={{ base: 'xs', md: 'sm', lg: 'md' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                        isDisabled={titlesFound.every(Boolean) || userAnswer?.isFinished}
                    />
                    <Button
                        type="submit"
                        colorScheme="blue"
                        size={{ base: 'xs', md: 'sm', lg: 'md' }}
                        isDisabled={titlesFound.every(Boolean) || userAnswer?.isFinished}
                        onClick={handleSubmit}
                    >
                        {t("Validate")}
                    </Button>
                        
                    {!userAnswer?.isFinished && !titlesFound.every(Boolean) && (
                        <Button 
                        onClick={handleSkip} 
                        colorScheme="yellow" 
                        size={{ base: 'xs', md: 'sm', lg: 'md' }}
                        
                        isDisabled={titlesFound.every(Boolean) || userAnswer?.isFinished}
                        >
                            {t("Skip")}
                        </Button>
                    )}
                </Flex>
            </Box>
        </Box>
    );
});

// ===================
// IntruderQuestion
// ===================
const IntruderQuestion = memo(({ question, onAnswer, userAnswer }) => {
    const toast = useToast();
    const [selectedTracks, setSelectedTracks] = useState(userAnswer?.selectedTracks || []);
    const [attempts, setAttempts] = useState(0);
    const [showArtists, setShowArtists] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [victorious, setVictorious] = useState(false);
    const correctTracks = useMemo(() => question.correctAnswers.map(a => a.track), [question]);
    const maxAttempts = 2;
    const { t } = useTranslation();

    const validateSelection = useCallback(() => {
        if (userAnswer) return;
        if (selectedTracks.length !== 2) {
            toast({ title: "Sélectionnez 2 titres", status: "warning" });
            return;
        }
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        const correctCount = selectedTracks.filter(t => correctTracks.includes(t)).length;
        if (correctCount === correctTracks.length) {
            const attemptMultiplier = 1 - (0.5 * (newAttempts - 1));
            const selectionPoints = Math.round(POINTS_CONFIG.intruder.selection * attemptMultiplier);
            toast({
                title: t("Correct answer!") + ` +${selectionPoints} ` + t("pts"),
                status: "success",
                duration: 2000
            });
            setShowArtists(true);
            setVictorious(true);
            onAnswer({ selectedTracks, artistGuesses: undefined }, selectionPoints, 0);
        } else {
            const remainingAttempts = maxAttempts - newAttempts;
            if (remainingAttempts > 0) {
                toast({
                    title: t("Wrong answer") + ` (${t("Attempts remaining")}: ${remainingAttempts})`,
                    status: "warning",
                    duration: 2000,
                });

                setShowFeedback(true);
            } else {
                toast({
                    title: t("Wrong answer"),
                    status: "error",
                    duration: 2000
                });
                setShowArtists(true);
                onAnswer({ selectedTracks, artistGuesses: undefined }, 0, 0);
            }
        }
    }, [attempts, correctTracks, onAnswer, selectedTracks, toast, userAnswer]);

    useEffect(() => {
        if (selectedTracks.length === 2 && attempts < maxAttempts && !showFeedback) {
            validateSelection();
        }
    }, [selectedTracks, attempts, validateSelection]);

    return (
        <Box>
            <Flex wrap="wrap" gap={{ base: 2, md: 4, lg: 6 }} justify="center" mb={{ base: 2, md: 4 }}>
                {question.options.map((track, i) => {
                    let colorScheme = 'gray';
                    if (showArtists || userAnswer) {
                        colorScheme = correctTracks.includes(track) ? 'green' : 'red';
                    } else if (showFeedback) {
                        colorScheme = selectedTracks.includes(track)
                            ? (correctTracks.includes(track) ? 'green' : 'red')
                            : 'gray';
                    } else {
                        colorScheme = selectedTracks.includes(track) ? "cyan" : "gray";
                    }
                    return (
                        <Button
                            key={i}
                            onClick={() => {
                                setShowFeedback(false);
                                setSelectedTracks(prev =>
                                    prev.includes(track)
                                        ? prev.filter(t => t !== track)
                                        : [...prev, track]
                                );
                            }}
                            colorScheme={colorScheme}
                            _hover={{ transform: 'scale(1.02)', shadow: 'md' }}
                            borderWidth={selectedTracks.includes(track) ? "4px" : "1px"}
                            variant="solid"
                            isDisabled={!!userAnswer}
                            leftIcon={colorScheme === 'green' ? <CheckIcon /> : colorScheme === 'red' ? <CloseIcon /> : null}
                            {...BUTTON_STYLES}
                        >
                            {track}
                        </Button>
                    );
                })}
            </Flex>
            {(showArtists || userAnswer) && (
                <Box>
                    <Alert 
                        status="info"
                        mb={{ base: 2, md: 4 }}
                        size={{ base: "sm", md: "md" }}
                        
                    >
                        <AlertIcon />
                        {t("Now identify the real artists.")}
                    </Alert>

                    <WordByWordLyricsInput
                        correctAnswers={question.correctAnswers.map(a => a.artist)}
                        labels={question.correctAnswers.map(a => a.track)}
                        onComplete={(a, p, s) => onAnswer({ selectedTracks, artistGuesses: a }, p, s)}
                        isVictorious={victorious}
                        userAnswer={userAnswer?.artistGuesses}
                    />
                </Box>
            )}
        </Box>
    );
});

const PlayerNameInput = memo(({ playerName, setPlayerName }) => {

    const { t } = useTranslation();

    return (
        <Input
            placeholder={t("Your Name")}
            size={{ base: 'sm', md: 'md', lg: 'lg' }}
            variant="filled"
            focusBorderColor="blue.500"
            _placeholder={{ color: 'gray.500' }}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
        />
    );
});


/* ---------------------------------------------------------------------------
  Sous-composant DailyQuizHeader
  Affiche les infos du quiz : titre, artiste, score et barre de progression
--------------------------------------------------------------------------- */
const DailyQuizHeader = memo(({ quiz, progress }) => {

    return (
        <Flex direction="column" align="center" mb={8}>
            <Heading mb={2}>{quiz.artist}</Heading>
            <Text 
            fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}
            color="gray.600" 
            fontWeight={"bold"}>
                {quiz.song}
                </Text>
            <Progress value={progress} w="100%" mt={6} colorScheme="purple" />
        </Flex>

    );
});

/* ---------------------------------------------------------------------------
  Sous-composant DailyQuizQuestions
  Affiche l’ensemble des questions dans un Accordion
--------------------------------------------------------------------------- */
const DailyQuizQuestions = memo(
    ({ quiz, currentQuestion, lastUnlockedQuestion, answers, setTotalPoints, completedQuestions, handleAnswer, setCurrentQuestion }) => {
        const { t } = useTranslation();
        return (
            <Accordion allowToggle index={currentQuestion} onChange={setCurrentQuestion}>
                {quiz.questions.map((q, i) => (
                    <AccordionItem key={i} border="none" isDisabled={i > lastUnlockedQuestion}>
                        <AccordionButton _focus={{ boxShadow: 'none' }}>
                            <Box flex="1" textAlign="left" fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}>
                                <Tag colorScheme="blue" mr={2}>
                                    Question {i + 1}
                                </Tag>
                                {t(q.question)}
                            </Box>
                            {completedQuestions[i] ? (
                                completedQuestions[i] === -1 ? (
                                    <CloseIcon color="red.500" />
                                ) : completedQuestions[i] === -2 ? (
                                    <PiApproximateEqualsBold color="orange" />
                                ) : (
                                    <CheckIcon color="green.500" />
                                )
                            ) : (
                                <AccordionIcon />
                            )}
                        </AccordionButton>
                        <AccordionPanel pb={{ base: 2, md: 4 }}>
                            {q.type === 'year' || q.type === 'country' ? (
                                <MultipleChoiceQuestion
                                    options={q.options}
                                    correctAnswer={q.correctAnswer}
                                    onAnswer={(a, p, s) => handleAnswer(i, a, p, s)}
                                    userAnswer={answers[i]}
                                    questionType={q.type}
                                />
                            ) : q.type === 'image' ? (
                                <ImageQuestion
                                    options={q.options}
                                    correctAnswer={q.correctAnswer}
                                    onAnswer={(a, p, s) => handleAnswer(i, a, p, s)}
                                    userAnswer={answers[i]}
                                />
                            ) : q.type === 'free-text' ? (
                                <WordByWordLyricsInput
                                    correctAnswers={q.correctAnswers}
                                    onComplete={(a, p, s) => handleAnswer(i, a, p, s)}
                                    userAnswer={answers[i]}
                                />
                            ) : (
                                <IntruderQuestion
                                    question={q}
                                    onAnswer={(a, p, s) => handleAnswer(i, a, p, s)}
                                    userAnswer={answers[i]}
                                />
                            )}
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    });

/* ---------------------------------------------------------------------------
  Sous-composant DailyQuizFooter
  Affiche le message de fin de quiz et le formulaire de sauvegarde du score
--------------------------------------------------------------------------- */
const DailyQuizFooter = memo(
    ({ quizEnded, totalPoints, playerName, setPlayerName, quizSaved, saveDailyScore, dailyScores, toast }) => {
        const { t } = useTranslation();
        if (!quizEnded) return null;
        return (
            <Box textAlign="center" >
                <VStack spacing={4}>
                    <Alert
                        status="success"
                        variant="subtle"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        textAlign="center"
                        borderRadius="lg"
                        py={{ base: 4, md: 6 }}
                    >
                        <AlertTitle fontSize={{base:"md", md:"lg", lg:"xl"}}>{t("Quiz finished!")}</AlertTitle>
                        <AlertDescription fontSize={{base:"sm", md:"md", lg:"lg"}} fontWeight={"medium"}>
                            🎉 {t("You scored")}{" "}
                            <Badge colorScheme="green" fontSize={{base:"sm", md:"md", lg:"lg"}} transform={"translateY(-2px)"}>
                                {totalPoints} {t("points!")}
                            </Badge>
                            <br />
                            {t("Compare your score with other players!")}
                        </AlertDescription>
                    </Alert>
                    <Flex direction="row" justify="center" align="center" gap={4}>
                        <PlayerNameInput playerName={playerName} setPlayerName={setPlayerName} />
                        <Button
                            colorScheme="blue"
                            size={{ base: 'sm', md: 'md', lg: 'lg' }}
                            onClick={() => saveDailyScore(playerName, dailyScores, toast)}
                            _hover={{ transform: 'scale(1.02)' }}
                            transition="all 0.2s"
                            isDisabled={quizSaved}
                            fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                        >
                            {t("Save")}
                        </Button>
                    </Flex>
                </VStack>
            </Box>
        );
    }
);


/* ---------------------------------------------------------------------------
  Composant principal DailyQuiz
  Gère la logique du quiz, la sauvegarde dans localStorage et les mises à jour d'état
--------------------------------------------------------------------------- */
const DailyQuiz = ({ songId, dailyScores, setDailyScores, totalPoints, setTotalPoints }) => {
    const toast = useToast();
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const localKey = useMemo(() => `paroldle_daily_quiz_${today}`, [today]);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [lastUnlockedQuestion, setLastUnlockedQuestion] = useState(0);
    const [progress, setProgress] = useState(0);
    const [answers, setAnswers] = useState({});
    const [completedQuestions, setCompletedQuestions] = useState({});
    const [showConfetti, setShowConfetti] = useState(false);
    const [quizEnded, setQuizEnded] = useState(false);
    const [quizSaved, setQuizSaved] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [quiz, setQuiz] = useState(null);
    const { t } = useTranslation();

    // Restauration de l'état depuis localStorage ou génération d'un nouveau quiz
    useEffect(() => {
        if (songId === null) return;
        const savedQuiz = localStorage.getItem(localKey);
        if (savedQuiz) {
            try {
                const parsedState = JSON.parse(savedQuiz);
                setQuiz(parsedState.quiz);
                setCurrentQuestion(parsedState.currentQuestion);
                setLastUnlockedQuestion(parsedState.lastUnlockedQuestion);
                setAnswers(parsedState.answers);
                setTotalPoints(parsedState.totalPoints);
                setCompletedQuestions(parsedState.completedQuestions);
                setQuizEnded(parsedState.quizEnded);
                setQuizSaved(parsedState.quizSaved);
            } catch (error) {
                console.error("Erreur lors du parsing du quiz sauvegardé", error);
            }
        } else {
            generateQuiz(songId).then(({ quiz }) => {
                setQuiz(quiz);
                const initialState = {
                    quiz,
                    currentQuestion: 0,
                    lastUnlockedQuestion: 0,
                    answers: {},
                    totalPoints: 0,
                    completedQuestions: {},
                    quizEnded: false,
                    quizSaved: false
                };
                localStorage.setItem(localKey, JSON.stringify(initialState));
            });
        }
    }, [songId, localKey]);

    // Sauvegarde de l'état dans le localStorage avec un délai (debounce)
    useEffect(() => {
        if (!quiz) return;
        const stateToSave = {
            quiz,
            currentQuestion,
            lastUnlockedQuestion,
            answers,
            totalPoints,
            completedQuestions,
            quizEnded,
            quizSaved
        };
        const handler = setTimeout(() => {
            localStorage.setItem(localKey, JSON.stringify(stateToSave));
        }, 300);
        return () => clearTimeout(handler);
    }, [quiz, currentQuestion, lastUnlockedQuestion, answers, totalPoints, completedQuestions, quizEnded, quizSaved, localKey]);

    // Mise à jour de la barre de progression
    useEffect(() => {
        setProgress(quizEnded ? 100 : (lastUnlockedQuestion / (quiz?.questions.length || 1)) * 100);
    }, [lastUnlockedQuestion, quiz, quizEnded]);

    // Gestion de la réponse d'une question
    const handleAnswer = useCallback((questionIndex, answer, points, status) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
        if (answer.selectedTracks && !answer.artistGuesses) return;
        setCompletedQuestions(prev => ({
            ...prev,
            [questionIndex]: status
        }));
        const newTotalPoints = totalPoints + Math.max(points, 0);
        setTotalPoints(newTotalPoints);
        console.log("Question", questionIndex, "répondu avec", answer, "pour", points, "points", "status", status);
        if (status === 0) return;

        if (currentQuestion < quiz.questions.length - 1) {
            setLastUnlockedQuestion(prev => {
                setTimeout(() => setCurrentQuestion(prevQ => Math.min(prev + 1, prevQ + 1)), 1500);
                return prev + 1;
            });
        } else {
            setQuizEnded(true);
            setDailyScores(prev => {
                const todayString = new Date().toISOString().split('T')[0];
                return { ...prev, [todayString]: { ...prev[todayString], quiz: { score: newTotalPoints } } };
            });
            toast({
                title: t("Quiz finished!"),
                status: "success",
                duration: 2000
            });

            setTimeout(() => {
                setCurrentQuestion(-1);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 10000);
            }, 2000);
        }
    }, [currentQuestion, quiz, setDailyScores, totalPoints, toast]);

    // Fonction de sauvegarde du score dans Firebase
    const saveScore = useCallback((playerName, dailyScores, toast) => {
        if (!playerName) {
            toast({
                title: t("Please enter a name"),
                status: "warning",
                duration: 2000
            });

            return;
        }
        const today = new Date().toISOString().split('T')[0];
        get(ref(database, `daily_scores/${today}/${playerName}`)).then(snapshot => {
            if (snapshot.exists()) {
                toast({
                    title: t("The name is already in use"),
                    status: "warning",
                    duration: 2000
                });

                return;
            }
            set(ref(database, `daily_scores/${today}/${playerName}`), dailyScores[today])
                .then(() => {
                    toast({
                        title: t("Score saved!"),
                        status: "success",
                        duration: 2000
                    });

                    setQuizSaved(true);
                });
        });
    }, [toast]);

    if (!quiz) return (
        <Box minH={400}>
            <Loading />
        </Box>);

    return (
        <>
            {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
            <Box mx="auto" p={6}>
                <DailyQuizHeader quiz={quiz} progress={progress} />
                <DailyQuizQuestions
                    quiz={quiz}
                    currentQuestion={currentQuestion}
                    lastUnlockedQuestion={lastUnlockedQuestion}
                    answers={answers}
                    completedQuestions={completedQuestions}
                    handleAnswer={handleAnswer}
                    setTotalPoints={setTotalPoints}
                    setCurrentQuestion={setCurrentQuestion}
                />
                <DailyQuizFooter
                    quizEnded={quizEnded}
                    totalPoints={totalPoints}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    quizSaved={quizSaved}
                    saveDailyScore={saveScore}
                    dailyScores={dailyScores}
                    toast={toast}
                />
            </Box>
        </>
    );
};

export default memo(DailyQuiz);
