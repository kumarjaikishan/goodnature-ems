// features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const FirstFetch = createAsyncThunk(
    'user/fetchUserData',
    async (_, { getState }) => {
        const token = localStorage.getItem("emstoken");
        const res = await axios.get(`${import.meta.env.VITE_API_ADDRESS}firstfetch`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // console.log("firstfetch", res.data)
        return res.data;
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        profile: null,
        department: null,
        adminManager: null,
        employee: null,
        company: null,
        holidays: null,
        notices: null,
        branch: null,
        attandence: null,
        ledger: null,
        leaveBalance: null,
        leavePolicies: [],
        advance: null,
        payroll: null,
        status: 'idle',
        sidebar: false,
        extendedonMobile: false,
        liveAttandence: true,
        primaryColor: '#1e293b',
    },
    reducers: {
        userlogout(state, action) {
            localStorage.clear();
            state.profile = null;
            state.department = null;
            state.adminManager = null;
            state.employee = null;
            state.company = null;
            state.holidays = null;
            state.notices = null;
            state.branch = null;
            state.leaveBalance = null;
            state.advance = null;
            state.attandence = null;
            state.ledger = null;
            state.payroll = null;
        },
        updateAttendance(state, action) {
            state.attandence = action.payload;
        },
        setpayroll(state, action) {
            state.payroll = action.payload;
        },
        setuser(state, action) {
            // console.log('payload setting',action.payload)
            state.profile = action.payload;
        },
        setEmployees(state, action) {
            state.employee = action.payload;
        },
        tooglesidebar(state, action) {
            state.sidebar = !state.sidebar;
        },
        setPrimaryColor(state, action) {
            state.primaryColor = action.payload;
        },
        toogleextendedonMobile(state, action) {
            state.extendedonMobile = !state.extendedonMobile;
        },
        toogleliveAttandence(state, action) {
            state.liveAttandence = !state.liveAttandence;
        },

    },
    extraReducers: (builder) => {
        builder
            .addCase(FirstFetch.fulfilled, (state, action) => {
                state.profile = action.payload?.user;
                state.department = action.payload?.departmentlist || [];
                state.company = action.payload?.company || null;
                state.branch = action.payload?.branch || [];
                state.notices = action.payload?.notices || [];
                state.status = 'succeeded';
            })
            .addCase(FirstFetch.pending, (state) => {
                state.status = 'loading';
            });
    },
});

export const { userlogout, updateAttendance, setEmployees, setPrimaryColor, setpayroll, toogleliveAttandence, setuser, tooglesidebar, toogleextendedonMobile } = userSlice.actions;
export default userSlice.reducer;
