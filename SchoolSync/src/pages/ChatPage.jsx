import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; //
import Sidebar from './sidebar'; //
import useSocket from '../hooks/useSocket'; // Correcto para export default
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
// SOCKET_URL ahora está dentro de useSocket.js

const RoomType = {
  CLASS: 'class',
  DIRECT: 'direct',
};

// ... (El componente AddPrivateChatModal no cambia, así que lo omito por brevedad) ...
const AddPrivateChatModal = ({ isOpen, onClose, onAddChat }) => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user: currentUser } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor, ingresa el email o código del alumno.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/users/find-by-identifier?identifier=${encodeURIComponent(identifier.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Error buscando usuario: ${response.statusText}` }));
        throw new Error(errData.message || 'No se pudo encontrar al usuario.');
      }
      const targetUser = await response.json();

      if (!targetUser || !targetUser.id) {
        throw new Error('Usuario no encontrado o datos inválidos.');
      }
      if (targetUser.id === currentUser.id) {
        throw new Error('No puedes iniciar un chat contigo mismo.');
      }

      const userIds = [currentUser.id, targetUser.id].sort();
      const privateRoomId = `dm-${userIds[0]}-${userIds[1]}`;

      onAddChat({
        id: privateRoomId,
        name: `${targetUser.firstName || 'Usuario'} ${targetUser.lastName || ''}`.trim() || targetUser.email,
        type: RoomType.DIRECT,
        targetUserId: targetUser.id,
      });
      onClose();
      setIdentifier('');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al intentar añadir el chat.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Iniciar Chat Privado</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="studentIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
              Email o Código del Alumno
            </label>
            <input
              id="studentIdentifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ingresa identificador..."
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50">
              {isLoading ? 'Buscando...' : 'Iniciar Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ChatPage = () => {
  const { user: currentUser, token, isAuthenticated, isLoading: authLoading } = useAuth(); //
  
  // Llama a useSocket UNA SOLA VEZ y desestructura lo que necesitas:
  const { socket, isConnected, socketError } = useSocket(token, isAuthenticated); 

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(true);
  const [pageChatError, setPageChatError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = useCallback(async (roomId) => {
    if (!roomId || !token) return;
    setLoadingHistory(true);
    setPageChatError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status} cargando historial.`);
      }
      const history = await response.json();
      setMessages(history.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        roomId: msg.roomId,
        senderId: msg.senderId,
        senderName: msg.senderName,
      })));
    } catch (err) {
      console.error('Error al cargar historial de mensajes:', err);
      setMessages([]);
      setPageChatError(`Error cargando mensajes: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    if (!socket || !isConnected) { 
      return;
    }

    console.log("ChatPage: Socket conectado y listo para listeners (socket.id):", socket.id);

    const handleNewMessage = (message) => {
      console.log('ChatPage: Mensaje nuevo recibido:', message);
      if (message.roomId === currentRoom?.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      } else {
        console.log(`ChatPage: Mensaje para otra sala (${message.roomId}):`, message);
        setChatList(prevList => prevList.map(chat => 
            chat.id === message.roomId 
            ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 } 
            : chat
        ));
      }
    };

    const handleJoinedRoom = (roomId) => { // El backend debe emitir roomId como string o { roomId: string }
      const roomIdentifier = typeof roomId === 'object' ? roomId.roomId : roomId;
      console.log(`ChatPage: Confirmación de unión a sala: ${roomIdentifier}`);
    };
    
    const handleLeftRoom = (roomId) => { // Similar para leftRoom
      const roomIdentifier = typeof roomId === 'object' ? roomId.roomId : roomId;
      console.log(`ChatPage: Confirmación de salida de sala: ${roomIdentifier}`);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('leftRoom', handleLeftRoom);

    return () => {
      console.log("ChatPage: Limpiando listeners de socket (socket.id):", socket.id);
      socket.off('newMessage', handleNewMessage);
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('leftRoom', handleLeftRoom);
    };
  }, [socket, isConnected, currentRoom?.id]);


  useEffect(() => {
    if (socket && isConnected && currentRoom?.id) {
      console.log(`ChatPage: Intentando unirse a sala: ${currentRoom.id}, tipo: ${currentRoom.type} (socket.id: ${socket.id})`);
      socket.emit('joinRoom', currentRoom.id);
      setMessages([]); 
      fetchChatHistory(currentRoom.id);
    }
  }, [socket, isConnected, currentRoom?.id, fetchChatHistory]);

  const fetchUserChatLists = useCallback(async () => {
    if (!token || !currentUser || !isAuthenticated) return;
    setFetchingChats(true);
    setPageChatError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${response.status} al obtener chats.`);
      }
      const rooms = await response.json();
      const formattedRooms = rooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type, 
        originalId: room.originalId,
        targetUserId: room.targetUserId,
        unreadCount: 0, 
      }));
      setChatList(formattedRooms);

      if (!currentRoom && formattedRooms.length > 0) {
        setCurrentRoom(formattedRooms[0]);
      } else if (currentRoom && !formattedRooms.find(r => r.id === currentRoom.id)) {
        setCurrentRoom(formattedRooms.length > 0 ? formattedRooms[0] : null);
      } else if (formattedRooms.length === 0) {
        setCurrentRoom(null);
      }
    } catch (error) {
      console.error("Error fetching user chat rooms:", error);
      setPageChatError(`Error al cargar chats: ${error.message}`);
      setChatList([]);
    } finally {
      setFetchingChats(false);
    }
  }, [token, currentUser, isAuthenticated, currentRoom]); 

  useEffect(() => {
    if (isAuthenticated && currentUser && token) {
      fetchUserChatLists();
    } else {
      setChatList([]);
      setCurrentRoom(null);
      setMessages([]);
      setFetchingChats(false);
      setPageChatError(null);
    }
  }, [isAuthenticated, currentUser, token, fetchUserChatLists]);

  const handleSelectChat = (chatRoom) => {
    if (currentRoom?.id === chatRoom.id) return;

    if (socket && isConnected && currentRoom?.id) {
      console.log(`ChatPage: Dejando sala anterior: ${currentRoom.id} (socket.id: ${socket.id})`);
      socket.emit('leaveRoom', currentRoom.id);
    }
    setChatList(prevList => prevList.map(chat => 
        chat.id === chatRoom.id ? { ...chat, unreadCount: 0 } : chat
    ));
    setCurrentRoom(chatRoom);
    setPageChatError(null); 
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && isConnected && currentRoom && currentUser) {
      const payload = {
        content: newMessage,
        roomId: currentRoom.id,
        roomType: currentRoom.type, 
        classId: currentRoom.type === RoomType.CLASS ? currentRoom.originalId : undefined,
      };
      console.log('ChatPage: Enviando mensaje:', payload, `(socket.id: ${socket.id})`);
      console.log('Enviando mensaje desde cliente. Payload:', JSON.stringify(payload));
      socket.emit('message', payload);
      setNewMessage('');
    } else {
      console.warn('ChatPage: No se pudo enviar el mensaje. Condiciones:', {
        msg: newMessage.trim(), socketExists: !!socket, isConnected, currentRoom, currentUser,
      });
    }
  };

  const handleAddPrivateChatToList = (newChat) => {
    if (!chatList.find(chat => chat.id === newChat.id)) {
      setChatList(prev => [newChat, ...prev].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === RoomType.CLASS ? -1 : 1; 
      }));
    }
    handleSelectChat(newChat);
  };

  if (authLoading) {
    return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-center">Cargando sesión...</div></div>; 
  }
  if (!isAuthenticated || !currentUser) {
    return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-center">Por favor, inicia sesión para chatear.</div></div>; 
  }

  // El resto del JSX de ChatPage no cambia, lo omito por brevedad, pero debe estar aquí.
  // Solo me aseguro que la lógica de arriba esté integrada.
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar /> {/* */}
      <div className="flex flex-1">
        <div className="w-1/3 md:w-1/4 bg-gray-200 p-4 border-r border-gray-300 overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
            <button onClick={() => setIsModalOpen(true)} className="p-2 text-indigo-600 hover:text-indigo-800" title="Iniciar nuevo chat privado">
              <UserPlusIcon className="h-6 w-6" />
            </button>
          </div>

          {fetchingChats && <p className="text-gray-600">Cargando lista de chats...</p>}
          {pageChatError && !fetchingChats && <p className="text-red-500 text-sm p-2 bg-red-100 rounded">{pageChatError}</p>}
          {socketError && <p className="text-orange-500 text-sm p-2 bg-orange-100 rounded">Error de Socket: {socketError}</p>}


          {!fetchingChats && !pageChatError && chatList.length === 0 && (
            <p className="text-gray-500 text-center mt-4">No tienes chats activos.</p> 
          )}

          {!fetchingChats && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Clases</h3>
                {chatList.filter(c => c.type === RoomType.CLASS).length === 0 && <p className="text-xs text-gray-500 italic">No hay chats de clase.</p>} {/* */}
                <ul>
                  {chatList.filter(c => c.type === RoomType.CLASS).map(chat => (
                    <li key={chat.id} onClick={() => handleSelectChat(chat)}
                      className={`p-3 rounded-md cursor-pointer truncate relative ${currentRoom?.id === chat.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-300'}`}>
                      {chat.name}
                      {chat.unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unreadCount}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Mensajes Directos</h3>
                {chatList.filter(c => c.type === RoomType.DIRECT).length === 0 && <p className="text-xs text-gray-500 italic">No hay mensajes directos.</p>} {/* */}
                <ul>
                  {chatList.filter(c => c.type === RoomType.DIRECT).map(chat => (
                    <li key={chat.id} onClick={() => handleSelectChat(chat)}
                      className={`p-3 rounded-md cursor-pointer truncate relative ${currentRoom?.id === chat.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-300'}`}>
                      {chat.name}
                       {chat.unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unreadCount}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {currentRoom ? (
            <>
              <header className="bg-gray-50 p-4 border-b border-gray-300">
                <h2 className="text-lg font-semibold text-gray-800">{currentRoom.name}</h2>
              </header>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {loadingHistory && <p className="text-center text-gray-500">Cargando mensajes...</p>} {/* */}
                {!loadingHistory && messages.length === 0 && <p className="text-center text-gray-500">No hay mensajes. ¡Envía el primero!</p>} {/* */}
                {messages.map((msg) => (
                  <div key={msg.id || msg.timestamp} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}> {/* */}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-gray-300 text-black'}`}> {/* */}
                      <p className="text-sm font-semibold">{msg.senderName || 'Usuario'}</p> {/* */}
                      <p>{msg.content}</p> {/* */}
                      <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-indigo-100' : 'text-gray-500'}`}> {/* */}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="bg-gray-50 p-4 border-t border-gray-300"> {/* */}
                <div className="flex items-center">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Mensaje a ${currentRoom.name}...`}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button type="submit" disabled={!socket || !isConnected || !currentRoom || !newMessage.trim() || loadingHistory}
                    className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    Enviar
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 justify-center items-center text-gray-500">
              <p className="text-lg">Selecciona un chat para comenzar.</p> {/* */}
            </div>
          )}
        </div>
      </div>
      <AddPrivateChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddChat={handleAddPrivateChatToList} /> {/* */}
    </div>
  );
};

export default ChatPage;