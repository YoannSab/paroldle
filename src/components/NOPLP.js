import React, { useState, useMemo, memo, useCallback } from 'react';
import { Box, Input, List, ListItem, Heading, Text } from '@chakra-ui/react';
import Loading from './Loading';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';

/** 
 * Composant SearchBar optimisé avec memo
 */
const SearchBar = memo(({ query, onChange }) => {
  const colors = useColors();
  const { t } = useTranslation();
  
  return (
    <Input
      placeholder={t("Type to search...")}
      value={query}
      onChange={onChange}
      mb={[2, 4]}
      color={colors.text}
      size={["sm", "md"]}
    />
  );
});

/**
 * Sous-composant Song mémorisé pour chaque élément de la liste
 */
const SongItem = memo(({ song, index, currentIndex, onClick, colors }) => (
  <ListItem
    p={[1, 2]}
    border="2px"
    borderColor="gray.200"
    borderRadius="md"
    bgColor={currentIndex === song.index ? colors.buttonBgHover : colors.lyricsBg}
    _hover={{ bgColor: colors.buttonBgHover }}
    cursor="pointer"
    onClick={() => onClick(song.index)}
  >
    <Text fontSize={["sm", "md"]}>
      <Text as={'b'}>{song.title}</Text> - {song.author}
    </Text>
  </ListItem>
));

/**
 * Composant SongsList optimisé avec memo
 */
const SongsList = memo(({ songs, setIndex, index, colors }) => {
  // Fonction optimisée pour gérer le clic sur une chanson
  const handleClick = useCallback((songIndex) => {
    setIndex(songIndex);
  }, [setIndex]);
  
  if (!songs || songs.length === 0) return null;
  
  return (
    <List spacing={[1, 3]} overflow={'auto'} maxH={['300px', '400px']}>
      {songs.map((song) => (
        <SongItem 
          key={song.index} 
          song={song} 
          currentIndex={index} 
          onClick={handleClick}
          colors={colors}
        />
      ))}
    </List>
  );
});

/**
 * Composant de section mémorisé pour regrouper le contenu similaire
 */
const SongsSection = memo(({ title, songs, emptyMessage, setIndex, index, colors }) => (
  <Box p={[3, 4]} borderRadius="3xl" boxShadow="md" mb={[2, 4]} bg={colors.lyricsBg}>
    <Heading size={["sm", "md"]} mb={[2, 4]} textAlign="center">
      {title}
    </Heading>
    {songs.length === 0 ? (
      <Text textAlign="center" color={colors.text} fontSize={["sm", "md"]}>
        {emptyMessage}
      </Text>
    ) : (
      <SongsList songs={songs} setIndex={setIndex} index={index} colors={colors} />
    )}
  </Box>
));

/**
 * Composant d'en-tête mémorisé pour afficher les informations de la chanson actuelle
 */
const CurrentSongHeader = memo(({ currentSong }) => {
  const colors = useColors();
  
  if (!currentSong) return <Loading />;
  
  return (
    <Box p={[3, 4]} borderRadius="3xl" boxShadow="md" mb={[2, 4]} bg={colors.lyricsBg}>
      <Heading size={["sm", "md"]} textAlign="center">
        {currentSong.title}
      </Heading>
      <Heading size={["sm", "md"]} textAlign="center">
        {currentSong.author} 🔥
      </Heading>
    </Box>
  );
});

/**
 * Composant principal NOPLP optimisé
 */
const NOPLP = memo(({ allSongs, setIndex, foundSongs, index, inProgressSongs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const colors = useColors();
  const { t } = useTranslation();

  // Optimiser le gestionnaire de changement de recherche
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Calcul mémorisé des chansons filtrées par recherche
  const filteredSongs = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length <= 2) return [];
    
    const lowerQuery = searchQuery.toLowerCase();
    return Object.values(allSongs || {}).filter(
      (song) =>
        (song.title && song.title.toLowerCase().includes(lowerQuery)) ||
        (song.author && song.author.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, allSongs]);

  // Calcul mémorisé des chansons complétées
  const filteredSongsHistory = useMemo(() => {
    if (!foundSongs || 
        Object.keys(foundSongs).length === 0 ||
        Object.values(foundSongs).some(song => typeof song === 'object')
    ) return [];
    
    return Object.values(allSongs || {}).filter(song => 
      song && song.index && Object.hasOwn(foundSongs, song.index)
    );
  }, [foundSongs, allSongs]);

  // Calcul mémorisé des chansons en cours
  const filteredInProgressSongs = useMemo(() => {
    if (!inProgressSongs || inProgressSongs.length === 0 || !allSongs) return [];
    
    return Object.values(allSongs).filter(song => 
      song && song.index && inProgressSongs.includes(song.index)
    );
  }, [inProgressSongs, allSongs]);

  // Chanson actuellement sélectionnée
  const currentSong = useMemo(() => 
    index !== null && allSongs ? allSongs[index] : null
  , [index, allSongs]);

  // Props communes mémorisées pour les sections
  const commonSectionProps = useMemo(() => ({
    setIndex,
    index,
    colors
  }), [setIndex, index, colors]);

  return (
    <>
      {/* En-tête avec chanson actuelle */}
      {index !== null && (
        <CurrentSongHeader currentSong={currentSong} />
      )}

      {/* Section de recherche */}
      <Box p={[3, 4]} borderRadius="3xl" boxShadow="md" mb={[2, 4]} bg={colors.lyricsBg}>
        <Heading size={["sm", "md"]} mb={[2, 4]} textAlign="center">
          🎤 {t("Song search")}
        </Heading>
        <SearchBar query={searchQuery} onChange={handleSearchChange} />
        {filteredSongs.length > 0 && (
          <SongsList 
            songs={filteredSongs} 
            setIndex={setIndex} 
            index={index}
            colors={colors}
          />
        )}
      </Box>

      {/* Section des chansons en cours */}
      <SongsSection
        title={`⏳ ${t("Songs in progress")}`}
        songs={filteredInProgressSongs}
        emptyMessage={t("No songs in progress.")}
        {...commonSectionProps}
      />

      {/* Section des chansons complétées */}
      <SongsSection
        title={`✔️ ${t("Completed songs")}`}
        songs={filteredSongsHistory}
        emptyMessage={t("No completed songs.")}
        {...commonSectionProps}
      />
    </>
  );
});

export default NOPLP;