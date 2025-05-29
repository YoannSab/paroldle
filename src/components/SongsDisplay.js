import { memo, useMemo } from 'react';
import { Box, Heading, Progress, Grid, Tag, Tooltip, Text } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { styleEmojis } from '../constants';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import { useBreakpointValue } from '@chakra-ui/react';

// Composant de titre mémorisé
const StyleHeading = memo(({ style }) => {
  const { t } = useTranslation();
  return (
    <Heading size={["sm", "md"]} mb={2}>
      {t(style) + ' ' + (styleEmojis[style] || '')}
    </Heading>
  );
});

// Composant de tag de chanson mémorisé
const SongTag = memo(({ 
  song, 
  index, 
  number, 
  foundSongs, 
  inProgressSongs, 
  tooltipLabel, 
  setIndex 
}) => {
  // Déterminer le style du tag en fonction de l'état de la chanson
  const { bg, hover } = useMemo(() => {
    let bg, hover;
    const songState = Object.hasOwn(foundSongs, song.index)
      ? foundSongs[song.index]
      : null;
      
    if (songState === 'normal') {
      bg = 'green.400';
      hover = 'green.500';
    } else if (songState === 'hardcore') {
      bg = 'red.400';
      hover = 'red.500';
    } else if (songState === 'abandonned') {
      bg = 'purple.400';
      hover = 'purple.500';
    } else if (song.isAvailable) {
      bg = 'gray.600';
      hover = 'gray.800';
    } else {
      bg = 'gray.400';
      hover = 'gray.400';
    }
    
    if (inProgressSongs.includes(song.index)) {
      bg = 'blue.500';
      hover = 'blue.600';
    }
    
    if (song.index === index) {
      bg = hover;
    }
    
    return { bg, hover };
  }, [song.index, song.isAvailable, foundSongs, inProgressSongs, index]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (song.isAvailable) {
      setIndex(song.index);
    }
  };

  return (
    <Tooltip label={tooltipLabel} hasArrow>
      <Tag
        size={["sm", "md"]}
        variant="solid"
        cursor={song.isAvailable ? 'pointer' : 'not-allowed'}
        onClick={handleClick}
        bg={bg}
        _hover={{ bg: hover }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
      >
        {number}
      </Tag>
    </Tooltip>
  );
});

// Composant pour le bouton d'expansion/réduction
const ExpandButton = memo(({ isExpanded, toggleGroup, style, colors }) => (
  <Box
    position="absolute"
    right={-2}
    bottom={-2}
    cursor="pointer"
  >
    <Box
      bg={colors.buttonBg}
      borderRadius="full"
      boxShadow="md"
      _hover={{ bg: colors.buttonBgHover }}
      width={["15px", "20px"]}
      height={["15px", "20px"]}
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="2px solid #ccc"
      onClick={() => toggleGroup(style)}
    >
      {isExpanded ? <MinusIcon boxSize={3} /> : <AddIcon boxSize={3} />}
    </Box>
  </Box>
));

// Groupe de chansons avec son contenu
const SongGroup = memo(({ 
  style, 
  songs, 
  currentTier, 
  foundSongs, 
  expandedStyles, 
  toggleGroup, 
  getRequirementsForSong, 
  setIndex, 
  index, 
  inProgressSongs,
  currentTierPerStyle,
  colors
}) => {
  const { t } = useTranslation();
  
  // Nombre d'éléments par ligne selon la taille d'écran
  const itemsPerRow = useBreakpointValue({ base: 5, sm : 7, md: 8, xl: 10 });
  
  // Nombre de lignes à afficher initialement
  const initialRows = 3;
  
  const songsWithAvailability = useMemo(() => {
    return songs.map(song => ({
      ...song,
      isAvailable: song.tier <= currentTier || Object.hasOwn(foundSongs, song.index)
    }));
  }, [songs, currentTier, foundSongs]);
  
  const isExpanded = expandedStyles[style];
  
  // Calcul du nombre d'éléments à afficher
  const itemsToShow = useMemo(() => {
   
    if (isExpanded) {
      return songsWithAvailability.length;
    } else {
      return Math.min(
        initialRows * itemsPerRow,
        songsWithAvailability.length
      );
    }
  }, [songsWithAvailability, isExpanded, itemsPerRow, currentTierPerStyle, style, initialRows]);
  
  const songsToShow = useMemo(() => 
    songsWithAvailability.slice(0, itemsToShow), 
    [songsWithAvailability, itemsToShow]
  );

  // Vérifier si on a besoin du bouton d'expansion
  const needsExpansionButton = songsWithAvailability.length > (initialRows * itemsPerRow);

  return (
    <Box mb={3}>
      <StyleHeading style={style} />
      <Box
        position="relative"
        border="1px solid #ccc"
        borderRadius="md"
        p={2}
        bg={colors.lyricsBg}
      >
        <Box maxH={["180px", "250px"]} overflowY="auto">
          <Grid 
            templateColumns={`repeat(${itemsPerRow}, 1fr)`}
            gap={1}
          >
            {songsToShow.map((song, idx) => {
              const { missingTrophies, missingSongs } = getRequirementsForSong(song);
              
              const tooltipLabel = song.isAvailable
                ? (Object.hasOwn(foundSongs, song.index)
                  ? `${song.title} - ${song.author}`
                  : '')
                : `${t("You need")} ${missingTrophies > 0
                  ? `${missingTrophies} ${missingTrophies > 1 ? t("trophies") : t("trophy")}`
                  : ''
                }${missingTrophies > 0 && missingSongs > 0 ? ` ${t("and")}  ` : ''
                }${missingSongs > 0
                  ? `${missingSongs} ${t("song")}${missingSongs > 1 ? 's' : ''} (${song.style})`
                  : ''
                } ${t("to unlock")}`;

              return (
                <SongTag
                  key={song.index}
                  song={song}
                  index={index}
                  number={idx + 1}
                  foundSongs={foundSongs}
                  inProgressSongs={inProgressSongs}
                  tooltipLabel={tooltipLabel}
                  setIndex={setIndex}
                />
              );
            })}
          </Grid>
        </Box>
        
        {needsExpansionButton && (
          <ExpandButton 
            isExpanded={isExpanded}
            toggleGroup={toggleGroup}
            style={style}
            colors={colors}
          />
        )}
      </Box>
    </Box>
  );
});

// Composant principal SongsDisplay
const SongsDisplay = memo(({
  index,
  groupedSongs,
  currentTierPerStyle,
  foundSongs,
  toggleGroup,
  expandedStyles,
  setIndex,
  getRequirementsForSong,
  progressValue,
  inProgressSongs
}) => {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Box bg={colors.lyricsBg} p={[4, 4]} borderRadius="3xl" boxShadow="md">
      <Heading fontSize={["xl", "3xl"]} mb={4} textAlign="center">
        {t("Songs")}
      </Heading>
      
      <Progress
        value={progressValue}
        size="sm"
        borderRadius="md"
        colorScheme="purple"
        mb={4}
      />
      
      {Object.keys(groupedSongs).length === 0 ? (
        <Text>{t("No songs found.")}</Text>
      ) : (
        Object.entries(groupedSongs).map(([style, songs]) => (
          <SongGroup
            key={style}
            style={style}
            songs={songs}
            currentTier={currentTierPerStyle[style]?.unlockedTier || 0}
            foundSongs={foundSongs}
            expandedStyles={expandedStyles}
            toggleGroup={toggleGroup}
            getRequirementsForSong={getRequirementsForSong}
            setIndex={setIndex}
            index={index}
            inProgressSongs={inProgressSongs}
            colors={colors}
            currentTierPerStyle={currentTierPerStyle}
          />
        ))
      )}
    </Box>
  );
});

export default SongsDisplay;