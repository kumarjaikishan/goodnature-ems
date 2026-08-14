import React, { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import DataTable from "react-data-table-component";
import dayjs from "dayjs";
import { Avatar } from "@mui/material";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import { FaRegUser } from "react-icons/fa";

const Transactions = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await apiClient({
        url: "getAllTransactions"
      });
      setData(result.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const columns = [
    {
      name: "User",
      // selector: (row) => row.userId?.name,
      selector: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={cloudinaryUrl(row?.userId?.profileImage, {
              format: "webp",
              width: 100,
              height: 100,
            })}
            alt={row?.userId?.name}
          >
            {!row?.userId?.profileImage && <FaRegUser />}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {row?.userId?.name || "Unknown"}
            </span>
            
          </div>
        </div>
      ),
    },
    {
      name: "Email",
      selector: (row) => row.userId?.email,
    },
    {
      name: "Plan",
      selector: (row) => row.subscriptionId?.plan,
    },
    {
      name: "Amount",
      selector: (row) => `₹${row.amount}`,
    },
    {
      name: "Payment Status",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${row.status === "SUCCESS"
              ? "bg-green-100 text-green-600"
              : "bg-yellow-100 text-yellow-600"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Membership",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${row.subscriptionId?.status === "ACTIVE"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
            }`}
        >
          {row.subscriptionId?.status}
        </span>
      ),
    },
    {
      name: "Confirmed By",
      selector: (row) => row.subscriptionId?.conf_type,
    },
    {
      name: "Date",
      selector: (row) =>
        dayjs(row.createdAt).format("DD MMM YYYY, hh:mm A"),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Transactions</h1>

      <DataTable
        columns={columns}
        data={data}
        pagination
        highlightOnHover
      />
    </div>
  );
};

export default Transactions;