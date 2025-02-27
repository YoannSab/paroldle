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
} from '@chakra-ui/react';
import { ref, set, get, onChildAdded, onChildRemoved, remove } from "firebase/database";
import { database } from '../firebase';
import { useToast } from "@chakra-ui/react";
import Peer from 'peerjs';

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
  setPlayerSenders,
}) => {
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('Entrez un identifiant de salle et un nom');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  // Références pour PeerJS et connexions
  const peerRef = useRef(null);
  const connectionsRef = useRef({}); // { remotePeerId: DataConnection }
  const [myPeerId, setMyPeerId] = useState(null);
  // Ref pour toujours obtenir le playerName courant
  const playerNameRef = useRef(playerName);
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);
  
  // Pour associer un peerId à un nom (issu de Firebase)
  const playersMappingRef = useRef({});

  useEffect(() => {
    setIsConnected(status.startsWith('Connecté'));
  }, [status]);

  // Création du PeerJS dès le montage
  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => {
      console.log('Mon peer ID est:', id);
      setMyPeerId(id);
    });
    // Gestion des connexions entrantes
    peer.on('connection', (conn) => {
      console.log('Connexion entrante de:', conn.peer);
      // Si on a déjà une connexion avec ce peer, on ferme celle-ci
      if (connectionsRef.current[conn.peer]) {
        console.log(`Connexion déjà existante avec ${conn.peer}, fermeture de la nouvelle.`);
        conn.close();
        return;
      }
      // Utiliser le mapping pour retrouver le nom distant
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

  // Mise en place d'une connexion (entrant ou sortant)
  const setupDataConnection = (conn) => {
    conn.on('open', () => {
      console.log(`Data connection avec ${conn.peer} ouverte`);
      checkIfAnyConnected();
    });
    conn.on('data', (data) => {
      console.log(`Message reçu de ${conn.peer}:`, data);
      if (data && data.type === 'game_data' && onMessage) onMessage(data);
    });
    conn.on('error', (err) => {
      console.error(`Erreur sur la connexion avec ${conn.peer}:`, err);
    });
    conn.on('close', () => {
      console.log(`Connexion fermée avec ${conn.peer}`);
      delete connectionsRef.current[conn.peer];
      checkIfAnyConnected();
    });
  };

  // Rejoindre la salle en vérifiant que le nom n'est pas déjà pris,
  // puis en enregistrant notre présence dans Firebase avec notre peerId
  const joinRoom = async () => {
    if (!roomId || !playerName) {
      setError("Veuillez saisir un identifiant de salle et un nom");
      return;
    }
    if (!myPeerId) {
      setError("En attente de l'initialisation du Peer...");
      return;
    }
    const playersSnapshot = await get(ref(database, `rooms/${roomId}/players`));
    if (playersSnapshot.exists()) {
      const playersData = playersSnapshot.val();
      const isNameTaken = Object.values(playersData).some((player) => player.name === playerName);
      if (isNameTaken) {
        setError("Ce nom est déjà utilisé dans la salle. Veuillez en choisir un autre.");
        return;
      }
    }
    // Enregistrer notre présence avec notre nom et notre peerId
    await set(ref(database, `rooms/${roomId}/players/${playerName}`), { name: playerName, peerId: myPeerId });
    setStatus("Connecté à la salle. En attente d'autres joueurs...");
    setError('');

    // Écouter l'arrivée de nouveaux joueurs via Firebase
    const playersRef = ref(database, `rooms/${roomId}/players`);
    onChildAdded(playersRef, (snapshot) => {
      const remoteName = snapshot.key;
      const remoteData = snapshot.val();
      if (remoteName === playerName) return;
      if (remoteData && remoteData.peerId) {
        // Stocker le mapping peerId -> nom
        playersMappingRef.current[remoteData.peerId] = remoteName;
        console.log(`Nouveau joueur détecté: ${remoteName} avec peerId ${remoteData.peerId}`);
        // Règle : seul le pair dont l'ID est inférieur initie la connexion
        if (myPeerId && myPeerId < remoteData.peerId) {
          if (!connectionsRef.current[remoteData.peerId]) {
            const conn = peerRef.current.connect(remoteData.peerId);
            conn.remoteName = remoteName;
            connectionsRef.current[remoteData.peerId] = conn;
            setupDataConnection(conn);
          }
        }
      }
      // Mettre à jour la liste des joueurs
      setRoomPlayers((prev) => {
        if (!prev.includes(remoteName)) return [...prev, remoteName];
        return prev;
      });
    });

    // Écouter les déconnexions
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
      setRoomPlayers((prev) => prev.filter((name) => name !== remoteName));
    });

    // Charger la liste initiale des joueurs
    if (playersSnapshot.exists()) {
      const initialPlayers = Object.keys(playersSnapshot.val());
      setRoomPlayers(initialPlayers);
    }
  };

  // Déconnexion : fermer toutes les connexions PeerJS et supprimer notre entrée Firebase
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
      console.log("Salle supprimée car vide");
    }
    setStatus("Déconnecté");
    setRoomPlayers([]);
    setPlayerName('');
    setError('');
    if (onDisconnected) onDisconnected();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de la salle.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  // Construire la table des fonctions d'envoi à partir des connexions ouvertes
  const checkIfAnyConnected = () => {
    const openConnections = Object.values(connectionsRef.current).filter(conn => conn.open);
    if (openConnections.length > 0) {
      const senders = {};
      openConnections.forEach(conn => {
        if (conn.remoteName) {
          senders[conn.remoteName] = (msg) => {
            conn.send({ type: 'game_data', text: msg, sender: playerNameRef.current });
          };
        }
      });
      setPlayerSenders(senders);
      if (onConnected) {
        const broadcast = (msg) => {
          openConnections.forEach(conn => {
            conn.send({ type: 'game_data', text: msg, sender: playerNameRef.current });
          });
        };
        onConnected(broadcast);
      }
    }
  };

  // Déconnexion lors de la fermeture ou du rechargement de la page
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Connexion Multi-Peer avec PeerJS</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Identifiant de salle"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            mb={4}
          />
          <Input
            placeholder="Votre nom"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            mb={4}
          />
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}
          <Button onClick={joinRoom} colorScheme="blue" mr={2}>
            Rejoindre la salle
          </Button>
          <Button onClick={disconnect} colorScheme="red" isDisabled={!isConnected}>
            Déconnexion
          </Button>
          <Text mt={4}>Statut : {status}</Text>
          {isConnected && (
            <VStack mt={4} align="start">
              <Text fontWeight="bold">Joueurs dans la salle :</Text>
              <HStack spacing={2}>
                {roomPlayers.map((name) => (
                  <Badge key={name} colorScheme="green">
                    {name}
                  </Badge>
                ))}
              </HStack>
              <Text>Nombre de joueurs : {roomPlayers.length}</Text>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Fermer</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FirebaseSignalingModal;
