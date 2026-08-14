import React, { useState, useRef, useEffect } from 'react';
import { CiBullhorn } from 'react-icons/ci';
import { MdMarkEmailRead, MdOutlineNotificationsActive, MdOutlineInbox } from "react-icons/md";
import { FaTrashAlt, FaCheckCircle, FaBell } from 'react-icons/fa';
import { IoClose } from "react-icons/io5";
import { toast } from 'react-toastify';
import { apiClient } from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const NotificationIcon = ({ notifications }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markread = async () => {
    try {
      const data = await apiClient({
        url: "updatenotification"
      });

      toast.success(data.message, { autoClose: 1800 });
      // Parent component should ideally refetch here or update state
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  const clearNotifications = async () => {
    try {
      const data = await apiClient({
        url: "deletenotification",
        method: "DELETE"
      });

      toast.success(data.message, { autoClose: 1800 });
      // Refetch logic usually handled by parent through state update if needed, 
      // but standard is to refetch on success.
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error("Failed to clear notifications");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggleDropdown} className="relative p-1 text-gray-600 hover:text-black cursor-pointer">
        {/* <button onClick={toggleDropdown} className='bg-amber-200 w-7 h-7 rounded-full flex items-center justify-center relative cursor-pointer'> */}
        <CiBullhorn size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-purple-800 text-white text-[8px] md:text-xs w-3 h-3 md:w-4 md:h-4 flex items-center justify-center font-bold rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-20 md:right-0 mt-3 w-[300px] md:w-[380px] bg-white shadow-2xl rounded-2xl z-50 overflow-hidden border border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <MdOutlineNotificationsActive size={20} />
                <span className="font-semibold text-sm">Notification Center</span>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
                title="Close"
              >
                <IoClose size={18} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400 gap-3">
                <div className="p-4 bg-gray-50 rounded-full">
                  <MdOutlineInbox size={40} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-center px-4">You have no new notifications to review right now.</p>
              </div>
            ) : (
              <>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth">
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((notif, index) => (
                      <motion.li 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={notif._id || index} 
                        className={`px-4 py-4 relative hover:bg-teal-50/30 cursor-pointer transition-all duration-200 group flex gap-3 ${!notif.read ? 'bg-teal-50/20' : ''}`}
                      >
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.read ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-transparent'}`}></div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-relaxed break-words ${!notif.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium bg-gray-50 px-2 py-0.5 rounded-full capitalize">
                              {dayjs(notif.createdAt).fromNow()}
                            </span>
                          </div>
                        </div>

                        {!notif.read && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markread(); // Ideally should pass specific ID
                              }}
                              className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-full transition-colors"
                              title="Mark as read"
                            >
                              <FaCheckCircle size={14} />
                            </button>
                          </div>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
                  <button 
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium"
                    onClick={clearNotifications}
                  >
                    <FaTrashAlt size={12} />
                    <span>Clear All</span>
                  </button>

                  <button 
                    onClick={markread}
                    className="flex items-center gap-1.5 bg-white border border-teal-600 text-teal-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <MdMarkEmailRead size={14} />
                    <span>Mark All Read</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
