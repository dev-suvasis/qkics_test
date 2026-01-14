import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function AdminDashboard({ theme }) {
  const user = useSelector((state) => state.user.data);

  if (!user || (user.user_type !== "admin" && user.user_type !== "superadmin")) {
    return <Navigate to="/" />;
  }

  const role = user.user_type;

  const stats = [
    {
      title: "Total Users",
      value: 1800,
      color:
        "border-blue-400 bg-blue-400/10 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300",
    },
    {
      title: "Total Posts",
      value: 4200,
      color:
        "border-purple-400 bg-purple-400/10 text-purple-600 dark:border-purple-500 dark:bg-purple-500/20 dark:text-purple-300",
    },
    {
      title: "Normal Users",
      value: 1300,
      color:
        "border-green-400 bg-green-400/10 text-green-600 dark:border-green-500 dark:bg-green-500/20 dark:text-green-300",
    },
    {
      title: "Expert Users",
      value: 300,
      color:
        "border-orange-400 bg-orange-400/10 text-orange-600 dark:border-orange-500 dark:bg-orange-500/20 dark:text-orange-300",
    },
    {
      title: "Entrepreneur Users",
      value: 200,
      color:
        "border-pink-400 bg-pink-400/10 text-pink-600 dark:border-pink-500 dark:bg-pink-500/20 dark:text-pink-300",
    },
  ];

  return (
    <div className="p-6">

      {/* PAGE TITLE */}
      <h1 className={`text-2xl font-bold mb-8 text-center transition-colors ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>
        {role === "superadmin" ? "Super Admin Dashboard" : "Admin Dashboard"}
      </h1>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ">
        {stats.map((card, idx) => (
          <div
            key={idx}
            className={`
              p-4 rounded-xl border shadow-sm 
              hover:shadow-md hover:scale-[1.015] transition-all cursor-pointer
              flex flex-col items-center justify-center text-center
              ${card.color}
            `}
          >
            <div className="text-sm font-medium">{card.title}</div>
            <div className="text-2xl font-bold mt-1">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
