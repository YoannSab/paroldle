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
} from '@chakra-ui/react';
import { FaMusic, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import { GiBloodySword } from "react-icons/gi";

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
  const [activeTab, setActiveTab] = useState(0);

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
    const activeTab = localStorage.getItem('paroldle_activeTab');
    if (activeTab) setActiveTab(Number(activeTab));
  }, []);

  useEffect(() => {
    localStorage.setItem('paroldle_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (gameMode === 'NOPLP' && activeTab !== 1) {
      setActiveTab(1);
      setIsReady(false);
      setTimeout(() => {
        setIsReady(true);
      }
        , 1000
      );
    }
    else if (gameMode === 'classic' && activeTab !== 0) {
      setActiveTab(0);
      setIsReady(false);
      setTimeout(() => {
        setIsReady(true);
      }
        , 1000
      );
    }
    else if (gameMode === 'battle' && activeTab !== 2) {
      setActiveTab(2);
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
  const progressValue = filteredFlat.length > 0
    ? (filteredFlat.filter((song) => Object.hasOwn(foundSongs, song.index)).length / filteredFlat.length) * 100
    : 0;

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

  const handleOnChange = (index) => {
    setSideBarLoading(true);
    setActiveTab(index);
  };

  useEffect(() => {
    if (activeTab === 0 && gameMode !== 'classic') {
      setGameMode('classic');
    } else if (activeTab === 1 && gameMode !== 'NOPLP') {
      setGameMode('NOPLP');
    }
    else if (activeTab === 2 && gameMode !== 'battle') {
      setGameMode('battle');
    }
  }, [activeTab, setGameMode]);


  return (
    <Box maxW="400px" mx="auto" h="100%">
      {/* Partie supérieure commune (GuessList, titre, etc.) */}
      <Box
        bg={colors.guessListBg}
        p={6}
        borderRadius="3xl"
        textAlign="center"
        boxShadow="lg"
        mb={6}
      >
        <Heading size="lg" mb={3}>🎵 Paroldle</Heading>
        <Heading size="md" mb={4}>
          {activeTab === 0 ? `Chanson n°${index + 1}` : 'NOPLP'}
        </Heading>
        <Divider width="80%" borderWidth="2px" mx="auto" mb={4} borderColor={colors.text} />
        <GuessListDisplay guessList={guessList} />
      </Box>
      <Box
        p={2}
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
          {/* Barre d’onglets */}
          <TabList mb={4}>
            <Tab
              _selected={{ bg: colors.tabsColors[0] }}
              _hover={{ bg: colors.tabsColors[0] }}
              color={"white"}
              borderRadius="3xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mr={2}
              borderWidth={2}
            >
              <Icon as={FaMusic} mr={2} />
              {t("Classic")}
            </Tab>

            <Tab
              _selected={{ bg: colors.tabsColors[1] }}
              _hover={{ bg: colors.tabsColors[1] }}
              color={"white"}
              borderRadius="3xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth={2}
              mr={2}
            >
              <Icon as={PiMicrophoneStageDuotone} mr={2} />
              {t('NOPLP')}
            </Tab>
            <Tab
              _selected={{ bg: colors.tabsColors[2] }}
              _hover={{ bg: colors.tabsColors[2] }}
              color={"white"}
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
          <HStack spacing={4} justifyContent="center">
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
            />
          )}
          {/* Contenu des onglets */}
          <TabPanels>

            <TabPanel>
              {sideBarLoading ?
                (
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
                      inProgressSongs={inProgressSongs} /><Filters
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
                      setSelectedStatuses={setSelectedStatuses} />
                  </>
                )}
            </TabPanel>

            <TabPanel>
              {sideBarLoading ?
                (
                  <Loading />
                ) : (
                  <NOPLP
                    allSongs={allSongs}
                    setIndex={setIndex}
                    foundSongs={foundSongs}
                    index={index}
                    inProgressSongs={inProgressSongs}
                  />)
              }
            </TabPanel>

            <TabPanel>
              {sideBarLoading ?
                (
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
                    isConnected={isConnected}
                    battleState={battleState}
                    setBattleState={setBattleState}
                    battleStartTime={battleStartTime}
                    setBattleStartTime={setBattleStartTime}
                    setFightIndex={setFightIndex}
                    fightIndex={fightIndex}
                    foundSongs={foundSongs}
                    gameState={gameState}
                    setWantsTie={setWantsTie} />

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
                      setSelectedStatuses={setSelectedStatuses} />
                    </>
                )
                
              }
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default memo(Sidebar);


