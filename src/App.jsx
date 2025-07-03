import React, { useEffect, useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { makeServer } from './services/mockApi';
import useStore from './store/useStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OrgChart from './components/OrgChart';
import logo from './public/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, Search, Lightbulb } from 'lucide-react';
import EditEmployeeModal from './components/Modals/EditEmployeeModal';
import DeleteConfirmModal from './components/Modals/DeleteConfirmModal';
import Chatbot from './components/chatbot/Chatbot';

if (process.env.NODE_ENV === 'development') makeServer();

function App() {
  const { fetchEmployees } = useStore();
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showInstruction, setShowInstruction] = useState(false);
  const instructionTimeout = useRef(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const chatbotRef = useRef(null);
  const [showChatbotHint, setShowChatbotHint] = useState(false);

  useEffect(() => {
    fetchEmployees();
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  useEffect(() => {
    if (!showSplash) {
      setShowInstruction(true);
      if (instructionTimeout.current) clearTimeout(instructionTimeout.current);
      instructionTimeout.current = setTimeout(() => {
        setShowInstruction(false);
        instructionTimeout.current = null;
      }, 10000);
    }
    return () => {
      if (instructionTimeout.current) {
        clearTimeout(instructionTimeout.current);
        instructionTimeout.current = null;
      }
    };
  }, [showSplash]);

  useEffect(() => {
    if (!showSplash) {
      setShowChatbotHint(true);
      const hintTimer = setTimeout(() => setShowChatbotHint(false), 4000);
      return () => clearTimeout(hintTimer);
    }
  }, [showSplash]);

  const handleShowInfo = () => {
    setShowInstruction(true);
    if (instructionTimeout.current) clearTimeout(instructionTimeout.current);
    instructionTimeout.current = setTimeout(() => {
      setShowInstruction(false);
      instructionTimeout.current = null;
    }, 10000);
  };

  const openEditModal = employee => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };
  const openDeleteModal = employee => {
    setSelectedEmployee(employee);
    setDeleteModalOpen(true);
  };
  const closeModals = () => {
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <>
      <div className="min-h-screen w-full max-w-screen overflow-x-hidden bg-gray-50 transition-colors flex flex-col relative" style={{ position: 'fixed', inset: 0 }}>
        {/* Instruction Popup */}
        <AnimatePresence>
          {showInstruction && (
            <motion.div 
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255, 193, 7, 0.13) 0%, rgba(255, 152, 0, 0.10) 60%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setShowInstruction(false)}
              aria-label="Close instructions"
              tabIndex={-1}
            >
              <motion.div 
                className="relative rounded-2xl shadow-2xl p-0 w-full max-w-md overflow-hidden focus:outline-none border border-amber-300/60"
                style={{ boxShadow: '0 12px 48px 0 rgba(255, 193, 7, 0.18), 0 2px 16px 0 rgba(0,0,0,0.10)' }}
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.98 }}
                transition={{ duration: 0.38, type: 'spring', damping: 28, stiffness: 320 }}
                onClick={e => e.stopPropagation()}
                tabIndex={0}
                aria-modal="true"
                role="dialog"
              >
                <div className="absolute -inset-8 z-0 pointer-events-none rounded-3xl bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-white/0 blur-2xl" />
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
                <div className="relative z-10 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col w-full">
                      <h3 className="text-xl font-sans font-bold text-gray-900 leading-tight tracking-tight mb-1">Model HappyFox Organization Chart</h3>
                      <div className="h-1 w-12 rounded bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 mb-1" />
                    </div>
                    <motion.button
                      onClick={() => setShowInstruction(false)}
                      aria-label="Close instructions"
                      className="relative flex items-center justify-center w-6 h-6 rounded-full group focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 transition-all"
                      style={{ background: 'transparent', boxShadow: 'none' }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-rose-500 to-red-500 shadow-lg" style={{ zIndex: 0 }} />
                      <X size={16} className="relative z-10 transition-colors text-rose-600 group-hover:text-white" />
                    </motion.button>
                  </div>
                  <div className="text-base text-gray-800 font-medium mb-5 text-center md:text-left">Visualize, manage, and reorganize your team with ease.</div>
                  <div className="relative mb-6 flex flex-col items-start">
                    <div className="absolute left-5 top-7 bottom-7 w-1 bg-gradient-to-b from-amber-300 via-orange-200 to-amber-200 rounded-full" style={{zIndex:0}} />
                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 shadow border-2 border-amber-100">
                            <GripVertical className="w-6 h-6 text-white" strokeWidth={2.2} />
                          </span>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-amber-900">Drag & Drop</div>
                          <div className="text-sm text-gray-700">Drag employees to reorganize the hierarchy</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 shadow border-2 border-amber-100">
                            <Search className="w-6 h-6 text-white" strokeWidth={2.2} />
                          </span>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-amber-900">Zoom & Pan</div>
                          <div className="text-sm text-gray-700">Scroll or pinch to zoom, drag to pan</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-300 shadow border-2 border-amber-100">
                            <Lightbulb className="w-6 h-6 text-white" strokeWidth={2.2} />
                          </span>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-amber-900">Quick Tips</div>
                          <div className="text-sm text-gray-700">Double-click to fit, search, or click for details</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowInstruction(false)}
                    className="w-full px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-orange-600 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-50 text-base tracking-wide relative overflow-hidden"
                    whileHover={{ scale: 1.03, boxShadow: '0 0 16px 2px #fb923c55' }}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Get started"
                  >
                    <span className="relative z-10">Get Started</span>
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400/20 to-orange-400/20 blur-md opacity-60 pointer-events-none" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showSplash && (
            <motion.div
              key="splash"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="fixed inset-0 z-[200] flex items-center justify-center"
              style={{ background: 'linear-gradient(120deg, #fff5e0 60%, #ffeaba 100%)' }}
            >
              <motion.img
                src={logo}
                alt="HappyFox Logo"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                className="w-24 h-24 drop-shadow-xl"
                style={{ filter: 'drop-shadow(0 8px 32px rgba(245,158,66,0.18))' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 32 : 0 }}
          transition={{ duration: 0.7, delay: showSplash ? 0.7 : 0, ease: 'easeInOut' }}
          style={{ pointerEvents: showSplash ? 'none' : 'auto' }}
          className="flex flex-col flex-1 h-full relative"
        >
          <Header onShowMobileControls={() => setShowMobileControls(true)} onShowInfo={handleShowInfo} />
          <div className="relative flex-1 w-full h-full">
            <div className="absolute top-0 left-0 z-20 h-full">
              <Sidebar onEditEmployee={openEditModal} onDeleteEmployee={openDeleteModal} />
            </div>
            <div className="absolute inset-0 z-10 w-full h-full">
              <OrgChart
                showMobileControls={showMobileControls}
                setShowMobileControls={setShowMobileControls}
                onEditEmployee={openEditModal}
                onDeleteEmployee={openDeleteModal}
              />
            </div>
          </div>
        </motion.div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#000000',
            border: '1px solid #E5E7EB',
          },
        }}
      />
      <EditEmployeeModal isOpen={editModalOpen} onClose={closeModals} employee={selectedEmployee} />
      <DeleteConfirmModal isOpen={deleteModalOpen} onClose={closeModals} employee={selectedEmployee} />
      {!showSplash && <Chatbot ref={chatbotRef} showHint={showChatbotHint} />}
    </>
  );
}

export default App; 