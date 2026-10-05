// Resolves the logged-in user's ops_accounts.Employee.id -- distinct from
// accounts.User.id (authUser.user.id, which nearly every other endpoint in
// this app calls user_id or employee_id interchangeably). manual-status-update
// specifically wants the real Employee.id. There's no such field on the login
// response, so it's looked up by matching the Employee record whose
// user_name equals the logged-in username -- same convention this app's own
// employee-creation flow uses (user_name set equal to employee_code/username).
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import { EMPLOYEE_LIST } from "@/api";

function readUsername() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.username || "";
  } catch {
    return "";
  }
}

async function fetchCurrentEmployeeId(username) {
  const res = await authFetch(EMPLOYEE_LIST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: "1", search: username }),
  });
  const data = await res.json().catch(() => null);
  const list = data?.results?.results || data?.results || (Array.isArray(data) ? data : []);
  const match = list.find((e) => e.user_name === username);
  return match?.id ?? null;
}

export function useCurrentEmployeeId(options = {}) {
  const username = readUsername();
  return useQuery({
    queryKey: qk.session.currentEmployeeId(username),
    queryFn: () => fetchCurrentEmployeeId(username),
    enabled: !!username,
    staleTime: 30 * 60_000,
    retry: 1,
    ...options,
  });
}
