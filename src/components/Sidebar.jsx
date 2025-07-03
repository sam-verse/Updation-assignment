import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Plus, Filter, RotateCcw, Menu, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import EmployeeCard from './EmployeeCard';
import AddEmployeeModal from './Modals/AddEmployeeModal';
import '../index.css';
import companyLogo from '../public/logo.png';

const Sidebar = ({ onEditEmployee, onDeleteEmployee }) => {
  const {
    filteredEmployees,
    searchTerm,
    selectedTeam,
    teams,
    actionHistory,
    setSearchTerm,
    setSelectedTeam,
    undoLastAction,
    isSidebarOpen,
    setSidebarOpen
  } = useStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customDropdownOpen, setCustomDropdownOpen] = useState(false);
  const customDropdownRef = useRef(null);

  // Mobile menu open/close event listeners
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    const closeHandler = () => setMobileOpen(false);
    window.addEventListener('open-mobile-menu', handler);
    window.addEventListener('close-mobile-menu', closeHandler);
    return () => {
      window.removeEventListener('open-mobile-menu', handler);
      window.removeEventListener('close-mobile-menu', closeHandler);
    };
  }, []);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (customDropdownRef.current && !customDropdownRef.current.contains(event.target)) {
        setCustomDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputButtonClass = `w-full pl-10 pr-4 py-2 rounded-lg border bg-[#ffeaba] border-[#ffe0a3] text-base font-semibold text-black transition-all duration-150 focus:ring-2 focus:ring-primary-dark focus:border-transparent outline-none appearance-none flex items-center min-h-[44px]`;

  // --- Sidebar closed button (desktop) ---
  if (!isSidebarOpen) {
    return (
      <motion.button
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] flex items-center h-16 px-2 pr-4 rounded-r-2xl bg-orange-500 text-white shadow-xl border-y-2 border-r-2 border-orange-500 hover:bg-orange-600 hover:scale-105 active:scale-95 focus:outline-none transition-all duration-200 group"
        style={{ pointerEvents: 'auto', boxShadow: '0 4px 16px 0 rgba(245,158,66,0.18)', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minWidth: 0 }}
        onClick={() => setSidebarOpen(true)}
        title="Show Sidebar"
        aria-label="Show Sidebar"
      >
        <ChevronLeft size={24} className="rotate-180 mr-2" />
        <span className="font-semibold text-base">Show</span>
      </motion.button>
    );
  }

  return (
    <>
      {/* --- Mobile Drawer --- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 flex"
          >
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-bl-[2px]"
              onClick={() => {
                setMobileOpen(false);
                window.dispatchEvent(new CustomEvent('close-mobile-menu'));
              }}
            />
            {/* Drawer */}
            <div
              className="relative w-[100vw] max-w-xs sm:w-[92vw] h-full bg-[#fff5e0] text-black shadow-2xl border-r border-[#ffe0a3] flex flex-col z-50 rounded-r-3xl backdrop-blur-xl pb-6"
              style={{ boxShadow: '0 8px 32px 0 rgba(248,178,23,0.18)' }}
            >
              {/* Profile Section */}
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-2 pt-7 pb-4 px-6 border-b border-primary/20 mb-2"
              >
                <img src={companyLogo} alt="HappyFox Logo" className="w-10 md:h-10" />
                <span className="text-lg font-bold tracking-tight text-blaack">happyfox</span>
                <span className="text-xs font-medium text-accent">Organization Chart</span>
              </motion.div>
              {/* Top App Bar */}
              <div className="flex items-center justify-between px-5 py-4 rounded-tr-3xl bg-[#fff5e0] border-b border-[#ffe0a3] shadow-md mb-2">
                <div className="flex-1 text-center">
                  <span className="text-lg font-bold tracking-tight text-primary">Employees</span>
                </div>
              </div>
              {/* Navigation/Filters */}
              <div className="px-5 mb-4 mt-2 w-full">
                <div className="flex flex-row items-center justify-between gap-2 w-full">
                  <div className="flex flex-row items-center gap-2 flex-1">
                    <div className="relative w-full max-w-xs">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search employees..."
                        className={inputButtonClass + ' placeholder:text-black/60'}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark" size={18} />
                    </div>
                  </div>
                  <div className="flex flex-row items-center ml-2">
                    <div className="relative" ref={customDropdownRef}>
                      <button
                        className={inputButtonClass + (customDropdownOpen ? ' ring-2 ring-primary-dark' : '') + ' min-w-[160px]'}
                        onClick={() => setCustomDropdownOpen((open) => !open)}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={customDropdownOpen}
                      >
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark" size={18} />
                        <span className="flex-1 text-left truncate">{selectedTeam === 'all' ? 'All Teams' : selectedTeam}</span>
                        <svg className={`ml-2 w-5 h-5 transition-transform duration-200 ${customDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      {customDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-full bg-[#ffeaba] border border-[#ffe0a3] rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto animate-fade-in">
                          {['all', ...teams].map(team => (
                            <button
                              key={team}
                              className={`w-full text-left pl-10 pr-4 py-2 rounded-lg transition-colors duration-100 flex items-center
                                ${selectedTeam === team ? 'bg-[#ffd18c] text-black font-bold' : 'text-black font-medium'}
                                hover:bg-[#ffe0a3] hover:text-black focus:bg-[#ffd18c]'}`}
                              onClick={() => {
                                setSelectedTeam(team);
                                setCustomDropdownOpen(false);
                              }}
                              tabIndex={0}
                              role="option"
                              aria-selected={selectedTeam === team}
                            >
                              <Filter className="mr-2 text-primary-dark" size={18} /> {team === 'all' ? 'All Teams' : team}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Employee List */}
              <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4 custom-scrollbar">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(employee => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ scale: 1.03, boxShadow: '0 8px 32px 0 rgba(34,139,230,0.10)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="rounded-xl border shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing"
                    >
                      <EmployeeCard employee={employee} variant="sidebar" onEdit={onEditEmployee} onDelete={onDeleteEmployee} />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-primary-dark mt-16 text-lg font-medium">No employees found.</div>
                )}
              </div>
              {/* Floating Add Employee Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-4 right-4 z-50 w-12 h-12 sm:bottom-8 sm:right-8 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-2xl border-4 border-white/40 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold backdrop-blur-lg"
                style={{ boxShadow: '0 8px 32px 0 rgba(34,139,230,0.18)' }}
                aria-label="Add Employee"
              >
                <Plus size={24} className="sm:hidden" />
                <Plus size={32} className="hidden sm:inline" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Desktop Sidebar --- */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 h-full bg-[#fff5e0] backdrop-blur-lg border-r border-[#ffe0a3] flex flex-col hidden md:flex"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
            <div className="flex gap-2 items-center">
              {actionHistory.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={undoLastAction}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Undo Last Action"
                >
                  <RotateCcw size={16} />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary-dark hover:bg-primary text-white p-2 rounded-lg transition-colors"
                title="Add Employee"
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </div>
          {/* Search and Team Filter */}
          <div className="space-y-3 w-full mb-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search employees"
                className={inputButtonClass + ' placeholder:text-black/60'}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark" size={18} />
            </div>
            <div className="relative w-full" ref={customDropdownRef}>
              <button
                className={inputButtonClass + (customDropdownOpen ? ' ring-2 ring-primary-dark' : '')}
                onClick={() => setCustomDropdownOpen((open) => !open)}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={customDropdownOpen}
              >
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark" size={18} />
                <span className="flex-1 text-left truncate">{selectedTeam === 'all' ? 'All Teams' : selectedTeam}</span>
                <svg className={`ml-2 w-5 h-5 transition-transform duration-200 ${customDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {customDropdownOpen && (
                <div className="absolute left-0 mt-2 w-full bg-[#ffeaba] border border-[#ffe0a3] rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto animate-fade-in">
                  {['all', ...teams].map(team => (
                    <button
                      key={team}
                      className={`w-full text-left pl-10 pr-4 py-2 rounded-lg transition-colors duration-100 flex items-center
                        ${selectedTeam === team ? 'bg-[#ffd18c] text-black font-bold' : 'text-black font-medium'}
                        hover:bg-[#ffe0a3] hover:text-black focus:bg-[#ffd18c]'}`}
                      onClick={() => {
                        setSelectedTeam(team);
                        setCustomDropdownOpen(false);
                      }}
                      tabIndex={0}
                      role="option"
                      aria-selected={selectedTeam === team}
                    >
                      <Filter className="mr-2 text-primary-dark" size={18} /> {team === 'all' ? 'All Teams' : team}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Employee List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <Users size={16} />
            <span>{filteredEmployees.length} employees</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {filteredEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EmployeeCard employee={employee} variant="sidebar" onEdit={onEditEmployee} onDelete={onDeleteEmployee} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filteredEmployees.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No employees found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </motion.div>
      {/* --- Add Employee Modal --- */}
      <AddEmployeeModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      {/* --- Custom scrollbar styles --- */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
            background: #fff5e0;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #ffd18c;
            border-radius: 8px;
            border: 2px solid #fff5e0;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #ffc76b;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #ffd18c #fff5e0;
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;