import React, {
  memo,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Icon } from '@chakra-ui/icons';
import {
  Box,
  Heading,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
  Button,
  Flex,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaMusic, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import { GiBloodySword } from "react-icons/gi";
import { MdToday } from "react-icons/md";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { SONG_AVAILABILITY_THRESHOLD, SONGS_REQUIRED } from '../constants';
import GuessListDisplay from './GuessListDisplay';
import SongsDisplay from './SongsDisplay';
import Filters from './Filters';
import NOPLP from './NOPLP';
import Loading from './Loading';
import MultiplayerPanel from './MultiplayerPanel';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import OneVsOne from './OneVsOne';
import QuizTab from './QuizTab';

const Sidebar = ({
  index,
  guessList,
  setIndex,
  setGameMode,
  gameMode,
  foundSongs,
  trophies,
  sideBarLoading,
  setSideBarLoading,
  inProgressSongs,
  isConnected,
  roomPlayers,
  otherPlayersInfo,
  setOtherPlayersInfo,
  setRtcModalOpen,
  playerName,
  sendGuessListCallback,
  setIsReady,
  battleState,
  setBattleState,
  guess,
  battleStartTime,
  setBattleStartTime,
  setFightIndex,
  fightIndex,
  gameState,
  setWantsTie,
  roomId,
  selectedImage,
  setGameState,
  dailyIndex,
  dailyScores,
  setDailySongOrQuiz,
  dailyTotalPoints
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  // États locaux pour la gestion de la songList et des filtres
  const [allSongs, setAllSongs] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [expandedStyles, setExpandedStyles] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  // Valeurs responsives via useBreakpointValue
  const headerPadding = useBreakpointValue({ base: 4, md: 6 });
  const tabPadding = useBreakpointValue({ base: 2, md: 4 });
  const tabFontSize = useBreakpointValue({ base: 'sm', md: 'md' });

  // Chargement initial de la songList depuis un fichier JSON statique
  useEffect(() => {
    fetch('/songs_lyrics.json')
      .then((response) => response.json())
      .then((data) => {
        setAllSongs(data);
      })
      .catch((err) => console.error("Erreur lors du chargement des chansons:", err));
  }, []);

  // Synchronisation activeTab avec gameMode
  useEffect(() => {
    // On utilise un switch pour associer le gameMode à l’onglet correspondant
    switch (gameMode) {
      case 'daily':
        if (activeTab !== 0) {
          setActiveTab(0);
          setIsReady(false);
          setTimeout(() => setIsReady(true), 1000);
        }
        break;
      case 'classic':
        if (activeTab !== 1) {
          setActiveTab(1);
          setIsReady(false);
          setTimeout(() => setIsReady(true), 1000);
        }
        break;
      case 'NOPLP':
        if (activeTab !== 2) {
          setActiveTab(2);
          setIsReady(false);
          setTimeout(() => setIsReady(true), 1000);
        }
        break;
      case 'battle':
        if (activeTab !== 3) {
          setActiveTab(3);
          setIsReady(false);
          setTimeout(() => setIsReady(true), 1000);
        }
        break;
      default:
        break;
    }
  }, [gameMode, activeTab, setIsReady]);

  // Regroupement des chansons par style, triées par rang
  const sortedSongsByStyle = useMemo(() => {
    const groups = {};
    Object.values(allSongs).forEach((song) => {
      if (!groups[song.style]) groups[song.style] = [];
      groups[song.style].push(song);
    });
    Object.keys(groups).forEach((style) => {
      groups[style].sort((a, b) => a.rank - b.rank);
    });
    return groups;
  }, [allSongs]);

  // Calcul du tier courant par style en fonction des chansons découvertes et des trophées
  const currentTierPerStyle = useMemo(() => {
    const result = {};
    Object.keys(sortedSongsByStyle).forEach((style) => {
      const songs = sortedSongsByStyle[style];
      const discoveredCount = songs.filter(
        (song) =>
          Object.hasOwn(foundSongs, song.index) &&
          foundSongs[song.index] !== "abandonned"
      ).length;
      const foundCount = songs.filter((song) => Object.hasOwn(foundSongs, song.index)).length;
      const tierFromTrophies = Math.floor(trophies / SONG_AVAILABILITY_THRESHOLD);
      const tierFromDiscovered = Math.floor(discoveredCount / SONGS_REQUIRED);
      const unlockedTier = Math.min(tierFromTrophies, tierFromDiscovered);
      result[style] = { discoveredCount, unlockedTier, foundCount };
    });
    return result;
  }, [sortedSongsByStyle, foundSongs, trophies]);

  // Options de filtres disponibles pour les langues, décennies et styles
  const availableLanguages = useMemo(() => {
    const langs = new Set();
    Object.values(allSongs).forEach((song) => {
      if (song.lang) langs.add(song.lang);
    });
    return Array.from(langs);
  }, [allSongs]);

  const availableDecades = useMemo(() => {
    const decadesSet = new Set();
    Object.values(allSongs).forEach((song) => {
      if (song.year) {
        const decade = Math.floor(song.year / 10) * 10;
        decadesSet.add(decade);
      }
    });
    return Array.from(decadesSet).sort((a, b) => a - b);
  }, [allSongs]);

  const availableStyles = useMemo(() => {
    const stylesSet = new Set();
    Object.values(allSongs).forEach((song) => {
      if (song.style) stylesSet.add(song.style);
    });
    return Array.from(stylesSet);
  }, [allSongs]);

  // Regroupement des chansons par style en appliquant les filtres sélectionnés
  const groupedSongs = useMemo(() => {
    const groups = {};
    Object.keys(sortedSongsByStyle).forEach((style) => {
      const filteredSongs = sortedSongsByStyle[style].filter((song) => {
        if (selectedLanguages.length > 0 && !selectedLanguages.includes(song.lang))
          return false;
        if (selectedDecades.length > 0 && !selectedDecades.includes(Math.floor(song.year / 10) * 10))
          return false;
        if (selectedStyles.length > 0 && !selectedStyles.includes(song.style))
          return false;
        if (selectedStatuses.length > 0) {
          const status = Object.hasOwn(foundSongs, song.index)
            ? foundSongs[song.index]
            : "not_found";
          if (!selectedStatuses.includes(status)) return false;
        }
        return true;
      });
      if (filteredSongs.length > 0) {
        if (filterAvailable) {
          const unlockedTier = currentTierPerStyle[style]?.unlockedTier || 0;
          groups[style] = filteredSongs.filter(
            (song) => song.tier <= unlockedTier || Object.hasOwn(foundSongs, song.index)
          );
        } else {
          groups[style] = filteredSongs;
        }
      }
    });
    return groups;
  }, [
    sortedSongsByStyle,
    selectedLanguages,
    selectedDecades,
    selectedStyles,
    filterAvailable,
    currentTierPerStyle,
    foundSongs,
    selectedStatuses,
  ]);

  // Calcul de la progression globale sur l'ensemble des chansons filtrées
  const filteredFlat = useMemo(() => Object.values(groupedSongs).flat(), [groupedSongs]);
  const progressValue = filteredFlat.length > 0
    ? (filteredFlat.filter((song) => Object.hasOwn(foundSongs, song.index)).length / filteredFlat.length) * 100
    : 0;

  // Fonction pour basculer l’expansion d’un groupe par style
  const toggleGroup = useCallback((style) => {
    setExpandedStyles((prev) => ({ ...prev, [style]: !prev[style] }));
  }, []);

  // Calcul des trophées et chansons manquants pour débloquer une chanson
  const getRequirementsForSong = useCallback(
    (song) => {
      const discoveredCount = currentTierPerStyle[song.style]?.discoveredCount || 0;
      const targetTier = song.tier;
      const requiredTrophies = targetTier * SONG_AVAILABILITY_THRESHOLD;
      const missingTrophies = Math.max(0, requiredTrophies - trophies);
      const requiredSongs = targetTier * SONGS_REQUIRED;
      const missingSongs = Math.max(0, requiredSongs - discoveredCount);
      return { missingTrophies, missingSongs };
    },
    [currentTierPerStyle, trophies]
  );

  // Lors du changement d'onglet
  const handleOnChange = useCallback((index) => {
    setSideBarLoading(true);
    setActiveTab(index);
  }, [setSideBarLoading]);

  // Synchronisation de gameMode avec l'onglet actif
  useEffect(() => {
    switch (activeTab) {
      case 0:
        if (gameMode !== 'daily') setGameMode('daily');
        break;
      case 1:
        if (gameMode !== 'classic') setGameMode('classic');
        break;
      case 2:
        if (gameMode !== 'NOPLP') setGameMode('NOPLP');
        break;
      case 3:
        if (gameMode !== 'battle') setGameMode('battle');
        break;
      default:
        break;
    }
  }, [activeTab, setGameMode, gameMode]);

  // Calcul des joueurs triés pour le mode battle
  const sortedPlayers = useMemo(() => (
    [...roomPlayers]
      .filter((player) =>
        player === playerName
          ? battleState !== "not_participating"
          : otherPlayersInfo[player].battleState !== "not_participating"
      )
      .sort((a, b) => a.localeCompare(b))
  ), [roomPlayers, playerName, battleState, otherPlayersInfo]);

  const isSelector = useMemo(() => sortedPlayers[0] === playerName, [sortedPlayers, playerName]);

  return (
    <Box mx="auto" h="100%" p={{ base: 2, md: 4 }}>
      {/* Sidebar Header */}
      <Box
        bg={colors.guessListBg}
        p={headerPadding}
        borderRadius="3xl"
        textAlign="center"
        boxShadow="lg"
        mb={headerPadding}
      >
        <Heading size={{ base: 'lg', md: 'xl' }} mb={3}>
          🎵 Paroldle
        </Heading>
        <Heading size={{ base: 'md', md: 'lg' }} mb={4}>
          {activeTab === 0
            ? t("Daily")
            : activeTab === 1
            ? t("Classic")
            : activeTab === 2
            ? t("NOPLP")
            : t("Battle")}
        </Heading>
        <Divider width="80%" borderWidth="2px" mx="auto" mb={4} borderColor={colors.text} />
        <GuessListDisplay guessList={guessList} />
      </Box>
      {/* Tabs & Content */}
      <Box
        p={tabPadding}
        borderRadius="3xl"
        boxShadow="lg"
        bg={colors.tabsBgColors[activeTab]}
        transition="background-color 1s ease"
      >
        <Tabs
          variant="soft-rounded"
          colorScheme="blue"
          index={activeTab}
          onChange={handleOnChange}
          isFitted
        >
          <TabList mb={4} fontSize={tabFontSize}>
            <Tab
              _selected={{ bg: colors.tabsColors[0] }}
              _hover={{ bg: colors.tabsColors[0] }}
              color="white"
              borderRadius="3xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mr={1}
              borderWidth={2}
            >
              <Icon as={MdToday} mr={2} />
              {t("Daily")}
            </Tab>
            <Tab
              _selected={{ bg: colors.tabsColors[1] }}
              _hover={{ bg: colors.tabsColors[1] }}
              color="white"
              borderRadius="3xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mr={1}
              borderWidth={2}
            >
              <Icon as={FaMusic} mr={2} />
              {t("Classic")}
            </Tab>
            <Tab
              _selected={{ bg: colors.tabsColors[2] }}
              _hover={{ bg: colors.tabsColors[2] }}
              color="white"
              borderRadius="3xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth={2}
              mr={1}
            >
              <Icon as={PiMicrophoneStageDuotone} mr={2} />
              {t('NOPLP')}
            </Tab>
            <br/>
            <Tab
              _selected={{ bg: colors.tabsColors[3] }}
              _hover={{ bg: colors.tabsColors[3] }}
              color="white"
              borderRadius="3xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth={2}
            >
              <Icon as={GiBloodySword} mr={2} />
              {t('Battle')}
            </Tab>
          </TabList>
          <HStack spacing={4} justifyContent="center" mb={4}>
            <Button
              colorScheme={isConnected ? 'green' : 'purple'}
              onClick={() => setRtcModalOpen(true)}
              leftIcon={<Icon as={isConnected ? FaUserCheck : FaUserPlus} />}
              size="sm"
              variant="solid"
            >
              {isConnected ? t('Connected') : t('Join a room')}
            </Button>
          </HStack>
          {isConnected && (
            <MultiplayerPanel
              players={roomPlayers}
              otherPlayersInfo={otherPlayersInfo}
              playerName={playerName}
              sendGuessListCallback={sendGuessListCallback}
              setGameMode={setGameMode}
              gameMode={gameMode}
              setIndex={setIndex}
              index={index}
              guess={guess}
              foundSongs={foundSongs}
              battleState={battleState}
              roomId={roomId}
              selectedImage={selectedImage}
            />
          )}
          <TabPanels>
            {/* Onglet Daily */}
            <TabPanel p={tabPadding}>
              {sideBarLoading ? (
                <Loading />
              ) : (
                <QuizTab 
                  dailyScores={dailyScores} 
                  setDailySongOrQuiz={setDailySongOrQuiz} 
                  setIsReady={setIsReady} 
                  dailyTotalPoints={dailyTotalPoints}
                />
              )}
            </TabPanel>
            {/* Onglet Classic : Affichage des chansons et filtres */}
            <TabPanel p={tabPadding}>
              {sideBarLoading ? (
                <Loading />
              ) : (
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                >
                  <SongsDisplay
                    index={index}
                    groupedSongs={groupedSongs}
                    currentTierPerStyle={currentTierPerStyle}
                    foundSongs={foundSongs}
                    toggleGroup={toggleGroup}
                    expandedStyles={expandedStyles}
                    setIndex={setIndex}
                    getRequirementsForSong={getRequirementsForSong}
                    progressValue={progressValue}
                    inProgressSongs={inProgressSongs}
                  />
                  <Filters
                    availableLanguages={availableLanguages}
                    availableDecades={availableDecades}
                    availableStyles={availableStyles}
                    selectedLanguages={selectedLanguages}
                    setSelectedLanguages={setSelectedLanguages}
                    selectedDecades={selectedDecades}
                    setSelectedDecades={setSelectedDecades}
                    selectedStyles={selectedStyles}
                    setSelectedStyles={setSelectedStyles}
                    filterAvailable={filterAvailable}
                    setFilterAvailable={setFilterAvailable}
                    selectedStatuses={selectedStatuses}
                    setSelectedStatuses={setSelectedStatuses}
                  />
                </Flex>
              )}
            </TabPanel>
            {/* Onglet NOPLP */}
            <TabPanel p={tabPadding}>
              {sideBarLoading ? (
                <Loading />
              ) : (
                <NOPLP
                  allSongs={allSongs}
                  setIndex={setIndex}
                  foundSongs={foundSongs}
                  index={index}
                  inProgressSongs={inProgressSongs}
                />
              )}
            </TabPanel>
            {/* Onglet Battle */}
            <TabPanel p={tabPadding}>
              {sideBarLoading ? (
                <Loading />
              ) : (
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                >
                  <OneVsOne
                    filteredSongs={filteredFlat}
                    allSongs={allSongs}
                    setIndex={setIndex}
                    playerName={playerName}
                    roomPlayers={roomPlayers}
                    otherPlayersInfo={otherPlayersInfo}
                    setOtherPlayersInfo={setOtherPlayersInfo}
                    isConnected={isConnected}
                    battleState={battleState}
                    setBattleState={setBattleState}
                    battleStartTime={battleStartTime}
                    setBattleStartTime={setBattleStartTime}
                    setFightIndex={setFightIndex}
                    fightIndex={fightIndex}
                    foundSongs={foundSongs}
                    gameState={gameState}
                    setWantsTie={setWantsTie}
                  />
                  {isSelector && (
                    <Filters
                      gameMode={gameMode}
                      availableLanguages={availableLanguages}
                      availableDecades={availableDecades}
                      availableStyles={availableStyles}
                      selectedLanguages={selectedLanguages}
                      setSelectedLanguages={setSelectedLanguages}
                      selectedDecades={selectedDecades}
                      setSelectedDecades={setSelectedDecades}
                      selectedStyles={selectedStyles}
                      setSelectedStyles={setSelectedStyles}
                      filterAvailable={filterAvailable}
                      setFilterAvailable={setFilterAvailable}
                      selectedStatuses={selectedStatuses}
                      setSelectedStatuses={setSelectedStatuses}
                    />
                  )}
                </Flex>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default memo(Sidebar);
