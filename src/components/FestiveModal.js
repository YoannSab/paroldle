import React from 'react';
import { 
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, 
    ModalBody, Text, Flex, Icon, useBreakpointValue
} from '@chakra-ui/react';
import { FaMedal, FaMusic, FaFire, FaSadTear, FaTimesCircle, FaBalanceScale } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useTranslation } from 'react-i18next';

const FestiveModal = ({ isOpen, onClose, state }) => {
    const { width, height } = useWindowSize();
    const { t } = useTranslation();
    
    // Responsive sizes
    const iconSize = useBreakpointValue({ base: 6, sm: 8 });
    const bodyIconSize = useBreakpointValue({ base: 10, sm: 12 });
    const fontSize = useBreakpointValue({ base: "lg", sm: "xl", md: "2xl" });
    const bodyFontSize = useBreakpointValue({ base: "md", sm: "xl" });
    const modalSize = useBreakpointValue({ base: "xs", sm: "sm" });

    return (
        <>
            {isOpen && state.includes("victory") && <Confetti width={width} height={height} />}
        
            <Modal isOpen={isOpen} onClose={onClose} size={modalSize} isCentered>
                <ModalOverlay />
                
                {state === 'victory_hardcore' ? (
                    // MODAL POUR LA VICTOIRE HARDCORE
                    <ModalContent bgGradient="linear(to-r, red.400, orange.400)" color="white" boxShadow="xl" mx={2}>
                        <ModalHeader textAlign="center" py={3}>
                            <Flex align="center" justify="center" wrap="wrap">
                                <Icon as={FaFire} boxSize={iconSize} mr={2} />
                                <Text fontSize={fontSize} fontWeight="bold">{t("Wow, champion!")}</Text>
                                <Icon as={FaFire} boxSize={iconSize} ml={2} />
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={2}>
                                <Icon as={FaMusic} color="white" boxSize={bodyIconSize} mb={3} />
                                <Text fontSize={bodyFontSize} textAlign="center" pb={4}>{t("You crushed the song in hardcore mode!")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>

                ) : state.startsWith("defeat") || state.startsWith("abandonned") ? (
                    // MODAL POUR LA DÉFAITE
                    <ModalContent bgGradient="linear(to-r, gray.700, blue.900)" color="white" boxShadow="xl" mx={2}>
                        <ModalHeader textAlign="center" py={3}>
                            <Flex align="center" justify="center" wrap="wrap">
                                <Icon as={FaSadTear} boxSize={iconSize} mr={2} />
                                <Text fontSize={fontSize} fontWeight="bold">{t("Oh no...")}</Text>
                                <Icon as={FaSadTear} boxSize={iconSize} ml={2} />
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={2}>
                                <Icon as={FaTimesCircle} color="red.400" boxSize={bodyIconSize} mb={3} />
                                <Text fontSize={bodyFontSize} textAlign="center" pb={4}>{t("You lost this time, but don't give up!")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>

                ) : state.startsWith('tie') ? (
                    // MODAL POUR L'ÉGALITÉ
                    <ModalContent bgGradient="linear(to-r, gray.500, yellow.400)" color="white" boxShadow="xl" mx={2}>
                        <ModalHeader textAlign="center" py={3}>
                            <Flex align="center" justify="center" wrap="wrap">
                                <Icon as={FaBalanceScale} boxSize={iconSize} mr={2} />
                                <Text fontSize={fontSize} fontWeight="bold">{t("It's a tie!")}</Text>
                                <Icon as={FaBalanceScale} boxSize={iconSize} ml={2} />
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={2}>
                                <Icon as={FaMedal} color="white" boxSize={bodyIconSize} mb={3} />
                                <Text fontSize={bodyFontSize} textAlign="center" pb={4}>{t("A well-matched battle! No winners, no losers.")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>

                ) : (
                    // MODAL POUR LA VICTOIRE CLASSIQUE
                    <ModalContent mx={2}>
                        <ModalHeader textAlign="center" py={3}>
                            <Flex align="center" justify="center">
                                <Icon as={FaMedal} color="yellow.400" boxSize={iconSize} mr={2} />
                                <Text fontSize={fontSize} fontWeight="bold">{t("Well done!")}</Text>
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={2}>
                                <Icon as={FaMusic} color="green.400" boxSize={bodyIconSize} mb={3} />
                                <Text fontSize={bodyFontSize} textAlign="center" pb={4}>{t("You found the song!")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>
                )}
            </Modal>
        </>
    );
};

export default FestiveModal;
