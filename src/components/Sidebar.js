import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
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

// ---------- Composant principal Sidebar ----------
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
  dailyScores,
  setDailySongOrQuiz,
  dailyTotalPoints,
  isMobile,
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  const [allSongs, setAllSongs] = useState([]);
  // Filtres locaux
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [filterAvailable, setFilterAvailable] = useState(false);
  // Nouveaux filtres pour l'état des chansons
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // Pour gérer l’expansion par style
  const [expandedStyles, setExpandedStyles] = useState({});
  const [activeTab, setActiveTab] = useState(gameMode ? (gameMode === 'daily' ? 0 : gameMode === 'classic' ? 1 : gameMode === 'NOPLP' ? 2 : 3) : 0);
  console.log('Sidebar Rerendered');

  // Chargement initial de la songList (imaginée comme statique)
  useEffect(() => {
    fetch('/songs_lyrics.json')
      .then((response) => response.json())
      .then((data) => {
        setAllSongs(data);
      })
      .catch((err) => console.error("Erreur lors du chargement des chansons:", err));
  }, []);

    

  useEffect(() => {
    if (isMobile) return;

    if (gameMode === 'NOPLP' && activeTab !== 2) {
      setActiveTab(2);
      setIsReady(false);
      setTimeout(() => {
        setIsReady(true);
      }
        , 1000
      );
    }
    else if (gameMode === 'classic' && activeTab !== 1) {
      setActiveTab(1);
      setIsReady(false);
      setTimeout(() => {
        setIsReady(true);
      }
        , 1000
      );
    }
    else if (gameMode === 'battle' && activeTab !== 3) {
      setActiveTab(3);
      setIsReady(false);
      setTimeout(() => {
        setIsReady(true);
      }
        , 1000
      );
    }
    if (gameMode === 'daily' && activeTab !== 0) {
      setActiveTab(0);
      setIsReady(false);
      setTimeout(() => {
        setIsReady(true);
      }
        , 1000
      );
    }
  }, [gameMode]);

  // Pré-calcul : regrouper et trier les chansons par style
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
      // Découvertes = chansons trouvées (pas abandonnées)
      const discoveredCount = songs.filter(
        (song) =>
          Object.hasOwn(foundSongs, song.index) &&
          foundSongs[song.index] !== "abandonned"
      ).length;
      // Trouvées (quelles que soient les conditions)
      const foundCount = songs.filter((song) => Object.hasOwn(foundSongs, song.index)).length;

      const tierFromTrophies = Math.floor(trophies / SONG_AVAILABILITY_THRESHOLD);
      const tierFromDiscovered = Math.floor(discoveredCount / SONGS_REQUIRED);
      const unlockedTier = Math.min(tierFromTrophies, tierFromDiscovered);

      result[style] = { discoveredCount, unlockedTier, foundCount };
    });
    return result;
  }, [sortedSongsByStyle, foundSongs, trophies]);

  // Langues, décennies et styles disponibles
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

  // Regroupe les chansons par style en appliquant les filtres
  const groupedSongs = useMemo(() => {
    const groups = {};
    Object.keys(sortedSongsByStyle).forEach((style) => {
      const filteredSongs = sortedSongsByStyle[style].filter((song) => {
        if (selectedLanguages.length > 0 && !selectedLanguages.includes(song.lang)) return false;
        if (selectedDecades.length > 0 && !selectedDecades.includes(Math.floor(song.year / 10) * 10)) return false;
        if (selectedStyles.length > 0 && !selectedStyles.includes(song.style)) return false;

        // Filtrage par état de la chanson
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

  // Calcul de la progression globale
  const filteredFlat = useMemo(() => Object.values(groupedSongs).flat(), [groupedSongs]);
  const progressValue = useMemo(() => filteredFlat.length > 0
    ? (filteredFlat.filter((song) => Object.hasOwn(foundSongs, song.index)).length / filteredFlat.length) * 100
    : 0, [filteredFlat, foundSongs]);

  // Permet d'afficher/masquer un groupe de style
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

  const handleOnChange = useCallback((index) => {
    setSideBarLoading(true);
    setActiveTab(index);
  }, [setSideBarLoading]);

  useEffect(() => {
    if (activeTab === 0 && gameMode !== 'daily') {
      setGameMode('daily');
    }
    else if (activeTab === 1 && gameMode !== 'classic') {
      setGameMode('classic');
    } else if (activeTab === 2 && gameMode !== 'NOPLP') {
      setGameMode('NOPLP');
    }
    else if (activeTab === 3 && gameMode !== 'battle') {
      setGameMode('battle');
    }
  }, [activeTab, setGameMode]);


  const sortedPlayers = useMemo(() => ([...roomPlayers].filter((player) => player === playerName ? battleState !== "not_participating" :
    otherPlayersInfo[player].battleState !== "not_participating")
    .sort((a, b) => a.localeCompare(b))), [roomPlayers, playerName, battleState, otherPlayersInfo]);

  const isSelector = useMemo(() => sortedPlayers[0] === playerName, [sortedPlayers, playerName]);

  return (
    <Box mx="auto"  w="full" pb={{base: 5, xl: 0}}>
      {/* Partie supérieure commune (GuessList, titre, etc.) */}
      <Box
        bg={colors.guessListBg}
        p={{ base: 3, xl: 6 }}
        borderRadius="3xl"
        textAlign="center"
        boxShadow="lg"
        mb={{ base: 3, xl: 6 }}
      >
        <Heading size={{ base: "md", xl: "lg" }} mb={2}>🎵 Paroldle</Heading>
        <Heading size={{ base: "sm", xl: "md" }} mb={3}>
          {activeTab === 0 ? t("Daily") : activeTab === 1 ? t("Classic") : activeTab === 2 ? t("NOPLP") : t("Battle")}
        </Heading>
        <Divider width="80%" borderWidth="2px" mx="auto" mb={3} borderColor={colors.text} />
        <GuessListDisplay guessList={guessList} />
      </Box>
      <Box
        p={{ base: 1, xl: 2 }}
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
          {/* Barre d'onglets - 2x2 grid for mobile, row for desktop */}
          <TabList mb={3} fontSize={{ base: "xs", xl: "md" }}>
            <Flex direction={{ base: "column", xl: "row" }} width="full">
              <Flex mb={{ base: 2, xl: 0 }} width="full">
                <Tab
                  _selected={{ bg: colors.tabsColors[0] }}
                  _hover={{ bg: colors.tabsColors[0] }}
                  color="white"
                  borderRadius="3xl"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mr={{ base: 1, xl: 1 }}
                  mb={{ base: 0, xl: 0 }}
                  py={{ base: 1, xl: 2 }}
                  flexGrow={1}
                  borderWidth={2}
                >
                  <Icon as={MdToday} mr={{ base: 1, xl: 2 }} />
                  <Box display={{ base: "none", sm: "block" }}>{t("Daily")}</Box>
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
                  py={{ base: 1, xl: 2 }}
                  flexGrow={1}
                  borderWidth={2}
                >
                  <Icon as={FaMusic} mr={{ base: 1, xl: 2 }} />
                  <Box display={{ base: "none", sm: "block" }}>{t("Classic")}</Box>
                </Tab>
              </Flex>

              <Flex width="full">
                <Tab
                  _selected={{ bg: colors.tabsColors[2] }}
                  _hover={{ bg: colors.tabsColors[2] }}
                  color="white"
                  borderRadius="3xl"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mr={{ base: 1, xl: 1 }}
                  py={{ base: 1, xl: 2 }}
                  flexGrow={1}
                  borderWidth={2}
                >
                  <Icon as={PiMicrophoneStageDuotone} mr={{ base: 1, xl: 2 }} />
                  <Box display={{ base: "none", sm: "block" }}>{t('NOPLP')}</Box>
                </Tab>
                
                <Tab
                  _selected={{ bg: colors.tabsColors[3] }}
                  _hover={{ bg: colors.tabsColors[3] }}
                  color="white"
                  borderRadius="3xl"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  py={{ base: 1, xl: 2 }}
                  flexGrow={1}
                  borderWidth={2}
                >
                  <Icon as={GiBloodySword} mr={{ base: 1, xl: 2 }} />
                  <Box display={{ base: "none", sm: "block" }}>{t('Battle')}</Box>
                </Tab>
              </Flex>
            </Flex>
          </TabList>
          
          <HStack spacing={{ base: 2, xl: 4 }} justifyContent="center">
            <Button
              colorScheme={isConnected ? 'green' : 'purple'}
              onClick={() => setRtcModalOpen(true)}
              leftIcon={<Icon as={isConnected ? FaUserCheck : FaUserPlus} />}
              size={{ base: "xs", xl: "sm" }}
              variant="solid"
              px={{ base: 2, xl: 4 }}
            >
              {isConnected ? t('Connected') : t('Join a room')}
            </Button>
          </HStack>

          {/* Panel Multijoueur */}
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
          {/* Contenu des onglets */}
          <TabPanels>
            <TabPanel p={{ base: 2, xl: 4 }}>
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

            <TabPanel p={{ base: 2, xl: 4 }}>
              {sideBarLoading ? (
                <Loading />
              ) : (
                <>
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
                </>
              )}
            </TabPanel>

            <TabPanel p={{ base: 2, xl: 4 }}>
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

            <TabPanel p={{ base: 2, xl: 4 }}>
              {sideBarLoading ? (
                <Loading />
              ) : (
                <>
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
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default memo(Sidebar);