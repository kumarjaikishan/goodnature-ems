import { useEffect, useRef, useState } from "react";
import { TextField, Button, Avatar, InputAdornment, Menu, } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import { swal } from "../../../utils/confirmDialog";
import useImageUpload from "../../../utils/imageresizer";
import { useSelector } from "react-redux";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Modalbox from "../../../components/custommodal/Modalbox";
import Loader from "../../../utils/loader";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { motion } from "framer-motion";
import { LayoutGrid, Table, Coins, Wallet, Scale, Search, MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";

const LedgerListPage = () => {
    const [ledgers, setLedgers] = useState([]);
    const [filteredLedgers, setFilteredLedgers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const { ledger } = useSelector(e => e.user);
    const [editLedgerId, setEditLedgerId] = useState(null);
    const [editLedgerName, setEditLedgerName] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [editLedgerImage, setEditLedgerImage] = useState(null);
    const { handleImage } = useImageUpload();
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLedger, setSelectedLedger] = useState(null);
    const open = Boolean(anchorEl);
    const [viewType, setViewType] = useState(localStorage.getItem('ledgerViewType') || 'card');

    const MotionAvatar = motion.create(Avatar);

    const handleMenuOpen = (event, ledger) => {
        event.stopPropagation(); // prevent card click
        setAnchorEl(event.currentTarget);
        setSelectedLedger(ledger);
    };

    const handleMenuClose = (event) => {
        event?.stopPropagation();
        setAnchorEl(null);
        setSelectedLedger(null);
    };

    useEffect(() => {
        //  console.log("useEffect called");
        fetchLedgers();
        // console.log(ledger)
        // setLedgers(ledger);
        // setFilteredLedgers(ledger);
    }, []);

    useEffect(() => {
        if (ledgers.length < 1) return;
        if (searchQuery.trim() === "") {
            setFilteredLedgers(ledgers);
        } else {
            const lower = searchQuery.toLowerCase();
            setFilteredLedgers(
                ledgers.filter((l) => l.name.toLowerCase().includes(lower))
            );
        }
    }, [searchQuery, ledgers]);

    const fetchLedgers = async () => {
        setLoading(true);
        try {
            const data = await apiClient({
                url: "ledger?view=ledger"
            });
            setLedgers(data.ledgers);
            setFilteredLedgers(data.ledgers);
        } catch (err) {
            console.error('Error fetching ledgers:', err);
        } finally {
            setLoading(false)
        }
    };

    const handleOpenLedgerDialog = (ledger = null) => {
        if (ledger) {
            setEditLedgerName(ledger.name);
            setEditLedgerId(ledger._id);
            setEditLedgerImage(ledger.profileImage || null);
        } else {
            setEditLedgerName("");
            setEditLedgerId(null);
            setEditLedgerImage(null);
        }
        setEditOpen(true);
    };

    const handleSaveLedger = async () => {
        const name = editLedgerName.trim();
        if (!name) return toast.warn("Ledger name can't be empty");
        if (name.length < 3)
            return toast.warn("Ledger name must be at least 3 characters");

        const formData = new FormData();
        formData.append("name", name);

        if (editLedgerImage instanceof File) {
            let resizedfile = await handleImage(170, editLedgerImage);
            formData.append("image", resizedfile);
        }

        try {
            setLoading(true);
            const data = await apiClient({
                url: editLedgerId ? `ledger/${editLedgerId}` : "ledger",
                method: editLedgerId ? "PUT" : "POST",
                body: formData
            });

            toast.success(data.message || (editLedgerId ? "Ledger updated" : "Ledger created"));
            setEditOpen(false);
            fetchLedgers();
        } catch (err) {
            console.error('Error saving ledger:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteLedger = async (ledger) => {
        swal({
            title: `Are you sure to Delete ${ledger.name}'s Ledger?`,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                try {
                    const data = await apiClient({
                        url: `ledger/${ledger._id}`,
                        method: "DELETE"
                    });
                    toast.success(data.message || "Ledger deleted");
                    fetchLedgers();
                } catch (err) {
                    console.error('Error deleting ledger:', err);
                }
            }
        });
    };

    const handleNavigate = (ledger) => {
        if (ledger) {
            let url = `./${ledger._id}?name=${encodeURIComponent(ledger.name)}`;
            if (ledger.profileImage) {
                url += `&profileimage=${encodeURIComponent(ledger.profileImage)}`;
            }
            if (ledger.empId) {
                url += `&empid=${encodeURIComponent(ledger.empId)}`;
            }
            if (ledger.ledgerType) {
                url += `&ledgertype=${encodeURIComponent(ledger.ledgerType)}`;
            }
            return navigate(url);
        }
    };

    const inputref = useRef(null);

    const stats = filteredLedgers.reduce((acc, curr) => {
        const bal = curr.netBalance || 0;
        if (bal > 0) {
            acc.payable += bal;
        } else if (bal < 0) {
            acc.receivable += Math.abs(bal);
        }
        return acc;
    }, { payable: 0, receivable: 0 });

    const netBalance = stats.payable - stats.receivable;

    return (
        <div className="w-full max-w-6xl mx-auto  bg-white rounded">
            <div className="p-1 md:p-4 py-4 mb-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Total Payable Card */}
                    <motion.div 
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative overflow-hidden bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                    >
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Total Payable</span>
                            <span className="text-xs font-medium text-emerald-600/80 mt-0.5">Amount We Owe</span>
                            <span className="text-2xl font-extrabold text-emerald-950 mt-2">
                                ₹ {stats.payable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="p-3 bg-emerald-100/50 rounded-xl text-emerald-700">
                            <Coins className="w-6 h-6" />
                        </div>
                        <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-100/20 rounded-full blur-xl pointer-events-none"></span>
                    </motion.div>

                    {/* Total Receivable Card */}
                    <motion.div 
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative overflow-hidden bg-gradient-to-br from-rose-50/60 to-white border border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                    >
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-widest">Total Receivable</span>
                            <span className="text-xs font-medium text-rose-600/80 mt-0.5">Amount Owed to Us</span>
                            <span className="text-2xl font-extrabold text-rose-950 mt-2">
                                ₹ {stats.receivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="p-3 bg-rose-100/50 rounded-xl text-rose-700">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-100/20 rounded-full blur-xl pointer-events-none"></span>
                    </motion.div>

                    {/* Net Balance Card */}
                    <motion.div 
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`relative overflow-hidden bg-gradient-to-br border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${
                            netBalance >= 0 
                                ? 'from-teal-50/60 to-white border-teal-100' 
                                : 'from-amber-50/60 to-white border-amber-100'
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className={`text-[11px] font-bold uppercase tracking-widest ${
                                netBalance >= 0 ? 'text-teal-800' : 'text-amber-800'
                            }`}>
                                {netBalance >= 0 ? 'Net Payable' : 'Net Receivable'}
                            </span>
                            <span className={`text-xs font-medium mt-0.5 ${
                                netBalance >= 0 ? 'text-teal-600/80' : 'text-amber-600/80'
                            }`}>
                                {netBalance >= 0 ? 'Balance We Owe' : 'Balance Owed to Us'}
                            </span>
                            <span className={`text-2xl font-extrabold mt-2 ${
                                netBalance >= 0 ? 'text-teal-950' : 'text-amber-950'
                            }`}>
                                ₹ {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className={`p-3 rounded-xl ${
                            netBalance >= 0 ? 'bg-teal-100/50 text-teal-700' : 'bg-amber-100/50 text-amber-700'
                        }`}>
                            <Scale className="w-6 h-6" />
                        </div>
                        <span className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-xl pointer-events-none ${
                            netBalance >= 0 ? 'bg-teal-100/20' : 'bg-amber-100/20'
                        }`}></span>
                    </motion.div>
                </div>

                {/* Toolbar */}
                <div className="flex mb-5 gap-3 flex-wrap justify-between items-center bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <div className="flex gap-3 items-center flex-wrap w-full md:w-auto">
                        <TextField
                            size="small"
                            label="Search Ledger"
                            className="w-full md:w-[220px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search className="text-gray-400" size={18} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                }
                            }}
                        />

                        {/* View Switcher Toggle */}
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm">
                            <button
                                onClick={() => {
                                    setViewType('card');
                                    localStorage.setItem('ledgerViewType', 'card');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    viewType === 'card'
                                        ? 'bg-teal-700 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                Card
                            </button>
                            <button
                                onClick={() => {
                                    setViewType('table');
                                    localStorage.setItem('ledgerViewType', 'table');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    viewType === 'table'
                                        ? 'bg-teal-700 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <Table className="w-3.5 h-3.5" />
                                Table
                            </button>
                        </div>
                    </div>
                    <Button 
                        className="w-full md:w-auto px-6 py-2" 
                        variant="contained" 
                        onClick={() => handleOpenLedgerDialog()}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: '600',
                            backgroundColor: '#0f766e', // teal-700
                            '&:hover': {
                                backgroundColor: '#115e59', // teal-800
                            }
                        }}
                    >
                        Add Ledger
                    </Button>
                </div>

                {loading ? <Loader /> :
                    <div className="w-full">
                        {viewType === 'card' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredLedgers.map((l, ind) => (
                                                                    <motion.div
                                        key={ind}
                                        onClick={() => handleNavigate(l)}
                                        whileHover={{ y: -4 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                        className="relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-3 bg-white flex flex-col justify-between h-[110px]"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-2.5 items-center">
                                                <MotionAvatar
                                                    layoutId={`ledger-avatar-${l._id}`}
                                                    sx={{ width: 38, height: 38 }}
                                                    alt={l.name}
                                                    src={cloudinaryUrl(l.profileImage, {
                                                        format: "webp",
                                                        width: 100,
                                                        height: 100,
                                                    })}
                                                    transition={{
                                                        layout: {
                                                            duration: 0.3,
                                                            ease: "easeInOut",
                                                        },
                                                    }}
                                                    className="border-2 border-white shadow-sm"
                                                />

                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[13px] md:text-[14px] font-bold text-gray-800 capitalize leading-tight">
                                                        {l.name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                                            l.ledgerType === 'employee' 
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                            {l.ledgerType || 'Custom'}
                                                        </span>
                                                        {l.empId && (
                                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                                                ID: {l.empId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <IconButton onClick={(e) => handleMenuOpen(e, l)} size="small" className="-mt-1 -mr-2 hover:bg-gray-50">
                                                <MoreVertical size={16} className="text-gray-500" />
                                            </IconButton>
                                        </div>

                                        {/* Balance */}
                                        <div className="flex justify-between items-end mt-auto">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                l.netBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                            }`}>
                                                {l.netBalance >= 0 ? 'Payable' : 'Receivable'}
                                            </span>
                                            <p className={`text-[16px] md:text-lg font-bold leading-none ${
                                                l.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                                            }`}>
                                                ₹ {Math.abs(l.netBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        {/* Left Accent Border */}
                                        <span className={`w-[4px] h-full absolute left-0 top-0 ${
                                            l.netBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}></span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto border border-gray-150 rounded-2xl shadow-sm bg-white">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50/75">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Ledger
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Balance Status
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Net Balance
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredLedgers.map((l, ind) => (
                                            <tr 
                                                key={ind} 
                                                onClick={() => handleNavigate(l)}
                                                className="hover:bg-teal-50/15 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <MotionAvatar
                                                            layoutId={`ledger-avatar-${l._id}`}
                                                            sx={{ width: 38, height: 38 }}
                                                            alt={l.name}
                                                            src={cloudinaryUrl(l.profileImage, {
                                                                format: "webp",
                                                                width: 100,
                                                                height: 100,
                                                            })}
                                                            transition={{
                                                                layout: {
                                                                    duration: 0.3,
                                                                    ease: "easeInOut",
                                                                },
                                                            }}
                                                            className="border-2 border-white shadow-sm"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-800 capitalize leading-tight">
                                                                {l.name}
                                                            </span>
                                                            {l.empId && (
                                                                <span className="text-xs text-gray-400 font-medium mt-0.5">
                                                                    EMP ID: {l.empId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                                        l.ledgerType === 'employee' 
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                        {l.ledgerType || 'Custom'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                        l.netBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                                    }`}>
                                                        {l.netBalance >= 0 ? 'Payable' : 'Receivable'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`text-sm font-bold ${
                                                        l.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                                                    }`}>
                                                        ₹ {Math.abs(l.netBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                                    <IconButton onClick={(e) => handleMenuOpen(e, l)} size="small" className="hover:bg-gray-50">
                                                        <MoreVertical size={16} className="text-gray-500" />
                                                    </IconButton>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {filteredLedgers?.length < 1 && (
                            <div className="w-full text-center py-12 text-gray-400 font-semibold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                No Ledgers found matching the search criteria.
                            </div>
                        )}
                    </div>}

                {/* Shared Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        elevation: 1,
                    }}
                >
                    <MenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClose();
                            handleNavigate(selectedLedger);
                        }}
                    >
                        <Eye size={16} className="mr-2" /> See
                    </MenuItem>
                    <MenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClose();
                            handleOpenLedgerDialog(selectedLedger);
                        }}
                    >
                        <Edit2 size={16} className="mr-2" /> Edit
                    </MenuItem>
                    <MenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClose();
                            deleteLedger(selectedLedger);
                        }}
                    >
                        <Trash2 size={16} className="text-red-600 mr-2" /> Delete
                    </MenuItem>
                </Menu>
            </div>

            <Modalbox open={editOpen} onClose={() => {
                setEditOpen(false);
            }}>
                <div className="membermodal w-[300px]">
                    <div className="whole" >
                        <div className="modalhead">{editLedgerId ? "Edit Ledger" : "Add Ledger"}</div>
                        <span className="modalcontent ">
                            <TextField
                                autoFocus
                                size="small"
                                fullWidth
                                margin="dense"
                                label="Ledger Name"
                                value={editLedgerName}
                                onChange={(e) => setEditLedgerName(e.target.value)}
                            />

                            <div className="mt-1 items-center  w-fit relative">
                                <input
                                    style={{ display: "none" }}
                                    type="file"
                                    onChange={(e) => setEditLedgerImage(e.target.files[0])}
                                    ref={inputref}
                                    accept="image/*"
                                    id="fileInput"
                                />

                                <Avatar
                                    sx={{ width: 80, height: 80 }}
                                    alt={editLedgerName}
                                    src={
                                        editLedgerImage
                                            ? editLedgerImage instanceof File
                                                ? URL.createObjectURL(editLedgerImage)
                                                : editLedgerImage
                                            : ""
                                    }
                                />

                                <span
                                    onClick={() => inputref.current.click()}
                                    className="absolute -bottom-1 -right-1 rounded-full bg-teal-900 text-white p-1.5 cursor-pointer"
                                >
                                    <Edit2 size={14} />
                                </span>
                            </div>
                        </span>
                        <div className="modalfooter">
                            <Button variant="outlined" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button disabled={loading} variant="contained" onClick={handleSaveLedger}>
                                {editLedgerId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modalbox>

        </div >
    );
};

export default LedgerListPage;
