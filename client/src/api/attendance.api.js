import dayjs from 'dayjs';

export const bulkMarkAttendanceApi = async (attendanceRecords) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_ADDRESS}bulkMarkAttendance`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("emstoken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attendanceRecords }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit attendance");
  }

  return response.json();
};

export const getBulkMarkDataApi = async (dateOrParams, branchId, departmentId) => {
  let dateVal;
  let branchVal;
  let deptVal;

  if (typeof dateOrParams === 'object' && dateOrParams !== null && !dayjs.isDayjs(dateOrParams)) {
    dateVal = dateOrParams.date;
    branchVal = dateOrParams.branchId;
    deptVal = dateOrParams.departmentId;
  } else {
    dateVal = dateOrParams;
    branchVal = branchId;
    deptVal = departmentId;
  }

  // Format date if dayjs object was passed
  if (dayjs.isDayjs(dateVal)) {
    dateVal = dateVal.format('YYYY-MM-DD');
  }

  const query = new URLSearchParams({
    date: dateVal || dayjs().format('YYYY-MM-DD'),
    branchId: branchVal || 'all',
    departmentId: deptVal || 'all'
  }).toString();

  const response = await fetch(
    `${import.meta.env.VITE_API_ADDRESS}bulkMarkAttendance/data?${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("emstoken")}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch bulk mark data");
  }

  return response.json();
};

// Paginated, filtered attendance list — use this instead of reading the
// full company history out of redux. Params map 1:1 to the filter UI:
// { page, limit, fromDate, toDate, month, year, branchId, departmentId,
//   employeeId, employee, status, sortDir }
export const getAttendanceListApi = async (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const query = new URLSearchParams(cleaned).toString();

  const response = await fetch(
    `${import.meta.env.VITE_API_ADDRESS}attandence/list${query ? `?${query}` : ''}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("emstoken")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch attendance list");
  }

  return response.json();
};

export const getSingleEmployeeAttendanceApi = async (employeeId, date) => {
  const query = new URLSearchParams({
    employeeId,
    date,
  }).toString();

  const response = await fetch(
    `${import.meta.env.VITE_API_ADDRESS}singleEmployeeAttendance?${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("emstoken")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch employee attendance");
  }

  return response.json();
};
