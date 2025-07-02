import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable, DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { Users, Download, Image as ImageIcon, GripVertical, Hand, X } from 'lucide-react';
import useStore from '../store/useStore';
import EmployeeCard from './EmployeeCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

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

// --- Classic grid-aligned tree layout for perfect equal spacing and alignment ---
const compactMode = true;
const cardWidth = 220;
const siblingGap = compactMode ? 140 : 180;
const baseLevelHeight = 220;
const minLevelHeight = 120;
const maxLevelHeight = 320;
const chartHorizontalMargin = 120;

// First pass: calculate the number of leaf nodes under each node
function countLeaves(node) {
  if (!node.children || node.children.length === 0) {
    node._leaves = 1;
    return 1;
  }
  let sum = 0;
  node.children.forEach(child => {
    sum += countLeaves(child);
  });
  node._leaves = sum;
  return sum;
}

// Second pass: assign x/y positions so siblings are equally spaced and aligned
function layoutTreeGrid(node, depth = 0, xOffset = 0, levelHeight = 220) {
  node._y = depth * levelHeight;

  if (!node.children || node.children.length === 0) {
    node._x = xOffset;
    return xOffset + cardWidth + siblingGap;
  }

  let childX = xOffset;
  node.children.forEach(child => {
    childX = layoutTreeGrid(child, depth + 1, childX, levelHeight);
  });

  // Center parent above its children
  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  node._x = (firstChild._x + lastChild._x) / 2;

  return childX;
}

function collectNodePositionsGrid(node, positions, parent = null) {
  positions.push({
    id: node.id,
    x: Math.round(node._x),
    y: Math.round(node._y),
    parentX: parent ? Math.round(parent._x) : null,
    parentY: parent ? Math.round(parent._y) : null,
    node
  });
  if (node.children) {
    node.children.forEach(child => collectNodePositionsGrid(child, positions, node));
  }
}

// ZoomButtons component for chart controls
function ZoomButtons({ centerChart, handTool, setHandTool, zoom, setZoom, pan, setPan, chartRef, positions }) {
  const btnBase =
    'w-9 h-9 flex items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 shadow-sm';

  // Debounce zoom to prevent rapid double-zoom
  const zoomTimeout = React.useRef(null);
  const [zoomDisabled, setZoomDisabled] = React.useState(false);
  const debouncedZoom = (delta) => {
    if (zoomDisabled) return;
    setZoomDisabled(true);
    setZoom(z => {
      let newZoom = +(z + delta).toFixed(3);
      newZoom = Math.max(0.5, Math.min(2.5, newZoom));
      // Do NOT recenter or change pan here; just zoom in/out
      return newZoom;
    });
    clearTimeout(zoomTimeout.current);
    zoomTimeout.current = setTimeout(() => setZoomDisabled(false), 120);
  };

  return (
    <>
      <button
        onClick={() => debouncedZoom(0.1)}
        className={`${btnBase} bg-primary-dark text-white border-primary hover:bg-primary active:scale-95`}
        title="Zoom In"
        aria-label="Zoom In"
        disabled={zoomDisabled}
        style={zoomDisabled ? { opacity: 0.7, pointerEvents: 'none' } : {}}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button
        onClick={() => debouncedZoom(-0.1)}
        className={`${btnBase} bg-primary-dark text-white border-primary hover:bg-primary active:scale-95`}
        title="Zoom Out"
        aria-label="Zoom Out"
        disabled={zoomDisabled}
        style={zoomDisabled ? { opacity: 0.7, pointerEvents: 'none' } : {}}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button
        onClick={centerChart}
        className={`${btnBase} bg-primary-dark text-white border-primary hover:bg-primary active:scale-95`}
        title="Reset"
        aria-label="Reset"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      </button>
      <button
        onClick={() => setHandTool(!handTool)}
        className={
          handTool
            ? `${btnBase} bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 text-white border-2 border-orange-400 shadow-lg ring-2 ring-orange-300 animate-pulse`
            : `${btnBase} bg-white text-orange-500 border-orange-300 hover:bg-orange-100 active:scale-95`
        }
        title={handTool ? "Disable Hand Tool" : "Enable Hand Tool"}
        aria-label={handTool ? "Disable Hand Tool" : "Enable Hand Tool"}
        style={handTool ? { boxShadow: '0 0 0 4px rgba(251,191,36,0.18), 0 8px 32px 0 rgba(251,191,36,0.12)' } : {}}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
        </svg>
      </button>
    </>
  );
}

