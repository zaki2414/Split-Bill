import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";

function App() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get("/health").then((res) => res.data),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Split Bill</h1>
      <p className="mt-2 text-slate-500">
        Backend status:{" "}
        {isLoading && "checking..."}
        {isError && <span className="text-red-500">unreachable</span>}
        {health && <span className="text-green-600">{health.status}</span>}
      </p>
    </div>
  );
}

export default App;
