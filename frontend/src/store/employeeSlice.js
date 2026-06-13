const API_URL = 'http://localhost:5000/api';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getHeaders } from './authSlice';

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to fetch employees');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const addEmployee = createAsyncThunk(
  'employees/add',
  async (employeeData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(employeeData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to add employee');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, employeeData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(employeeData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to update employee');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || 'Failed to delete employee');
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Server error');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(addEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((e) => e._id !== action.payload);
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
