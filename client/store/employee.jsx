// features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const empFirstFetch = createAsyncThunk(
    'employee/fetchempData',
    async (_, { getState }) => {
        const token = localStorage.getItem("emstoken");
        const res = await axios.get(`${import.meta.env.VITE_API_ADDRESS}empFirstFetch`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // console.log("empFirstFetch", res.data)
        return res.data;
    }
);

const initialEmployeeState = {
    profile: null,
    notification: null,
    attendance: null,
    leave: null,
    salary: null,
    holiday: null,
    notices: null,
    companysetting: null,
    status: 'idle',
};

const EmployeeSlice = createSlice({
    name: 'employee',
    initialState: initialEmployeeState,
    reducers: {
        emplogout(state, action) {
            localStorage.removeItem("emstoken");
            localStorage.removeItem("persist:EMS");
            return { ...initialEmployeeState };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(empFirstFetch.fulfilled, (state, action) => {
                state.profile = action.payload?.profile;
                state.notification = action.payload?.notification;
                state.attendance = action.payload?.attendance;
                state.leave = action.payload?.leave;
                state.companysetting = action.payload?.companySetting;
                state.holiday = action.payload?.holiday;
                state.notices = action.payload?.notices;
                state.salary = action.payload?.salary;
                state.status = 'succeeded';
            })
            .addCase(empFirstFetch.pending, (state) => {
                state.status = 'loading';
            });
    },
});

export const { emplogout } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
