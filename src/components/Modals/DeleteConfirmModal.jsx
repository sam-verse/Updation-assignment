import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

const DeleteConfirmModal = ({ employee, isOpen, onClose }) => {
  const { deleteEmployee, employees } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEmployee(employee.id);
      onClose();
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsDeleting(false);
    }
  };

  if (!employee) return null;

  const directReports = employees.filter(emp => emp.managerId === employee.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 193, 7, 0.13) 0%, rgba(255, 152, 0, 0.10) 60%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)'
          }}
          onClick={onClose}
        >
          <div className="absolute -inset-8 z-0 pointer-events-none rounded-3xl bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-white/0 blur-2xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl border border-orange-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <motion.div
              className="absolute inset-0 z-0"
              style={{
                background: 'linear-gradient(120deg, #ffe0b2 0%, #ffd180 40%, #ffb74d 100%)',
                opacity: 0.93
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage: 'repeating-linear-gradient(135deg, #ffe0b2 0 2px, transparent 2px 24px)'}} />
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-amber-400/40"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/20 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100/15 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between p-4 border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Trash2 size={16} className="text-red-600" />
                  </div>
                  <h2 className="text-lg font-bold text-amber-900">Delete Employee</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-amber-500 hover:text-amber-600 transition-colors p-1 -mr-1"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-3 sm:p-5">
                <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Are you sure you want to delete this employee?</p>
                    <p className="text-xs text-red-700">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/50 border border-amber-100 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={e => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3B82F6&color=ffffff&size=40`;
                      }}
                    />
                    <div>
                      <h3 className="text-sm font-medium text-amber-900">{employee.name}</h3>
                      <p className="text-xs text-amber-700">{employee.designation} • {employee.team}</p>
                    </div>
                  </div>
                </div>
                {directReports.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-800 mb-1">
                          This employee manages {directReports.length} direct report{directReports.length > 1 ? 's' : ''}
                        </p>
                        <div className="text-xs text-amber-700 mb-1">
                          {directReports.map((report, index) => (
                            <span key={report.id}>
                              {report.name}
                              {index < directReports.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-amber-700">They will be moved to the next level up in the hierarchy.</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-amber-700 font-medium rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-1"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;