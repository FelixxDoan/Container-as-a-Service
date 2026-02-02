
const gateway = import.meta.env.VITE_GATEWAY || "/api/class";


const  classData = async () => {
  try {
    const res = await fetch(`${gateway}/all`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Get class failed");
    const  {data}  = await res.json();
    return data
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export default classData