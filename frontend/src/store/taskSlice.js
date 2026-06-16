import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getHeaders, getBackendUrl } from './authSlice';

const API_URL = `${getBackendUrl()}/api`;

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`${API_URL}/tasks?${queryParams.toString()}`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to fetch tasks');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (taskData, { rejectWithValue }) => {
    try {
      const formattedData = {
        ...taskData,
        eta: taskData.eta ? new Date(taskData.eta).toISOString() : taskData.eta
      };
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formattedData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to assign task');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const updateTaskDetails = createAsyncThunk(
  'tasks/update',
  async ({ id, taskData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to update task');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const completeTask = createAsyncThunk(
  'tasks/complete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}/complete`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to complete task');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const extendTask = createAsyncThunk(
  'tasks/extend',
  async ({ id, newEta, reason }, { rejectWithValue }) => {
    try {
      const formattedNewEta = newEta ? new Date(newEta).toISOString() : newEta;
      const response = await fetch(`${API_URL}/tasks/${id}/extend`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ newEta: formattedNewEta, reason }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to extend task ETA');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const markTaskNotStarted = createAsyncThunk(
  'tasks/markNotStarted',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}/not-started`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to mark task as not started');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to delete task');
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    list: [],
    loading: false,
    error: null,
    isAssignModalOpen: false,
    searchQuery: '',
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    openAssignModal: (state) => {
      state.isAssignModalOpen = true;
    },
    closeAssignModal: (state) => {
      state.isAssignModalOpen = false;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    // Realtime update hook (via Socket.io)
    socketTaskUpdated: (state, action) => {
      const index = state.list.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = action.payload;
      } else {
        // If not found, insert sorted by ETA
        state.list.push(action.payload);
        state.list.sort((a, b) => new Date(a.eta) - new Date(b.eta));
      }
    },
    socketTaskCreated: (state, action) => {
      const exists = state.list.some((t) => t._id === action.payload._id);
      if (!exists) {
        state.list.push(action.payload);
        state.list.sort((a, b) => new Date(a.eta) - new Date(b.eta));
      }
    },
    socketTaskDeleted: (state, action) => {
      state.list = state.list.filter((t) => t._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Helper to update a task in the list when fulfilled
    const updateTaskInList = (state, action) => {
      state.loading = false;
      const index = state.list.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    };

    builder
      // Fetch all
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
        state.list.sort((a, b) => new Date(a.eta) - new Date(b.eta));
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update details
      .addCase(updateTaskDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTaskDetails.fulfilled, updateTaskInList)
      .addCase(updateTaskDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Complete
      .addCase(completeTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeTask.fulfilled, updateTaskInList)
      .addCase(completeTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Extend
      .addCase(extendTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(extendTask.fulfilled, updateTaskInList)
      .addCase(extendTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Not Started
      .addCase(markTaskNotStarted.pending, (state) => {
        state.loading = true;
      })
      .addCase(markTaskNotStarted.fulfilled, updateTaskInList)
      .addCase(markTaskNotStarted.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearTaskError, 
  socketTaskUpdated, 
  socketTaskCreated, 
  socketTaskDeleted,
  openAssignModal,
  closeAssignModal,
  setSearchQuery
} = taskSlice.actions;
export default taskSlice.reducer;
