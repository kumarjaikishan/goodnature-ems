import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import { swal } from "../../../utils/confirmDialog";
import useImageUpload from "../../../utils/imageresizer";
import { useSelector } from "react-redux";
import Modalbox from "../../../components/custommodal/Modalbox";
import Loader from "../../../utils/loader";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { LayoutGrid, Table, Coins, Wallet, Scale, Search, MoreVertical, Eye, Edit2, Trash2, Plus, X } from "lucide-react";

// Custom UI Components
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

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
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [viewType, setViewType] = useState(localStorage.getItem('ledgerViewType') || 'card');
    const menuRef = useRef(null);

    // Close menu when clicked outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchLedgers();
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
            setLedgers(data.ledgers || []);
            setFilteredLedgers(data.ledgers || []);
        } catch (err) {
            console.error('Error fetching ledgers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenLedgerDialog = (ledgerItem = null) => {
        if (ledgerItem) {
            setEditLedgerName(ledgerItem.name);
            setEditLedgerId(ledgerItem._id);
            setEditLedgerImage(ledgerItem.profileImage || null);
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

    const deleteLedger = async (ledgerItem) => {
        swal({
            title: `Are you sure to Delete ${ledgerItem.name}'s Ledger?`,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                try {
                    const data = await apiClient({
                        url: `ledger/${ledgerItem._id}`,
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

    const handleNavigate = (ledgerItem) => {
        if (ledgerItem) {
            let url = `./${ledgerItem._id}?name=${encodeURIComponent(ledgerItem.name)}`;
            if (ledgerItem.profileImage) {
                url += `&profileimage=${encodeURIComponent(ledgerItem.profileImage)}`;
            }
            if (ledgerItem.empId) {
                url += `&empid=${encodeURIComponent(ledgerItem.empId)}`;
            }
            if (ledgerItem.ledgerType) {
                url += `&ledgertype=${encodeURIComponent(ledgerItem.ledgerType)}`;
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
        <div className="w-full max-w-6xl mx-auto space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Payable Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Total Payable</span>
                        <span className="text-xs font-medium text-emerald-600/80 mt-0.5">Amount We Owe</span>
                        <span className="text-2xl font-black text-emerald-950 mt-2">
                            ₹ {stats.payable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-100/60 rounded-xl text-emerald-700">
                        <Coins className="w-6 h-6" />
                    </div>
                </div>

                {/* Total Receivable Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/70 to-white border border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-rose-800 uppercase tracking-widest">Total Receivable</span>
                        <span className="text-xs font-medium text-rose-600/80 mt-0.5">Amount Owed to Us</span>
                        <span className="text-2xl font-black text-rose-950 mt-2">
                            ₹ {stats.receivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="p-3 bg-rose-100/60 rounded-xl text-rose-700">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>

                {/* Net Balance Card */}
                <div className={`relative overflow-hidden bg-gradient-to-br border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${
                    netBalance >= 0 
                        ? 'from-teal-50/70 to-white border-teal-100' 
                        : 'from-amber-50/70 to-white border-amber-100'
                }`}>
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
                        <span className={`text-2xl font-black mt-2 ${
                            netBalance >= 0 ? 'text-teal-950' : 'text-amber-950'
                        }`}>
                            ₹ {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className={`p-3 rounded-xl ${
                        netBalance >= 0 ? 'bg-teal-100/60 text-teal-700' : 'bg-amber-100/60 text-amber-700'
                    }`}>
                        <Scale className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex gap-3 items-center flex-wrap w-full md:w-auto">
                    <div className="w-full sm:w-[240px]">
                        <Input
                            size="sm"
                            placeholder="Search ledger..."
                            icon={<Search size={14} className="text-slate-400" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setViewType('card');
                                localStorage.setItem('ledgerViewType', 'card');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                viewType === 'card'
                                    ? 'bg-teal-700 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Card
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewType('table');
                                localStorage.setItem('ledgerViewType', 'table');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                viewType === 'table'
                                    ? 'bg-teal-700 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5" />
                            Table
                        </button>
                    </div>
                </div>

                <Button
                    icon={<Plus size={15} />}
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenLedgerDialog()}
                >
                    Add Ledger
                </Button>
            </div>

            {loading ? <Loader /> : (
                <div className="w-full">
                    {viewType === 'card' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredLedgers.map((l, ind) => (
                                <div
                                    key={ind}
                                    onClick={() => handleNavigate(l)}
                                    className="relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-3.5 bg-white flex flex-col justify-between h-[120px]"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2.5 items-center">
                                            {l.profileImage ? (
                                                <img
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                                    alt={l.name}
                                                    src={cloudinaryUrl(l.profileImage, {
                                                        format: "webp",
                                                        width: 100,
                                                        height: 100,
                                                    })}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-200">
                                                    {l.name?.charAt(0)?.toUpperCase() || 'L'}
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-xs font-bold text-slate-800 capitalize leading-tight">
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
                                                        <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                                                            ID: {l.empId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dropdown Action Menu */}
                                        <div className="relative" ref={activeMenuId === l._id ? menuRef : null}>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === l._id ? null : l._id);
                                                }}
                                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenuId === l._id && (
                                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(null);
                                                            handleNavigate(l);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(null);
                                                            handleOpenLedgerDialog(l);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Edit2 size={14} /> Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(null);
                                                            deleteLedger(l);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className="flex justify-between items-end mt-auto">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                            l.netBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                        }`}>
                                            {l.netBalance >= 0 ? 'Payable' : 'Receivable'}
                                        </span>
                                        <p className={`text-base font-bold leading-none ${
                                            l.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                                        }`}>
                                            ₹ {Math.abs(l.netBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {/* Left Accent Bar */}
                                    <span className={`w-[4px] h-full absolute left-0 top-0 ${
                                        l.netBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}></span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Ledger
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Balance Status
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Net Balance
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredLedgers.map((l, ind) => (
                                        <tr 
                                            key={ind} 
                                            onClick={() => handleNavigate(l)}
                                            className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {l.profileImage ? (
                                                        <img
                                                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
                                                            alt={l.name}
                                                            src={cloudinaryUrl(l.profileImage, {
                                                                format: "webp",
                                                                width: 100,
                                                                height: 100,
                                                            })}
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-200">
                                                            {l.name?.charAt(0)?.toUpperCase() || 'L'}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800 capitalize leading-tight">
                                                            {l.name}
                                                        </span>
                                                        {l.empId && (
                                                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                                EMP ID: {l.empId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                                    l.ledgerType === 'employee' 
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                    {l.ledgerType || 'Custom'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                    l.netBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                                }`}>
                                                    {l.netBalance >= 0 ? 'Payable' : 'Receivable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-right">
                                                <span className={`text-xs font-bold ${
                                                    l.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                                                }`}>
                                                    ₹ {Math.abs(l.netBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative inline-block" ref={activeMenuId === l._id ? menuRef : null}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveMenuId(activeMenuId === l._id ? null : l._id)}
                                                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {activeMenuId === l._id && (
                                                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-30 text-left animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setActiveMenuId(null); handleNavigate(l); }}
                                                                className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Eye size={14} /> View
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setActiveMenuId(null); handleOpenLedgerDialog(l); }}
                                                                className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Edit2 size={14} /> Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setActiveMenuId(null); deleteLedger(l); }}
                                                                className="w-full px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {filteredLedgers?.length < 1 && (
                        <div className="w-full text-center py-12 text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                            No Ledgers found matching the search criteria.
                        </div>
                    )}
                </div>
            )}

            {/* Add / Edit Ledger Modal */}
            <Modalbox open={editOpen} onClose={() => setEditOpen(false)}>
                <div className="w-full max-w-sm p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">
                            {editLedgerId ? "Edit Ledger" : "Add New Ledger"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setEditOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <Input
                            autoFocus
                            label="Ledger Name"
                            value={editLedgerName}
                            onChange={(e) => setEditLedgerName(e.target.value)}
                            placeholder="Enter account / ledger name"
                        />

                        <div className="flex flex-col items-center justify-center pt-2">
                            <input
                                style={{ display: "none" }}
                                type="file"
                                onChange={(e) => setEditLedgerImage(e.target.files[0])}
                                ref={inputref}
                                accept="image/*"
                                id="fileInput"
                            />

                            <div className="relative group cursor-pointer" onClick={() => inputref.current?.click()}>
                                {editLedgerImage ? (
                                    <img
                                        className="w-20 h-20 rounded-full object-cover border-2 border-teal-500 shadow-md"
                                        alt={editLedgerName}
                                        src={
                                            editLedgerImage instanceof File
                                                ? URL.createObjectURL(editLedgerImage)
                                                : editLedgerImage
                                        }
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300 flex items-center justify-center font-bold text-xl">
                                        {editLedgerName?.charAt(0)?.toUpperCase() || '+'}
                                    </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 rounded-full bg-teal-800 text-white p-1.5 shadow-md">
                                    <Edit2 size={13} />
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-2">Click to upload avatar / image</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            loading={loading}
                            onClick={handleSaveLedger}
                        >
                            {editLedgerId ? "Update Ledger" : "Create Ledger"}
                        </Button>
                    </div>
                </div>
            </Modalbox>
        </div>
    );
};

export default LedgerListPage;
