// proyecto/SchoolSync/src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './sidebar'; // Asegúrate que la ruta sea correcta
import useSocket from '../hooks/useSocket';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

const RoomType = {
  CLASS: 'class',
  DIRECT: 'direct',
};

// --- AddPrivateChatModal ---
const AddPrivateChatModal = ({ isOpen, onClose, onAddChat }) => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user: currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Por favor, ingresa el email o código del alumno.'); return; }
    setIsLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/users/find-by-identifier?identifier=${encodeURIComponent(identifier.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Error buscando usuario: ${response.statusText}` }));
        throw new Error(errData.message || 'No se pudo encontrar al usuario.');
      }
      const targetUser = await response.json();
      if (!targetUser || !targetUser.id) { throw new Error('Usuario no encontrado o datos inválidos.'); }
      if (targetUser.id === currentUser.id) { throw new Error('No puedes iniciar un chat contigo mismo.'); }
      const userIds = [currentUser.id, targetUser.id].sort();
      const privateRoomId = `dm-${userIds[0]}-${userIds[1]}`;
      onAddChat({
        id: privateRoomId,
        name: `${targetUser.firstName || 'Usuario'} ${targetUser.lastName || ''}`.trim() || targetUser.email,
        type: RoomType.DIRECT,
        targetUserId: targetUser.id,
      });
      onClose(); setIdentifier('');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al intentar añadir el chat.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      
    </div>
  );
};


const ChatPage = () => {
  const { user: currentUser, token, isAuthenticated, isLoading: authLoading } = useAuth();
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
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
        const errorData = await response.json().catch(() => ({ message: `Error ${response.status} cargando historial.` }));
        throw new Error(errorData.message);
      }
      const history = await response.json();
      const processedHistory = history.map(msg => ({
        ...msg,
        senderName: String(msg.senderId) === String(currentUser?.id)
          ? ((currentUser?.firstName || currentUser?.lastName) ? `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() : currentUser?.email || 'Tú')
          : (msg.senderName || 'Usuario'),
      }));
      setMessages(processedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    } catch (err) {
      console.error(`ChatPage: Error al cargar historial de mensajes para ${roomId}:`, err);
      setMessages([]);
      setPageChatError(`Error cargando mensajes: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, currentUser]);

  const fetchUserChatLists = useCallback(async () => {
    if (!token || !currentUser?.id || !isAuthenticated) {
      setChatList([]); setCurrentRoom(null); setFetchingChats(false); return;
    }
    setFetchingChats(true); setPageChatError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP ${response.status} al obtener chats.` }));
        throw new Error(errorData.message);
      }
      const rooms = await response.json();
      const formattedRooms = rooms.map(room => ({
        id: room.id, name: room.name, type: room.type,
        originalId: room.originalId, targetUserId: room.targetUserId, unreadCount: 0,
      }));
      setChatList(formattedRooms);
    } catch (error) {
      console.error("ChatPage: Error fetching user chat rooms:", error);
      setPageChatError(`Error al cargar lista de chats: ${error.message}`);
      setChatList([]);
    } finally {
      setFetchingChats(false);
    }
  }, [token, currentUser?.id, isAuthenticated]);


  useEffect(() => {
    if (isAuthenticated && currentUser?.id && token) {
      fetchUserChatLists();
    } else {
      setChatList([]); setCurrentRoom(null); setMessages([]);
      setFetchingChats(false); setPageChatError(null);
    }
  }, [isAuthenticated, currentUser?.id, token, fetchUserChatLists]);

  const handleNewMessage = useCallback((messageFromServer) => {
    if (!currentUser?.id) {
      console.warn("[handleNewMessage] currentUser no está definido. Ignorando mensaje del socket.");
      return;
    }

    let determinedSenderName = messageFromServer.senderName;

    if (String(messageFromServer.senderId) === String(currentUser.id)) {
      if (!determinedSenderName || determinedSenderName.trim() === '' || determinedSenderName === 'Usuario') {
        determinedSenderName = (currentUser.firstName || currentUser.lastName)
          ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
          : currentUser.email || 'Tú';
      }
    } else {
      if (!determinedSenderName || determinedSenderName.trim() === '') {
        determinedSenderName = 'Usuario'; // Nombre por defecto para otros usuarios si no viene
      }
    }

    const finalMessage = {
      ...messageFromServer,
      senderName: determinedSenderName,
      isOptimistic: false, // Mensaje real del servidor
    };
    
    const isForCurrentRoom = String(finalMessage.roomId) === String(currentRoom?.id);

    if (!isForCurrentRoom) {
      setChatList(prevList => prevList.map(chat =>
        String(chat.id) === String(finalMessage.roomId)
          ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
          : chat
      ));
      return; // No añadir a 'messages' si no es para la sala actual
    }

    // Si es para la sala actual, resetea contador de no leídos
     setChatList(prevList => prevList.map(chat =>
        chat.id === finalMessage.roomId ? { ...chat, unreadCount: 0 } : chat
      ));

    setMessages(prevMessages => {
      // Lógica para reemplazar mensaje optimista si existe
      if (finalMessage.echoedTempId && String(finalMessage.senderId) === String(currentUser.id)) {
        let replaced = false;
        const updatedMessages = prevMessages.map(msg => {
          if (msg.id === finalMessage.echoedTempId) {
            replaced = true; return finalMessage;
          }
          return msg;
        });
        if (!replaced && !updatedMessages.some(m => m.id === finalMessage.id)) {
            updatedMessages.push(finalMessage); // Añadir si no se reemplazó y no existe por ID real
        }
        return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }

      // Intento de reemplazar mensajes optimistas que no usaron echoedTempId (fallback)
      if (!finalMessage.echoedTempId && String(finalMessage.senderId) === String(currentUser.id)) {
        const optimisticMsgIndex = prevMessages.findIndex(msg => 
          msg.isOptimistic && 
          msg.senderId === currentUser.id && 
          msg.content === finalMessage.content &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(finalMessage.timestamp).getTime()) < 7000 // Ventana de tiempo
        );
        if (optimisticMsgIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages.splice(optimisticMsgIndex, 1, finalMessage);
          return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
      }
      
      // Evitar duplicados si el mensaje ya existe por ID (y no es un ID optimista)
      if (prevMessages.some(msg => msg.id === finalMessage.id && !msg.id?.toString().startsWith('optimistic-'))) {
        return prevMessages;
      }
      
      return [...prevMessages, finalMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });
  }, [currentUser, currentRoom?.id]);


  useEffect(() => {
    if (socket && isConnected) {
      socket.on('newMessage', handleNewMessage);
      return () => {
        socket.off('newMessage', handleNewMessage);
      };
    }
  }, [socket, isConnected, handleNewMessage]);


  useEffect(() => {
    if (socket && isConnected && currentRoom?.id) {
      socket.emit('joinRoom', currentRoom.id);
      setMessages([]); // Limpiar mensajes al cambiar de sala antes de cargar nuevos
      fetchChatHistory(currentRoom.id);
      // Resetea contador de no leídos para la sala actual
      setChatList(prevList => prevList.map(chat =>
        chat.id === currentRoom.id ? { ...chat, unreadCount: 0 } : chat
      ));
    }
    // No es necesario 'leaveRoom' aquí, se maneja en handleSelectChat
  }, [socket, isConnected, currentRoom?.id, fetchChatHistory]);


  const handleSelectChat = (chatRoom) => {
    // Evitar recargar si es la misma sala y ya hay mensajes y no está cargando historial
    if (currentRoom?.id === chatRoom.id && messages.length > 0 && !loadingHistory) return;

    if (socket && isConnected && currentRoom?.id && currentRoom.id !== chatRoom.id) {
      socket.emit('leaveRoom', currentRoom.id);
    }
    // Resetea contador de no leídos para la sala seleccionada
    setChatList(prevList => prevList.map(chat =>
        chat.id === chatRoom.id ? { ...chat, unreadCount: 0 } : chat
      ));
    setCurrentRoom(chatRoom);
    setPageChatError(null); // Limpiar errores de página al cambiar de chat
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && isConnected && currentRoom && currentUser) {
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const optimisticSenderName = (currentUser.firstName || currentUser.lastName)
        ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
        : currentUser.email || 'Yo'; // "Yo" para mensajes optimistas del usuario actual

      const optimisticMessage = {
        id: tempId, // ID temporal único
        content: newMessage,
        timestamp: new Date().toISOString(),
        roomId: currentRoom.id,
        senderId: currentUser.id,
        senderName: optimisticSenderName, // Nombre para la UI optimista
        isOptimistic: true,
      };
      setMessages(prevMessages => [...prevMessages, optimisticMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
      
      const payload = {
        content: newMessage,
        roomId: currentRoom.id,
        roomType: currentRoom.type,
        classId: currentRoom.type === RoomType.CLASS ? currentRoom.originalId : undefined,
        tempId: tempId, 
      };
      socket.emit('message', payload);
      setNewMessage('');

      setTimeout(() => { 
      if (currentRoom?.id) { 
        fetchChatHistory(currentRoom.id);
        }
      }, 200);

    } else {
      console.warn('ChatPage: No se pudo enviar el mensaje.', { newMessage, socketIsConnected: isConnected, currentRoomExists: !!currentRoom, currentUserExists: !!currentUser });
    }
  };

  const handleAddPrivateChatToList = (newChat) => {
    if (!chatList.find(chat => chat.id === newChat.id)) {
      setChatList(prev => [newChat, ...prev].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name); // Ordenar alfabéticamente dentro del mismo tipo
        return a.type === RoomType.CLASS ? -1 : 1; // Chats de clase primero
      }));
    }
    handleSelectChat(newChat); // Seleccionar el chat recién añadido
  };

  if (authLoading) { return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-center">Cargando sesión...</div></div>; }
  if (!isAuthenticated || !currentUser) { return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-center">Por favor, inicia sesión para chatear.</div></div>; }

  const chatsClase = chatList.filter(c => c.type === RoomType.CLASS);
  const chatsDirectos = chatList.filter(c => c.type === RoomType.DIRECT);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex flex-1">
        {/* Panel de Lista de Chats */}
        <div className="w-1/3 md:w-1/4 bg-slate-900 p-4 border-r border-slate-700 overflow-y-auto flex flex-col space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-semibold text-white">Chats</h2>

          </div>

          {fetchingChats && <p className="text-gray-400 text-sm px-1">Cargando chats...</p>}
          {pageChatError && !fetchingChats && <p className="text-red-400 text-sm p-2 bg-red-900/30 rounded">{pageChatError}</p>}
          {socketError && <p className="text-orange-400 text-sm p-2 bg-orange-900/30 rounded">Error de Socket: {typeof socketError === 'string' ? socketError : JSON.stringify(socketError)}</p>}

          {!fetchingChats && chatList.length === 0 && !pageChatError && (
            <p className="text-gray-500 text-center mt-4 text-sm">No tienes chats activos.</p>
          )}

          {!fetchingChats && (
            <>
              {chatsClase.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase px-1 tracking-wider">Clases</h3>
                  <ul className="space-y-1.5">
                    {chatsClase.map(chat => {
                      const isActive = currentRoom?.id === chat.id;
                      return ( <li key={chat.id} className="list-none w-full"> <div className="relative group w-full"> <button onClick={() => handleSelectChat(chat)} title={chat.name} className={`w-full relative inline-block p-px font-semibold leading-6 text-white shadow-md cursor-pointer rounded-xl transition-transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isActive ? 'bg-indigo-600 scale-100 shadow-indigo-500/40' : 'bg-gray-800 hover:scale-[1.02] active:scale-95 shadow-zinc-900/50' }`}> <span className={`absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-px transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-75'}`}/> <span className={`relative z-10 block w-full px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'bg-indigo-600' : 'bg-gray-900 group-hover:bg-gray-800'}`}> <div className="relative z-10 flex items-center justify-between space-x-2"> <span className={`truncate transition-colors duration-300 ${isActive ? 'text-white' : 'text-white group-hover:text-teal-300'}`}>{chat.name}</span> <div className="flex items-center flex-shrink-0"> {chat.unreadCount > 0 && ( <span className={`ml-2 text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center font-bold ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span> )} <svg className={`w-5 h-5 transition-all duration-300 ease-in-out ${isActive ? 'text-white translate-x-0 opacity-100' : 'text-teal-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path clipRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" fillRule="evenodd" /> </svg> </div> </div> </span> </button> </div> </li> ); })}
                  </ul>
                </div>
              )}
              {chatsDirectos.length > 0 && (
                <div className={chatsClase.length > 0 ? "mt-3" : ""}>
                  <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase px-1 tracking-wider">Mensajes Directos</h3>
                  <ul className="space-y-1.5">
                    {chatsDirectos.map(chat => { const isActive = currentRoom?.id === chat.id; return ( <li key={chat.id} className="list-none w-full"> <div className="relative group w-full"> <button onClick={() => handleSelectChat(chat)} title={chat.name} className={`w-full relative inline-block p-px font-semibold leading-6 text-white shadow-md cursor-pointer rounded-xl transition-transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isActive ? 'bg-indigo-600 scale-100 shadow-indigo-500/40' : 'bg-gray-800 hover:scale-[1.02] active:scale-95 shadow-zinc-900/50' }`}> <span className={`absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-px transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-75'}`}/> <span className={`relative z-10 block w-full px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'bg-indigo-600' : 'bg-gray-900 group-hover:bg-gray-800'}`}> <div className="relative z-10 flex items-center justify-between space-x-2"> <span className={`truncate transition-colors duration-300 ${isActive ? 'text-white' : 'text-white group-hover:text-teal-300'}`}>{chat.name}</span> <div className="flex items-center flex-shrink-0"> {chat.unreadCount > 0 && ( <span className={`ml-2 text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center font-bold ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span> )} <svg className={`w-5 h-5 transition-all duration-300 ease-in-out ${isActive ? 'text-white translate-x-0 opacity-100' : 'text-teal-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path clipRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" fillRule="evenodd" /> </svg> </div> </div> </span> </button> </div> </li> ); })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Área de Mensajes del Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {currentRoom ? (
            <>
              <header className="bg-gray-50 p-4 border-b border-gray-300">
                <h2 className="text-lg font-semibold text-gray-800">{currentRoom.name}</h2>
              </header>
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                {loadingHistory && <p className="text-center text-gray-500">Cargando mensajes...</p>}
                {!loadingHistory && messages.length === 0 && !pageChatError && <p className="text-center text-gray-500">No hay mensajes. ¡Envía el primero!</p>}
                {!loadingHistory && pageChatError && messages.length === 0 && <p className="text-center text-red-500">{pageChatError}</p>}

                {messages.map((msg) => {
                  const isCurrentUserMessage = String(msg.senderId) === String(currentUser.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col mb-2 ${isCurrentUserMessage ? 'items-end' : 'items-start'}`}
                    >
                      {!isCurrentUserMessage && (
                        <p className="text-xs text-gray-600 mb-0.5 px-1">
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl shadow-md ${msg.isOptimistic ? 'opacity-70' : ''} ${isCurrentUserMessage ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'}`}
                      >
                        {isCurrentUserMessage && (
                          <p className="text-xs font-medium mb-0.5">
                            {msg.senderName} {/* Muestra el nombre del remitente también para el usuario actual para consistencia */}
                            {msg.isOptimistic && <span className="text-indigo-200 ml-1 text-[10px]">(Enviando...)</span>}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1.5 ${isCurrentUserMessage ? 'text-indigo-200 text-right' : 'text-slate-500 text-right'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="bg-gray-50 p-3 border-t border-gray-300">
                <div className="relative rounded-full overflow-hidden bg-white shadow-xl w-full">
                  <input
                    className="input bg-transparent outline-none border-none pl-6 pr-20 py-4 w-full font-sans text-base text-gray-700 placeholder-gray-500"
                    placeholder={currentRoom ? `Mensaje a ${currentRoom.name}...` : "Selecciona un chat"}
                    name="text" type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!currentRoom || !isConnected || loadingHistory}
                  />
                  <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                    <button
                      type="submit"
                      disabled={!socket || !isConnected || !currentRoom || !newMessage.trim() || loadingHistory}
                      className="w-14 h-14 rounded-full bg-violet-500 group shadow-xl flex items-center justify-center relative overflow-hidden hover:bg-violet-600 active:bg-violet-700 disabled:opacity-50"
                    >
                      <svg className="relative z-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="30" width="30">
                        <path fillOpacity="0.01" fill="currentColor" d="M63.6689 29.0491L34.6198 63.6685L0.00043872 34.6194L29.0496 1.67708e-05L63.6689 29.0491Z"></path>
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="3.76603" stroke="currentColor" d="M42.8496 18.7067L21.0628 44.6712"></path>
                        <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="3.76603" stroke="currentColor" d="M26.9329 20.0992L42.85 18.7067L44.2426 34.6238"></path>
                      </svg>
                      <div className="w-full h-full rotate-45 absolute left-[32%] top-[32%] bg-black group-hover:-left-[100%] group-hover:-top-[100%] duration-1000"></div>
                      <div className="w-full h-full -rotate-45 absolute -left-[32%] -top-[32%] group-hover:left-[100%] group-hover:top-[100%] duration-1000"></div>
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 justify-center items-center text-gray-500">
              <p className="text-lg">Selecciona un chat para comenzar.</p>
            </div>
          )}
        </div>
      </div>
      <AddPrivateChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddChat={handleAddPrivateChatToList} />
    </div>
  );
};

export default ChatPage;