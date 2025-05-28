// src/components/Input.jsx
import React from 'react';

const Input = ({ type = "text", name, id, value, onChange, onFocus, placeholder, className }) => {
  const combinedClassName = `bg-[#222630] px-4 py-3 outline-none w-full text-white rounded-lg border-2 transition-colors duration-100 border-solid focus:border-[#596A95] border-[#2B3040] ${className || ''}`;

  return (
    <input
      type={type}
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      onFocus={onFocus} // Se pasa la prop onFocus, si es undefined, no hace nada
      placeholder={placeholder}
      className={combinedClassName}
    />
  );
}

export default Input;