// Add custom centerOverlay modifier
const centerOverlay = ({ transform }) => ({
  ...transform,
  x: transform.x - 110, // half of card width
  y: transform.y - 60,  // half of card height
});

const OrgChart = ({ showMobileControls, setShowMobileControls, onEditEmployee, onDeleteEmployee }) => {
  const { 
    employees, 
    filteredEmployees, 
    moveEmployee,
    searchTerm,
    selectedTeam,
    handTool,
    setHandTool
  } = useStore();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [mouseDown, setMouseDown] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const chartRef = useRef(null);
  const panStart = useRef({ x: 0, y: 0 });
  const lastPan = useRef({ x: 0, y: 0 });
  const [overId, setOverId] = useState(null);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchMoveTimeout = useRef(null);
  const hasAutoCenteredRef = useRef(false);

  // Build hierarchy from filtered employees
  const buildHierarchy = (employees) => {
    const employeeMap = new Map();
    employees.forEach(emp => employeeMap.set(emp.id, { ...emp, children: [] }));
    
    const roots = [];
    employees.forEach(emp => {
      const employee = employeeMap.get(emp.id);
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        employeeMap.get(emp.managerId).children.push(employee);
      } else {
        roots.push(employee);
      }
    });
    
    return roots;
  };

  // Use filtered employees for hierarchy if there are filters, otherwise use all employees
  const employeesToUse = (searchTerm || selectedTeam !== 'all') ? filteredEmployees : employees;
  const hierarchy = buildHierarchy(employeesToUse);

  // In OrgChart component, before calling layoutTreeGrid:
  const effectiveLevelHeight = baseLevelHeight; // Keep layout grid fixed regardless of zoom

  // Build node positions for SVG lines
  let positions = [];
  if (hierarchy.length > 0) {
    let xCursor = 0;
    hierarchy.forEach((root, i) => {
      countLeaves(root);
      layoutTreeGrid(root, 0, xCursor, effectiveLevelHeight);
      xCursor += root._leaves * (cardWidth + siblingGap);
      collectNodePositionsGrid(root, positions);
    });
  }

  // Map of id to position for quick lookup
  const posMap = Object.fromEntries(positions.map(p => [p.id, p]));

  const handleDragStart = (event) => {
    if (handTool) return;
    setDraggedEmployee(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    setDraggedEmployee(null);
    setOverId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const draggedEmployee = active.data.current;
    const targetEmployee = over.data.current;
    // Prevent dropping on self or descendants
    if (isDescendant(draggedEmployee.id, targetEmployee.id, employees)) {
      toast.error('Cannot move employee to their own descendant');
      return;
    }
    // Prevent moving to the same manager
    if (draggedEmployee.managerId === targetEmployee.id) {
      toast.error(
        <span>
          <b>{draggedEmployee.name}</b> is already reporting to <b>{targetEmployee.name}</b> - invalid move
        </span>
      );
      return;
    }
    moveEmployee(draggedEmployee.id, targetEmployee.id);
    toast.success(
      <span>
        <b>{draggedEmployee.name}</b> have to report to <b>{targetEmployee.name}</b> — employee updated successfully
      </span>
    );
  };

  const handleDragCancel = () => {
    setDraggedEmployee(null);
    setOverId(null);
  };

  const isDescendant = (ancestorId, descendantId, employees) => {
    const employee = employees.find(emp => emp.id === descendantId);
    if (!employee || !employee.managerId) return false;
    if (employee.managerId === ancestorId) return true;
    return isDescendant(ancestorId, employee.managerId, employees);
  };

  const exportAsImage = async () => {
    const element = document.getElementById('org-chart');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = 'org-chart.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
    }
  };

  const exportAsPDF = async () => {
    const element = document.getElementById('org-chart');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('org-chart.pdf');
    } catch (error) {
    }
  };

  // Enhanced wheel handler for smooth trackpad, mouse wheel, and pinch-to-zoom
  const handleWheel = (e) => {
    // If hand tool is active, do not zoom (let panning take priority)
    if (handTool) return;
    // Always zoom on vertical scroll or pinch gesture
    if (e.ctrlKey || e.metaKey || e.deltaMode === 0 || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      // Use a smaller delta for smooth zoom
      let delta = -e.deltaY / 500;
      if (e.deltaMode === 1) delta = -e.deltaY / 50; // fallback for some browsers
      setZoom(z => {
        let newZoom = +(z + delta).toFixed(3);
        newZoom = Math.max(0.5, Math.min(2.5, newZoom));
        return newZoom;
      });
    }
  };

  // Attach wheel event with passive: false to prevent default browser zoom
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      chart.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }, [chartRef, handleWheel]);

  // Handle keyboard for spacebar panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') setSpacePressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle panning (hand tool, spacebar, or middle mouse button)
  const handleMouseDown = (e) => {
    if ((handTool && e.button === 0) || (spacePressed && e.button === 0) || e.button === 1) {
      setIsPanning(true);
      setMouseDown(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      lastPan.current = { ...pan };
      e.preventDefault();
    }
  };
  const handleMouseMove = (e) => {
    if (!isPanning || !mouseDown) return;
    setPan({
      x: lastPan.current.x + (e.clientX - panStart.current.x),
      y: lastPan.current.y + (e.clientY - panStart.current.y),
    });
  };
  const handleMouseUp = (e) => {
    setIsPanning(false);
    setMouseDown(false);
  };

  // Enhanced touch support for panning and zooming
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    
    let lastTouch = null;
    let lastPanTouch = { ...pan };
    let initialTouches = [];
    let isPinching = false;

    function getTouchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e) {
      if (e.touches.length === 1) {
        // Single touch - prepare for drag or tap
        const touch = e.touches[0];
        touchStartTime.current = Date.now();
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        lastTouch = { x: touch.clientX, y: touch.clientY };
        lastPanTouch = { ...pan };
        
        // Small delay to distinguish between tap and drag
        touchMoveTimeout.current = setTimeout(() => {
          if (Math.abs(touch.clientX - touchStartPos.current.x) < 5 && 
              Math.abs(touch.clientY - touchStartPos.current.y) < 5) {
            // This is a tap, not a drag
            setIsTouchDragging(false);
          } else {
            setIsTouchDragging(true);
          }
        }, 100);
        
        setIsPanning(handTool);
      } else if (e.touches.length === 2) {
        // Two touches - prepare for pinch-to-zoom
        e.preventDefault();
        isPinching = true;
        initialTouches = Array.from(e.touches);
        setTouchStartDistance(getTouchDistance(e.touches));
        setInitialZoom(zoom);
        lastTouch = { 
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2, 
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2 
        };
        lastPanTouch = { ...pan };
      }
    }

    function onTouchMove(e) {
      if (isPinching && e.touches.length === 2) {
        // Handle pinch-to-zoom
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / touchStartDistance;
        const newZoom = Math.max(0.5, Math.min(2.5, initialZoom * scale));
        
        // Calculate new pan to zoom toward touch center
        const touchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        
        const zoomPointX = (touchCenter.x - pan.x) / zoom;
        const zoomPointY = (touchCenter.y - pan.y) / zoom;
        
        const newPanX = touchCenter.x - zoomPointX * newZoom;
        const newPanY = touchCenter.y - zoomPointY * newZoom;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
        
      } else if (lastTouch && e.touches.length === 1 && (handTool || isTouchDragging)) {
        // Single touch move - pan or drag
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        setPan({
          x: lastPanTouch.x + deltaX,
          y: lastPanTouch.y + deltaY,
        });
      }
    }

    function onTouchEnd(e) {
      // Clear any pending touch move timeout
      if (touchMoveTimeout.current) {
        clearTimeout(touchMoveTimeout.current);
        touchMoveTimeout.current = null;
      }
      
      // Reset states
      setIsPanning(false);
      setIsTouchDragging(false);
      lastTouch = null;
      
      // If this was a quick tap, handle it as a click
      if (e.changedTouches.length === 1 && !isPinching) {
        const touch = e.changedTouches[0];
        const touchDuration = Date.now() - touchStartTime.current;
        const touchDistance = Math.hypot(
          touch.clientX - touchStartPos.current.x,
          touch.clientY - touchStartPos.current.y
        );
        
        if (touchDuration < 300 && touchDistance < 10) {
          // Handle tap (if needed)
        }
      }
      
      // Reset pinch state
      if (e.touches.length < 2) {
        isPinching = false;
      }
    }

    // Add event listeners with passive: false to allow preventDefault()
    const options = { passive: false };
    chart.addEventListener('touchstart', onTouchStart, options);
    chart.addEventListener('touchmove', onTouchMove, options);
    chart.addEventListener('touchend', onTouchEnd, options);
    chart.addEventListener('touchcancel', onTouchEnd, options);
    
    return () => {
      chart.removeEventListener('touchstart', onTouchStart, options);
      chart.removeEventListener('touchmove', onTouchMove, options);
      chart.removeEventListener('touchend', onTouchEnd, options);
      chart.removeEventListener('touchcancel', onTouchEnd, options);
      if (touchMoveTimeout.current) {
        clearTimeout(touchMoveTimeout.current);
      }
    };
  }, [chartRef, pan, zoom, handTool, isTouchDragging]);

  // Set cursor style based on mode
  let chartCursor = 'default';
  if (isPanning) chartCursor = 'grabbing';
  else if (handTool || spacePressed) chartCursor = 'grab';
  else if (draggedEmployee) chartCursor = 'grabbing';

  // Render SVG lines
  const renderLines = () => (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      width="100%"
      height="100%"
    >
      <defs>
        {/* No gradients or glow needed for orange lines */}
      </defs>
      {positions.filter(pos => {
        // Only render a line if both parent and child are present in the positions array
        if (pos.parentX === null || pos.parentY === null) return false;
        const parentExists = positions.some(p => Math.abs(p.x - pos.parentX) < 1 && Math.abs(p.y - pos.parentY) < 1);
        return parentExists;
      }).map(pos => {
        // Draw straight and rounded lines from parent to child
        const startX = pos.parentX + cardWidth / 2;
        const startY = pos.parentY + 120;
        const endX = pos.x + cardWidth / 2;
        const endY = pos.y;
        
        // Calculate the middle point for the corner
        const midY = (startY + endY) / 2;
        
        return (
          <g key={pos.id}>
            {/* Vertical line from parent to middle */}
            <line
              x1={startX}
              y1={startY}
              x2={startX}
              y2={midY}
              stroke="#f59e42"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="1"
            />
            {/* Horizontal line from middle to child */}
            <line
              x1={startX}
              y1={midY}
              x2={endX}
              y2={midY}
              stroke="#f59e42"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="1"
            />
            {/* Vertical line from middle to child */}
            <line
              x1={endX}
              y1={midY}
              x2={endX}
              y2={endY}
              stroke="#f59e42"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="1"
            />
          </g>
        );
      })}
    </svg>
  );

  // Debug: log employees, hierarchy, and positions
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('Employees:', employees);
    // eslint-disable-next-line no-console
    console.log('Hierarchy:', JSON.stringify(hierarchy, null, 2));
    // eslint-disable-next-line no-console
    console.log('Positions:', positions);
  }, [employees, hierarchy, positions]);

  // Render employee cards at absolute positions
  const renderEmployeeNodes = () => (
    positions.map(pos => {
      const parentExists = pos.parentX === null || pos.parentY === null ? true : positions.some(p => Math.abs(p.x - pos.parentX) < 1 && Math.abs(p.y - pos.parentY) < 1);
      const isOrphan = !parentExists && pos.parentX !== null && pos.parentY !== null;
      let isDropTarget = false;
      let isInvalidDrop = false;
      if (draggedEmployee && overId === pos.id) {
        isDropTarget = true;
        isInvalidDrop = draggedEmployee.id === pos.id || isDescendant(draggedEmployee.id, pos.id, employees);
      }
      return (
        <div
          key={pos.id}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            zIndex: isDropTarget ? 30 : 2,
            width: 220,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isOrphan ? '2px solid red' : undefined,
            pointerEvents: draggedEmployee ? 'none' : 'auto',
          }}
        >
          <DropZone employee={pos.node} isDropTarget={isDropTarget} isInvalidDrop={isInvalidDrop}>
            <EmployeeCard 
              employee={pos.node} 
              variant="org-chart" 
              onEdit={onEditEmployee}
              onDelete={onDeleteEmployee}
            />
          </DropZone>
        </div>
      );
    })
  );

  const animateTo = (from, to, setter, duration = 400) => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const value = typeof from === 'object'
        ? Object.fromEntries(Object.keys(from).map(k => [k, from[k] + (to[k] - from[k]) * t]))
        : from + (to - from) * t;
      setter(value);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const centerChart = (isInitial = false) => {
    if (!positions.length || !chartRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    // Calculate bounding box of all cards
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    const chartWidth = maxX - minX + cardWidth;
    const chartHeight = maxY - minY + 120;
    const container = chartRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    // Compute optimal zoom to fit all cards
    const zoomX = containerWidth / (chartWidth + 80); // add some margin
    const zoomY = containerHeight / (chartHeight + 80);
    let targetZoom = Math.min(1, Math.max(0.5, Math.min(zoomX, zoomY)));
    // Adjust offsets based on selectedTeam
    let verticalMargin, horizontalOffset;
    if (selectedTeam === 'all') {
      verticalMargin = -200;
      horizontalOffset = 220;
    } else {
      verticalMargin = 0;
      horizontalOffset = 90; // nudge filtered charts right
    }
    if (window.innerWidth >= 768) {
      targetZoom *= 0.9; // zoom out 10%
    } else {
      verticalMargin = 0;
    }
    // Ensure zoom never exceeds 1.0 after all calculations
    targetZoom = Math.min(targetZoom, 1);
    const targetPan = {
      x: containerWidth / 2 - ((minX + chartWidth / 2) * targetZoom) + horizontalOffset,
      y: verticalMargin - minY * targetZoom
    };
    animateTo(zoom, targetZoom, setZoom, 350);
    animateTo(pan, targetPan, setPan, 350);
  };

  // Auto-center on first load or data/filter change
  useEffect(() => {
    centerChart(true); // initial auto-center, more right
    hasAutoCenteredRef.current = true;
  }, [searchTerm, selectedTeam, positions.length]);

  // Detect mobile (tailwind: md:hidden)
  const isMobile = window.innerWidth < 768;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      onDragOver={event => setOverId(event.over?.id || null)}
    >
      <div className="flex-1 h-full overflow-hidden relative bg-[#fff5e0]">
        {/* Zoom Controls Plate: Desktop */}
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-row items-center justify-center gap-2 px-5 py-3 rounded-full shadow-2xl z-50 border border-orange-200/70 backdrop-blur-2xl transition-all duration-300 group"
          style={{
            minWidth: 200,
            maxWidth: 340,
            background: 'linear-gradient(120deg, rgba(255,245,224,0.92) 60%, rgba(255,186,100,0.82) 100%)',
            boxShadow: '0 8px 32px 0 rgba(245,158,66,0.18), 0 1.5px 8px 0 rgba(255,186,100,0.10)',
            border: '1.5px solid #f59e42',
            outline: '0.5px solid #fff8e1',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            transition: 'box-shadow 0.2s, background 0.2s',
          }}
        >
          <ZoomButtons centerChart={() => centerChart(false)} handTool={handTool} setHandTool={setHandTool} zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan} chartRef={chartRef} positions={positions} />
        </div>
        {/* Mobile: Controls Plate (only when toggled, bottom center) */}
        {showMobileControls && (
          <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-row items-center justify-center gap-2 px-5 py-3 rounded-full shadow-2xl z-50 border border-orange-200/70 backdrop-blur-2xl transition-all duration-300 group md:hidden"
            style={{
              minWidth: 200,
              maxWidth: 340,
              background: 'linear-gradient(120deg, rgba(255,245,224,0.92) 60%, rgba(255,186,100,0.82) 100%)',
              boxShadow: '0 8px 32px 0 rgba(245,158,66,0.18), 0 1.5px 8px 0 rgba(255,186,100,0.10)',
              border: '1.5px solid #f59e42',
              outline: '0.5px solid #fff8e1',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              transition: 'box-shadow 0.2s, background 0.2s',
            }}
          >
            <ZoomButtons centerChart={() => centerChart(false)} handTool={handTool} setHandTool={setHandTool} zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan} chartRef={chartRef} positions={positions} />
            <button
              className="ml-2 p-2 rounded-full bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 focus:outline-none transition-all"
              style={{ width: 36, height: 36 }}
              onClick={() => setShowMobileControls(false)}
              aria-label="Close Controls"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {/* Chart Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
          className="flex-1 overflow-auto p-8 flex items-center justify-center"
          ref={chartRef}
          style={{
            cursor: chartCursor,
            position: 'relative',
            minHeight: '100vh',
            minWidth: '100vw',
            background: 'linear-gradient(120deg, #fff5e0 60%, #ffeaba 100%)',
            maxWidth: '1440px',
            margin: '0 auto',
            boxShadow: '0 8px 32px 0 rgba(245,158,66,0.10), 0 1.5px 8px 0 rgba(34,139,230,0.10)',
            padding: selectedTeam === 'all' ? '64px 24px 64px 0' : '64px 0',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {handTool && (
            <div className="fixed top-20 left-1/2 z-40 -translate-x-1/2 bg-white/95 backdrop-blur-lg border border-orange-300 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 animate-fade-in" style={{minWidth:320}}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-800">Hand Tool Active</span>
                <p className="text-xs text-gray-600 mt-0.5">Drag to pan the chart. Drag-and-drop is disabled.</p>
              </div>
              <button
                onClick={() => setHandTool(false)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium shadow-lg hover:from-orange-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all text-sm"
              >
                Turn Off
              </button>
            </div>
          )}
          <div
            id="org-chart"
            className={`relative flex items-center ${selectedTeam === 'all' ? 'justify-end' : 'justify-center'}`}
            style={{
              transform: `scale(${zoom}) translate(${(pan.x + 40) / zoom}px, ${pan.y / zoom}px)`,
              position: 'relative',
              minWidth: positions.length > 0 ? (Math.max(...positions.map(p => p.x)) + 1200) : 1600,
              minHeight: positions.length > 0 ? (Math.max(...positions.map(p => p.y)) + 1000) : 1400,
              padding: selectedTeam === 'all' ? '64px 24px 64px 0' : '64px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: selectedTeam === 'all' ? 'flex-end' : 'center',
              boxSizing: 'border-box',
              marginRight: selectedTeam === 'all' ? 0 : undefined,
              marginLeft: selectedTeam === 'all' ? 'auto' : undefined,
            }}
          >
            {renderLines()}
            {positions.length > 0 ? renderEmployeeNodes() : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center justify-center h-96`}>
                <Users size={64} className="opacity-50 mb-4" />
                <h3 className="text-xl font-medium mb-2">No employees to display</h3>
                <p className="text-center text-sm max-w-md">{(searchTerm || selectedTeam !== 'all') ? 'No employees match your current filter criteria. Try adjusting your search or team filter.' : 'Add some employees to get started with your organization chart.'}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      {/* DragOverlay must be outside the transformed container */}
      <DragOverlay dropAnimation={null} adjustScale={false} style={{ pointerEvents: 'none' }}>
        {draggedEmployee && !handTool && (
          <div style={{ transform: `scale(${zoom}) translateX(80px)`, transformOrigin: 'top left' }}>
            <EmployeeCard
              employee={draggedEmployee}
              variant="org-chart"
              dragOverlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default OrgChart;