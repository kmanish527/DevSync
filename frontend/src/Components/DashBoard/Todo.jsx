import React, { useEffect, useMemo, useState } from "react";
import Topbar from "./Topbar";
import BackButton from "../ui/backbutton";
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Filter } from "lucide-react";

// Mock-only UI for GSSOC To-Do page. Uses local state; backend wiring will follow.
export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = `${import.meta.env.VITE_API_URL}/api/tasks`;

  const [form, setForm] = useState({ title: "", description: "", deadline: "" });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | upcoming | completed
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: "", description: "", status: "pending", deadline: "" });

  const pendingTasks = useMemo(() => tasks.filter(t => t.status === "pending"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === "completed"), [tasks]);

  const filtered = (items) => {
    if (filter === "completed") return items.filter(t => t.status === "completed");
    if (filter === "upcoming") return items.filter(t => t.status === "pending").sort((a,b)=> new Date(a.deadline) - new Date(b.deadline));
    return items;
  };

  // Load tasks on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(API, { headers: { "x-auth-token": token } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.errors?.[0]?.msg || "Failed to fetch tasks");
        setTasks(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [API]);

  function resetForm() {
    setForm({ title: "", description: "", deadline: "" });
    setModalData({ title: "", description: "", status: "pending", deadline: "" });
    setEditingId(null);
  }

  function openAddModal() {
    setModalData({ title: "", description: "", status: "pending", deadline: "" });
    setEditingId(null);
    setShowModal(true);
  }

  function handleSubmitModal(e) {
    e.preventDefault();
    if (!modalData.title.trim()) return;
    const token = localStorage.getItem("token");
    if (editingId) {
      const taskId = editingId;
      fetch(`${API}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({
          title: modalData.title,
          description: modalData.description,
          status: modalData.status,
          deadline: modalData.deadline || null,
        })
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.errors?.[0]?.msg || "Failed to update task");
          setTasks(prev => prev.map(t => (t._id || t.id) === taskId ? data : t));
          setShowModal(false);
          resetForm();
        })
        .catch((e) => console.error(e));
    } else {
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({
          title: modalData.title,
          description: modalData.description,
          status: modalData.status,
          deadline: modalData.deadline || null,
        })
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.errors?.[0]?.msg || "Failed to create task");
          setTasks(prev => [data, ...prev]);
          setShowModal(false);
          resetForm();
        })
        .catch((e) => console.error(e));
    }
  }

  function toggleComplete(id) {
    const token = localStorage.getItem("token");
    const task = tasks.find(t => t._id === id || t.id === id);
    if (!task) return;
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const taskId = task._id || task.id;
    fetch(`${API}/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({ status: newStatus })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.errors?.[0]?.msg || "Failed to update task");
        setTasks(prev => prev.map(t => (t._id || t.id) === taskId ? data : t));
      })
      .catch((e) => console.error(e));
  }

  function removeTask(id) {
    const token = localStorage.getItem("token");
    const task = tasks.find(t => t._id === id || t.id === id);
    if (!task) return;
    const taskId = task._id || task.id;
    fetch(`${API}/${taskId}`, { method: "DELETE", headers: { "x-auth-token": token } })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.errors?.[0]?.msg || "Failed to delete task");
        }
        setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
      })
      .catch((e) => console.error(e));
  }

  function startEdit(task) {
    setEditingId(task._id || task.id);
    setModalData({
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline ? task.deadline.slice(0,16) : "",
    });
    setShowModal(true);
  }

  function GoalProgress() {
    // simplistic mock: completed / total
    const total = tasks.length || 1;
    const done = completedTasks.length;
    const percent = Math.round((done / total) * 100);
    return (
      <div className="p-4 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--card-foreground)] dark:text-gray-100">Goals</h3>
          <span className="text-sm text-[var(--muted-foreground)] dark:text-gray-400">{done}/{total} completed</span>
        </div>
        <div className="mt-3 w-full h-3 bg-[var(--accent)]/30 dark:bg-gray-600 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--primary)] dark:bg-blue-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] dark:text-gray-400">Track milestones like "Solve X LeetCode" or "Finish project".</p>
      </div>
    );
  }

  const TaskCard = ({ task }) => (
    <div className="p-4 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => toggleComplete(task._id || task.id)} className="mt-1 p-1 rounded-full hover:bg-[var(--accent)] dark:hover:bg-gray-700/50" aria-label="toggle-complete">
            {task.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--primary)] dark:text-blue-400" />
            ) : (
              <Circle className="w-5 h-5 text-[var(--muted-foreground)] dark:text-gray-400" />
            )}
          </button>
          <div>
            <h4 className="font-semibold text-[var(--card-foreground)] dark:text-gray-100">{task.title}</h4>
            {task.description && <p className="text-sm text-[var(--muted-foreground)] dark:text-gray-400">{task.description}</p>}
            {task.deadline && (
              <p className="text-xs mt-1 text-[var(--muted-foreground)] dark:text-gray-400">Due {new Date(task.deadline).toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => startEdit(task)} className="p-2 rounded-lg hover:bg-[var(--accent)] dark:hover:bg-gray-700/50" aria-label="edit">
            <Pencil className="w-4 h-4 text-[var(--primary)] dark:text-blue-400" />
          </button>
          <button onClick={() => removeTask(task._id || task.id)} className="p-2 rounded-lg hover:bg-[var(--accent)] dark:hover:bg-gray-700/50" aria-label="delete">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );

  function WeeklyGoals() {
    const weeklyTarget = 7; // mock
    const weeklyDone = Math.min(weeklyTarget, completedTasks.length);
    const percent = Math.round((weeklyDone / weeklyTarget) * 100);
    return (
      <div className="p-4 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--card-foreground)] dark:text-gray-100">Weekly Goals</h3>
          <span className="text-sm text-[var(--muted-foreground)] dark:text-gray-400">{weeklyDone}/{weeklyTarget} this week</span>
        </div>
        <div className="mt-3 w-full h-3 bg-[var(--accent)]/30 dark:bg-gray-600 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--primary)] dark:bg-blue-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] dark:text-gray-400">Set targets like "Solve 7 problems" weekly.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Topbar />
      <main className="flex-1 p-6 bg-[#d1e4f3] dark:bg-gray-900">
        <div className="max-w-full mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <BackButton to="/dashboard" />
            <h2 className="text-2xl font-bold text-[var(--card-foreground)] dark:text-gray-100">To-Do List</h2>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="appearance-none pr-8 pl-3 py-2 rounded-lg bg-[var(--card)] dark:bg-gray-800 text-[var(--card-foreground)] dark:text-gray-100 border border-[var(--input)] dark:border-gray-700">
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming deadlines</option>
                  <option value="completed">Completed</option>
                </select>
                <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] dark:text-gray-400" />
              </div>
              <button type="button" onClick={openAddModal} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center gap-2 hover:opacity-90">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Add / Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-lg p-5 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[var(--card-foreground)] dark:text-gray-100">{editingId ? "Edit Task" : "Add Task"}</h3>
                  <button onClick={() => { setShowModal(false); resetForm(); }} className="px-2 py-1 rounded-md hover:bg-[var(--accent)] dark:hover:bg-gray-700/50 text-[var(--card-foreground)] dark:text-gray-100">✕</button>
                </div>
                <form onSubmit={handleSubmitModal} className="mt-4 grid grid-cols-1 gap-3">
                  <input value={modalData.title} onChange={(e)=>setModalData({ ...modalData, title: e.target.value })} placeholder="Title" className="px-3 py-2 rounded-lg bg-[var(--background)] dark:bg-gray-900 text-[var(--card-foreground)] dark:text-gray-100 border border-[var(--input)] dark:border-gray-600" />
                  <textarea value={modalData.description} onChange={(e)=>setModalData({ ...modalData, description: e.target.value })} placeholder="Description" className="px-3 py-2 rounded-lg bg-[var(--background)] dark:bg-gray-900 text-[var(--card-foreground)] dark:text-gray-100 border border-[var(--input)] dark:border-gray-600" rows="3" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={modalData.status} onChange={(e)=>setModalData({ ...modalData, status: e.target.value })} className="px-3 py-2 rounded-lg bg-[var(--background)] dark:bg-gray-900 text-[var(--card-foreground)] dark:text-gray-100 border border-[var(--input)] dark:border-gray-600">
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                    <input type="datetime-local" value={modalData.deadline} onChange={(e)=>setModalData({ ...modalData, deadline: e.target.value })} className="px-3 py-2 rounded-lg bg-[var(--background)] dark:bg-gray-900 text-[var(--card-foreground)] dark:text-gray-100 border border-[var(--input)] dark:border-gray-600" />
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 rounded-lg border border-[var(--input)] dark:border-gray-600 text-[var(--card-foreground)] dark:text-gray-100 hover:bg-[var(--accent)] dark:hover:bg-gray-700/50">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                      {editingId ? "Save Changes" : "Add Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Content */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2 space-y-4">
      
      {/* --- Pending Tasks Section --- */}
      {/* Only show this section if filter is 'all' OR 'upcoming' */}
      {(filter === 'all' || filter === 'upcoming') && (
        <div className="p-4 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--card-foreground)] dark:text-gray-100 mb-3">
            Pending
          </h3>
          <div className="space-y-3">
            {/* Inner check: Show tasks or "No tasks" message */}
            {filtered(pendingTasks).length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] dark:text-gray-400">
                No pending tasks yet.
              </p>
            ) : (
              filtered(pendingTasks).map(task => <TaskCard key={task._id || task.id} task={task} />)
            )}
          </div>
        </div>
      )}

      {/* --- Completed Tasks Section --- */}
      {/* Only show this section if filter is 'all' OR 'completed' */}
      {(filter === 'all' || filter === 'completed') && (
        <div className="p-4 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--card-foreground)] dark:text-gray-100 mb-3">
            Completed
          </h3>
          <div className="space-y-3">
            {/* Inner check: Show tasks or "No tasks" message */}
            {filtered(completedTasks).length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] dark:text-gray-400">
                No completed tasks yet.
              </p>
            ) : (
              filtered(completedTasks).map(task => <TaskCard key={task._id || task.id} task={task} />)
            )}
          </div>
        </div>
      )}

    </div>

    {/* Right column widgets */}
    <div className="space-y-4">
      {/* Move Quick Tips to top for visibility */}
      <div className="p-4 rounded-xl bg-[var(--card)] dark:bg-gray-800 border border-[var(--border)] dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--card-foreground)] dark:text-gray-100">Quick Tips</h3>
        <ul className="mt-2 list-disc list-inside text-sm text-[var(--muted-foreground)] dark:text-gray-400 space-y-1">
          <li>Use deadlines to prioritize tasks.</li>
          <li>Break big goals into smaller, actionable items.</li>
          <li>Mark tasks done to track your streaks.</li>
        </ul>
      </div>
      <GoalProgress />
      <WeeklyGoals />
    </div>
  </div>
        </div>
      </main>
    </div>
  );
}