import { useAuthStore } from "../session/store";

const gateway_service = import.meta.env.GATEWAY_SERVICE || "/api/user";

const profile = async () => {
  const setUser = useAuthStore.getState().setUser;
  try {
    const res = await fetch(`${gateway_service}/profile`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Get profile failed");
    const {data} = await res.json();

    setUser(data);
  } catch (error) {
    console.log(error);
  }
};

export default profile;
