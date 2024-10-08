import { Box, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { memo } from 'react';
import { word_to_lemme } from './word_to_lemme';
//import { loadModel, compareWords, buildCache } from './compare_words';

function stringToList(text) {
    text = text.replace('\n', '.');
    return text.match(/([\w\u00C0-\u017F]+|[^\s\w])/g);
}

const isAlphanumeric = (word) => /^[a-z0-9\u00C0-\u00FF\u0152\u0153]+$/i.test(word);

const LyricsComponent = ({ song, setVictory, guess, showAllSong, setGuessFeedback }) => {
    const [title, setTitle] = useState([]);
    const [lyrics, setLyrics] = useState([]);
    const [artist, setArtist] = useState([]);
    const [titleFound, setTitleFound] = useState([]);
    const [lyricsFound, setLyricsFound] = useState([]);
    const [artistFound, setArtistFound] = useState([]);
    const [partialMatchesTitle, setPartialMatchesTitle] = useState({});
    const [partialMatchesLyrics, setPartialMatchesLyrics] = useState({});
    const [partialMatchesArtist, setPartialMatchesArtist] = useState({});
    const [currentIndexWordFound, setCurrentIndexWordFound] = useState({ title: [], lyrics: [], artist: [] });
    // const [model, setModel] = useState(null);
    // const [cache, setCache] = useState(null);

    // useEffect(() => {
    //     const loadModelAsync = async () => {
    //         const model = await loadModel();
    //         setModel(model);
    //     };

    //     loadModelAsync();
    // }, []);

    useEffect(() => {
        if (!song) return;

        const titleList = stringToList(song.name);
        const lyricsList = stringToList(song.lyrics);
        const artistList = stringToList(song.creator[0].name);

        setTitle(titleList);
        setLyrics(lyricsList);
        setArtist(artistList);

        setTitleFound(titleList.reduce((acc, word, i) => {
            if (!isAlphanumeric(word)) acc.push(i);
            return acc;
        }, []));
        setLyricsFound(lyricsList.reduce((acc, word, i) => {
            if (!isAlphanumeric(word)) acc.push(i);
            return acc;
        }, []));
        setArtistFound(artistList.reduce((acc, word, i) => {
            if (!isAlphanumeric(word)) acc.push(i);
            return acc;
        }, []));

        // if (model){
        //     setCache(buildCache(model, [...titleList, ...lyricsList, ...artistList]));
        // }
    }, [song]);

    useEffect(() => {
        if (guess && song) {
            const updateFoundWords = async () => {
                // Function to check similarity for words in title, lyrics, and artist
                const checkAndUpdate = async (wordList, foundList, partialList, setFound, setPartial, key) => {
                    const foundIndices = [];
                    const partialIndices = {};

                    await Promise.all(
                        wordList.map(async (word, i) => {
                            if (foundList.includes(i)) return;
                            // const similarity = await compareWords(model, cache, guess.toLowerCase(), word.toLowerCase());
                            let guessLower = guess.toLowerCase();
                            let wordLower = word.toLowerCase();
                            let guessLems = guessLower in word_to_lemme ? word_to_lemme[guessLower] : [guessLower];
                            let wordLems = wordLower in word_to_lemme ? word_to_lemme[wordLower] : [wordLower];
                            const similarity = guessLower === wordLower || guessLems.some(lem => wordLems.includes(lem)) ? 1 : 0;
                            if (similarity > 0.9) {
                                foundIndices.push(i); 
                            } else if (similarity > 0.6) {
                                partialIndices[i] = guess;
                            }

                        })
                    );

                    setFound([...foundList, ...foundIndices]);
                    setPartial({ ...partialList, ...partialIndices });

                    return { foundIndices, partialIndices };
                };

                const [titleResult, lyricsResult, artistResult] = await Promise.all([
                    checkAndUpdate(title, titleFound, partialMatchesTitle, setTitleFound, setPartialMatchesTitle, "title"),
                    checkAndUpdate(lyrics, lyricsFound, partialMatchesLyrics, setLyricsFound, setPartialMatchesLyrics, "lyrics"),
                    checkAndUpdate(artist, artistFound, partialMatchesArtist, setArtistFound, setPartialMatchesArtist, "artist")
                ]);

                setCurrentIndexWordFound({
                    title: titleResult.foundIndices,
                    lyrics: lyricsResult.foundIndices,
                    artist: artistResult.foundIndices
                });

                setGuessFeedback({
                    perfect_match: titleResult.foundIndices.length + lyricsResult.foundIndices.length + artistResult.foundIndices.length,
                    //partial_match: titleResult.partialIndices.length + lyricsResult.partialIndices.length + artistResult.partialIndices.length
                });
            };

            updateFoundWords();
        }
    }, [guess]);

    useEffect(() => {
        if (titleFound.length === title.length) {
            setVictory(true);
        }
    }, [titleFound]);

    if (!song) {
        return <Text>Loading...</Text>;
    }

    return (
        <>
            <Box mb={4}>
                {title.map((word, i) => (
                    <LyricWords
                        key={i}
                        word={word}
                        isCurrentGuess={currentIndexWordFound.title.includes(i)}
                        found={titleFound.includes(i) || showAllSong}
                        partial={i.toString() in partialMatchesTitle}
                        wordPartialMatch={i.toString() in partialMatchesTitle ? partialMatchesTitle[i] : null}
                    />
                ))}
            </Box>
            <Box mb={4}>
                {artist.map((word, i) => (
                    <LyricWords
                        key={i}
                        word={word}
                        isCurrentGuess={currentIndexWordFound.artist.includes(i)}
                        found={artistFound.includes(i) || showAllSong}
                        partial={i.toString() in partialMatchesArtist}
                        wordPartialMatch={i.toString() in partialMatchesArtist ? partialMatchesArtist[i] : null}
                    />
                ))}
            </Box>
            <Box>
                {lyrics.map((word, i) => (
                    <LyricWords
                        key={i}
                        word={word}
                        isCurrentGuess={currentIndexWordFound.lyrics.includes(i)}
                        found={lyricsFound.includes(i) || showAllSong}
                        partial={i.toString() in partialMatchesLyrics}
                        wordPartialMatch={i.toString() in partialMatchesLyrics ? partialMatchesLyrics[i] : null}
                    />
                ))}
            </Box>
        </>
    );
};

const LyricWords = ({ word, isCurrentGuess, found, partial, wordPartialMatch }) => {
    const [showWordLength, setShowWordLength] = useState(false);

    const handleClick = () => {
        if (!found && isAlphanumeric(word)) {
            setShowWordLength(true);
            setTimeout(() => {
                setShowWordLength(false);
            }, 2000);
        }
    };

    return found ? (
        isCurrentGuess ?
            (
                <Box
                    backgroundColor={'green.300'}
                    display={'inline-block'}
                    mr={3}
                    pl={1}
                    pr={1}
                    textAlign={'center'}
                    borderRadius={'md'}
                    transform='translateY(-2px)'
                >
                    <Text fontSize={'lg'}>{word}</Text>
                </Box>
            ) : (
                <Text display={'inline-block'} mr={3} fontSize={'lg'}>{word}</Text>
            )
    ) : (
            <Box
                width={word.length * 6}
                height={5}
                backgroundColor={'gray.600'}
                display={'inline-block'}
                cursor={'pointer'}
                position={'relative'}
                mr={3}
                onClick={handleClick}
                textAlign={'center'}
                borderRadius={'md'}
            >
                {showWordLength && (
                    <Text
                        color={'white'}
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontWeight={'bold'}
                        fontSize={'lg'}
                    >
                        {word.length}
                    </Text>
                )}
                {!showWordLength && partial && (
                    <Text
                        color={'white'}
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontWeight={'bold'}
                        fontSize={'lg'}
                    >
                        {wordPartialMatch}
                    </Text>
                )}
            </Box>
        );
    };

export default memo(LyricsComponent);
