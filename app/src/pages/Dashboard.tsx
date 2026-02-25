import { useParams } from "react-router-dom";

const Dashboard = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();

  return (
    <div className="flex flex-1 items-center justify-center rounded-lg bg-white shadow-xs border border-gray-200">
      <p className="text-gray-500">This is the dashboard {dashboardId}</p>
    </div>
  );
};

export default Dashboard;
