import React from 'react';

// interface AnnouncementCardProps {
//   title: string;
//   description: string;
//   // buttonText y onButtonClick ya no son necesarios si quitamos el botón
// }

const AnnouncementCard = ({
  title = "Encabezado Increíble", // Valor por defecto
  description = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero dolorum blanditiis pariatur sequi magni.", // Valor por defecto
  // buttonText y onButtonClick eliminados de las props ya que el botón se va
}) => {
  return (
    <div
      // CAMBIOS: w-full para ocupar el ancho, se mantiene h-[18em] (considera las descripciones largas)
      className="relative w-full h-[18em] border-2 border-[rgba(75,30,133,0.5)] rounded-[1.5em] bg-gradient-to-br from-[#3678bb] via-blue-700/80 to-[rgb(12,25,112)] text-white font-nunito p-[1.5em] flex justify-center items-start flex-col gap-[1em] backdrop-blur-[12px] hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 group/card hover:-translate-y-1"
    >
      {/* Efecto de superposición al hacer hover */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-fuchsia-500/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-[1.5em]"
      ></div>
      {/* Efecto de pulso radial */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,50,190,0.1),transparent_60%)] group-hover/card:animate-pulse"
      ></div>

      {/* Puntos decorativos en la esquina superior derecha */}
      <div className="absolute top-4 right-4 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-300/50"></div>
        <div className="w-2 h-2 rounded-full bg-purple-300/30"></div>
        <div className="w-2 h-2 rounded-full bg-purple-300/10"></div>
      </div>

      {/* Contenido principal de la tarjeta */}
      <div
        className="relative z-10 transition-transform duration-300 group-hover/card:translate-y-[-2px] space-y-3 w-full" // Añadido w-full aquí también por si acaso
      >
        <h1
          className="text-[2.2em] font-bold bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent"
        >
          {title}
        </h1>
        <p className="text-[0.9em] text-purple-100/90 leading-relaxed font-light">
          {description}
          {/* NOTA: Con una altura fija de tarjeta (h-[18em]) y sin botón "Leer más",
              las descripciones muy largas podrían cortarse o desbordarse.
              Considera ajustar la altura de la tarjeta o manejar el desbordamiento del texto de descripción.
              Por ejemplo, podrías añadir a esta <p>: max-h-[8em] overflow-y-auto para scroll interno en la descripción
              o una clase para truncar texto si prefieres. */}
        </p>
      </div>

      {/* BOTÓN ELIMINADO */}
      {/* Ya no se renderiza el botón <button>...</button> */}

      {/* Efecto de pulso decorativo en la esquina inferior izquierda */}
      <div
        className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-sm group-hover/card:animate-pulse"
      ></div>
    </div>
  );
};

export default AnnouncementCard;