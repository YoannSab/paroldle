import React from 'react';
import {
    AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
    AlertDialogBody, AlertDialogFooter, Button, Icon, Flex
} from '@chakra-ui/react';
import { FaBalanceScale } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const TieRequestDialog = ({ isOpen, onClose, onAccept }) => {
    const { t } = useTranslation();

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
            isCentered
        >
            <AlertDialogOverlay />
            
            <AlertDialogContent bg="gray.700" color="white" boxShadow="xl" borderRadius="lg">
                <AlertDialogHeader textAlign="center">
                    <Flex align="center" justify="center">
                        <Icon as={FaBalanceScale} boxSize={8} mr={2} />
                        {t("Tie Request")}
                        <Icon as={FaBalanceScale} boxSize={8} ml={2} />
                    </Flex>
                </AlertDialogHeader>

                <AlertDialogBody textAlign="center" fontSize="lg">
                    {t("Your opponent is proposing a tie. Do you accept?")}
                </AlertDialogBody>

                <AlertDialogFooter>
                    <Button onClick={onClose} colorScheme="red" mr={3}>
                        {t("No, refuse")}
                    </Button>
                    <Button onClick={onAccept} colorScheme="green">
                        {t("Yes, accept")}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default TieRequestDialog;
