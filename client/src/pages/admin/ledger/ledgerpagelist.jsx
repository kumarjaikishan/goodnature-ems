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

const LedgerListPage = ({ category = "all", defaultView = "table" }) => {
    const [ledgers, setLedgers] = useState([]);
    const [filteredLedgers, setFilteredLedgers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [balanceFilter, setBalanceFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name_asc");
    const navigate = useNavigate();
    const { ledger } = useSelector(e => e.user);
    const [editLedgerId, setEditLedgerId] = useState(null);
    const [editLedgerName, setEditLedgerName] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [editLedgerImage, setEditLedgerImage] = useState(null);
    const { handleImage } = useImageUpload();
    const [loading, setLoading] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [viewType, setViewType] = useState(() => {
        return localStorage.getItem(`ledgerViewType_${category}`) || defaultView;
    });
    const menuRef = useRef(null);

    // Sync viewType when category changes
    useEffect(() => {
        const savedView = localStorage.getItem(`ledgerViewType_${category}`);
        if (savedView) {
            setViewType(savedView);
        } else {
            setViewType(defaultView);
        }
    }, [category, defaultView]);

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
    }, [category]);

    useEffect(() => {
        if (!ledgers) return;
        let result = [...ledgers];

        // 1. First enforce page category if specific page
        if (category && category !== "all") {
            result = result.filter((l) => {
                const isEmployee = l.ledgerType === 'employee' || Boolean(l.employeeId) || (Boolean(l.empId) && !l.sponsorId && !l.kisanSellerId);
                const isKisan = l.ledgerType === 'kisan' || Boolean(l.kisanSellerId);
                const isSponsor = l.ledgerType === 'sponsor' || Boolean(l.sponsorId);
                const hasBranch = Boolean(l.sponsorId?.branchIds && l.sponsorId.branchIds.length > 0);
                const isAssociate = isSponsor && Boolean(l.sponsorId?.sponsorId);
                const isBranchPartner = isSponsor && hasBranch;
                const isPartner = isSponsor && !l.sponsorId?.sponsorId;

                if (category === 'employee') return isEmployee && !isSponsor && !isKisan;
                if (category === 'seller' || category === 'kisan') return isKisan;
                if (category === 'associate') return isAssociate;
                if (category === 'partner') return isPartner && !isBranchPartner;
                if (category === 'branch_partner') return isBranchPartner;
                return true;
            });
        }

        // 2. Search query filter (name or empId)
        if (searchQuery.trim() !== "") {
            const lower = searchQuery.toLowerCase().trim();
            result = result.filter((l) => 
                (l.name && l.name.toLowerCase().includes(lower)) ||
                (l.empId && String(l.empId).toLowerCase().includes(lower))
            );
        }

        // 3. Ledger Type Filter (when category is all)
        if (category === "all" && typeFilter !== "all") {
            result = result.filter((l) => {
                const isEmployee = l.ledgerType === 'employee' || Boolean(l.employeeId) || (Boolean(l.empId) && !l.sponsorId && !l.kisanSellerId);
                const isKisan = l.ledgerType === 'kisan' || Boolean(l.kisanSellerId);
                const isSponsor = l.ledgerType === 'sponsor' || Boolean(l.sponsorId);
                const isAssociate = isSponsor && Boolean(l.sponsorId?.sponsorId);
                const hasBranch = Boolean(l.sponsorId?.branchIds && l.sponsorId.branchIds.length > 0);
                const isBranchPartner = isSponsor && hasBranch;
                const isPartner = isSponsor && !l.sponsorId?.sponsorId && !isBranchPartner;
                
                if (typeFilter === 'employee') return isEmployee && !isSponsor && !isKisan;
                if (typeFilter === 'seller' || typeFilter === 'kisan') return isKisan;
                if (typeFilter === 'partner') return isPartner;
                if (typeFilter === 'branch_partner') return isBranchPartner;
                if (typeFilter === 'associate') return isAssociate;
                if (typeFilter === 'sponsor') return isSponsor;
                if (typeFilter === 'custom') return !isEmployee && !isSponsor && !isKisan;
                return true;
            });
        }

        // 4. Balance Status Filter
        if (balanceFilter === "payable") {
            result = result.filter((l) => (l.netBalance || 0) > 0);
        } else if (balanceFilter === "receivable") {
            result = result.filter((l) => (l.netBalance || 0) < 0);
        } else if (balanceFilter === "zero") {
            result = result.filter((l) => (l.netBalance || 0) === 0);
        }

        // 5. Sorting
        result.sort((a, b) => {
            if (sortBy === "name_asc") {
                return (a.name || "").localeCompare(b.name || "");
            } else if (sortBy === "name_desc") {
                return (b.name || "").localeCompare(a.name || "");
            } else if (sortBy === "balance_desc") {
                return Math.abs(b.netBalance || 0) - Math.abs(a.netBalance || 0);
            } else if (sortBy === "balance_asc") {
                return Math.abs(a.netBalance || 0) - Math.abs(b.netBalance || 0);
            }
            return 0;
        });

        setFilteredLedgers(result);
    }, [searchQuery, typeFilter, balanceFilter, sortBy, ledgers, category]);

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
            let url = `/dashboard/ledger/${ledgerItem._id}?name=${encodeURIComponent(ledgerItem.name)}`;
            if (ledgerItem.profileImage) {
                url += `&profileimage=${encodeURIComponent(ledgerItem.profileImage)}`;
            }
            if (ledgerItem.empId) {
                url += `&empid=${encodeURIComponent(ledgerItem.empId)}`;
            }
            const itemType = ledgerItem.ledgerType || (ledgerItem.employeeId ? 'employee' : ledgerItem.sponsorId ? 'sponsor' : ledgerItem.kisanSellerId ? 'kisan' : 'custom');
            url += `&ledgertype=${encodeURIComponent(itemType)}`;
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

    const pageTitles = {
        employee: "Employee Financial Ledgers",
        seller: "Kisan / Seller Land Purchase Ledgers",
        associate: "Business Associates Commission Ledgers",
        partner: "Business Partners Commission Ledgers",
        branch_partner: "Branch Partners Commission Ledgers",
        all: "Account Ledgers Overview"
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-4">
            {/* Page Header */}
            {category !== "all" && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{pageTitles[category] || "Ledgers"}</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Real-time balances, credits, debits & statement tracking</p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Payable Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Total Payable</span>
                        <span className="text-xs font-medium text-emerald-600/80 mt-0.5">To Pay</span>
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
                        <span className="text-xs font-medium text-rose-600/80 mt-0.5">To Receive</span>
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
                            {netBalance >= 0 ? 'Net Balance to Pay' : 'Net Balance to Receive'}
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

            {/* Toolbar & Filters */}
            <div className="bg-white p-3 md:p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2.5">
                    {/* Left: Search & View Toggle */}
                    <div className="flex gap-2.5 items-center flex-wrap flex-1 min-w-[280px]">
                        <div className="w-full sm:w-[220px]">
                            <Input
                                size="sm"
                                placeholder="Search name or ID..."
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
                                    localStorage.setItem(`ledgerViewType_${category}`, 'card');
                                    localStorage.setItem('ledgerViewType', 'card');
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    viewType === 'card'
                                        ? 'bg-teal-700 text-white shadow-xs'
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
                                    localStorage.setItem(`ledgerViewType_${category}`, 'table');
                                    localStorage.setItem('ledgerViewType', 'table');
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    viewType === 'table'
                                        ? 'bg-teal-700 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                }`}
                            >
                                <Table className="w-3.5 h-3.5" />
                                Table
                            </button>
                        </div>
                    </div>

                    {/* Right: Add Ledger Button */}
                    <Button
                        icon={<Plus size={15} />}
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenLedgerDialog()}
                    >
                        Add Ledger
                    </Button>
                </div>

                {/* Filter Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Type Filter (Shown only in All view) */}
                        {category === "all" && (
                            <div className="flex items-center gap-1.5">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type:</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer"
                                >
                                    <option value="all">All Ledgers ({ledgers.length})</option>
                                    <option value="employee">
                                        Employees ({ledgers.filter(l => (l.ledgerType === 'employee' || Boolean(l.employeeId) || (Boolean(l.empId) && !l.sponsorId && !l.kisanSellerId))).length})
                                    </option>
                                    <option value="seller">
                                        Sellers / Kisans ({ledgers.filter(l => (l.ledgerType === 'kisan' || Boolean(l.kisanSellerId))).length})
                                    </option>
                                    <option value="partner">
                                        Business Partners ({ledgers.filter(l => (l.ledgerType === 'sponsor' || Boolean(l.sponsorId)) && !l.sponsorId?.sponsorId && (!l.sponsorId?.branchIds || l.sponsorId.branchIds.length === 0)).length})
                                    </option>
                                    <option value="branch_partner">
                                        Branch Partners ({ledgers.filter(l => (l.ledgerType === 'sponsor' || Boolean(l.sponsorId)) && Boolean(l.sponsorId?.branchIds && l.sponsorId.branchIds.length > 0)).length})
                                    </option>
                                    <option value="associate">
                                        Business Associates ({ledgers.filter(l => (l.ledgerType === 'sponsor' || Boolean(l.sponsorId)) && Boolean(l.sponsorId?.sponsorId)).length})
                                    </option>
                                    <option value="custom">
                                        Custom Ledgers ({ledgers.filter(l => !(l.ledgerType === 'employee' || Boolean(l.employeeId)) && !(l.ledgerType === 'sponsor' || Boolean(l.sponsorId)) && !(l.ledgerType === 'kisan' || Boolean(l.kisanSellerId))).length})
                                    </option>
                                </select>
                            </div>
                        )}

                        {/* Balance Filter */}
                        <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Balance:</label>
                            <select
                                value={balanceFilter}
                                onChange={(e) => setBalanceFilter(e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer"
                            >
                                <option value="all">All Balances</option>
                                <option value="payable">Payable (To Pay)</option>
                                <option value="receivable">Receivable (To Receive)</option>
                                <option value="zero">Settled (₹ 0.00)</option>
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sort:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer"
                            >
                                <option value="name_asc">Name (A → Z)</option>
                                <option value="name_desc">Name (Z → A)</option>
                                <option value="balance_desc">Highest Balance First</option>
                                <option value="balance_asc">Lowest Balance First</option>
                            </select>
                        </div>

                        {/* Reset Filter Button */}
                        {(searchQuery || typeFilter !== 'all' || balanceFilter !== 'all' || sortBy !== 'name_asc') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setTypeFilter("all");
                                    setBalanceFilter("all");
                                    setSortBy("name_asc");
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={13} /> Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Filter count indicator */}
                    <div className="text-[11px] font-semibold text-slate-500">
                        Showing <span className="text-teal-700 font-bold">{filteredLedgers.length}</span> of {ledgers.length} ledgers
                    </div>
                </div>
            </div>

            {loading ? <Loader /> : (
                <div className="w-full">
                    {viewType === 'card' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredLedgers.map((l, ind) => {
                                const isEmp = l.ledgerType === 'employee' || Boolean(l.employeeId);
                                const isKisan = l.ledgerType === 'kisan' || Boolean(l.kisanSellerId);
                                const isSpon = l.ledgerType === 'sponsor' || Boolean(l.sponsorId);
                                const hasBranch = Boolean(l.sponsorId?.branchIds && l.sponsorId.branchIds.length > 0);
                                const isAssociate = isSpon && Boolean(l.sponsorId?.sponsorId);
                                const isBranchPartner = isSpon && hasBranch;
                                const isPartner = isSpon && !l.sponsorId?.sponsorId && !isBranchPartner;

                                const tagLabel = isEmp
                                    ? 'Employee'
                                    : isKisan
                                    ? 'Seller/Kisan'
                                    : isBranchPartner
                                    ? 'Branch Partner'
                                    : isPartner
                                    ? 'Partner'
                                    : isAssociate
                                    ? 'Associate'
                                    : (l.ledgerType || 'Custom');

                                const tagClass = isEmp
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : isKisan
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : isBranchPartner
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                    : isPartner
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : isAssociate
                                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200';

                                return (
                                <div
                                    key={ind}
                                    onClick={() => handleNavigate(l)}
                                    className={`relative cursor-pointer rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-3.5 bg-white flex flex-col justify-between h-[125px] ${
                                        activeMenuId === l._id ? 'z-30 ring-1 ring-teal-500/20' : 'z-0'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2.5 items-center">
                                            {l.profileImage ? (
                                                <img
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                                                    alt={l.name}
                                                    src={cloudinaryUrl(l.profileImage, {
                                                        format: "webp",
                                                        width: 100,
                                                        height: 100,
                                                    })}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-200 shrink-0">
                                                    {l.name?.charAt(0)?.toUpperCase() || 'L'}
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <div className="text-xs font-bold text-slate-800 capitalize leading-tight truncate">
                                                    {l.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${tagClass}`}>
                                                        {tagLabel}
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
                                        <div className="relative shrink-0" ref={activeMenuId === l._id ? menuRef : null}>
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
                                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(null);
                                                            handleNavigate(l);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
                                                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
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
                                    <span className={`w-[4px] h-full absolute left-0 top-0 rounded-l-xl ${
                                        l.netBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}></span>
                                </div>
                                );
                            })}
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
                                        <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-36">
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
                                                                ID: {l.empId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                {(() => {
                                                    const isEmp = l.ledgerType === 'employee' || Boolean(l.employeeId);
                                                    const isKisan = l.ledgerType === 'kisan' || Boolean(l.kisanSellerId);
                                                    const isSpon = l.ledgerType === 'sponsor' || Boolean(l.sponsorId);
                                                    const hasBranch = Boolean(l.sponsorId?.branchIds && l.sponsorId.branchIds.length > 0);
                                                    const isAssociate = isSpon && Boolean(l.sponsorId?.sponsorId);
                                                    const isBranchPartner = isSpon && hasBranch;
                                                    const isPartner = isSpon && !l.sponsorId?.sponsorId && !isBranchPartner;

                                                    const tagLabel = isEmp
                                                        ? 'Employee'
                                                        : isKisan
                                                        ? 'Seller/Kisan'
                                                        : isBranchPartner
                                                        ? 'Branch Partner'
                                                        : isPartner
                                                        ? 'Partner'
                                                        : isAssociate
                                                        ? 'Associate'
                                                        : (l.ledgerType || 'Custom');

                                                    const tagClass = isEmp
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                        : isKisan
                                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        : isBranchPartner
                                                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                                        : isPartner
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        : isAssociate
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                        : 'bg-slate-50 text-slate-700 border border-slate-200';

                                                    return (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${tagClass}`}>
                                                            {tagLabel}
                                                        </span>
                                                    );
                                                })()}
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
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        title="View Ledger Statement"
                                                        onClick={() => handleNavigate(l)}
                                                        className="p-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-900 border border-teal-200 transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Edit Ledger"
                                                        onClick={() => handleOpenLedgerDialog(l)}
                                                        className="p-1.5 rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete Ledger"
                                                        onClick={() => deleteLedger(l)}
                                                        className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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
