

const gateway_service = import.meta.env.GATEWAY_SERVICE || "/api/homework";

const listTree = async (prefix) => {
  try {
    const res = await fetch(`${gateway_service}/folders?folderPrefix=${prefix}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Get tree failed");
    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error("ListTree error:", error);
    return null;
  }
};

export default listTree;
