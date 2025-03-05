import React from 'react';
import { 
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, 
    ModalBody, Text, Flex, Icon 
} from '@chakra-ui/react';
import { FaMedal, FaMusic, FaFire, FaSadTear, FaTimesCircle, FaBalanceScale } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useTranslation } from 'react-i18next';

const FestiveModal = ({ isOpen, onClose, state }) => {
    const { width, height } = useWindowSize();
    const { t } = useTranslation();

    return (
        <>
            {isOpen && state.includes("victory") && <Confetti width={width} height={height} />}
        
            <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
                <ModalOverlay />
                
                {state === 'victory_hardcore' ? (
                    // MODAL POUR LA VICTOIRE HARDCORE
                    <ModalContent bgGradient="linear(to-r, red.400, orange.400)" color="white" boxShadow="xl">
                        <ModalHeader textAlign="center">
                            <Flex align="center" justify="center">
                                <Icon as={FaFire} boxSize={8} mr={2} />
                                <Text fontSize="2xl" fontWeight="bold">{t("Wow, champion!")}</Text>
                                <Icon as={FaFire} boxSize={8} ml={2} />
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={4}>
                                <Icon as={FaMusic} color="white" boxSize={12} mb={4} />
                                <Text fontSize="xl" textAlign="center">{t("You crushed the song in hardcore mode!")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>

                ) : state.startsWith("defeat") || state.startsWith("abandonned") ? (
                    // MODAL POUR LA DÉFAITE
                    <ModalContent bgGradient="linear(to-r, gray.700, blue.900)" color="white" boxShadow="xl">
                        <ModalHeader textAlign="center">
                            <Flex align="center" justify="center">
                                <Icon as={FaSadTear} boxSize={8} mr={2} />
                                <Text fontSize="2xl" fontWeight="bold">{t("Oh no...")}</Text>
                                <Icon as={FaSadTear} boxSize={8} ml={2} />
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={4}>
                                <Icon as={FaTimesCircle} color="red.400" boxSize={12} mb={4} />
                                <Text fontSize="xl" textAlign="center">{t("You lost this time, but don't give up!")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>

                ) : state.startsWith('tie') ? (
                    // MODAL POUR L'ÉGALITÉ
                    <ModalContent bgGradient="linear(to-r, gray.500, yellow.400)" color="white" boxShadow="xl">
                        <ModalHeader textAlign="center">
                            <Flex align="center" justify="center">
                                <Icon as={FaBalanceScale} boxSize={8} mr={2} />
                                <Text fontSize="2xl" fontWeight="bold">{t("It's a tie!")}</Text>
                                <Icon as={FaBalanceScale} boxSize={8} ml={2} />
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center" mt={4}>
                                <Icon as={FaMedal} color="white" boxSize={12} mb={4} />
                                <Text fontSize="xl" textAlign="center">{t("A well-matched battle! No winners, no losers.")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>

                ) : (
                    // MODAL POUR LA VICTOIRE CLASSIQUE
                    <ModalContent>
                        <ModalHeader textAlign="center">
                            <Icon as={FaMedal} color="yellow.400" boxSize={8} />
                            {t("Well done!")}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" align="center">
                                <Icon as={FaMusic} color="green.400" boxSize={12} mb={4} />
                                <Text fontSize="xl" textAlign="center">{t("You found the song!")}</Text>
                            </Flex>
                        </ModalBody>
                    </ModalContent>
                )}
            </Modal>
        </>
    );
};

export default FestiveModal;
