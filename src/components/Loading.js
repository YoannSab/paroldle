import { Spinner,Center } from '@chakra-ui/react'

export default function Loading(){ return (
    <Center>
    <Spinner
        mt={2}
        thickness='4px'
        speed='0.65s'
        emptyColor='cyan.200'
        color='cyan.500'
        size={['md', 'lg', 'xl']}
    /></Center>
)};
