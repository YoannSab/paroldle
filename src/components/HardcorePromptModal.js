// HardcorePromptModal.js
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from '@chakra-ui/react';

const HardcorePromptModal = ({ isOpen, onConfirm, onDecline }) => {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign={'center'}>🔥 Mode Hardcore 🔥</ModalHeader>
        <ModalBody>
          <Text>
            Continuer en mode hardcore pour tenter de découvrir l'intégralité
            des paroles et gagner plus de points ?
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={onConfirm}>
            Oui
          </Button>
          <Button variant="ghost" onClick={onDecline}>
            Non
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default HardcorePromptModal;
