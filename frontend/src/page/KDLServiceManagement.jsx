import React, { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

const emptyForm = { ten_dich_vu: "", gia_tien: "", mo_ta: "" };

const KDLServiceManagement = ({ user }) => {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await api.get("/businesses/kdl/services");
      setServices(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải gói dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/businesses/kdl/services/${editingId}`, form);
        toast.success("Đã cập nhật gói dịch vụ");
      } else {
        await api.post("/businesses/kdl/services", form);
        toast.success("Đã tạo gói dịch vụ");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không lưu được gói dịch vụ");
    }
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setForm({
      ten_dich_vu: service.ten_dich_vu || "",
      gia_tien: service.gia_tien || "",
      mo_ta: service.mo_ta || "",
    });
  };

  const removeService = async (id) => {
    try {
      await api.delete(`/businesses/kdl/services/${id}`);
      toast.success("Đã xóa gói dịch vụ");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không xóa được gói dịch vụ");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-10">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Gói dịch vụ</h1>
            <p className="text-sm text-slate-500">
              Quản lý vé, combo hoặc dịch vụ bổ sung để khách du lịch dễ chọn hơn.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-4"
          >
            <h2 className="text-xl font-black text-slate-800">
              {editingId ? "Chỉnh sửa gói" : "Tạo gói mới"}
            </h2>
            <input
              value={form.ten_dich_vu}
              onChange={(e) => setForm((prev) => ({ ...prev, ten_dich_vu: e.target.value }))}
              placeholder="Tên gói dịch vụ"
              className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-bold text-slate-700 outline-none"
            />
            <input
              type="number"
              value={form.gia_tien}
              onChange={(e) => setForm((prev) => ({ ...prev, gia_tien: e.target.value }))}
              placeholder="Giá tiền"
              className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-bold text-slate-700 outline-none"
            />
            <textarea
              rows="4"
              value={form.mo_ta}
              onChange={(e) => setForm((prev) => ({ ...prev, mo_ta: e.target.value }))}
              placeholder="Mô tả nhanh những gì khách sẽ nhận được"
              className="w-full rounded-[1.8rem] bg-slate-50 border border-slate-100 px-5 py-4 font-medium text-slate-700 outline-none"
            />
            <div className="flex gap-3">
              <button className="px-5 py-3 rounded-xl bg-blue-600 text-white font-black">
                {editingId ? "Lưu cập nhật" : "Tạo gói"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-black"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-4">
            {loading ? (
              <div className="bg-white rounded-[2rem] p-10 text-center text-slate-400 font-bold">
                Đang tải gói dịch vụ...
              </div>
            ) : services.length ? (
              services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                >
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{service.ten_dich_vu}</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{service.mo_ta}</p>
                    <p className="mt-4 text-blue-600 font-black text-lg">
                      {Number(service.gia_tien || 0).toLocaleString()}đ
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(service)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-black"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => removeService(service.id)}
                      className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-black"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[2rem] p-10 text-center text-slate-400 font-bold">
                Chưa có gói dịch vụ nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDLServiceManagement;
