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
import { useTranslation } from 'react-i18next';

const HardcorePromptModal = ({ isOpen, onConfirm, onDecline }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={() => {}} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign={'center'}>🔥 {t("Hardcore mode ")} 🔥</ModalHeader>
        <ModalBody>
          <Text>
            {t("Continue in hardcore mode to try to discover all the lyrics and earn more points?")}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={onConfirm}>
            {t("Yes")}
          </Button>
          <Button variant="ghost" onClick={onDecline}>
            {t("No")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default HardcorePromptModal;
