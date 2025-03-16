import React, { useState, useMemo } from 'react';
import { Box, Input, List, ListItem, Heading, Text } from '@chakra-ui/react';
import Loading from './Loading';
import { useTranslation } from 'react-i18next'; // Import de useTranslation
import useColors from '../hooks/useColors'; // Import du hook useColors
/** 
 * Composant SearchBar
 * Affiche un champ de recherche qui déclenche la mise à jour du terme recherché.
 */
const SearchBar = ({ query, onChange }) => {
    const colors = useColors();
    const { t } = useTranslation(); // Utilisation de useTranslation
    return (
        <Input
            placeholder={t("Type to search...")} // Traduction du placeholder
            value={query}
            onChange={onChange}
            mb={{ base: 2, md: 4 }}
            color={colors.text}
            size={{ base: "sm", md: "md" }}
        />
    );
};

/**
 * Composant SongsList
 * Affiche la liste des chansons correspondant à la recherche.
 */
const SongsList = ({ songs, setIndex, index }) => {
    const colors = useColors();
    return (
        <List spacing={{ base: 1, md: 3 }} overflow={'auto'} maxH={{ base: '300px', md: '400px' }}>
            {songs.map((song) => (
                <ListItem
                    key={song.index}
                    p={{ base: 1, md: 2 }}
                    border="2px"
                    borderColor="gray.200"
                    borderRadius="md"
                    bgColor={index === song.index ? colors.buttonBgHover : colors.lyricsBg}
                    _hover={{ bgColor: colors.buttonBgHover }}
                    cursor="pointer"
                    onClick={() => setIndex(song.index)}
                >
                    <Text fontSize={{ base: "sm", md: "md" }}>
                        <Text as={'b'}>{song.title}</Text> - {song.author}
                    </Text>
                </ListItem>
            ))}
        </List>
    );
};

/**
 * Composant principal NOPLP
 * Il charge la liste complète des chansons, met à jour les résultats en fonction
 * du texte saisi dans la barre de recherche et affiche la liste des chansons trouvées.
 */
const NOPLP = ({ allSongs, setIndex, foundSongs, index, inProgressSongs }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const colors = useColors();
    const { t } = useTranslation(); // Utilisation de useTranslation

    // Calcul des chansons filtrées mémorisé via useMemo.
    // La recherche ne démarre qu'après 4 caractères
    const filteredSongs = useMemo(() => {
        if (searchQuery.trim().length <= 2) return [];
        const lowerQuery = searchQuery.toLowerCase();
        return Object.values(allSongs).filter(
            (song) =>
                (song.title && song.title.toLowerCase().includes(lowerQuery)) ||
                (song.author && song.author.toLowerCase().includes(lowerQuery))
        );
    }, [searchQuery, allSongs]);

    const filteredSongsHistory = useMemo(() => {
        if (!foundSongs || 
            Object.keys(foundSongs).length === 0 ||
            Object.values(foundSongs).some(song => typeof song === 'object')
        ) return [];
        return Object.values(allSongs).filter(song => Object.hasOwn(foundSongs, song.index));
    }, [foundSongs, allSongs]);

    const filteredInProgressSongs = useMemo(() => {
        if (!inProgressSongs || inProgressSongs.length === 0) return [];
        return Object.values(allSongs).filter(song => inProgressSongs.includes(song.index));
    }, [inProgressSongs, allSongs]);

    return (
        <>
            {index !== null && (
                <Box p={{ base: 3, md: 4 }} borderRadius="3xl" boxShadow="md" mb={{ base: 2, md: 4 }} bg={colors.lyricsBg}>
                    {allSongs[index] ?
                        (
                            <>
                                <Heading size={{ base: "sm", md: "md" }} textAlign="center">
                                    {allSongs[index].title}
                                </Heading>
                                <Heading size={{ base: "sm", md: "md" }} textAlign="center">
                                    {allSongs[index].author} 🔥
                                </Heading>
                            </>
                        ) : (
                            <Loading />
                        )
                    }
                </Box>
            )}

            {/* Recherche de chansons */}
            <Box p={{ base: 3, md: 4 }} borderRadius="3xl" boxShadow="md" mb={{ base: 2, md: 4 }} bg={colors.lyricsBg}>
                <Heading size={{ base: "sm", md: "md" }} mb={{ base: 2, md: 4 }} textAlign="center">
                    🎤 {t("Song search")}
                </Heading>
                <SearchBar query={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {filteredSongs.length !== 0 && (
                    <SongsList songs={filteredSongs} setIndex={setIndex} index={index} />
                )}
            </Box>

            {/* Liste des chansons en cours */}
            <Box p={{ base: 3, md: 4 }} borderRadius="3xl" boxShadow="md" mb={{ base: 2, md: 4 }} bg={colors.lyricsBg}>
                <Heading size={{ base: "sm", md: "md" }} mb={{ base: 2, md: 4 }} textAlign="center">
                    ⏳ {t("Songs in progress")}
                </Heading>
                {filteredInProgressSongs.length === 0 && (
                    <Text textAlign="center" color={colors.text} fontSize={{ base: "sm", md: "md" }}>
                        {t("No songs in progress.")}
                    </Text>
                )}
                <SongsList songs={filteredInProgressSongs} setIndex={setIndex} index={index} />
            </Box>

            {/* Liste des chansons complétées */}
            <Box p={{ base: 3, md: 4 }} borderRadius="3xl" boxShadow="md" bg={colors.lyricsBg}>
                <Heading size={{ base: "sm", md: "md" }} mb={{ base: 2, md: 4 }} textAlign="center">
                    ✔️ {t("Completed songs")}
                </Heading>
                {filteredSongsHistory.length === 0 && (
                    <Text textAlign="center" color={colors.text} fontSize={{ base: "sm", md: "md" }}>
                        {t("No completed songs.")}
                    </Text>
                )}
                <SongsList songs={filteredSongsHistory} setIndex={setIndex} index={index} />
            </Box>
        </>
    );
};

export default NOPLP;