import { Box, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { memo } from 'react';
import { embeddings_v_small } from './embeddings_v_small';
import { word_to_lemme_small } from './word_to_lemme_small';
import { cosineSimilarity } from './compare_words';

//import { loadModel, compareWords, buildCache } from './compare_words';

function stringToList(text) {
    return text
        .replace(/\n+/g, '\n')
        .split(/\r?\n/)
        .map(line =>
            line.match(/([\w\u00C0-\u017F]+(?:')?|[^\s\w])/g) || []
        )
        .reduce((acc, line) => acc.concat(line, '\n'), []);
}

const isAlphanumeric = (word) => /^[a-z0-9\u00C0-\u00FF\u0152\u0153']+$/i.test(word);
const isSingleCharWithApostrophe = (word) => /^[a-zA-Z\u00C0-\u00FF\u0152\u0153]'$/i.test(word);
const findBreakPoint = (lyrics) => {
    const middle = Math.floor(lyrics.length / 2);
    
    for (let i = middle; i < lyrics.length; i++) {
      if (lyrics[i] === '\n') {
        return i + 1;
      }
    }
    for (let i = middle; i >= 0; i--) {
      if (lyrics[i] === '\n') {
        return i + 1;
      }
    }
    return middle;
  };

  
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

    useEffect(() => {
        if (!song) return;

        const titleList = stringToList(song.name);
        const lyricsList = stringToList(song.lyrics);
        const artistList = stringToList(song.creator[0].name);
        //console.log(lyricsList);

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

        //console.log(lyricsFound);
        setCurrentIndexWordFound({ title: [], lyrics: [], artist: [] });
        setGuessFeedback({ perfect_match: 0, partial_match: 0 });
        setPartialMatchesTitle({});
        setPartialMatchesLyrics({});
        setPartialMatchesArtist({});
        // eslint-disable-next-line
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
                            let guessLower = guess.toLowerCase();
                            let wordLower = word.toLowerCase();

                            if (guessLower === wordLower) {
                                foundIndices.push(i);
                                return;
                            }
                            else if (((isSingleCharWithApostrophe(guessLower) && wordLower.length === 2)
                                || (isSingleCharWithApostrophe(wordLower) && guessLower.length === 2))
                                && guessLower[0] === wordLower[0]) {
                                foundIndices.push(i);
                                return;
                            }


                            let guessLems = word_to_lemme_small[guessLower] || [guessLower];
                            let wordLems = word_to_lemme_small[wordLower] || [wordLower];
                            const similarity = (guessLems.some(lem => wordLems.includes(lem))) ? 1 :
                                cosineSimilarity(embeddings_v_small, guessLower, wordLower)
                            if (similarity > 0.9) {
                                foundIndices.push(i);
                            } else if (similarity >= 0.7) {
                                if (!partialList[i] || partialList[i][1] < similarity.toFixed(2)) {
                                    partialIndices[i] = [guess, similarity.toFixed(2)];
                                }

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
                    partial_match: Object.keys(titleResult.partialIndices).length + Object.keys(lyricsResult.partialIndices).length + Object.keys(artistResult.partialIndices).length
                });
            };

            updateFoundWords();
        }
        // eslint-disable-next-line
    }, [guess]);

    useEffect(() => {
        if (titleFound.length === title.length) {
            setVictory(true);
        }
        // eslint-disable-next-line
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
                        prevWord={title[i - 1]}
                        word={word}
                        isCurrentGuess={currentIndexWordFound.title.includes(i)}
                        found={titleFound.includes(i) || showAllSong}
                        partialMatch={partialMatchesTitle[i] ? partialMatchesTitle[i][0] : null}
                    />
                ))}
            </Box>
            <Box mb={4}>
                {artist.map((word, i) => (
                    <LyricWords
                        key={i}
                        prevWord={artist[i - 1]}
                        word={word}
                        isCurrentGuess={currentIndexWordFound.artist.includes(i)}
                        found={artistFound.includes(i) || showAllSong}
                        partialMatch={partialMatchesArtist[i] ? partialMatchesArtist[i][0] : null}
                    />
                ))}
            </Box>
            <Box display="flex">
                <Box width="50%">
                    {lyrics.slice(0, findBreakPoint(lyrics)).map((word, i) => (
                        word === '\n' ? (
                            <Box key={i} as={'br'} />
                        ) : (
                            <LyricWords
                                key={i}
                                prevWord={lyrics[i - 1]}
                                word={word}
                                isCurrentGuess={currentIndexWordFound.lyrics.includes(i)}
                                found={lyricsFound.includes(i) || showAllSong}
                                partialMatch={partialMatchesLyrics[i] ? partialMatchesLyrics[i][0] : null}
                            />
                        )
                    ))}
                </Box>
                <Box width="50%">
                    {lyrics.slice(findBreakPoint(lyrics)).map((word, i) => (
                        word === '\n' ? (
                            <Box key={i} as={'br'} />
                        ) : (
                            <LyricWords
                                key={i}
                                prevWord={lyrics[i - 1 + findBreakPoint(lyrics)]}
                                word={word}
                                isCurrentGuess={currentIndexWordFound.lyrics.includes(i + findBreakPoint(lyrics))}
                                found={lyricsFound.includes(i + findBreakPoint(lyrics)) || showAllSong}
                                partialMatch={partialMatchesLyrics[i + findBreakPoint(lyrics)] ? partialMatchesLyrics[i + findBreakPoint(lyrics)][0] : null}
                            />
                        )
                    ))}
                </Box>
            </Box>

        </>
    );
};

const LyricWords = ({ key, prevWord, word, isCurrentGuess, found, partialMatch }) => {
    const [showWordLength, setShowWordLength] = useState(false);
    const marginLeft = (!prevWord || prevWord === '\n' || (!isAlphanumeric(word) && !`("&-)`.includes(word))) ? 0 : 3;

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
                    pl={1}
                    pr={1}
                    ml={marginLeft}
                    textAlign={'center'}
                    borderRadius={'md'}
                >
                    <Text fontSize={'sm'}>{word}</Text>
                </Box>
            ) : (
                <Text display={'inline-block'} ml={marginLeft} fontSize={'md'}>{word}</Text>
            )
    ) : (
        <Box
            key={key}
            ml={marginLeft}
            backgroundColor={'gray.600'}
            display={'inline-block'}
            cursor={'pointer'}
            position={'relative'}
            onClick={handleClick}
            textAlign={'center'}
            borderRadius={'md'}
            transform={'translateY(3px)'}
            width={partialMatch ? `${partialMatch.length + 1}ch` : `${word.length}ch`}
            //minWidth={partial ? `${wordPartialMatch.length+1}ch` : `${word.length+1}ch`}
            height={'2ch'}
        >
            {showWordLength && (
                <Text
                    color={'white'}
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    fontWeight={'bold'}
                    fontSize={'md'}
                >
                    {word.length}
                </Text>
            )}
            {!showWordLength && partialMatch && (
                <Text
                    color={'orange'}
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -52%)"
                    fontSize={'sm'}
                >
                    {partialMatch}
                </Text>
            )}
        </Box>

    );
};

export default memo(LyricsComponent);
