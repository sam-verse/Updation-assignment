import { create } from 'zustand';
import toast from 'react-hot-toast';

const useStore = create((set, get) => ({
  // State
  employees: [],
  filteredEmployees: [],
  searchTerm: '',
  selectedTeam: 'all',
  isLoading: false,
  actionHistory: [],
  draggedEmployee: null,
  zoom: 1,
  isSidebarOpen: true,
  handTool: false,
  
  // Teams derived from employees
  teams: [],
  
  // Setters
  setEmployees: employees => {
    set({ employees });
    get().updateFilteredEmployees();
    get().updateTeams();
  },
  
  setSearchTerm: term => {
    set({ searchTerm: term });
    get().updateFilteredEmployees();
  },
  
  setSelectedTeam: team => {
    set({ selectedTeam: team });
    get().updateFilteredEmployees();
  },
  
  setLoading: isLoading => set({ isLoading }),
  
  setDraggedEmployee: draggedEmployee => set({ draggedEmployee }),
  
  // Filtering & Teams
  updateFilteredEmployees: () => {
    const { employees, searchTerm, selectedTeam } = get();
    let filtered = employees;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.designation.toLowerCase().includes(term) ||
        emp.team.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term)
      );
    }
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(emp => emp.team === selectedTeam);
    }
    set({ filteredEmployees: filtered });
  },
  
  updateTeams: () => {
    const { employees } = get();
    set({ teams: [...new Set(employees.map(emp => emp.team))].sort() });
  },
  
  // Undo/History
  addToHistory: action => {
    const { actionHistory } = get();
    const newHistory = [...actionHistory, { ...action, timestamp: Date.now() }];
    if (newHistory.length > 10) newHistory.shift();
    set({ actionHistory: newHistory });
  },
  
  undoLastAction: async () => {
    const { actionHistory } = get();
    if (!actionHistory.length) return toast.error('No actions to undo');
    const lastAction = actionHistory[actionHistory.length - 1];
    set({ actionHistory: actionHistory.slice(0, -1) });
    try {
      if (lastAction.type === 'update') {
        await get().updateEmployee(lastAction.employeeId, lastAction.previousData);
        toast.success('Action undone successfully');
      } else if (lastAction.type === 'add') {
        await get().deleteEmployee(lastAction.employeeId);
        toast.success('Employee addition undone');
      } else if (lastAction.type === 'delete') {
        await get().addEmployee(lastAction.employeeData);
        toast.success('Employee deletion undone');
      }
    } catch {
      toast.error('Failed to undo action');
    }
  },
  
  // API Actions
  fetchEmployees: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      get().setEmployees(data.employees);
    } catch {
      toast.error('Failed to fetch employees');
    } finally {
      set({ isLoading: false });
    }
  },
  
  addEmployee: async employeeData => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      const data = await res.json();
      get().setEmployees([...get().employees, data.employee]);
      get().addToHistory({ type: 'add', employeeId: data.employee.id, employeeData: data.employee });
      toast.success('Employee added successfully');
      return data.employee;
    } catch (e) {
      toast.error('Failed to add employee');
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateEmployee: async (id, updates) => {
    const { employees } = get();
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    const previousData = { ...employee };
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      get().setEmployees(employees.map(emp => emp.id === id ? data.employee : emp));
      get().addToHistory({ type: 'update', employeeId: id, previousData, newData: data.employee });
      return data.employee;
    } catch (e) {
      toast.error('Failed to update employee');
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteEmployee: async id => {
    const { employees } = get();
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    set({ isLoading: true });
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      get().setEmployees(employees.filter(emp => emp.id !== id));
      get().addToHistory({ type: 'delete', employeeId: id, employeeData: employee });
      toast.success('Employee deleted successfully');
    } catch (e) {
      toast.error('Failed to delete employee');
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
  
  moveEmployee: async (employeeId, newManagerId) => {
    const { employees } = get();
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    await get().updateEmployee(employeeId, { managerId: newManagerId });
  },
  
  // UI State
  setZoom: zoom => set({ zoom }),
  
  handleZoom: delta => {
    set(state => {
      let newZoom = +(state.zoom + delta).toFixed(3);
      newZoom = Math.max(0.5, Math.min(2.5, newZoom));
      return { zoom: newZoom };
    });
  },
  
  setSidebarOpen: isSidebarOpen => set({ isSidebarOpen }),
  
  setHandTool: value => set({ handTool: typeof value === 'function' ? value(get().handTool) : value }),
}));

export default useStore;