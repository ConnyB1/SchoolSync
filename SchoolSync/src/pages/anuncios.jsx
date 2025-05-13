import React from 'react';

const AnnouncementCard = ({ title, description }) => {
  return (
    <div className="bg-white rounded-md shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
      <button className="text-indigo-500 text-sm mt-2 hover:underline">Read More</button>
    </div>
  );
};

export default AnnouncementCard;