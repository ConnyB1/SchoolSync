import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './sidebar';
import { UserCircleIcon, PencilSquareIcon, CameraIcon } from '@heroicons/react/24/outline'; // O solid

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:300/api';

const UserProfile = () => {
  const { user, token, fetchUserProfile } = useAuth(); // fetchUserProfile para actualizar después de editar
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    description: user?.description || '', // Asume que tienes un campo description
    pictureFile: null,
  });
  const [previewImage, setPreviewImage] = useState(user?.pictureUrl || null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8 text-center">Cargando perfil...</div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditData(prev => ({ ...prev, pictureFile: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setLoadingEdit(true);
    setEditError(null);

    const formData = new FormData();
    if (editData.firstName !== user.firstName) formData.append('firstName', editData.firstName);
    if (editData.lastName !== user.lastName) formData.append('lastName', editData.lastName);
    // Asume que tienes un campo 'description' en tu entidad User y DTO de actualización
    // if (editData.description !== (user.description || '')) formData.append('description', editData.description);
    if (editData.pictureFile) formData.append('profilePicture', editData.pictureFile);


    // Solo envía los campos que han cambiado o la imagen si se seleccionó una nueva
    let hasChanges = false;
    for (const entry of formData.entries()) {
        if (entry[1] !== undefined) { // FormData convierte null o undefined en string "undefined"
            hasChanges = true;
            break;
        }
    }
    
    if (!hasChanges) {
        setIsEditing(false);
        setLoadingEdit(false);
        return;
    }


    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile/update`, { // Endpoint de ejemplo
        method: 'PATCH', // o PUT
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type' será establecido automáticamente por el navegador para FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}`}));
        throw new Error(errorResult.message || `Error HTTP: ${response.status}`);
      }

      await fetchUserProfile(token); // Refrescar datos del usuario en el contexto
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setEditError(error.message);
    } finally {
      setLoadingEdit(false);
    }
  };


  const UserInfoDisplay = () => (
    <div className="text-center">
      {user.pictureUrl ? (
        <img
          src={user.pictureUrl}
          alt="Perfil"
          className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
        />
      ) : (
        <UserCircleIcon className="w-32 h-32 text-gray-400 mx-auto mb-4" />
      )}
      <h1 className="text-3xl font-bold text-gray-800">
        {user.firstName || ''} {user.lastName || ''}
      </h1>
      <p className="text-gray-600 mt-1">{user.email}</p>
      <p className="text-sm text-indigo-600 font-semibold mt-1">{user.roles?.join(', ')}</p>
      {/* Asume que tienes un campo description en tu entidad User */}
      {/* <p className="mt-4 text-gray-700 max-w-md mx-auto">{user.description || 'Sin descripción.'}</p> */}
      
      <div className="mt-6 space-x-3">
        <button
          onClick={() => {
            setEditData({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              // description: user.description || '',
              pictureFile: null,
            });
            setPreviewImage(user.pictureUrl || null);
            setIsEditing(true);
            setEditError(null);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors"
        >
          Editar Perfil
        </button>
        {/* <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md shadow-md transition-colors">
          Cambiar Contraseña
        </button> */}
      </div>
    </div>
  );

  const EditProfileForm = () => (
    <form onSubmit={handleSubmitEdit} className="space-y-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Editar Perfil</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="relative group w-32 h-32">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Vista previa"
              className="w-32 h-32 rounded-full object-cover shadow-lg"
            />
          ) : (
            <UserCircleIcon className="w-32 h-32 text-gray-400" />
          )}
          <label
            htmlFor="pictureFile"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <CameraIcon className="h-8 w-8 text-white" />
            <input
              id="pictureFile"
              name="pictureFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          name="firstName"
          id="firstName"
          value={editData.firstName}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido</label>
        <input
          type="text"
          name="lastName"
          id="lastName"
          value={editData.lastName}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      {/* <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          name="description"
          id="description"
          rows="3"
          value={editData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div> */}

      {editError && <p className="text-sm text-red-600 text-center">{editError}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => { setIsEditing(false); setEditError(null); setPreviewImage(user?.pictureUrl || null);}}
          disabled={loadingEdit}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
        >
          {loadingEdit ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );


  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-10">
          {isEditing ? <EditProfileForm /> : <UserInfoDisplay />}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;