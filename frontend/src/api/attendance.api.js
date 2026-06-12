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

export const getBulkMarkDataApi = async (date, branchId, departmentId) => {
  const query = new URLSearchParams({
    date,
    branchId: branchId || 'all',
    departmentId: departmentId || 'all'
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
    throw new Error("Failed to fetch bulk mark data");
  }

  return response.json();
};
