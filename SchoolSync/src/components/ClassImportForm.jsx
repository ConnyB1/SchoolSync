// proyecto/SchoolSync/src/components/ClassImportForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const ClassImportForm = ({ onClose, onImportSuccess }) => {
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo Excel (.xlsx).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/classes/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' is handled automatically by browser for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al importar clases.' }));
        throw new Error(errorData.message || `Error al importar clases: ${response.status}`);
      }

      const result = await response.json();
      setSuccessMessage(result.message || 'Clases importadas exitosamente.');
      setSelectedFile(null); // Clear selected file
      onImportSuccess(); // Callback to refresh class list in parent
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Importar Clases desde Excel</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="excelFile" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo .xlsx
            </label>
            <input
              type="file"
              id="excelFile"
              accept=".xlsx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
            {selectedFile && <p className="mt-2 text-sm text-gray-500">Archivo seleccionado: {selectedFile.name}</p>}
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {successMessage && <p className="text-green-600 text-sm text-center">{successMessage}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none disabled:opacity-50"
              disabled={loading}
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading || !selectedFile}
            >
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassImportForm;