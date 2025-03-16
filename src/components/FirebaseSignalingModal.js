import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Box,
} from '@chakra-ui/react';
import { ref, set, get, onChildAdded, onChildChanged, onChildRemoved, remove, onValue, update} from "firebase/database";
import { database } from '../firebase';
import { useToast } from "@chakra-ui/react";
import Peer from 'peerjs';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import ProfilePictureModal from './ProfilePictureModal';

const FirebaseSignalingModal = ({
  isOpen,
  onClose,
  onConnected,
  onDisconnected,
  onMessage,
  roomPlayers,
  setRoomPlayers,
  playerName,
  setPlayerName,
  setOtherPlayersInfo,
  gameMode,
  gameModeRef,
  song,
  isConnected,
  setIsConnected,
  roomId,
  setRoomId,
  selectedImage,
  setSelectedImage,
}) => {
  const [roomInput, setRoomInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [myPeerId, setMyPeerId] = useState(null);
  const [status, setStatus] = useState('Enter a room id and a name');
  const [error, setError] = useState('');
  const toast = useToast();
  const { t } = useTranslation();
  

  // Nouvel état pour stocker la liste des salles ouvertes
  const [openRooms, setOpenRooms] = useState([]);

  useEffect(() => {
    localStorage.setItem('paroldle_profilePicture', selectedImage);

    if (isConnected && roomId && playerName) {
      update(ref(database, `rooms/${roomId}/players/${playerName}`), {
        profilePicture: selectedImage,
      });
    }
  }, [selectedImage, isConnected, roomId, playerName]);


  // Mise à jour automatique des salles ouvertes à partir de Firebase
  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const roomsData = snapshot.val();
      let roomsList = [];
      if (roomsData) {
        roomsList = Object.keys(roomsData).map((roomId) => {
          const playersCount = roomsData[roomId].players
            ? Object.keys(roomsData[roomId].players).length
            : 0;
          return { roomId, playersCount };
        });
      }
      setOpenRooms(roomsList);
    });
    return () => {
      // Désabonnement lors du démontage
      unsubscribe && unsubscribe();
    };
  }, []);

  // Dès qu'on change gameMode ou song, mettre à jour Firebase (si on a roomId, playerName et myPeerId)
  useEffect(() => {
    if (!gameMode || !song) return;
    if (roomId && playerName && myPeerId) {
      update(ref(database, `rooms/${roomId}/players/${playerName}`), {
        name: playerName,
        peerId: myPeerId,
        gameMode: gameMode || null,
        song: song ? { index: song.index, style: song.style } : null,
      });
    }
  }, [gameMode, song, roomId, playerName, myPeerId]);

  // Références pour PeerJS et connexions
  const peerRef = useRef(null);
  const connectionsRef = useRef({}); // { remotePeerId: DataConnection }
  // Garder en ref le playerName courant pour les messages
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  // Pour associer un peerId à un nom (issu de Firebase)
  const playersMappingRef = useRef({});

  useEffect(() => {
    setIsConnected(status.startsWith('Connected'));
  }, [status, setIsConnected]);

  // Création du PeerJS dès le montage
  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => {
      console.log('My peer ID is:', id);
      setMyPeerId(id);
    });
    // Gestion des connexions entrantes
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      if (connectionsRef.current[conn.peer]) {
        console.log(`Connection already exists with ${conn.peer}, closing new one.`);
        conn.close();
        return;
      }
      conn.remoteName = playersMappingRef.current[conn.peer] || conn.peer;
      connectionsRef.current[conn.peer] = conn;
      setupDataConnection(conn);
    });
    peerRef.current = peer;
    return () => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    };
  }, []);

  // Configure une connexion (entrant ou sortant)
  const setupDataConnection = (conn) => {
    conn.on('open', () => {
      console.log(`Data connection with ${conn.peer} opened`);
      updateOtherPlayersInfo();
      checkIfAnyConnected();
    });
    conn.on('data', (data) => {
      console.log(`Message received from ${conn.peer}:`, data);
      if (data && data.type === 'game_data' && onMessage) onMessage(data);
    });
    conn.on('error', (err) => {
      console.error(`Error on connection with ${conn.peer}:`, err);
    });
    conn.on('close', () => {
      console.log(`Connection closed with ${conn.peer}`);
      delete connectionsRef.current[conn.peer];
      updateOtherPlayersInfo();
      checkIfAnyConnected();
    });
  };

  // Met à jour otherPlayersInfo en fonction des connexions ouvertes.
  const updateOtherPlayersInfo = () => {
    const openConnections = Object.values(connectionsRef.current).filter(conn => conn.open);
    openConnections.forEach(conn => {
      if (conn.remoteName) {
        console.log(`Updating otherPlayersInfo for ${conn.remoteName}`);
        setOtherPlayersInfo(prev => ({
          ...prev,
          [conn.remoteName]: {
            ...(prev[conn.remoteName] || {}),
            sendFunc: (msg) => {
              conn.send({ type: 'game_data', text: msg, sender: playerNameRef.current, gameMode: gameModeRef.current });
            },
          },
        }));
      }
    });
  };

  // Envoie un message de diffusion à tous les pairs connectés
  const checkIfAnyConnected = () => {
    const openConnections = Object.values(connectionsRef.current).filter(conn => conn.open);
    if (openConnections.length > 0 && onConnected) {
      const broadcast = (msg) => {
        openConnections.forEach(conn => {
          conn.send({ type: 'game_data', text: msg, sender: playerNameRef.current, gameMode: gameModeRef.current });
        });
      };
      onConnected(broadcast);
    }
  };

  // Rejoindre la room et écouter Firebase
  const joinRoom = async () => {
    if (!roomInput || !playerNameInput) {
      setError("Please enter a room id and a name");
      return;
    }
    setRoomId(roomInput);
    setPlayerName(playerNameInput);

    const roomIdLocal = roomInput;
    const playerNameLocal = playerNameInput;
    if (!myPeerId) {
      setError("Waiting for Peer initialization...");
      return;
    }
    const playersSnapshot = await get(ref(database, `rooms/${roomIdLocal}/players`));
    if (playersSnapshot.exists()) {
      const playersData = playersSnapshot.val();
      const isNameTaken = Object.values(playersData).some((player) => player.name === playerNameLocal);
      if (isNameTaken) {
        setError("This name is already taken, please choose another one");
        return;
      }
    }
    // Enregistrer notre présence avec les infos (gameMode et song si disponibles)
    await set(ref(database, `rooms/${roomIdLocal}/players/${playerNameLocal}`), {
      name: playerNameLocal,
      peerId: myPeerId,
      gameMode: gameModeRef.current || null,
      song: song ? { index: song.index, style: song.style } : null,
    });
    setStatus("Connected to a room, waiting for players...");
    setError('');
    setRoomPlayers(prev => {
      if (!prev.includes(playerNameLocal)) return [...prev, playerNameLocal];
      return prev;
    });

    const playersRef = ref(database, `rooms/${roomIdLocal}/players`);

    // Mise à jour initiale de otherPlayersInfo à partir de la snapshot
    if (playersSnapshot.exists()) {
      const playersData = playersSnapshot.val();
      Object.keys(playersData).forEach(remoteName => {
        if (remoteName !== playerNameLocal) {
          const remoteData = playersData[remoteName];
          if (remoteData && remoteData.peerId) {
            setOtherPlayersInfo(prev => {
              const newInfo = {
                ...prev,
                [remoteName]: {
                  ...(prev[remoteName] || {}), // Conserver les infos existantes
                  name: remoteName,
                  gameMode: remoteData.gameMode,
                  song: remoteData.song,
                  profilePicture: remoteData.profilePicture || "pdp1",
                }
              };
              return newInfo;
            });
          }
        }
      });
    }

    // Lorsqu'un nouveau joueur rejoint
    onChildAdded(playersRef, (snapshot) => {
      const remoteName = snapshot.key;
      const remoteData = snapshot.val();
      if (remoteName !== playerNameLocal && remoteData && remoteData.peerId) {
        playersMappingRef.current[remoteData.peerId] = remoteName;
        setOtherPlayersInfo(prev => {
          const newInfo = {
            ...prev,
            [remoteName]: {
              ...(prev[remoteName] || {}),
              name: remoteName,
              gameMode: remoteData.gameMode,
              song: remoteData.song,
              profilePicture: remoteData.profilePicture || "pdp1",
            }
          };
          return newInfo;
        });
        // Seul le pair dont l'ID est inférieur initie la connexion
        if (myPeerId && myPeerId < remoteData.peerId) {
          if (!connectionsRef.current[remoteData.peerId]) {
            const conn = peerRef.current.connect(remoteData.peerId);
            conn.remoteName = remoteName;
            connectionsRef.current[remoteData.peerId] = conn;
            setupDataConnection(conn);
          }
          toast({
            title: t("New player detected"),
            description: remoteName + " " + t('has joined the room'),
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        }
      }
      setRoomPlayers(prev => {
        if (!prev.includes(remoteName)) return [...prev, remoteName];
        return prev;
      });
    });

    // Lorsqu'un joueur met à jour ses infos (gameMode ou song)
    onChildChanged(playersRef, (snapshot) => {
      const remoteName = snapshot.key;
      const remoteData = snapshot.val();
      if (remoteName !== playerNameLocal && remoteData && remoteData.peerId) {
        setOtherPlayersInfo(prev => ({
          ...prev,
          [remoteName]: {
            ...prev[remoteName],
            gameMode: remoteData.gameMode,
            song: remoteData.song,
            battleState: remoteData.battleState || prev[remoteName]?.battleState || "waiting",
            wantsTie: remoteData.wantsTie || false,
            profilePicture: remoteData.profilePicture || "pdp1",
          }
        }));
      }
    });

    // Lorsqu'un joueur quitte
    onChildRemoved(playersRef, (snapshot) => {
      const remoteName = snapshot.key;
      const remoteData = snapshot.val();
      if (remoteData && remoteData.peerId) {
        const remotePeerId = remoteData.peerId;
        if (connectionsRef.current[remotePeerId]) {
          connectionsRef.current[remotePeerId].close();
          delete connectionsRef.current[remotePeerId];
        }
      }
      setRoomPlayers(prev => prev.filter(name => name !== remoteName));
      setOtherPlayersInfo(prev => {
        const newInfo = { ...prev };
        delete newInfo[remoteName];
        return newInfo;
      });
    });

    if (playersSnapshot.exists()) {
      const initialPlayers = Object.keys(playersSnapshot.val());
      setRoomPlayers(prev => Array.from(new Set([...prev, ...initialPlayers])));
    }
  };

  const disconnect = async () => {
    for (const peerId in connectionsRef.current) {
      const conn = connectionsRef.current[peerId];
      if (conn) conn.close();
    }
    connectionsRef.current = {};
    await remove(ref(database, `rooms/${roomId}/players/${playerName}`));
    const playersSnapshot = await get(ref(database, `rooms/${roomId}/players`));
    if (!playersSnapshot.exists()) {
      await remove(ref(database, `rooms/${roomId}`));
      console.log("Room deleted because it was empty");
    }
    setStatus("Disconnected");
    setRoomPlayers([]);
    setPlayerName('');
    setError('');
    if (onDisconnected) onDisconnected();
    toast({
      title: t("Successfully Disconnected"),
      description: t("You have been removed from the room"),
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isConnected) {
        await disconnect();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected]);

  const colors = useColors();
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "sm", md: "md" }}>
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent borderRadius="2xl" boxShadow="2xl" mx={2}>
        <ModalHeader
          bgGradient="linear(to-r, teal.500, green.500)"
          color="white"
          fontSize={{ base: "xl", md: "2xl" }}
          textAlign="center"
          borderTopRadius="2xl"
          py={2}
        >
          {t("Multiplayer connection")}
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={4} mt={2}>
          <VStack spacing={3} align="stretch">
            {/* Affichage des salles ouvertes */}
            <Box w="100%" p={2} bgColor={colors.filtersBg} borderRadius="md" borderWidth={2}>
              <Text fontWeight="bold" mb={1} textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                {t("Available Rooms")}
              </Text>
              {openRooms.length > 0 ? (
                <VStack spacing={1} align="stretch">
                  {openRooms.map((room) => (
                    <HStack key={room.roomId} justify="space-between" px={2} fontSize={{ base: "xs", md: "sm" }}>
                      <Text fontWeight="medium">{room.roomId}</Text>
                      <Badge colorScheme="green" fontSize={{ base: "xs", md: "sm" }}>
                        {room.playersCount} {t("players")}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text textAlign="center" fontSize={{ base: "xs", md: "sm" }}>{t("No open rooms")}</Text>
              )}
            </Box>
            {/* Entrées pour rejoindre une salle */}
            <HStack spacing={2} align="stretch">
              <VStack spacing={2} flex={1}>
                <Input
                  placeholder={t("Room ID")}
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  variant="filled"
                  size={{ base: "sm", md: "lg" }}
                  focusBorderColor="teal.500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && roomInput && playerNameInput) {
                      joinRoom();
                    }
                  }}
                />
                <Input
                  placeholder={t("Your name")}
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  variant="filled"
                  size={{ base: "sm", md: "lg" }}
                  focusBorderColor="teal.500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && roomInput && playerNameInput) {
                      joinRoom();
                    }
                  }}
                />
              </VStack>
              
              <ProfilePictureModal selectedImage={selectedImage} setSelectedImage={setSelectedImage} />
            </HStack>
            {error && (
              <Alert status="error" borderRadius="md" fontSize={{ base: "xs", md: "sm" }}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            <HStack spacing={2} pt={1} justifyContent="center">
              <Button 
                onClick={joinRoom} 
                colorScheme="teal" 
                size={{ base: "sm", md: "lg" }} 
                isDisabled={isConnected || !roomInput || !playerNameInput}
                flex={1}
              >
                {t("Join a room")}
              </Button>
              <Button 
                onClick={disconnect} 
                colorScheme="red" 
                size={{ base: "sm", md: "lg" }} 
                isDisabled={!isConnected}
                flex={1}
              >
                {t("Disconnect")}
              </Button>
            </HStack>
            <Box pt={2} textAlign="center">
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                {t("Status")} : {t(status)}
              </Text>
            </Box>
            {isConnected && (
              <Box pt={2} w="100%">
                <Text fontWeight="bold" mb={1} textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                  {t("Room players")}
                </Text>
                <HStack justify="center" spacing={1} wrap="wrap">
                  {roomPlayers.map((name) => (
                    <Badge 
                      key={name} 
                      colorScheme="green" 
                      fontSize={{ base: "xs", md: "lg" }} 
                      px={2} 
                      py={0.5}
                      m={0.5}
                    >
                      {name}
                    </Badge>
                  ))}
                </HStack>
                <Text mt={1} textAlign="center" fontSize={{ base: "sm", md: "md" }}>
                  {t("Number of players")} : {roomPlayers.length}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent="center" py={2}>
          <Button 
            onClick={onClose} 
            variant="outline" 
            colorScheme="teal" 
            size={{ base: "sm", md: "lg" }}
          >
            {t("Close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default FirebaseSignalingModal;
