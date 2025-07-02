import React, { useState } from 'react';
import { X, User, Mail, Phone, Building, Users, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

const AddEmployeeModal = ({ isOpen, onClose }) => {
  const { employees, teams, addEmployee } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    team: '',
    managerId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addEmployee(formData);
      setFormData({
        name: '',
        email: '',
        phone: '',
        designation: '',
        team: '',
        managerId: ''
      });
      onClose();
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Get potential managers (excluding the employee being edited)
  const potentialManagers = employees.filter(emp => 
    emp.id !== formData.id
  );

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
          {/* Soft blurred vignette/glow behind card for elevation */}
          <div className="absolute -inset-8 z-0 pointer-events-none rounded-3xl bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-white/0 blur-2xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl border border-orange-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 z-0"
              style={{
                background: 'linear-gradient(120deg, #ffe0b2 0%, #ffd180 40%, #ffb74d 100%)',
                opacity: 0.93
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            />
            {/* Glass overlay with warm tint */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage: 'repeating-linear-gradient(135deg, #ffe0b2 0 2px, transparent 2px 24px)'}} />
            {/* Glowing border */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-amber-400/40"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Decorative orbs inside card */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/20 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100/15 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-orange-200 bg-white/80">
                <h2 className="text-lg font-bold text-black">
                  Add New Employee
                </h2>
                <button
                  onClick={onClose}
                  className="text-orange-500 hover:text-orange-600 transition-colors p-1 -mr-1"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-3 sm:p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">
                    <User size={14} className="inline mr-1.5" />
                    Full Name *
                  </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all duration-150 text-black placeholder:text-black/60"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  <Mail size={14} className="inline mr-1.5" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all duration-150 text-black placeholder:text-black/60"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  <Phone size={14} className="inline mr-1.5" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all duration-150 text-black placeholder:text-black/60"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  <Building size={14} className="inline mr-1.5" />
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all duration-150 text-black placeholder:text-black/60"
                  placeholder="Enter job designation"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  <Users size={14} className="inline mr-1.5" />
                  Team *
                </label>
                <input
                  type="text"
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  required
                  list="teams"
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all duration-150 text-black placeholder:text-black/60"
                  placeholder="Enter or select team"
                />
                <datalist id="teams">
                  {teams.map(team => (
                    <option key={team} value={team} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  <UserCheck size={14} className="inline mr-1.5" />
                  Manager
                </label>
                <select
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all duration-150 text-black"
                >
                  <option value="">No Manager (Top Level)</option>
                  {potentialManagers.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-orange-700 font-medium rounded-lg border border-orange-200 bg-white hover:bg-orange-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
            
              {/* Glow effect (already handled by card overlays) */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEmployeeModal;