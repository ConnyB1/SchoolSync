// src/hooks/useSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function useSocket(token, isAuthenticated) {
  const [socket, setSocket] = useState(null); // El estado que se expone al componente
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const socketRef = useRef(null); // Para la instancia real del socket

  // Función estable para desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("Socket Hook: disconnect() llamado. Desconectando socket:", socketRef.current.id);
      // Quitar todos los listeners para evitar fugas de memoria si se reutiliza la ref incorrectamente
      socketRef.current.off('connect');
      socketRef.current.off('authenticated');
      socketRef.current.off('disconnect');
      socketRef.current.off('connect_error');
      socketRef.current.off('error'); // Limpiar también errores de aplicación
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null); // Limpiar el estado expuesto
    setIsConnected(false);
    // setSocketError(null); // Opcional: limpiar errores al desconectar
  }, []); // Sin dependencias, por lo que esta función es estable

  // Función estable para conectar
  const connect = useCallback(() => {
    // Si ya hay una conexión activa en la ref, no hacer nada o asegurarse que el estado esté sincronizado.
    if (socketRef.current && socketRef.current.connected) {
      console.log("Socket Hook: connect() llamado, pero ya hay un socket conectado:", socketRef.current.id);
      if (socket !== socketRef.current) setSocket(socketRef.current); // Sincronizar estado si es diferente
      if (!isConnected) setIsConnected(true);
      return;
    }

    // Si hay una ref pero no está conectada, o si no hay ref, proceder a conectar.
    // Primero, limpiar cualquier instancia anterior para evitar duplicados.
    if (socketRef.current) {
        console.log("Socket Hook: connect() llamado, limpiando instancia previa de socketRef.");
        disconnect(); // Usa la función estable de desconexión
    }

    console.log("Socket Hook: connect() creando nueva instancia de socket para:", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 3, // Reducir para pruebas, luego ajustar
      reconnectionDelay: 2000,
      // transports: ['websocket'], // Puedes forzar websocket si el polling causa problemas
    });

    newSocket.on('connect', () => {
      console.log('Socket Hook: Evento "connect" recibido. ID:', newSocket.id);
      socketRef.current = newSocket; // Asignar a la ref
      setSocket(newSocket);         // Actualizar el estado
      setIsConnected(true);
      setSocketError(null);
    });

    newSocket.on('authenticated', () => {
      console.log('Socket Hook: Evento "authenticated" recibido para socket:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket Hook: Evento "disconnect" recibido. Socket ID (si aún existe):', newSocket.id, 'Razón:', reason);
      setIsConnected(false);
      // No setear socketRef.current a null aquí si la librería maneja reconexión,
      // a menos que la razón sea 'io server disconnect' (desconexión explícita del servidor).
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log("Socket Hook: Desconexión explícita o por el cliente, limpiando ref.");
        // Llamar a disconnect() aquí podría causar un bucle si token/isAuthenticated no cambian.
        // Es mejor que el useEffect principal maneje la decisión de reconectar.
        // Solo actualizamos el estado.
        setSocket(null);
        socketRef.current = null;
      }
      // Si no es una desconexión explícita, la librería intentará reconectar.
      // Podrías querer mostrar un estado de "reconectando..."
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket Hook: Evento "connect_error". Error:', err.message);
      setSocketError(`Error de conexión: ${err.message}`);
      setIsConnected(false);
      // No limpiar socketRef ni setSocket(null) aquí para permitir reintentos automáticos de la librería.
    });

    newSocket.on('error', (errorData) => { // Errores de aplicación emitidos por el servidor
      console.error('Socket Hook: Evento "error" (app error). Data:', errorData);
      const message = typeof errorData === 'string' ? errorData : errorData.message || 'Error desconocido del servidor';
      setSocketError(message);
      // Si es un error de autenticación fatal, el servidor ya debería haber desconectado.
    });

  }, [token, disconnect, socket, isConnected]);

  useEffect(() => {
    console.log("Socket Hook: useEffect principal. Authenticated:", isAuthenticated, "Token:", !!token);
    if (isAuthenticated && token) {
      if (!socketRef.current || !socketRef.current.connected) {
         console.log("Socket Hook: useEffect -> Llamando a connect()");
         connect();
      } else {
         console.log("Socket Hook: useEffect -> Ya hay un socket conectado en ref, no se llama a connect(). ID:", socketRef.current.id);
         if (socket !== socketRef.current) setSocket(socketRef.current);
         if (!isConnected) setIsConnected(true);
      }
    } else {
      console.log("Socket Hook: useEffect -> No autenticado o sin token. Llamando a disconnect().");
      disconnect();
    }

    return () => {
      console.log("Socket Hook: Limpieza del useEffect principal (desmontaje o cambio de deps).");
    };
  }, [token, isAuthenticated, connect, disconnect, socket, isConnected]); // Aseguramos dependencias estables

  return { socket, isConnected, socketError };
}