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
            
            <AlertDialogContent 
                bg="gray.700" 
                color="white" 
                boxShadow="xl" 
                borderRadius="lg"
                mx={4} // Add margin on sides for small screens
                maxW={{ base: "90%", md: "md" }} // Responsive width
            >
                <AlertDialogHeader textAlign="center" fontSize={{ base: "lg", md: "xl" }}>
                    <Flex align="center" justify="center" flexWrap="wrap">
                        <Icon as={FaBalanceScale} boxSize={{ base: 6, md: 8 }} mr={2} />
                        {t("Tie Request")}
                        <Icon as={FaBalanceScale} boxSize={{ base: 6, md: 8 }} ml={2} />
                    </Flex>
                </AlertDialogHeader>

                <AlertDialogBody 
                    textAlign="center" 
                    fontSize={{ base: "md", md: "lg" }}
                    px={{ base: 3, md: 6 }}
                    py={{ base: 2, md: 4 }}
                >
                    {t("Your opponent is proposing a tie. Do you accept?")}
                </AlertDialogBody>

                <AlertDialogFooter flexDirection={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
                    <Button 
                        onClick={onClose} 
                        colorScheme="red" 
                        w={{ base: "100%", sm: "auto" }}
                        mr={{ base: 0, sm: 3 }}
                        mb={{ base: 2, sm: 0 }}
                    >
                        {t("No, refuse")}
                    </Button>
                    <Button 
                        onClick={onAccept} 
                        colorScheme="green"
                        w={{ base: "100%", sm: "auto" }}
                    >
                        {t("Yes, accept")}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default TieRequestDialog;
