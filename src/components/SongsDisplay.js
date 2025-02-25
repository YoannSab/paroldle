import { memo } from 'react';
import { Box, Heading, Progress, Grid, Tag, Tooltip, Text } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { useColors, styleEmojis } from '../constants';
import { useTranslation } from 'react-i18next';

// ---------- SongsDisplay ----------
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
    // Limites d'affichage
    const MAX_VISIBLE_PER_GROUP = 10;
    const MAX_GROUP_HEIGHT = 250; // en pixels

    return (
        <Box bg={colors.lyricsBg} p={4} borderRadius="3xl" boxShadow="md" >
            <Heading size="lg" mb={4} textAlign="center">
                {t("Songs")} {/* Traduction du titre */}
            </Heading>
            <Progress
                value={progressValue}
                size="sm"
                borderRadius="md"
                colorScheme="purple"
                mb={4}
            />
            {Object.keys(groupedSongs).length === 0 ? (
                <Text> {t("No songs found.")} </Text>
            ) : (
                Object.entries(groupedSongs).map(([style, songs]) => {
                    let i = 1;
                    const currentTier = currentTierPerStyle[style]?.unlockedTier || 0;
                    const songsWithAvailability = songs.map((song) => {
                        const isAvailable = song.tier <= currentTier || Object.hasOwn(foundSongs, song.index);
                        return { ...song, isAvailable };
                    });
                    const isExpanded = expandedStyles[style];
                    const songsToShow = isExpanded
                        ? songsWithAvailability
                        : songsWithAvailability.slice(
                            0,
                            MAX_VISIBLE_PER_GROUP + (currentTierPerStyle[style]?.foundCount || 0)
                        );

                    return (
                        <Box key={style} mb={3}>
                            <Heading size="md" mb={2}>
                                {t(style) + ' ' + styleEmojis[style] ?? ''}
                            </Heading>
                            <Box
                                position="relative"
                                border="1px solid #ccc"
                                borderRadius="md"
                                p={2}
                                bg={colors.lyricsBg}
                            >
                                <Box maxH={MAX_GROUP_HEIGHT} overflowY="auto">
                                    <Grid templateColumns="repeat(auto-fill, minmax(40px, 1fr))" gap={2}>
                                        {songsToShow.map((song) => {
                                            const { missingTrophies, missingSongs } = getRequirementsForSong(song);
                                            const tooltipLabel = song.isAvailable
                                                ? (Object.hasOwn(foundSongs, song.index)
                                                    ? `${song.title} - ${song.author}`: '')

                                                : `${t("You need")} ${missingTrophies > 0
                                                    ? `${missingTrophies} ${missingTrophies > 1 ? t("trophies") : t("trophy")}`
                                                    : ''
                                                }${missingTrophies > 0 && missingSongs > 0 ? ` ${t("and")}  ` : ''
                                                }${missingSongs > 0
                                                    ? `${missingSongs} ${t("song")}${missingSongs > 1 ? 's' : ''} (${song.style})`
                                                    : ''
                                                } ${t("to unlock")}`;

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
                                            return (
                                                <Tooltip key={song.index} label={tooltipLabel} hasArrow>
                                                    <Tag
                                                        size="md"
                                                        variant="solid"
                                                        cursor={song.isAvailable ? 'pointer' : 'not-allowed'}
                                                        onClick={(e) => {
                                                            // Empêche le clic sur le parent
                                                            e.stopPropagation();
                                                            if (song.isAvailable) {
                                                                setIndex(song.index);
                                                            }
                                                        }}
                                                        bg={bg}
                                                        _hover={{ bg: hover }}
                                                        display="flex"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        textAlign="center"
                                                    >
                                                        {i++}
                                                    </Tag>
                                                </Tooltip>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                                {songsWithAvailability.length > MAX_VISIBLE_PER_GROUP && (
                                    <Box
                                        position="absolute"
                                        right={-2}
                                        bottom={-2}
                                        cursor="pointer"
                                    // On clique aussi sur le parent, mais on peut bloquer ici si on veut
                                    >
                                        <Box
                                            bg={colors.buttonBg}
                                            borderRadius="full"
                                            boxShadow="md"
                                            _hover={{ bg: colors.buttonBgHover }}
                                            width="20px"
                                            height="20px"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            border="2px solid #ccc"
                                            onClick={() => toggleGroup(style)}
                                        >
                                            {isExpanded ? <MinusIcon boxSize={4} /> : <AddIcon boxSize={4} />}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    );
                })
            )}
        </Box>
    );
});

export default SongsDisplay;