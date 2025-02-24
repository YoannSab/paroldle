import { memo } from 'react';
import { Box, Stack, Tag, Text } from '@chakra-ui/react';
import { useColors } from '../constants';

// ---------- GuessListDisplay ----------
const GuessListDisplay = memo(({ guessList }) => {
  const colors = useColors();

  if (guessList.length === 0) return null;
  return (
    <Box mb={4}>
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        Essais précédents
      </Text>
      <Stack
        spacing={2}
        direction="row"
        flexWrap="wrap"
        justify="center"
        maxH="150px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
        }}
      >
        {guessList.map((word, i) => (
          <Tag
            key={i}
            size="md"
            variant="solid"
            bg={colors.guessListBg}
            border={`1px solid ${colors.text}`}
            color={colors.text}
          >
            {guessList.length - i}. {word}
          </Tag>
        ))}
      </Stack>
    </Box>
  );
});

export default GuessListDisplay;
