import { memo, useMemo } from 'react';
import { Box, Stack, Tag, Text } from '@chakra-ui/react';
import useColors from '../hooks/useColors';
import { useTranslation } from 'react-i18next';

// Composant TagItem mémorisé pour éviter les re-renders inutiles de chaque tag
const TagItem = memo(({ word, index, totalCount, colors }) => (
  <Tag
    size={["sm", "md"]}
    variant="solid"
    bg={colors.guessListBg}
    border={`1px solid ${colors.text}`}
    color={colors.text}
  >
    {totalCount - index}. {word}
  </Tag>
));

// Composant GuessListDisplay optimisé
const GuessListDisplay = memo(({ guessList }) => {
  const colors = useColors();
  const { t } = useTranslation();
  console.log('GuessListDisplay Rerendered');

  // Utiliser un style CSS mémorisé pour le scrollbar
  const scrollbarStyle = useMemo(() => ({
    '&::-webkit-scrollbar': { width: '5px' },
    '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
    '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '3px' },
    '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
  }), []);

  // Sortie anticipée si la liste est vide
  if (!guessList || guessList.length === 0) return null;

  // Mémoriser le nombre total une seule fois
  const totalCount = guessList.length;
  
  return (
    <Box mb={4}>
      <Text 
        fontSize={["md", "lg"]}
        fontWeight="bold" 
        mb={2}
      >
        {t("Previous guesses")}
      </Text>
      <Stack
        spacing={[1, 2]}
        direction="row"
        flexWrap="wrap"
        justify="center"
        maxH="150px"
        overflowY="auto"
        css={scrollbarStyle}
      >
        {guessList.map((word, i) => (
          <TagItem 
            key={i} 
            word={word} 
            index={i} 
            totalCount={totalCount} 
            colors={colors}
          />
        ))}
      </Stack>
    </Box>
  );
});

export default GuessListDisplay;