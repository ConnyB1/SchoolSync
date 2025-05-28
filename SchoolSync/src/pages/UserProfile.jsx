import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario
import Sidebar from './sidebar'; // Asegúrate que la ruta a Sidebar es correcta
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';
// Ya no importamos Input desde '../components/Input'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

// Definimos el componente Input aquí mismo
const Input = ({ type = "text", name, id, value, onChange, placeholder, className }) => {
  const combinedClassName = `bg-[#222630] px-4 py-3 outline-none w-full text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040] ${className || ''}`;

  return (
    <input
      type={type}
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      // onFocus ya no se pasa desde aquí, se eliminó para escritura fluida
      placeholder={placeholder}
      className={combinedClassName}
    />
  );
};


const UserProfile = () => {
  const { user, token, fetchUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    pictureFile: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    if (user && !isEditing) {
      setEditData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        pictureFile: null,
      });
      setPreviewImage(user.pictureUrl || null);
    }
  }, [user, isEditing]);

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
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
    if (editData.pictureFile) formData.append('profilePicture', editData.pictureFile);
    
    let hasChanges = false;
    if (editData.pictureFile || 
        editData.firstName !== user.firstName || 
        editData.lastName !== user.lastName) {
        hasChanges = true;
    }

    if (!hasChanges) {
      setIsEditing(false);
      setLoadingEdit(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/update`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorResult.message || `Error HTTP: ${response.status}`);
      }

      await fetchUserProfile(token);
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setEditError(error.message);
    } finally {
      setLoadingEdit(false);
    }
  };

  const UserInfoDisplay = () => (
    <div className="flex items-center justify-center py-8"> 
      <div className="w-full max-w-sm rounded-lg border-2 border-indigo-500 bg-white p-6 text-center shadow-xl dark:bg-gray-800">
        <figure className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 overflow-hidden border-2 border-indigo-300">
          {user.pictureUrl ? (
            <img src={user.pictureUrl} alt={`${user.firstName} ${user.lastName}`} className="h-full w-full object-cover"/>
          ) : (
            <UserCircleIcon className="h-20 w-20 text-indigo-500 dark:text-indigo-400" />
          )}
          <figcaption className="sr-only">{`${user.firstName} ${user.lastName}`}</figcaption>
        </figure>
        <h2 className="mt-4 text-2xl font-bold text-indigo-700 dark:text-indigo-400">
          {user.firstName || ''} {user.lastName || ''}
        </h2>
        <p className="mb-1 text-gray-600 dark:text-gray-300">{user.email}</p>
        {user.roles && user.roles.length > 0 && (
          <p className="mb-4 text-sm font-semibold text-indigo-500 dark:text-indigo-300">
            {user.roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')}
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', pictureFile: null });
              setPreviewImage(user.pictureUrl || null);
              setIsEditing(true);
              setEditError(null);
            }}
            className="w-full sm:w-auto rounded-full bg-indigo-600 px-6 py-2 text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Editar Perfil
          </button>
        </div>
      </div>
    </div>
  );

  const EditProfileForm = () => (
    <div className="flex items-center justify-center py-8"> 
      <div className="w-full max-w-sm rounded-lg border-2 border-indigo-500 bg-white p-6 text-center shadow-xl dark:bg-gray-800">
        <form onSubmit={handleSubmitEdit} className="space-y-6 max-w-lg mx-auto py-8 px-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-6">Editar Perfil</h2>
          <div className="flex flex-col items-center mb-6">
            <div className="relative group w-32 h-32">
              {previewImage ? (
                <img src={previewImage} alt="Vista previa" className="w-32 h-32 rounded-full object-cover shadow-lg border-2 border-gray-300"/>
              ) : (
                <UserCircleIcon className="w-32 h-32 text-gray-400 dark:text-gray-500" />
              )}
              <label htmlFor="pictureFile" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="h-8 w-8 text-white" />
                <input id="pictureFile" name="pictureFile" type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <Input
              type="text"
              name="firstName"
              id="firstName"
              value={editData.firstName}
              onChange={handleInputChange}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
            <Input
              type="text"
              name="lastName"
              id="lastName"
              value={editData.lastName}
              onChange={handleInputChange}
              placeholder="Tu apellido"
            />
          </div>

          {editError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{editError}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { 
                setIsEditing(false); 
                setEditError(null); 
                setPreviewImage(user?.pictureUrl || null); 
                setEditData({ firstName: user?.firstName || '', lastName: user?.lastName || '', pictureFile: null });
              }}
              disabled={loadingEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {loadingEdit ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-gray-100 ">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-8">
        {isEditing ? <EditProfileForm /> : <UserInfoDisplay />}

      </main>
    </div>
  );
};

export default UserProfile;