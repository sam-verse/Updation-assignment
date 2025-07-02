import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Edit2, Trash2, User, Users, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import useStore from '../store/useStore';

const EmployeeCard = ({ employee, variant = 'org-chart', dragOverlay = false, onEdit, onDelete }) => {
  const { employees, setDraggedEmployee, handTool } = useStore();
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const touchStartTime = useRef(0);
  const touchTimer = useRef(null);
  const cardRef = useRef(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: employee.id,
    data: employee,
  });

  // Combine refs for the drag handle
  const setRefs = (element) => {
    setNodeRef(element);
    cardRef.current = element;
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleDragStart = () => {
    setDraggedEmployee(employee);
    setIsPressed(false);
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    touchStartTime.current = Date.now();
    setIsPressed(true);
    
    // Long press to start dragging
    touchTimer.current = setTimeout(() => {
      if (!handTool) {
        setDraggedEmployee(employee);
      }
    }, 300); // 300ms delay for long press
  };

  const handleTouchMove = () => {
    // If we've moved, clear the long press timer
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - touchStartTime.current;
    
    // Clear any pending long press
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
    
    // If it was a short press, toggle actions on mobile
    if (touchDuration < 300) {
      if (window.innerWidth < 768) { // Mobile view
        e.stopPropagation();
        setShowActions(!showActions);
      }
    }
    
    setIsPressed(false);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (touchTimer.current) {
        clearTimeout(touchTimer.current);
      }
    };
  }, []);

  const cardClasses = variant === 'sidebar'
    ? `w-full p-3 rounded-xl border ${isPressed ? 'border-orange-500 scale-95' : 'border-primary'} bg-gradient-to-br from-[#fff5e0] via-[#ffeaba] to-[#ffd18c] text-black transition-all duration-200 ${!handTool ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} shadow-md touch-none`
    : `min-w-72 p-4 rounded-2xl border-2 ${isPressed ? 'border-orange-500 scale-95' : 'border-primary'} bg-gradient-to-br from-[#fff5e0] via-[#ffeaba] to-[#ffd18c] text-black shadow-2xl backdrop-blur-md ${!handTool ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} transition-all duration-300 touch-none`;

  // Only enable drag if handTool is not active
  const enableDnD = !handTool;

  // CardContent: shared card UI for all states
  function CardContent({ employee, variant, isDragging, dragOverlay }) {
    return (
      <div className="flex items-start gap-3 w-full">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={employee.avatar}
            alt={employee.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=ffffff&size=48`;
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between w-full">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate text-black">{employee.name}</h3>
              <p className="text-xs truncate text-black">{employee.designation}</p>
              <p className="text-xs truncate text-black">{employee.team}</p>
            </div>
            {/* Action Buttons (not shown in overlay/placeholder) - Show on hover */}
            {!dragOverlay && !isDragging && (
              <div 
                className={`flex gap-1 ${variant === 'sidebar' ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(employee);
                  }}
                  className="p-1.5 rounded-md bg-primary-dark text-white border border-primary hover:bg-primary transition-colors"
                  title="Edit Employee"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(employee);
                  }}
                  className="p-1.5 rounded-md bg-red-500 text-white border border-red-600 hover:bg-red-600 transition-colors"
                  title="Delete Employee"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
          {/* Contact Info (only in org-chart variant) */}
          {variant === 'org-chart' && !dragOverlay && !isDragging && (
            <div className="mt-3 flex items-center justify-center">
              <div className="flex flex-row items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md border border-orange-300">
                <Users size={11} className="opacity-90" />
                <span className="text-xs font-semibold tracking-wide flex items-center gap-1">
                  {employees.filter(emp => emp.managerId === employee.id).length}
                  <span className="ml-0.5 opacity-90">reports</span>
                </span>
                  </div>
                </div>
              )}
            </div>
          </div>
    );
  }

  return (
    <>
      {isDragging && !dragOverlay ? (
        <motion.div
          style={{ minWidth: '18rem', height: '9rem', opacity: 0.8, filter: 'blur(1.2px)', borderStyle: 'dashed', borderWidth: 2, borderColor: '#f59e42', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
          className={`${cardClasses} border-dashed pointer-events-none`}
          animate={{ opacity: 0.7 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        >
          <CardContent employee={employee} variant={variant} isDragging={isDragging} dragOverlay={dragOverlay} />
        </motion.div>
      ) : dragOverlay ? (
        <motion.div
          style={{
            ...style,
            minWidth: '18rem',
            height: '7.5rem',
            pointerEvents: 'none',
            zIndex: 9999,
            background: 'linear-gradient(120deg, #fffbe6 60%, #ffe0b2 100%)',
            border: '2.5px solid #f59e42',
            borderRadius: '1.25rem',
            boxShadow: '0 12px 36px 0 rgba(245,158,66,0.22), 0 2px 12px 0 rgba(245,158,66,0.10)',
            transition: 'box-shadow 0.2s, border 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          }}
          animate={{ scale: 1.04, opacity: 1 }}
          initial={{ scale: 1, opacity: 0.92 }}
          exit={{ scale: 1, opacity: 0.7 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className={`${cardClasses} pointer-events-none`}
          layout
        >
          <div className="flex items-center w-full h-full gap-4 ml-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=ffffff&size=48`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            {/* Content */}
            <div className="flex flex-col justify-center min-w-0 flex-1 pl-2">
              <h3 className="font-semibold text-sm truncate text-black">{employee.name}</h3>
              <p className="text-xs truncate text-black">{employee.designation}</p>
              <p className="text-xs truncate text-black">{employee.team}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          ref={setRefs}
          style={{ ...style, ...(dragOverlay ? { opacity: 1 } : {}), pointerEvents: enableDnD ? 'auto' : 'none' }}
          {...(enableDnD ? { ...listeners, ...attributes } : {})}
          onDragStart={enableDnD ? handleDragStart : undefined}
          onTouchStart={enableDnD ? handleTouchStart : undefined}
          onTouchMove={enableDnD ? handleTouchMove : undefined}
          onTouchEnd={enableDnD ? handleTouchEnd : undefined}
          whileHover={!dragOverlay && enableDnD ? { 
            scale: 1.04, 
            boxShadow: '0 8px 32px 0 rgba(34,139,230,0.15)', 
            zIndex: 2 
          } : undefined}
          whileTap={!dragOverlay && enableDnD ? { scale: 0.98 } : undefined}
          animate={{
            scale: dragOverlay ? 1 : isDragging ? 0.98 : 1,
            boxShadow: dragOverlay 
              ? '0 12px 36px 0 rgba(245,158,66,0.22)' 
              : isDragging 
                ? '0 4px 24px 0 rgba(245,158,66,0.18)' 
                : 'none',
            borderColor: dragOverlay || isDragging ? '#f59e42' : '',
            zIndex: dragOverlay ? 100 : isDragging ? 10 : 1,
            opacity: dragOverlay ? 1 : isDragging ? 0.7 : 1,
            filter: 'none'
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className={`${cardClasses} relative group ${dragOverlay ? 'ring-2 ring-orange-300 border-orange-300' : ''} ${
            isDragging ? 'opacity-70' : ''
          }`}
        >
          {/* Drag handle for mobile (visible only on touch devices) */}
          {!handTool && (
            <div className="absolute top-2 right-2 md:hidden touch-none">
              <GripVertical className="text-gray-400" size={16} />
            </div>
          )}
          
          <CardContent 
            employee={employee} 
            variant={variant} 
            isDragging={isDragging} 
            dragOverlay={dragOverlay} 
          />
          
          {/* Mobile actions overlay */}
          {showActions && window.innerWidth < 768 && (
            <div className="absolute inset-0 bg-black/10 rounded-2xl backdrop-blur-sm flex items-center justify-center gap-4 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(employee);
                  setShowActions(false);
                }}
                className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Edit"
              >
                <Edit2 size={18} className="text-blue-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(employee);
                  setShowActions(false);
                }}
                className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Delete"
              >
                <Trash2 size={18} className="text-red-500" />
              </button>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Touch overlay for closing actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setShowActions(false)}
          onTouchStart={(e) => {
            e.stopPropagation();
            setShowActions(false);
          }}
        />
      )}
    </>
  );
};

export default EmployeeCard;