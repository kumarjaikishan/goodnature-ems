import './department.css';
import { useEffect, useState } from 'react';
import { Send, Filter, Edit2, Trash2, Plus, Search } from 'lucide-react';
import { swal } from '../../../../utils/confirmDialog';
import DataTable from '@/components/common/DataTable';
import { adddepartment, columns, delette, update } from './departmenthelper';
import { useCustomStyles } from '../../attandence/attandencehelper';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const Department = () => {
  const [openmodal, setopenmodal] = useState(false);
  const [isload, setisload] = useState(false);
  const [departmentlist, setdepartmentlist] = useState([]);
  const [isupdate, setisupdate] = useState(false);
  const [filterattandence, setfilterattandence] = useState([]);
  const { branch, department } = useSelector(e => e.user);
  const [filtere, setfiltere] = useState({
    branch: 'all',
    department: "",
  });
  const isFilterActive = (
    filtere.branch !== 'all' ||
    filtere.department.trim() !== ''
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (!departmentlist || departmentlist.length === 0) return;

    const filtered = departmentlist.filter(dep => {
      const matchBranch =
        filtere.branch === 'all' || dep.branchid === filtere.branch;

      const matchDepartment =
        filtere.department.trim() === '' ||
        dep.dep_name?.toLowerCase().includes(filtere.department.trim().toLowerCase());

      return matchBranch && matchDepartment;
    });

    setfilterattandence(filtered);
  }, [filtere, departmentlist]);

  const init = {
    departmentId: '',
    branchId: '',
    department: "",
    description: ''
  };
  const [inp, setInp] = useState(init);

  useEffect(() => {
    if (department && department.length > 0) {
      let sno = 1;
      const data = department.map((dep) => {
        return {
          id: dep._id,
          sno: sno++,
          branchid: dep?.branchId?._id,
          branch: dep?.branchId?.name,
          dep_name: dep?.department,
          action: (
            <div className="action flex gap-2 items-center">
              <button
                type="button"
                className="edit text-teal-600 hover:text-teal-700 p-1 rounded hover:bg-teal-50 transition cursor-pointer"
                title="Edit"
                onClick={() => edite(dep)}
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="delete text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                title="Delete"
                onClick={() => deletee(dep._id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        };
      });
      setdepartmentlist(data);
    }
  }, [department]);

  const handleChange = (e, name) => {
    setInp({
      ...inp, [name]: e.target.value
    });
  };

  const adddepartcall = (e) => {
    e.preventDefault();
    adddepartment({ inp, setisload, setInp, setopenmodal, init, dispatch });
  };

  const edite = (depart) => {
    setisupdate(true);
    setInp({
      branchId: depart.branchId?._id || depart.branchId,
      departmentId: depart._id,
      department: depart.department,
      description: depart.description || ''
    });
    setopenmodal(true);
  };

  const deletee = (id) => {
    swal({
      title: 'Are you sure you want to delete this department?',
      text: 'Warning: Deleting this department may affect linked employees.',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        delette({ departmentId: id, setisload, dispatch });
      }
    });
  };

  const updatee = () => {
    update({ inp, setisload, setInp, setopenmodal, init, dispatch });
  };

  const branchOptions = [
    { label: 'All Branches', value: 'all' },
    ...(branch || []).map(b => ({ label: b.name, value: b._id }))
  ];

  const modalBranchOptions = (branch || []).map(b => ({ label: b.name, value: b._id }));

  return (
    <div className='department p-2 space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-3 w-full md:w-auto'>
          <div className="w-48">
            <Select
              size="sm"
              options={branchOptions}
              value={filtere.branch}
              onChange={(e) => setfiltere({ ...filtere, branch: e.target.value })}
            />
          </div>
          <div className="w-64">
            <Input
              size="sm"
              startIcon={Search}
              placeholder="Search Department..."
              value={filtere.department}
              onChange={(e) => setfiltere({ ...filtere, department: e.target.value })}
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          startIcon={Plus}
          onClick={() => {
            setisupdate(false);
            setInp(init);
            setopenmodal(true);
          }}
        >
          Add Department
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <DataTable
          customStyles={useCustomStyles()}
          columns={columns}
          data={isFilterActive ? filterattandence : departmentlist}
          pagination
          highlightOnHover
        />
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        open={openmodal}
        onClose={() => setopenmodal(false)}
        title={isupdate ? "Edit Department" : "Add Department"}
        subtitle="Configure department name and branch association"
        maxWidth="max-w-md"
      >
        <form onSubmit={isupdate ? (e) => { e.preventDefault(); updatee(); } : adddepartcall} className="space-y-4">
          <Select
            label="Branch"
            required
            options={modalBranchOptions}
            placeholder="Select Branch..."
            value={inp.branchId}
            onChange={(e) => handleChange(e, 'branchId')}
          />

          <Input
            label="Department Name"
            required
            placeholder="e.g. Sales, Human Resources"
            value={inp.department}
            onChange={(e) => handleChange(e, 'department')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">Description</label>
            <textarea
              rows={3}
              placeholder="Optional department description..."
              className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
              value={inp.description}
              onChange={(e) => handleChange(e, 'description')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setopenmodal(false);
                setisupdate(false);
                setInp(init);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isload}
              endIcon={Send}
            >
              {isupdate ? "Update Department" : "Add Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Department;
