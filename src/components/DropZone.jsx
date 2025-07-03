import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DropZone = ({ employee, children, isDropTarget, isInvalidDrop }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: employee.id,
    data: employee,
  });
  const highlight = isOver || isDropTarget;

  return (
    <div
      ref={setNodeRef}
      className={`relative group transition-all duration-200 ${highlight ? (isInvalidDrop ? 'ring-4 ring-red-400/90 scale-105 shadow-xl bg-red-100/80' : 'ring-4 ring-green-400/90 scale-105 shadow-xl bg-green-100/80') : ''} rounded-2xl shadow-lg`}
      style={{ minHeight: 0, zIndex: highlight ? 20 : 1, transition: 'box-shadow 0.18s, transform 0.18s' }}
    >
      {highlight && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${isInvalidDrop ? 'bg-red-200/90 text-red-900' : 'bg-green-200/90 text-green-900'}`}>{isInvalidDrop ? 'Invalid drop' : 'Drop here'}</span>
        </div>
      )}
      {children}
    </div>
  );
};

export default DropZone; 