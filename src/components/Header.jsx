import React, { useState, useEffect } from 'react';
import { Building2, Menu, Download, Info, GripVertical, X, ChevronDown, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import companyLogo from '../public/logo.png';

const Header = ({ onShowMobileControls, onShowInfo }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const { setSidebarOpen, isSidebarOpen } = useStore();

  useEffect(() => {
    const openHandler = () => setIsMobileMenuOpen(true);
    const closeHandler = () => setIsMobileMenuOpen(false);
    window.addEventListener('open-mobile-menu', openHandler);
    window.addEventListener('close-mobile-menu', closeHandler);
    return () => {
      window.removeEventListener('open-mobile-menu', openHandler);
      window.removeEventListener('close-mobile-menu', closeHandler);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest('.download-menu')) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    window.dispatchEvent(new CustomEvent('open-mobile-menu'));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('close-mobile-menu'));
  };

  const exportAsPDF = async () => {
    const element = document.getElementById('org-chart');
    if (!element) {
      toast.error('Chart element not found');
      return;
    }
    try {
      const loadingToast = toast.loading('Generating high-quality PDF...');
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(element, {
        backgroundColor: '#fff5e0',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('org-chart');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
            clonedElement.style.left = '0';
            clonedElement.style.top = '0';
            clonedElement.style.background = '#fff5e0';
            clonedElement.style.padding = '60px';
            clonedElement.style.margin = '0';
            clonedElement.style.overflow = 'visible';
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              if (el.style.position === 'absolute' && el.style.left && el.style.top) {
                el.style.overflow = 'visible';
                el.style.zIndex = 'auto';
              } else {
                el.style.transform = 'none';
                el.style.position = 'relative';
                el.style.left = 'auto';
                el.style.top = 'auto';
                el.style.overflow = 'visible';
              }
              if (el.tagName === 'H3' || el.tagName === 'P' || el.tagName === 'SPAN') {
                el.style.overflow = 'visible';
                el.style.whiteSpace = 'normal';
                el.style.textOverflow = 'clip';
              }
            });
          }
        }
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.setFontSize(20);
      pdf.setTextColor(248, 178, 23);
      pdf.text('Organization Chart', 20, 20);
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      pdf.addImage(imgData, 'PNG', 15, 45, pdfWidth - 30, pdfHeight - 30);
      pdf.save(`org-chart-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss(loadingToast);
      toast.success('High-quality PDF exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export as PDF. Please try again.');
    }
  };

  return (
    <>
      {isMobileMenuOpen && (
        <button
          onClick={closeMobileMenu}
          className="fixed top-4 left-4 z-[100] md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-lg border-2 border-orange-500 hover:bg-orange-600 active:scale-95 focus:outline-none transition-all duration-150"
          style={{ boxShadow: '0 4px 16px 0 rgba(245,158,66,0.18)' }}
          aria-label="Close Menu"
        >
          <X size={26} />
        </button>
      )}
      {!isMobileMenuOpen && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="h-16 flex items-center justify-between px-3 md:px-6 shadow-sm relative bg-[#fff5e0] border-[#ffe0a3] text-black border-b backdrop-blur-lg md:rounded-none md:shadow-sm rounded-b-3xl md:rounded-none md:border-b border-b-0 md:border-b z-50"
        >
          <div className="flex items-center gap-2 flex-1 md:flex-none min-w-0">
            {isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="hidden md:flex items-center gap-2 px-1 h-16 rounded-none rounded-r-lg bg-primary-dark text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-primary-dark border-r-2 border-primary-dark absolute left-0 top-0 z-20 hover:bg-orange-500 hover:border-orange-500 hover:text-white"
                style={{ minWidth: 8}}
                title="Hide Sidebar"
                aria-label="Hide Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button
              onClick={openMobileMenu}
              className="md:hidden mr-2 p-2 rounded-full bg-primary-dark shadow-xl border-2 border-primary backdrop-blur-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-dark transition-all duration-150"
              style={{ boxShadow: '0 4px 24px 0 rgba(248,178,23,0.18), 0 1.5px 8px 0 rgba(252,76,4,0.10)' }}
              aria-label="Open menu"
            >
              <Menu size={28} className="text-white drop-shadow" />
            </button>
            <div className="hidden md:flex items-center gap-2 mx-0 min-w-0">
              <img src={companyLogo} alt="HappyFox Logo" className="w-10 h-10" />
              <span className="text-lg font-bold text-black-dark">happyfox</span>
            </div>
            <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
              <img src={companyLogo} alt="HappyFox Logo" className="w-10 h-10" />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-2 md:ml-auto min-w-0">
            <div className="hidden md:flex items-center gap-10 min-w-0">
              <span className="h-8 w-px bg-[#ffe0a3] opacity-70 mx-2 rounded-full" />
              <div className="relative download-menu">
                <motion.button 
                  whileHover={{ scale: 1.07 }} 
                  whileTap={{ scale: 0.97 }} 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-dark hover:bg-primary text-white border border-primary transition-colors shadow-sm"
                >
                  <Download size={16} />
                  <span className="text-xs font-semibold">Download</span>
                  <ChevronDown size={10} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                </motion.button>
                {showDownloadMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-orange-200 rounded-lg shadow-xl z-50 min-w-[140px]">
                    <button
                      onClick={() => {
                        exportAsPDF();
                        setShowDownloadMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-orange-50 transition-colors rounded-lg"
                    >
                      <Download size={14} className="text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">PDF Document</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onShowInfo}
              className="ml-2 p-2 rounded-full border border-primary/40 bg-white/80 text-primary-dark shadow hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              title="Show Info"
              aria-label="Show Info"
            >
              <Info size={20} />
            </button>
            <button
              className="p-2 rounded-lg bg-orange-500 text-white shadow-lg border border-orange-500 hover:bg-orange-600 active:scale-95 focus:outline-none transition-all duration-150 md:hidden ml-1"
              style={{ width: 40, height: 40 }}
              onClick={onShowMobileControls}
              aria-label="Show Controls"
            >
              <GripVertical size={22} />
            </button>
          </div>
        </motion.header>
      )}
      {!isMobileMenuOpen && (
        <div className="block md:hidden h-1 w-full bg-gradient-to-r from-blue-100 via-orange-100 to-blue-100 opacity-60" />
      )}
    </>
  );
};

export default Header;