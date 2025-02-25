import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Text, Flex, Icon } from '@chakra-ui/react';
import { FaMedal, FaMusic, FaFire } from 'react-icons/fa'; // Ajout de l'icône de feu
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useTranslation } from 'react-i18next';

const FestiveModal = ({ isOpen, onClose, state }) => {
  const { width, height } = useWindowSize();
  const { t } = useTranslation();

  return (
    <>
    {isOpen && <Confetti width={width} height={height} />}
  
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
      <ModalOverlay />
      {state === 'victory_hardcore' ? (
        <ModalContent
          bgGradient="linear(to-r, red.400, orange.400)"
          color="white"
          boxShadow="xl"
        >
          <ModalHeader textAlign="center">
            <Flex align="center" justify="center">
              <Icon as={FaFire} boxSize={8} mr={2} />
              <Text fontSize="2xl" fontWeight="bold">
                {t("Wow, champion!")}
              </Text>
              <Icon as={FaFire} boxSize={8} ml={2} />
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" align="center" mt={4}>
              <Icon as={FaMusic} color="white" boxSize={12} mb={4} />
              <Text fontSize="xl" textAlign="center">
                {t("You crushed the song in hardcore mode!")}
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      ) : (
        <ModalContent>
          <ModalHeader textAlign="center">
            <Icon as={FaMedal} color="yellow.400" boxSize={8} />
            {t("Well done!")}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" align="center">
              <Icon as={FaMusic} color="green.400" boxSize={12} mb={4} />
              <Text fontSize="xl" textAlign="center">
                {t("You found the song!")}
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      )}
    </Modal>
  </>
  );
};

export default FestiveModal;
